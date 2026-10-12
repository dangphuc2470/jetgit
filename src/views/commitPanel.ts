import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitService, type StatusEntry } from '../git/gitService';
import { GitContentProvider } from '../providers/gitContentProvider';
import { CommitReviewPanel } from './commitReviewPanel';
import { PushDialogPanel } from './pushDialogPanel';
import { ConflictsDialogPanel } from './conflictsDialogPanel';
import { MergeEditorPanel } from './mergeEditorPanel';
import { generateAiCommitMessage } from '../utils/aiCommitGenerator';
import { getNonce } from '../utils/themeTokens';

export class CommitViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'intellij-git.commitView';
  public static currentProvider?: CommitViewProvider;
  private view?: vscode.WebviewView;
  private changesFilePaths: string[] = [];
  private unversionedFilePaths: string[] = [];
  private allFilePaths: string[] = [];
  private lastStatusHash = '';
  private isRefreshing = false;
  private queuedRefresh = false;

  constructor(
    private extensionUri: vscode.Uri,
    private gitService: GitService,
    private log: vscode.OutputChannel,
  ) {
    CommitViewProvider.currentProvider = this;
    CommitReviewPanel.onFileNavigateListener = (filePath: string) => {
      this.selectFile(filePath);
    };
  }

  public selectFile(filePath: string): void {
    if (this.view) {
      this.view.webview.postMessage({
        type: 'selectFile',
        payload: filePath,
      });
    }
  }

  private getReviewFilesList(filePath: string): string[] {
    let list = this.unversionedFilePaths.includes(filePath)
      ? this.unversionedFilePaths
      : this.changesFilePaths;
    if (!list.includes(filePath)) {
      list = this.allFilePaths.length > 0 ? this.allFilePaths : [filePath];
    }
    return list;
  }

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

    this.refresh();
  }

  closeAllMenus(): void {
    this.view?.webview.postMessage({ type: 'closeAllMenus' });
  }

  async refresh(): Promise<void> {
    if (!this.view || !this.view.visible) return;
    if (this.isRefreshing) {
      this.queuedRefresh = true;
      return;
    }
    this.isRefreshing = true;

    try {
      const isRepo = await this.gitService.isGitRepo();
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      const repoName = workspaceFolder ? workspaceFolder.name : (path.basename(this.gitService.getCwd()) || 'Project');
      if (!isRepo) {
        this.view.webview.postMessage({
          type: 'status',
          payload: {
            files: [],
            changesCount: 0,
            unversionedCount: 0,
            recentMessages: [],
            stashes: [],
            repoName,
          },
        });
        return;
      }

      await this.gitService.unmaskAllAssumeUnchanged();

      const [statusEntries, mergeMsg, recentMessages, stashes, totalDiff, cachedDiff, conflictInfo] = await Promise.all([
        this.gitService.getStatus(),
        this.gitService.getMergeMessage(),
        this.gitService.getRecentCommitMessages(10),
        this.gitService.getStashes(),
        this.gitService.exec(['diff', 'HEAD']).catch(() => ''),
        this.gitService.exec(['diff', '--cached']).catch(() => ''),
        this.gitService.getConflictInfo().catch(() => ({
          hasConflicts: false,
          isMerging: false,
          isRebasing: false,
          yoursBranch: '',
          theirsBranch: '',
          conflicts: [],
        })),
      ]);

      const totalChangesMap = this.parseChangesPerFile(totalDiff);
      const stagedChangesMap = this.parseChangesPerFile(cachedDiff);

      const files = statusEntries.map(entry => {
        const filePath = entry.path;
        const fileName = path.basename(filePath);
        const fileDir = path.dirname(filePath);
        const isUntracked = entry.x === '?' && entry.y === '?';
        const isStaged = entry.x !== ' ' && entry.x !== '?';
        const totalChanges = totalChangesMap.get(filePath) || 0;
        const stagedChanges = stagedChangesMap.get(filePath) || 0;
        const isPartiallyStaged = totalChanges > 0 && stagedChanges > 0 && stagedChanges < totalChanges;

        return {
          path: filePath,
          name: fileName,
          dir: fileDir === '.' ? '' : fileDir,
          status: entry.y !== ' ' ? entry.y : entry.x,
          staged: isStaged,
          isUntracked,
          totalChanges,
          stagedChanges,
          partiallyStaged: isPartiallyStaged,
        };
      });

      const changesFiles = files
        .filter(f => !f.isUntracked)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.path.localeCompare(b.path));
      const unversionedFiles = files
        .filter(f => f.isUntracked)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.path.localeCompare(b.path));
      const sortedFiles = [...changesFiles, ...unversionedFiles];

      const changesCount = changesFiles.length;
      const unversionedCount = unversionedFiles.length;

      this.changesFilePaths = changesFiles.map(f => f.path);
      this.unversionedFilePaths = unversionedFiles.map(f => f.path);
      this.allFilePaths = sortedFiles.map(f => f.path);
      this.lastStatusHash = sortedFiles.map(f => `${f.status}:${f.path}:${f.totalChanges}:${f.staged}`).join('\n');

      this.view.webview.postMessage({
        type: 'status',
        payload: {
          files: sortedFiles,
          changesCount,
          unversionedCount,
          defaultCommitMessage: mergeMsg || '',
          recentMessages,
          stashes,
          conflictInfo,
          repoName,
        },
      });
    } catch (err: any) {
      this.log.appendLine(`Commit panel status fetch failed: ${err.message}`);
    } finally {
      this.isRefreshing = false;
      if (this.queuedRefresh) {
        this.queuedRefresh = false;
        this.refresh();
      }
    }
  }

  private parseChangesPerFile(diffText: string): Map<string, number> {
    const map = new Map<string, number>();
    if (!diffText || !diffText.trim()) return map;

    const fileSections = diffText.split(/^diff --git /m);
    for (const section of fileSections) {
      if (!section.trim()) continue;
      const match = section.match(/^a\/(.*?)\s+b\/(.*?)(?:\n|$)/);
      if (!match) continue;
      const filePath = match[2];

      const lines = section.split('\n');
      let count = 0;
      let inHunk = false;
      let inDiffBlock = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('@@')) {
          inHunk = true;
          inDiffBlock = false;
        } else if (inHunk) {
          if (line.startsWith('+') || line.startsWith('-')) {
            if (!inDiffBlock) {
              count++;
              inDiffBlock = true;
            }
          } else if (line.startsWith(' ')) {
            inDiffBlock = false;
          }
        }
      }
      map.set(filePath, count);
    }
    return map;
  }

  private async handleMessage(msg: { type: string; payload?: any }): Promise<void> {
    switch (msg.type) {
      case 'ready':
      case 'refresh': {
        await this.refresh();
        break;
      }
      case 'selectFile':
      case 'openReviewInCenter': {
        const filePath = typeof msg.payload === 'string' ? msg.payload : msg.payload?.filePath;
        const jumpDiff = typeof msg.payload === 'object' ? Boolean(msg.payload?.jumpDiff) : false;
        const fromFileList = typeof msg.payload === 'object' ? Boolean(msg.payload?.fromFileList) : false;
        const direction = typeof msg.payload === 'object' ? (msg.payload?.direction || 1) : 1;
        if (filePath) {
          const panel = CommitReviewPanel.createOrShow(
            this.extensionUri,
            this.gitService,
            filePath,
            this.getReviewFilesList(filePath),
            () => this.refresh(),
          );
          if (jumpDiff) {
            panel.focusAndJumpDiff(direction, fromFileList);
          }
        }
        break;
      }
      case 'stageFile': {
        const filePath = msg.payload as string;
        try {
          await this.gitService.stageFile(filePath);
          if (CommitReviewPanel.currentPanel && CommitReviewPanel.currentPanel.getCurrentFilePath() === filePath) {
            await CommitReviewPanel.currentPanel.loadFile(filePath, this.getReviewFilesList(filePath));
          }
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Stage failed: ${err.message}`);
        }
        break;
      }
      case 'stageFiles': {
        const filePaths = msg.payload as string[];
        if (!filePaths || filePaths.length === 0) return;
        try {
          await this.gitService.stageFiles(filePaths);
          if (CommitReviewPanel.currentPanel) {
            const current = CommitReviewPanel.currentPanel.getCurrentFilePath();
            if (current && filePaths.includes(current)) {
              await CommitReviewPanel.currentPanel.loadFile(current, this.getReviewFilesList(current));
            }
          }
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Stage failed: ${err.message}`);
        }
        break;
      }
      case 'unstageFile': {
        const filePath = msg.payload as string;
        try {
          await this.gitService.unstageFile(filePath);
          if (CommitReviewPanel.currentPanel && CommitReviewPanel.currentPanel.getCurrentFilePath() === filePath) {
            await CommitReviewPanel.currentPanel.loadFile(filePath, this.getReviewFilesList(filePath));
          }
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Unstage failed: ${err.message}`);
        }
        break;
      }
      case 'unstageFiles': {
        const filePaths = msg.payload as string[];
        if (!filePaths || filePaths.length === 0) return;
        try {
          await this.gitService.unstageFiles(filePaths);
          if (CommitReviewPanel.currentPanel) {
            const current = CommitReviewPanel.currentPanel.getCurrentFilePath();
            if (current && filePaths.includes(current)) {
              await CommitReviewPanel.currentPanel.loadFile(current, this.getReviewFilesList(current));
            }
          }
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Unstage failed: ${err.message}`);
        }
        break;
      }
      case 'rollbackFiles': {
        const filePaths = msg.payload as string[];
        if (!filePaths || filePaths.length === 0) return;
        const confirm = await vscode.window.showWarningMessage(
          `Rollback changes in ${filePaths.length} file(s)? This cannot be undone.`,
          { modal: true },
          'Rollback',
        );
        if (confirm !== 'Rollback') return;
        try {
          await this.gitService.rollbackFiles(filePaths);
          vscode.window.showInformationMessage(`Rolled back ${filePaths.length} file(s).`);
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Rollback failed: ${err.message}`);
        }
        break;
      }
      case 'jumpToSource': {
        const filePath = msg.payload as string;
        if (filePath) {
          const fullPath = path.join(this.gitService.getCwd(), filePath);
          if (fs.existsSync(fullPath)) {
            vscode.commands.executeCommand('vscode.open', vscode.Uri.file(fullPath));
          }
        }
        break;
      }
      case 'deleteFile': {
        const filePath = msg.payload as string;
        if (!filePath) return;
        const fileName = path.basename(filePath);
        const confirm = await vscode.window.showWarningMessage(
          `Are you sure you want to delete "${fileName}"?`,
          { modal: true },
          'Delete',
        );
        if (confirm !== 'Delete') return;
        try {
          const fullPath = path.join(this.gitService.getCwd(), filePath);
          if (fs.existsSync(fullPath)) {
            if (fs.statSync(fullPath).isDirectory()) {
              fs.rmSync(fullPath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(fullPath);
            }
          }
          await this.gitService.exec(['rm', '-f', '--cached', filePath]).catch(() => {});
          await this.refresh();
          vscode.window.showInformationMessage(`Deleted ${fileName}`);
        } catch (err: any) {
          vscode.window.showErrorMessage(`Delete failed: ${err.message}`);
        }
        break;
      }
      case 'getFileDiff': {
        const filePath = msg.payload as string;
        try {
          const diff = await this.gitService.getFileDiff(filePath);
          this.view?.webview.postMessage({
            type: 'fileDiff',
            payload: { path: filePath, diff },
          });
        } catch (err: any) {
          this.log.appendLine(`Get diff failed: ${err.message}`);
        }
        break;
      }
      case 'applyHunkPatch': {
        const { patch, reverse } = msg.payload;
        try {
          await this.gitService.applyHunkPatch(patch, reverse);
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Apply patch failed: ${err.message}`);
        }
        break;
      }
      case 'commit': {
        const { message, files, amend } = msg.payload;
        try {
          await this.gitService.commitFiles(message, files, amend);
          vscode.window.showInformationMessage('Committed successfully.');
          this.view?.webview.postMessage({ type: 'commitSuccess' });
          await this.refresh();
          vscode.commands.executeCommand('intellij-git.refreshBranches');
        } catch (err: any) {
          vscode.window.showErrorMessage(`Commit failed: ${err.message}`);
        }
        break;
      }
      case 'commitAndPush': {
        const { message, files, amend } = msg.payload;
        try {
          await this.gitService.commitFiles(message, files, amend);
          vscode.window.showInformationMessage('Committed successfully.');
          this.view?.webview.postMessage({ type: 'commitSuccess' });
          await this.refresh();
          vscode.commands.executeCommand('intellij-git.refreshBranches');
          await this.openPushDialog();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Commit failed: ${err.message}`);
        }
        break;
      }
      case 'openPushDialog': {
        await this.openPushDialog(msg.payload?.branch);
        break;
      }
      case 'executePush': {
        const { branch, targetBranch, force, setUpstream, remote, tags } = msg.payload || {};
        try {
          await this.gitService.push(branch, force, setUpstream, remote, tags, targetBranch);
          vscode.window.showInformationMessage(`Pushed ${branch || 'branch'} successfully to ${remote || 'remote'}.`);
          await this.refresh();
          vscode.commands.executeCommand('intellij-git.refreshBranches');
          this.view?.webview.postMessage({ type: 'pushSuccess' });
        } catch (err: any) {
          vscode.window.showErrorMessage(`Push failed: ${err.message}`);
          this.view?.webview.postMessage({ type: 'pushError', payload: { error: err.message } });
        }
        break;
      }
      case 'acceptYours': {
        const { path: filePath } = msg.payload;
        try {
          await this.gitService.acceptYours(filePath);
          vscode.window.showInformationMessage(`Accepted Yours for '${filePath}'`);
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Accept Yours failed: ${err.message}`);
        }
        break;
      }
      case 'acceptTheirs': {
        const { path: filePath } = msg.payload;
        try {
          await this.gitService.acceptTheirs(filePath);
          vscode.window.showInformationMessage(`Accepted Theirs for '${filePath}'`);
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Accept Theirs failed: ${err.message}`);
        }
        break;
      }
      case 'openMergeEditor': {
        const { path: filePath } = msg.payload;
        try {
          await MergeEditorPanel.createOrShow(this.extensionUri, this.gitService, filePath);
        } catch (err: any) {
          vscode.window.showErrorMessage(`Failed to open merge editor: ${err.message}`);
        }
        break;
      }
      case 'abortMerge': {
        const confirmed = await vscode.window.showWarningMessage(
          'Are you sure you want to abort the current merge/rebase? All uncommitted merge changes will be lost.',
          { modal: true },
          'Abort'
        );
        if (confirmed === 'Abort') {
          try {
            await this.gitService.abortMerge();
            vscode.window.showInformationMessage('Merge/rebase aborted.');
            await this.refresh();
          } catch (err: any) {
            vscode.window.showErrorMessage(`Abort failed: ${err.message}`);
          }
        }
        break;
      }
      case 'openConflictsDialog': {
        this.openConflictsDialog();
        break;
      }
      case 'generateAiCommitMessage': {
        const { files } = msg.payload || {};
        const checkedFiles: string[] = Array.isArray(files) ? files : [];
        try {
          const finalMessage = await generateAiCommitMessage(this.gitService, checkedFiles);
          if (finalMessage) {
            this.view?.webview.postMessage({
              type: 'setCommitMessage',
              payload: { message: finalMessage },
            });
          } else {
            this.view?.webview.postMessage({ type: 'generateAiError' });
            vscode.window.showWarningMessage('No commit message was generated by AI.');
          }
        } catch (err: any) {
          this.view?.webview.postMessage({ type: 'generateAiError' });
          vscode.window.showErrorMessage(`Failed to generate commit message: ${err.message}`);
        } finally {
          await this.refresh();
        }
        break;
      }
      case 'openDiffInEditor': {
        const filePath = msg.payload as string;
        try {
          const leftUri = GitContentProvider.makeUri('HEAD', filePath);
          const rightUri = vscode.Uri.file(path.join(this.gitService.getCwd(), filePath));
          const fileName = path.basename(filePath);
          await vscode.commands.executeCommand('vscode.diff', leftUri, rightUri, `${fileName} (HEAD ↔ Working Tree)`);
        } catch (err: any) {
          vscode.window.showErrorMessage(`Open diff editor failed: ${err.message}`);
        }
        break;
      }
      case 'createStash': {
        const msgText = await vscode.window.showInputBox({
          prompt: 'Stash message (optional)',
          placeHolder: 'WIP on feature...',
        });
        if (msgText === undefined) return;
        try {
          await this.gitService.stashSave(msgText);
          vscode.window.showInformationMessage('Stashed local changes.');
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Stash failed: ${err.message}`);
        }
        break;
      }
      case 'stashPop': {
        const idx = msg.payload as string;
        try {
          await this.gitService.stashPop(idx);
          vscode.window.showInformationMessage(`Applied and dropped ${idx}`);
        } catch (err: any) {
          const raw = err?.message || String(err);
          if (raw.includes('CONFLICT') || raw.includes('conflict') || raw.includes('Merge conflict')) {
            vscode.window.showWarningMessage(
              `Stash applied with merge conflicts. Resolve them in the merge editor.`,
              'Resolve Conflicts'
            ).then(res => {
              if (res === 'Resolve Conflicts') {
                vscode.commands.executeCommand('intellij-git.resolveConflicts');
              }
            });
          } else {
            vscode.window.showErrorMessage(`Stash pop failed: ${err.message}`);
          }
        } finally {
          await this.refresh();
        }
        break;
      }
      case 'stashApply': {
        const idx = msg.payload as string;
        try {
          await this.gitService.stashApply(idx);
          vscode.window.showInformationMessage(`Applied ${idx}`);
        } catch (err: any) {
          const raw = err?.message || String(err);
          if (raw.includes('CONFLICT') || raw.includes('conflict') || raw.includes('Merge conflict')) {
            vscode.window.showWarningMessage(
              `Stash applied with merge conflicts. Resolve them in the merge editor.`,
              'Resolve Conflicts'
            ).then(res => {
              if (res === 'Resolve Conflicts') {
                vscode.commands.executeCommand('intellij-git.resolveConflicts');
              }
            });
          } else {
            vscode.window.showErrorMessage(`Stash apply failed: ${err.message}`);
          }
        } finally {
          await this.refresh();
        }
        break;
      }
      case 'stashDrop': {
        const idx = msg.payload as string;
        const confirm = await vscode.window.showWarningMessage(
          `Drop stash ${idx}?`,
          { modal: true },
          'Drop',
        );
        if (confirm !== 'Drop') return;
        try {
          await this.gitService.stashDrop(idx);
          vscode.window.showInformationMessage(`Dropped ${idx}`);
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Stash drop failed: ${err.message}`);
        }
        break;
      }
      case 'openLog': {
        vscode.commands.executeCommand('intellij-git.openLog');
        break;
      }
      case 'collapseView': {
        vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility');
        break;
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
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'commit', 'commit.js'),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'commit', 'commit.css'),
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
  <title>Commit</title>
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  async openConflictsDialog(): Promise<void> {
    await ConflictsDialogPanel.createOrShow(this.extensionUri, this.gitService);
  }

  async openPushDialog(branch?: string): Promise<void> {
    await PushDialogPanel.createOrShow(this.extensionUri, this.gitService, branch);
  }
}
