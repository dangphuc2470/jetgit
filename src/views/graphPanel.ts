import * as vscode from 'vscode';
import { GitService, type Commit, type BranchInfo, type TagInfo } from '../git/gitService';
import { buildGraph, graphWidth, type GraphNode } from '../git/graphBuilder';
import { GitContentProvider } from '../providers/gitContentProvider';
import { PushDialogPanel } from './pushDialogPanel';
import { CommitReviewPanel } from './commitReviewPanel';
import { handleGraphAction } from './graphActionHandlers';
import { getNonce } from '../utils/themeTokens';
import { GraphToExtensionMessage, ExtensionToGraphMessage } from '../shared/protocol';
import { taskManager } from '../services/taskManager';

export class GraphViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'jetgit.logView';
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

  private currentBranchCommits: Set<string> = new Set();
  private currentUser: { name: string; email: string } = { name: '', email: '' };
  private currentBranchName: string = '';
  private initialWorkspaceRoot: string = '';

  private async updateBranchAndUser(): Promise<void> {
    try {
      this.currentBranchName = await this.gitService.getCurrentBranch();
    } catch {
      this.currentBranchName = '';
    }
    try {
      this.currentUser = await this.gitService.getCurrentUser();
    } catch {
      this.currentUser = { name: '', email: '' };
    }
    this.currentBranchCommits.clear();
    try {
      const target = this.currentFilter.branch || 'HEAD';
      const output = await this.gitService.exec(['rev-list', '--max-count=3000', target]);
      for (const line of output.split('\n')) {
        const h = line.trim();
        if (h) this.currentBranchCommits.add(h);
      }
    } catch {}
  }

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
        vscode.Uri.joinPath(this.extensionUri, 'resources'),
      ],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(msg => this.handleMessage(msg));

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.refresh();
      } else {
        this.closeAllMenus();
      }
    });

    // Subscribe to background tasks
    const unsubTasks = taskManager.subscribe((tasks) => {
      this.view?.webview.postMessage({
        type: 'tasksUpdate',
        payload: tasks,
      });
    });

    webviewView.onDidDispose(() => {
      unsubTasks();
    });

    // Load data once the webview is ready
    this.loadInitialData();
  }

  closeAllMenus(): void {
    this.view?.webview.postMessage({ type: 'closeAllMenus' });
  }

  openCreateBranchDialog(startPoint?: string): boolean {
    if (this.view) {
      this.view.show?.(true);
      this.view.webview.postMessage({
        type: 'openCreateBranchDialog',
        payload: { startPoint },
      });
      return true;
    }
    return false;
  }

  openCheckoutBranchDialog(remoteRef: string, defaultName?: string): boolean {
    if (this.view) {
      this.view.show?.(true);
      this.view.webview.postMessage({
        type: 'openCheckoutBranchDialog',
        payload: { remoteRef, defaultName },
      });
      return true;
    }
    return false;
  }

  async loadInitialData(): Promise<void> {
    if (!this.initialWorkspaceRoot) {
      this.initialWorkspaceRoot = this.gitService.getCwd();
    }
    const isRepo = await this.gitService.isGitRepo();
    if (!isRepo) {
      this.log.appendLine('Current directory is not a git repository. Searching subfolders...');
      const subRepos = await this.gitService.findSubRepos();
      this.log.appendLine(`Found ${subRepos.length} sub-repositories: ${subRepos.map(r => r.name).join(', ')}`);
      this.allCommits = [];
      this.graphNodes = [];
      this.lastBranches = [];
      this.lastTags = [];
      this.currentBranchName = '';
      this.currentBranchCommits.clear();
      this.currentFilter = {};
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
      } else if (this.currentFilter.branch && this.currentFilter.branch.includes('/')) {
        this.currentFilter.branch = 'HEAD';
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
      await this.updateBranchAndUser();
      this.sendCommits();
      this.sendBranches(branches, tags, this.currentBranchName || currentBranch);

      // Asynchronously discover remote branch names in background if any remote is missing branches
      this.gitService.getRemotes().then(remotes => {
        const hasMissingRemotes = remotes.some(r => !branches.some(b => b.name.startsWith(r + '/')));
        if (hasMissingRemotes) {
          this.gitService.refreshRemoteBranchNames().then(res => {
            if (res.some(r => r.count > 0)) {
              this.refresh();
            }
          }).catch(() => {});
        }
      }).catch(() => {});
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
    const isSingleBranch = !!this.currentFilter.branch;
    const isSubRepo = !!(this.initialWorkspaceRoot && this.gitService.getCwd() !== this.initialWorkspaceRoot);
    this.view?.webview.postMessage({
      type: 'commits',
      payload: {
        commits: this.allCommits.map((c, i) => ({
          ...c,
          graph: this.graphNodes[i],
          isCurrentBranch: isSingleBranch || this.currentBranchCommits.has(c.hash),
        })),
        graphWidth: graphWidth(this.graphNodes),
        currentUser: this.currentUser,
        currentBranch: this.currentBranchName,
        isSubRepo,
        repoPath: this.gitService.getCwd(),
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

    let remotes: string[] = [];
    try {
      remotes = await this.gitService.getRemotes();
    } catch {
      remotes = [];
    }

    const isSubRepo = !!(this.initialWorkspaceRoot && this.gitService.getCwd() !== this.initialWorkspaceRoot);

    this.view?.webview.postMessage({
      type: 'branches',
      payload: {
        branches,
        tags,
        remotes,
        currentBranch: this.currentBranchName || currentBranch,
        currentUser: this.currentUser,
        activeBranch: this.currentFilter.branch || '',
        isSubRepo,
        repoPath: this.gitService.getCwd(),
      },
    });
  }

  private async handleMessage(msg: GraphToExtensionMessage): Promise<void> {
    switch (msg.type) {
      case 'ready': {
        this.log.appendLine('Webview reported ready');
        this.view?.webview.postMessage({
          type: 'tasksUpdate',
          payload: taskManager.getTasks(),
        });
        await this.loadInitialData();
        break;
      }
      case 'cancelTask': {
        const { id } = msg.payload || {};
        if (id) {
          taskManager.cancelTask(id);
        }
        break;
      }
      case 'dismissTask': {
        const { id } = msg.payload || {};
        if (id) {
          taskManager.dismissTask(id);
        }
        break;
      }
      case 'clearFinishedTasks': {
        taskManager.clearFinishedTasks();
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
      case 'exitSubRepo': {
        this.log.appendLine('Exiting sub-repository back to workspace root...');
        if (this.initialWorkspaceRoot) {
          this.gitService.setCwd(this.initialWorkspaceRoot);
          this.hasInitializedFilter = false;
          await this.loadInitialData();
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
            [filePath],
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
          order: (order === 'date' || order === 'topo') ? order : undefined,
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
          await this.updateBranchAndUser();
          this.sendCommits();
        } catch (err: any) {
          this.log.appendLine(`Filter failed: ${err.message}. Falling back to default log.`);
          try {
            this.currentFilter = { all: true };
            const commits = await this.gitService.getLog({ maxCount: 300, all: true });
            this.allCommits = commits;
            this.graphNodes = buildGraph(this.allCommits);
            await this.updateBranchAndUser();
            this.sendCommits();
          } catch {}
          vscode.window.showWarningMessage(`Could not filter by '${branch}': ${err.message}`);
        }
        break;
      }
      case 'refreshBranches': {
        this.hasReachedEnd = false;
        this.isLoadingMore = false;
        if (!(await this.gitService.isGitRepo())) {
          await this.loadInitialData();
          break;
        }
        try {
          await this.gitService.refreshRemoteBranchNames();
          await this.refresh();
          vscode.commands.executeCommand('jetgit.refreshBranches');
          taskManager.notifyInfo('Branches refreshed.');
        } catch (err: any) {
          taskManager.notifyError(`Refresh failed: ${err.message}`);
        }
        break;
      }
      case 'refresh': {
        this.hasReachedEnd = false;
        this.isLoadingMore = false;
        if (!(await this.gitService.isGitRepo())) {
          await this.loadInitialData();
          break;
        }
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
          await this.updateBranchAndUser();
          this.sendCommits();
          this.sendBranches(branches, tags);
        } catch (err: any) {
          taskManager.notifyError(`Refresh failed: ${err.message}`);
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
    if (!this.view) return;
    if (this.isRefreshing) {
      this.queuedRefresh = true;
      return;
    }
    this.isRefreshing = true;
    this.hasReachedEnd = false;
    this.isLoadingMore = false;
    try {
      if (!(await this.gitService.isGitRepo())) {
        await this.loadInitialData();
        return;
      }
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
      await this.updateBranchAndUser();
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
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'graph', 'graph.css'),
    );
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri}">
  <title>Git Log</title>
  <style>
    *::-webkit-scrollbar-track,
    *::-webkit-scrollbar-track-piece,
    *::-webkit-scrollbar-corner {
      background: transparent !important;
      background-color: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }
  </style>
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
  <div id="app" style="height:100%;overflow:hidden;"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}
