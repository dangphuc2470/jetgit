import * as vscode from 'vscode';
import { GitService, type Commit, type BranchInfo, type TagInfo } from '../git/gitService';
import { buildGraph, graphWidth, type GraphNode } from '../git/graphBuilder';
import { GitContentProvider } from '../providers/gitContentProvider';

export class GraphViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'intellij-git.logView';
  private view?: vscode.WebviewView;
  private allCommits: Commit[] = [];
  private graphNodes: GraphNode[] = [];
  private isLoadingMore = false;
  private hasReachedEnd = false;

  private lastBranches: BranchInfo[] = [];
  private lastTags: TagInfo[] = [];

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

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.loadInitialData();
      }
    });

    // Load data once the webview is ready
    this.loadInitialData();
  }

  async loadInitialData(): Promise<void> {
    const isRepo = await this.gitService.isGitRepo();
    if (!isRepo) {
      this.log.appendLine('Current directory is not a git repository. Searching subfolders...');
      const subRepos = await this.gitService.findSubRepos();
      this.log.appendLine(`Found ${subRepos.length} sub-repositories: ${subRepos.map(r => r.name).join(', ')}`);
      this.view?.webview.postMessage({
        type: 'noGitRepo',
        payload: {
          currentPath: this.gitService.getCwd(),
          subRepos,
        },
      });
      return;
    }

    try {
      this.hasReachedEnd = false;
      this.isLoadingMore = false;
      this.log.appendLine('Loading git log...');
      const [commits, branches, tags] = await Promise.all([
        this.gitService.getLog({ maxCount: 300, all: true }),
        this.gitService.getBranches(),
        this.gitService.getTags(),
      ]);
      const seen = new Set<string>();
      this.allCommits = commits.filter(c => {
        if (seen.has(c.hash)) return false;
        seen.add(c.hash);
        return true;
      });
      this.lastBranches = branches;
      this.lastTags = tags;
      this.log.appendLine(`Loaded ${this.allCommits.length} commits, ${branches.length} branches, ${tags.length} tags`);
      this.graphNodes = buildGraph(this.allCommits);
      this.sendCommits();
      this.sendBranches(branches, tags);
    } catch (err: any) {
      this.log.appendLine(`Git log failed: ${err.message}`);
      this.view?.webview.postMessage({
        type: 'commits',
        payload: {
          commits: [],
          graphWidth: 1,
        },
      });
      this.view?.webview.postMessage({
        type: 'error',
        payload: err.message,
      });
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
      case 'ready': {
        this.log.appendLine('Webview reported ready');
        await this.loadInitialData();
        break;
      }
      case 'switchRepo': {
        const repoPath = msg.payload as string;
        this.log.appendLine(`Switching git repository to: ${repoPath}`);
        this.gitService.setCwd(repoPath);
        await this.loadInitialData();
        break;
      }
      case 'initRepo': {
        this.log.appendLine('Initializing new git repository...');
        try {
          await this.gitService.initRepo();
          vscode.window.showInformationMessage('Initialized Git repository successfully.');
          await this.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Failed to init git repository: ${err.message}`);
        }
        break;
      }
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
        if (this.isLoadingMore || this.hasReachedEnd) break;
        this.isLoadingMore = true;
        const skip = this.allCommits.length;
        try {
          const more = await this.gitService.getLog({ maxCount: 100, skip, all: true });
          const existingHashes = new Set(this.allCommits.map(c => c.hash));
          const uniqueMore = more.filter(c => !existingHashes.has(c.hash));
          if (uniqueMore.length > 0) {
            this.allCommits.push(...uniqueMore);
            this.graphNodes = buildGraph(this.allCommits);
            this.sendCommits();
          } else {
            this.hasReachedEnd = true;
            this.view?.webview.postMessage({ type: 'reachedEnd' });
          }
        } catch {
          this.hasReachedEnd = true;
          this.view?.webview.postMessage({ type: 'reachedEnd' });
        } finally {
          this.isLoadingMore = false;
        }
        break;
      }
      case 'filter': {
        const { branch, author, after, before, path: filePath } = msg.payload;
        this.hasReachedEnd = false;
        this.isLoadingMore = false;
        try {
          const commits = await this.gitService.getLog({
            maxCount: 300,
            all: !branch,
            branch: branch || undefined,
            author: author || undefined,
            after: after || undefined,
            before: before || undefined,
            path: filePath || undefined,
          });
          const seen = new Set<string>();
          this.allCommits = commits.filter(c => {
            if (seen.has(c.hash)) return false;
            seen.add(c.hash);
            return true;
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
      case 'checkoutAndRebase': {
        const { branch, onto } = msg.payload;
        try {
          await this.gitService.checkoutAndRebase(branch, onto);
          vscode.window.showInformationMessage(`Rebased ${branch} onto ${onto}`);
          this.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Checkout and rebase failed: ${err.message}`);
        }
        break;
      }
      case 'rebase': {
        const branch = msg.payload as string;
        try {
          await this.gitService.rebase(branch);
          vscode.window.showInformationMessage(`Rebased onto ${branch}`);
          this.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Rebase failed: ${err.message}`);
        }
        break;
      }
      case 'compareBranch': {
        const { branch, withBranch } = msg.payload;
        try {
          this.allCommits = await this.gitService.getLog({
            branch: `${withBranch}..${branch}`,
            all: false,
          });
          this.graphNodes = buildGraph(this.allCommits);
          this.sendCommits();
          vscode.window.showInformationMessage(`Comparing commits between ${branch} and ${withBranch}`);
        } catch (err: any) {
          vscode.window.showErrorMessage(`Compare failed: ${err.message}`);
        }
        break;
      }
      case 'showDiff': {
        const { branch } = msg.payload;
        try {
          const files = await this.gitService.getDiffFiles(branch);
          if (files.length === 0) {
            vscode.window.showInformationMessage(`No differences between ${branch} and working tree.`);
            break;
          }
          const items = files.map(f => ({
            label: `${f.status} ${f.path}`,
            description: f.oldPath ? `from ${f.oldPath}` : '',
            file: f,
          }));
          const picked = await vscode.window.showQuickPick(items, {
            placeHolder: `Select a file changed against ${branch} to view diff`,
          });
          if (picked) {
            const filePath = picked.file.path;
            const leftUri = GitContentProvider.makeUri(branch, picked.file.oldPath || filePath);
            const path = require('path');
            const rightUri = vscode.Uri.file(path.join(this.gitService.getCwd(), filePath));
            const fileName = filePath.split('/').pop() || filePath;
            await vscode.commands.executeCommand('vscode.diff', leftUri, rightUri, `${fileName} (${branch} ↔ Working Tree)`);
          }
        } catch (err: any) {
          vscode.window.showErrorMessage(`Show diff failed: ${err.message}`);
        }
        break;
      }
      case 'pull': {
        const branch = msg.payload as string;
        try {
          const out = await this.gitService.pull(branch);
          vscode.window.showInformationMessage(`Pulled ${branch}: ${out || 'Already up to date.'}`);
          this.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Pull failed: ${err.message}`);
        }
        break;
      }
      case 'fetchAll': {
        try {
          vscode.window.showInformationMessage('Fetching all remotes...');
          await this.gitService.fetchAll();
          vscode.window.showInformationMessage('Fetched all remotes successfully.');
          this.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Fetch all failed: ${err.message}`);
        }
        break;
      }
      case 'push': {
        const branch = msg.payload as string;
        try {
          await this.gitService.push(branch);
          vscode.window.showInformationMessage(`Pushed ${branch} successfully.`);
          this.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Push failed: ${err.message}`);
        }
        break;
      }
      case 'renameBranch': {
        const { oldName, newName } = msg.payload;
        try {
          await this.gitService.renameBranch(oldName, newName);
          vscode.window.showInformationMessage(`Renamed branch '${oldName}' to '${newName}'`);
          this.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Rename failed: ${err.message}`);
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
