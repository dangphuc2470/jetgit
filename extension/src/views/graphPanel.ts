import * as vscode from 'vscode';
import { GitService, type Commit, type BranchInfo, type TagInfo } from '../git/gitService';
import { buildGraph, graphWidth, type GraphNode } from '../git/graphBuilder';
import { GitContentProvider } from '../providers/gitContentProvider';

export class GraphViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'intellij-git.logView';
  private view?: vscode.WebviewView;
  private allCommits: Commit[] = [];
  private graphNodes: GraphNode[] = [];

  constructor(
    private extensionUri: vscode.Uri,
    private gitService: GitService,
    private log: vscode.OutputChannel,
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview'),
      ],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(msg => this.handleMessage(msg));

    // Load data once the webview is ready
    this.loadInitialData();
  }

  async loadInitialData(): Promise<void> {
    try {
      this.log.appendLine('Loading git log...');
      const [commits, branches, tags] = await Promise.all([
        this.gitService.getLog({ maxCount: 300, all: true }),
        this.gitService.getBranches(),
        this.gitService.getTags(),
      ]);
      this.allCommits = commits;
      this.log.appendLine(`Loaded ${commits.length} commits, ${branches.length} branches, ${tags.length} tags`);
      this.graphNodes = buildGraph(this.allCommits);
      this.sendCommits();
      this.sendBranches(branches, tags);
    } catch (err: any) {
      this.log.appendLine(`Git log failed: ${err.message}`);
      vscode.window.showErrorMessage(`Git log failed: ${err.message}`);
    }
  }

  private sendCommits(): void {
    this.view?.webview.postMessage({
      type: 'commits',
      payload: {
        commits: this.allCommits.map((c, i) => ({
          ...c,
          graph: this.graphNodes[i],
        })),
        graphWidth: graphWidth(this.graphNodes),
      },
    });
  }

  private async sendBranches(branches: BranchInfo[], tags: TagInfo[]): Promise<void> {
    let currentBranch = '';
    try {
      currentBranch = await this.gitService.getCurrentBranch();
    } catch { /* ignore */ }

    this.view?.webview.postMessage({
      type: 'branches',
      payload: { branches, tags, currentBranch },
    });
  }

  private async handleMessage(msg: { type: string; payload?: any }): Promise<void> {
    switch (msg.type) {
      case 'selectCommit': {
        const hash = msg.payload as string;
        try {
          const files = await this.gitService.getCommitFiles(hash);
          this.view?.webview.postMessage({ type: 'commitFiles', payload: { hash, files } });
        } catch (err: any) {
          vscode.window.showErrorMessage(`Failed to get commit files: ${err.message}`);
        }
        break;
      }
      case 'openDiff': {
        try {
          const { hash, file } = msg.payload;

          const commit = this.allCommits.find(c => c.hash === hash);
          const parentHash = commit?.parents?.[0] || `${hash}~1`;
          const filePath = file.path as string;
          const oldPath = (file.oldPath || filePath) as string;

          const leftUri = file.status === 'A'
            ? GitContentProvider.emptyUri()
            : GitContentProvider.makeUri(parentHash, oldPath);
          const rightUri = file.status === 'D'
            ? GitContentProvider.emptyUri()
            : GitContentProvider.makeUri(hash, filePath);

          const fileName = filePath.split('/').pop() || filePath;
          const title = `${fileName} (${hash.slice(0, 7)})`;

          await vscode.commands.executeCommand('vscode.diff', leftUri, rightUri, title);
        } catch (err: any) {
          this.log.appendLine(`openDiff ERROR: ${err.message}`);
          vscode.window.showErrorMessage(`Diff failed: ${err.message}`);
        }
        break;
      }
      case 'loadMore': {
        const skip = this.allCommits.length;
        try {
          const more = await this.gitService.getLog({ maxCount: 100, skip, all: true });
          if (more.length > 0) {
            this.allCommits.push(...more);
            this.graphNodes = buildGraph(this.allCommits);
            this.sendCommits();
          }
        } catch { /* end of history */ }
        break;
      }
      case 'filter': {
        const { branch, author, after, before, path: filePath } = msg.payload;
        try {
          this.allCommits = await this.gitService.getLog({
            maxCount: 300,
            all: !branch,
            branch: branch || undefined,
            author: author || undefined,
            after: after || undefined,
            before: before || undefined,
            path: filePath || undefined,
          });
          this.graphNodes = buildGraph(this.allCommits);
          this.sendCommits();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Filter failed: ${err.message}`);
        }
        break;
      }
      case 'checkout': {
        const ref = msg.payload as string;
        try {
          await this.gitService.checkout(ref);
          vscode.window.showInformationMessage(`Checked out ${ref}`);
          this.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Checkout failed: ${err.message}`);
        }
        break;
      }
      case 'createBranch': {
        const { name, startPoint } = msg.payload;
        try {
          await this.gitService.createBranch(name, startPoint);
          vscode.window.showInformationMessage(`Created branch ${name}`);
          this.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Create branch failed: ${err.message}`);
        }
        break;
      }
      case 'deleteBranch': {
        const ref = msg.payload as string;
        try {
          await this.gitService.deleteBranch(ref);
          this.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Delete failed: ${err.message}`);
        }
        break;
      }
      case 'mergeBranch': {
        const ref = msg.payload as string;
        try {
          await this.gitService.merge(ref);
          vscode.window.showInformationMessage(`Merged ${ref}`);
          this.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Merge failed: ${err.message}`);
        }
        break;
      }
      case 'rebaseFromHere': {
        const hash = msg.payload as string;
        await vscode.commands.executeCommand('intellij-git.interactiveRebase', hash);
        break;
      }
    }
  }

  selectCommit(hash: string): void {
    this.view?.webview.postMessage({
      type: 'scrollToCommit',
      payload: hash,
    });
  }

  refresh(): void {
    this.loadInitialData();
  }

  show(): void {
    if (this.view) {
      this.view.show(true);
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'graph', 'graph.js'),
    );
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Git Log</title>
</head>
<body>
  <div id="app" style="height:100%;overflow:hidden;"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
