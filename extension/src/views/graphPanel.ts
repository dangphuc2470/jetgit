import * as vscode from 'vscode';
import { GitService, type Commit, type BranchInfo, type TagInfo } from '../git/gitService';
import { buildGraph, graphWidth, type GraphNode } from '../git/graphBuilder';
import { GitContentProvider } from '../providers/gitContentProvider';
import { PushDialogPanel } from './pushDialogPanel';
import { CommitReviewPanel } from './commitReviewPanel';
import { handleGraphAction } from './graphActionHandlers';
import { getNonce } from '../utils/themeTokens';

export class GraphViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'intellij-git.logView';
  private view?: vscode.WebviewView;
  private allCommits: Commit[] = [];
  private graphNodes: GraphNode[] = [];
  private isLoadingMore = false;
  private hasReachedEnd = false;

  private lastBranches: BranchInfo[] = [];
  private lastTags: TagInfo[] = [];
  private hasInitializedFilter = false;
  private isRefreshing = false;
  private queuedRefresh = false;
  private currentFilter: {
    branch?: string;
    author?: string;
    after?: string;
    before?: string;
    path?: string;
    query?: string;
    order?: 'date' | 'topo';
    firstParent?: boolean;
    noMerges?: boolean;
    all?: boolean;
  } = {};

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
        this.refresh();
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

      let currentBranch = '';
      try {
        currentBranch = await this.gitService.getCurrentBranch();
      } catch { /* ignore */ }

      // Align with Android Studio: Default to filtering by active branch ONLY ONCE on initial startup
      this.hasReachedEnd = false;
      this.isLoadingMore = false;
      if (!this.hasInitializedFilter) {
        this.hasInitializedFilter = true;
        this.currentFilter = currentBranch ? { branch: 'HEAD', all: false } : { all: true };
      }

      const [commits, branches, tags] = await Promise.all([
        this.gitService.getLog({ maxCount: 300, ...this.currentFilter }),
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
      this.sendBranches(branches, tags, currentBranch);
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

  private async sendBranches(branches: BranchInfo[], tags: TagInfo[], currentBranch?: string): Promise<void> {
    if (currentBranch === undefined) {
      try {
        currentBranch = await this.gitService.getCurrentBranch();
      } catch {
        currentBranch = '';
      }
    }

    this.view?.webview.postMessage({
      type: 'branches',
      payload: {
        branches,
        tags,
        currentBranch,
        activeBranch: this.currentFilter.branch || '',
      },
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
        try {
          this.gitService.setCwd(repoPath);
          this.hasInitializedFilter = false;
          await this.loadInitialData();
        } catch (err: any) {
          this.log.appendLine(`Failed to switch git repository: ${err.message}`);
          vscode.window.showErrorMessage(`Failed to switch repository: ${err.message}`);
        }
        break;
      }
      case 'initRepo': {
        this.log.appendLine('Initializing new git repository...');
        try {
          await this.gitService.initRepo();
          vscode.window.showInformationMessage('Initialized Git repository successfully.');
          this.hasInitializedFilter = false;
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
      case 'openReviewInCenter': {
        const filePath = typeof msg.payload === 'string' ? msg.payload : msg.payload?.filePath;
        if (filePath) {
          CommitReviewPanel.createOrShow(
            this.extensionUri,
            this.gitService,
            filePath,
            [{ path: filePath, name: filePath.split('/').pop() || filePath, dir: '', status: 'M' }],
            () => this.refresh(),
          );
        }
        break;
      }
      case 'loadMore': {
        if (this.isLoadingMore || this.hasReachedEnd) break;
        this.isLoadingMore = true;
        const skip = this.allCommits.length;
        try {
          const more = await this.gitService.getLog({
            maxCount: 300,
            skip,
            ...this.currentFilter,
          });
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
        const { branch, author, after, before, path: filePath, query, order, firstParent, noMerges } = msg.payload || {};
        this.hasReachedEnd = false;
        this.isLoadingMore = false;
        this.currentFilter = {
          branch: branch || undefined,
          author: author || undefined,
          after: after || undefined,
          before: before || undefined,
          path: filePath || undefined,
          query: query || undefined,
          order: order || undefined,
          firstParent: firstParent || undefined,
          noMerges: noMerges || undefined,
          all: !branch,
        };
        try {
          const commits = await this.gitService.getLog({
            maxCount: 300,
            ...this.currentFilter,
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
      case 'refreshBranches':
      case 'refresh': {
        this.hasReachedEnd = false;
        this.isLoadingMore = false;
        try {
          const [commits, branches, tags] = await Promise.all([
            this.gitService.getLog({
              maxCount: 300,
              ...this.currentFilter,
            }),
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
          this.graphNodes = buildGraph(this.allCommits);
          this.sendCommits();
          this.sendBranches(branches, tags);
        } catch (err: any) {
          vscode.window.showErrorMessage(`Refresh failed: ${err.message}`);
        }
        break;
      }
      default: {
        await handleGraphAction(msg.type, msg.payload, {
          gitService: this.gitService,
          extensionUri: this.extensionUri,
          loadInitialData: () => this.loadInitialData(),
          openPushDialog: (branch) => this.openPushDialog(branch),
          view: this.view,
          updateGraph: (commits) => {
            this.allCommits = commits;
            this.graphNodes = buildGraph(this.allCommits);
            this.sendCommits();
          },
        });
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

  async refresh(): Promise<void> {
    if (!this.view || !this.view.visible) return;
    if (this.isRefreshing) {
      this.queuedRefresh = true;
      return;
    }
    this.isRefreshing = true;
    this.hasReachedEnd = false;
    this.isLoadingMore = false;
    try {
      const [commits, branches, tags] = await Promise.all([
        this.gitService.getLog({
          maxCount: 300,
          ...this.currentFilter,
        }),
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
      this.graphNodes = buildGraph(this.allCommits);
      this.sendCommits();
      this.sendBranches(branches, tags);
    } catch { /* ignore */ } finally {
      this.isRefreshing = false;
      if (this.queuedRefresh) {
        this.queuedRefresh = false;
        this.refresh();
      }
    }
  }

  show(): void {
    if (this.view) {
      this.view.show(true);
    }
  }

  async openPushDialog(branch?: string): Promise<void> {
    await PushDialogPanel.createOrShow(this.extensionUri, this.gitService, branch);
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
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
  <div id="app" style="height:100%;overflow:hidden;"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}
