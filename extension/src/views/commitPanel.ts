import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitService, type StatusEntry } from '../git/gitService';
import { GitContentProvider } from '../providers/gitContentProvider';
import { CommitReviewPanel } from './commitReviewPanel';

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
    if (this.unversionedFilePaths.includes(filePath)) {
      return this.unversionedFilePaths;
    }
    return this.changesFilePaths;
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
      ],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(msg => this.handleMessage(msg));

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.refresh();
      }
    });

    this.refresh();
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
      if (!isRepo) {
        this.view.webview.postMessage({
          type: 'status',
          payload: {
            files: [],
            changesCount: 0,
            unversionedCount: 0,
            recentMessages: [],
            stashes: [],
          },
        });
        return;
      }

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
          const fileUri = vscode.Uri.file(path.join(this.workspaceRoot, filePath));
          try {
            await vscode.commands.executeCommand('git.openMergeEditor', fileUri);
          } catch {
            await vscode.commands.executeCommand('vscode.open', fileUri);
          }
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
        const assumedFiles: string[] = [];
        const temporarilyUnstaged: string[] = [];

        try {
          // Strictly isolate checked files so AI only generates message for ticked files
          const allStatus = await this.gitService.getStatus();
          const trackedToMask: string[] = [];

          for (const s of allStatus) {
            const isUntracked = s.x === '?' && s.y === '?';
            const isChecked = checkedFiles.includes(s.path);

            if (isChecked) {
              // Ensure checked files are staged in git index so AI sees them
              if (s.y !== ' ' && s.x === ' ') {
                await this.gitService.stageFiles([s.path]);
              } else if (isUntracked) {
                await this.gitService.stageFiles([s.path]);
              }
              // If file has unstaged changes/hunks, assume-unchanged ensures AI only sees the staged part!
              if (s.y !== ' ' && s.x !== ' ') {
                trackedToMask.push(s.path);
              }
            } else {
              // UNCHECKED file: must be completely hidden from AI
              if (s.x !== ' ' && s.x !== '?') {
                // If it was staged in index, unstage it so git diff HEAD won't include it
                temporarilyUnstaged.push(s.path);
                await this.gitService.unstageFile(s.path);
              }
              if (!isUntracked) {
                // Tracked file with changes -> mask it from git diff HEAD
                trackedToMask.push(s.path);
              }
            }
          }

          if (trackedToMask.length > 0) {
            await this.gitService.setAssumeUnchanged(trackedToMask, true);
            assumedFiles.push(...trackedToMask);
          }

          // Fetch only the current author's recent clean commits (excluding merge/MR commits)
          const authorSamples = await this.gitService.getAuthorRecentCommitMessages(10);

          const repoRoot = this.gitService.getCwd();
          const gitExt = vscode.extensions.getExtension('vscode.git');
          let gitRepo: any;
          if (gitExt) {
            const gitApi = gitExt.exports.getAPI(1);
            gitRepo = gitApi.repositories.find((r: any) => r.rootUri.fsPath === repoRoot || r.rootUri.path === repoRoot) || gitApi.repositories[0];
          }

          // Antigravity's command internally triggers 'workbench.view.scm'.
          // We immediately and repeatedly restore focus back to our commit tool window!
          const restoreFocus = () => {
            vscode.commands.executeCommand('workbench.view.extension.intellij-git-commit');
            vscode.commands.executeCommand('intellij-git.commitView.focus');
          };
          setTimeout(restoreFocus, 30);
          setTimeout(restoreFocus, 80);
          setTimeout(restoreFocus, 180);
          setTimeout(restoreFocus, 350);

          let aiMsg = '';

          // 1. Try VS Code Language Model API if available with few-shot author samples
          try {
            if ((vscode as any).lm && typeof (vscode as any).lm.selectChatModels === 'function') {
              const models = await (vscode as any).lm.selectChatModels({ family: 'gemini-1.5-pro' }).catch(() => []);
              const model = models[0] || (await (vscode as any).lm.selectChatModels().catch(() => []))[0];
              if (model) {
                const stagedDiff = await this.gitService.getStagedDiff();
                if (stagedDiff && stagedDiff.trim()) {
                  const prompt = [
                    'You are an expert Git commit message generator.',
                    authorSamples.length > 0
                      ? `Follow the exact style, tone, and conventions of the author's recent commit messages below:\n${authorSamples.map(s => `- ${s}`).join('\n')}`
                      : 'Write a concise, high quality commit message.',
                    'Generate ONLY a single-line commit summary with no markdown, quotes, backticks, or extra explanation.',
                    `Git diff:\n${stagedDiff.slice(0, 8000)}`
                  ].join('\n\n');

                  const response = await model.sendRequest([
                    (vscode as any).LanguageModelChatMessage.User(prompt)
                  ]);
                  let accumulated = '';
                  for await (const chunk of response.text) {
                    accumulated += chunk;
                  }
                  if (accumulated.trim()) {
                    aiMsg = accumulated.trim().replace(/^[`'"]+|[`'"]+$/g, '');
                  }
                }
              }
            }
          } catch {}

          // 2. Fallback to Antigravity IDE built-in command if LM API was not available
          if (!aiMsg) {
            aiMsg = (await vscode.commands.executeCommand<string>('antigravity.generateCommitMessage', repoRoot)) || '';
          }

          if (!aiMsg && gitRepo?.inputBox?.value) {
            aiMsg = gitRepo.inputBox.value;
          }

          restoreFocus();

          if (aiMsg && typeof aiMsg === 'string') {
            // Adapt to the author's personal style
            const finalMessage = adaptCommitMessageStyle(aiMsg, authorSamples);
            this.view?.webview.postMessage({
              type: 'setCommitMessage',
              payload: { message: finalMessage.trim() },
            });
          } else {
            this.view?.webview.postMessage({ type: 'generateAiError' });
            vscode.window.showWarningMessage('No commit message was generated by AI.');
          }
        } catch (err: any) {
          this.view?.webview.postMessage({ type: 'generateAiError' });
          vscode.window.showErrorMessage(`Failed to generate commit message: ${err.message}`);
        } finally {
          // ALWAYS restore assume-unchanged and previously staged files cleanly
          if (assumedFiles.length > 0) {
            await this.gitService.setAssumeUnchanged(assumedFiles, false);
          }
          if (temporarilyUnstaged.length > 0) {
            await this.gitService.stageFiles(temporarilyUnstaged);
          }
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
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Stash pop failed: ${err.message}`);
        }
        break;
      }
      case 'stashApply': {
        const idx = msg.payload as string;
        try {
          await this.gitService.stashApply(idx);
          vscode.window.showInformationMessage(`Applied ${idx}`);
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Stash apply failed: ${err.message}`);
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
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  openConflictsDialog(): void {
    if (this.view) {
      this.view.show?.(true);
      this.view.webview.postMessage({ type: 'showConflictsDialog' });
    }
  }

  async openPushDialog(branch?: string): Promise<void> {
    if (this.view) {
      try {
        const pushInfo = await this.gitService.getPushInfo(branch);
        this.view.show?.(true);
        this.view.webview.postMessage({
          type: 'showPushDialog',
          payload: pushInfo,
        });
      } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to get push info: ${err.message}`);
      }
    }
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

interface AuthorStyle {
  type: 'imperative' | 'conventional';
  hasScope?: boolean;
  endsWithPeriod?: boolean;
}

function detectAuthorStyle(messages: string[]): AuthorStyle {
  if (!messages || messages.length === 0) {
    return { type: 'imperative', endsWithPeriod: false };
  }

  let conventionalCount = 0;
  let imperativeCount = 0;
  let periodCount = 0;
  let scopeCount = 0;

  const conventionalRegex = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_\-\.\/]+\))?:\s*(.+)/i;

  for (const msg of messages) {
    if (msg.endsWith('.')) periodCount++;
    const convMatch = msg.match(conventionalRegex);
    if (convMatch) {
      conventionalCount++;
      if (convMatch[2]) scopeCount++;
    } else if (/^[A-Z][a-zA-Z0-9_\-]*\s+/.test(msg)) {
      imperativeCount++;
    }
  }

  return {
    type: conventionalCount > imperativeCount ? 'conventional' : 'imperative',
    hasScope: scopeCount > conventionalCount / 2,
    endsWithPeriod: periodCount > messages.length / 2,
  };
}

function adaptCommitMessageStyle(raw: string, samples: string[]): string {
  if (!raw) return raw;
  const style = detectAuthorStyle(samples);
  let msg = raw.trim();

  if (style.type === 'imperative') {
    // Strip Conventional Commit prefix like feat: or fix(core):
    msg = msg.replace(/^(?:feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(?:\([^\)]+\))?!?:\s*/i, '');
    msg = msg.charAt(0).toUpperCase() + msg.slice(1);
    if (!style.endsWithPeriod) {
      msg = msg.replace(/\.+$/, '');
    } else if (!msg.endsWith('.')) {
      msg += '.';
    }
    return msg;
  } else {
    // Conventional commit style
    const convRegex = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_\-\.\/]+\))?!?:\s*(.+)/i;
    const match = msg.match(convRegex);
    if (match) {
      const type = match[1].toLowerCase();
      const scope = match[2] ? match[2].toLowerCase() : '';
      let desc = match[3].trim();
      desc = desc.charAt(0).toLowerCase() + desc.slice(1);
      desc = desc.replace(/\.+$/, '');
      return `${type}${scope}: ${desc}`;
    }

    let type = 'feat';
    if (/^(fix|resolve|prevent|handle|correct)\b/i.test(msg)) type = 'fix';
    else if (/^(refactor|clean|simplify)\b/i.test(msg)) type = 'refactor';
    else if (/^(doc|document|docs)\b/i.test(msg)) type = 'docs';
    else if (/^(test|tests)\b/i.test(msg)) type = 'test';
    else if (/^(chore|build|ci)\b/i.test(msg)) type = 'chore';

    let desc = msg.charAt(0).toLowerCase() + msg.slice(1);
    desc = desc.replace(/\.+$/, '');
    return `${type}: ${desc}`;
  }
}
