import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitService, type StatusEntry } from '../git/gitService';
import { GitContentProvider } from '../providers/gitContentProvider';
import { CommitReviewPanel } from './commitReviewPanel';

export class CommitViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'intellij-git.commitView';
  private view?: vscode.WebviewView;
  private allFilePaths: string[] = [];
  private lastStatusHash = '';
  private isRefreshing = false;
  private queuedRefresh = false;

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

    this.refresh();
  }

  async refresh(): Promise<void> {
    if (!this.view) return;
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

      const [statusEntries, mergeMsg, recentMessages, stashes, totalDiff, cachedDiff] = await Promise.all([
        this.gitService.getStatus(),
        this.gitService.getMergeMessage(),
        this.gitService.getRecentCommitMessages(10),
        this.gitService.getStashes(),
        this.gitService.exec(['diff', 'HEAD']).catch(() => ''),
        this.gitService.exec(['diff', '--cached']).catch(() => ''),
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

      files.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA !== nameB) return nameA.localeCompare(nameB);
        return a.path.localeCompare(b.path);
      });

      const changesCount = files.filter(f => !f.isUntracked).length;
      const unversionedCount = files.filter(f => f.isUntracked).length;

      this.allFilePaths = files.map(f => f.path);
      this.lastStatusHash = files.map(f => `${f.status}:${f.path}:${f.totalChanges}:${f.staged}`).join('\n');

      this.view.webview.postMessage({
        type: 'status',
        payload: {
          files,
          changesCount,
          unversionedCount,
          defaultCommitMessage: mergeMsg || '',
          recentMessages,
          stashes,
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
        const filePath = msg.payload as string;
        if (filePath) {
          CommitReviewPanel.createOrShow(
            this.extensionUri,
            this.gitService,
            filePath,
            this.allFilePaths,
            () => this.refresh(),
          );
        }
        break;
      }
      case 'stageFile': {
        const filePath = msg.payload as string;
        try {
          await this.gitService.stageFile(filePath);
          if (CommitReviewPanel.currentPanel && CommitReviewPanel.currentPanel.getCurrentFilePath() === filePath) {
            await CommitReviewPanel.currentPanel.loadFile(filePath, this.allFilePaths);
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
              await CommitReviewPanel.currentPanel.loadFile(current, this.allFilePaths);
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
            await CommitReviewPanel.currentPanel.loadFile(filePath, this.allFilePaths);
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
              await CommitReviewPanel.currentPanel.loadFile(current, this.allFilePaths);
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
          await this.gitService.commitAndPush(message, files, amend);
          vscode.window.showInformationMessage('Committed and pushed successfully.');
          this.view?.webview.postMessage({ type: 'commitSuccess' });
          await this.refresh();
          vscode.commands.executeCommand('intellij-git.refreshBranches');
        } catch (err: any) {
          vscode.window.showErrorMessage(`Commit and Push failed: ${err.message}`);
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
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
