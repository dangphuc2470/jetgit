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
        this.gitService.setCwd(repoPath);
        this.hasInitializedFilter = false;
        await this.loadInitialData();
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
        const { branch, author, after, before, path: filePath, query } = msg.payload || {};
        this.hasReachedEnd = false;
        this.isLoadingMore = false;
        this.currentFilter = {
          branch: branch || undefined,
          author: author || undefined,
          after: after || undefined,
          before: before || undefined,
          path: filePath || undefined,
          query: query || undefined,
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
          vscode.window.showInformationMessage(`Deleted branch '${ref}'`);
          this.loadInitialData();
        } catch (err: any) {
          if (err.message && (err.message.includes('not fully merged') || err.message.includes('not merged'))) {
            const force = await vscode.window.showWarningMessage(
              `Branch '${ref}' is not fully merged. Do you want to force delete it?`,
              { modal: true },
              'Force Delete',
            );
            if (force === 'Force Delete') {
              try {
                await this.gitService.deleteBranch(ref, true);
                vscode.window.showInformationMessage(`Force deleted branch '${ref}'`);
                this.loadInitialData();
              } catch (e: any) {
                vscode.window.showErrorMessage(`Delete failed: ${e.message}`);
              }
            }
          } else {
            vscode.window.showErrorMessage(`Delete failed: ${err.message}`);
          }
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
            const leftUri = picked.file.status === 'A'
              ? GitContentProvider.emptyUri()
              : GitContentProvider.makeUri(branch, picked.file.oldPath || filePath);
            const path = require('path');
            const rightUri = picked.file.status === 'D'
              ? GitContentProvider.emptyUri()
              : vscode.Uri.file(path.join(this.gitService.getCwd(), filePath));
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
          vscode.window.showInformationMessage(`Updated ${branch}: ${out || 'Already up to date.'}`);
          this.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Update failed: ${err.message}`);
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
          vscode.window.showInformationMessage(`Merged '${ref}' successfully.`);
          this.loadInitialData();
        } catch (err: any) {
          const errMsg: string = err.message || '';
          const hasConflicts =
            errMsg.includes('CONFLICT') ||
            errMsg.includes('conflict') ||
            errMsg.includes('Automatic merge failed') ||
            errMsg.includes('fix conflicts');

          if (hasConflicts) {
            // Merge is running but has conflicts — not a failure
            this.loadInitialData();
            try {
              const conflictFiles = await this.gitService.getUnmergedFiles();
              if (conflictFiles.length === 0) {
                vscode.window.showWarningMessage(`Merge has conflicts. Please resolve them and commit.`);
                return;
              }

              const items: vscode.QuickPickItem[] = conflictFiles.map(f => ({
                label: `$(git-merge) ${f}`,
                description: 'Conflict — click to open merge editor',
                detail: f,
              }));
              items.push({
                label: '$(check-all) All conflicts resolved — open Commit panel',
                description: '',
                detail: '__commit__',
              });

              const chosen = await vscode.window.showQuickPick(items, {
                placeHolder: `${conflictFiles.length} file(s) with conflicts — select a file to resolve`,
                canPickMany: false,
                title: `Merge conflicts: '${ref}' into current branch`,
              });

              if (chosen && chosen.detail && chosen.detail !== '__commit__') {
                const fileUri = vscode.Uri.joinPath(
                  vscode.Uri.file(this.workspaceRoot),
                  chosen.detail,
                );
                // Open VS Code's built-in 3-way merge editor
                try {
                  await vscode.commands.executeCommand('merge-conflict.accept.all-both');
                } catch { /* ignore */ }
                await vscode.commands.executeCommand('vscode.open', fileUri);
                // Try to open in merge editor if available
                try {
                  await vscode.commands.executeCommand('git.openMergeEditor', fileUri);
                } catch { /* merge editor might not be available */ }
              } else if (chosen && chosen.detail === '__commit__') {
                await vscode.commands.executeCommand('intellij-git.openCommit');
              }
            } catch {
              vscode.window.showWarningMessage(
                `Merge has conflicts. Please resolve them in the editor and commit when done.`,
              );
            }
          } else {
            vscode.window.showErrorMessage(`Merge failed: ${errMsg}`);
          }
        }
        break;
      }
      case 'rebaseFromHere': {
        const hash = msg.payload as string;
        await vscode.commands.executeCommand('intellij-git.interactiveRebase', hash);
        break;
      }
      case 'cherryPick': {
        const { hash } = msg.payload;
        try {
          await this.gitService.cherryPick(hash);
          vscode.window.showInformationMessage(`Cherry-picked ${hash.slice(0, 8)} successfully`);
          this.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Cherry-pick failed: ${err.message}`);
        }
        break;
      }
      case 'revertCommit': {
        const { hash } = msg.payload;
        try {
          await this.gitService.revertCommit(hash);
          vscode.window.showInformationMessage(`Reverted commit ${hash.slice(0, 8)}`);
          this.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Revert failed: ${err.message}`);
        }
        break;
      }
      case 'resetToCommit': {
        const { hash } = msg.payload;
        const mode = await vscode.window.showQuickPick([
          { label: 'Soft', description: 'Keep all local changes in index (staged)', mode: 'soft' },
          { label: 'Mixed', description: 'Keep all local changes in working tree (unstaged)', mode: 'mixed' },
          { label: 'Hard', description: 'Discard all local changes', mode: 'hard' },
        ], { placeHolder: `Reset current branch to ${hash.slice(0, 8)}` });
        if (mode) {
          if (mode.mode === 'hard') {
            const confirm = await vscode.window.showWarningMessage(
              `Are you sure you want to perform a HARD reset to ${hash.slice(0, 8)}? All uncommitted local changes will be lost!`,
              { modal: true },
              'Reset',
            );
            if (confirm !== 'Reset') break;
          }
          try {
            await this.gitService.reset(hash, mode.mode as any);
            vscode.window.showInformationMessage(`Reset branch to ${hash.slice(0, 8)} (${mode.label})`);
            this.loadInitialData();
          } catch (err: any) {
            vscode.window.showErrorMessage(`Reset failed: ${err.message}`);
          }
        }
        break;
      }
      case 'undoCommit': {
        try {
          await this.gitService.reset('HEAD~1', 'soft');
          vscode.window.showInformationMessage('Undid last commit (changes kept staged)');
          this.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Undo commit failed: ${err.message}`);
        }
        break;
      }
      case 'createTag': {
        const { name, hash } = msg.payload;
        try {
          await this.gitService.createTag(name, hash);
          vscode.window.showInformationMessage(`Created tag ${name} at ${hash.slice(0, 8)}`);
          this.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Create tag failed: ${err.message}`);
        }
        break;
      }
      case 'createPatch': {
        const { hash } = msg.payload;
        try {
          const patch = await this.gitService.createPatch(hash);
          const doc = await vscode.workspace.openTextDocument({
            content: patch,
            language: 'diff',
          });
          await vscode.window.showTextDocument(doc);
          vscode.window.showInformationMessage(`Created patch for ${hash.slice(0, 8)}`);
        } catch (err: any) {
          vscode.window.showErrorMessage(`Create patch failed: ${err.message}`);
        }
        break;
      }
      case 'compareWithLocal': {
        const { hash } = msg.payload;
        try {
          const files = await this.gitService.getDiffFiles(hash);
          if (files.length === 0) {
            vscode.window.showInformationMessage(`No differences between ${hash.slice(0, 8)} and working tree.`);
            break;
          }
          const items = files.map(f => ({
            label: `${f.status} ${f.path}`,
            description: f.oldPath ? `from ${f.oldPath}` : '',
            file: f,
          }));
          const picked = await vscode.window.showQuickPick(items, {
            placeHolder: `Select a file changed against ${hash.slice(0, 8)} to view diff`,
          });
          if (picked) {
            const filePath = picked.file.path;
            const leftUri = picked.file.status === 'A'
              ? GitContentProvider.emptyUri()
              : GitContentProvider.makeUri(hash, picked.file.oldPath || filePath);
            const path = require('path');
            const rightUri = picked.file.status === 'D'
              ? GitContentProvider.emptyUri()
              : vscode.Uri.file(path.join(this.gitService.getCwd(), filePath));
            const fileName = filePath.split('/').pop() || filePath;
            await vscode.commands.executeCommand('vscode.diff', leftUri, rightUri, `${fileName} (${hash.slice(0, 8)} ↔ Working Tree)`);
          }
        } catch (err: any) {
          vscode.window.showErrorMessage(`Compare with local failed: ${err.message}`);
        }
        break;
      }
      case 'editCommitMessage': {
        const { hash, subject, message } = msg.payload || {};
        let newMsg = message;
        if (!newMsg) {
          newMsg = await vscode.window.showInputBox({
            prompt: 'Edit Commit Message',
            value: subject || '',
          });
        }
        if (newMsg && newMsg.trim()) {
          try {
            const headHash = (await this.gitService.getLog({ maxCount: 1 }))[0]?.hash;
            if (headHash === hash) {
              await this.gitService.exec(['commit', '--amend', '-m', newMsg.trim()]);
              vscode.window.showInformationMessage('Commit message updated');
              this.loadInitialData();
            } else {
              vscode.window.showWarningMessage('Editing commit message of older commits requires interactive rebase.');
              await vscode.commands.executeCommand('intellij-git.interactiveRebase', hash);
            }
          } catch (err: any) {
            vscode.window.showErrorMessage(`Edit message failed: ${err.message}`);
          }
        }
        break;
      }
      case 'dropCommit': {
        const { hash } = msg.payload;
        try {
          const headHash = (await this.gitService.getLog({ maxCount: 1 }))[0]?.hash;
          if (headHash === hash) {
            await this.gitService.reset('HEAD~1', 'hard');
            vscode.window.showInformationMessage(`Dropped commit ${hash.slice(0, 8)}`);
            this.loadInitialData();
          } else {
            vscode.window.showInformationMessage(`Use Interactive Rebase to drop older commit ${hash.slice(0, 8)}`);
            await vscode.commands.executeCommand('intellij-git.interactiveRebase', hash);
          }
        } catch (err: any) {
          vscode.window.showErrorMessage(`Drop commit failed: ${err.message}`);
        }
        break;
      }
      case 'pushUpToHere': {
        const { hash } = msg.payload;
        try {
          const currentBranch = await this.gitService.getCurrentBranch();
          await this.gitService.exec(['push', 'origin', `${hash}:refs/heads/${currentBranch}`]);
          vscode.window.showInformationMessage(`Pushed up to ${hash.slice(0, 8)} on ${currentBranch}`);
          this.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Push failed: ${err.message}`);
        }
        break;
      }
      case 'showRepoAtRevision': {
        const { hash } = msg.payload;
        try {
          const files = await this.gitService.getCommitFiles(hash);
          if (files.length === 0) {
            vscode.window.showInformationMessage(`No files changed in ${hash.slice(0, 8)}.`);
            break;
          }
          const items = files.map(f => ({
            label: `${f.status} ${f.path}`,
            description: f.oldPath ? `from ${f.oldPath}` : '',
            path: f.path,
          }));
          const picked = await vscode.window.showQuickPick(items, {
            placeHolder: `Files changed in commit ${hash.slice(0, 8)}`,
          });
          if (picked) {
            const uri = GitContentProvider.makeUri(hash, picked.path);
            await vscode.commands.executeCommand('vscode.open', uri);
          }
        } catch (err: any) {
          vscode.window.showErrorMessage(`Show revision failed: ${err.message}`);
        }
        break;
      }
      case 'openInBrowser': {
        const { hash } = msg.payload;
        try {
          const remoteUrl = await this.gitService.getRemoteUrl();
          if (!remoteUrl) {
            vscode.window.showWarningMessage('No remote URL found for this repository.');
            break;
          }
          let httpUrl = remoteUrl
            .replace(/^ssh:\/\/git@([^/:]+)(?::\d+)?\//, 'https://$1/')
            .replace(/^git@([^:]+):/, 'https://$1/')
            .replace(/^https?:\/\/[^@]+@/, 'https://')
            .replace(/\.git$/, '');
          if (httpUrl.includes('gitlab.com') || httpUrl.includes('gitlab')) {
            httpUrl = `${httpUrl}/-/commit/${hash}`;
          } else {
            httpUrl = `${httpUrl}/commit/${hash}`;
          }
          await vscode.env.openExternal(vscode.Uri.parse(httpUrl));
        } catch (err: any) {
          vscode.window.showErrorMessage(`Open in browser failed: ${err.message}`);
        }
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
