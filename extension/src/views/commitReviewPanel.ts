import * as vscode from 'vscode';
import * as path from 'path';
import { GitService } from '../git/gitService';

export class CommitReviewPanel {
  public static currentPanel: CommitReviewPanel | undefined;
  public static readonly viewType = 'intellij-git.commitReview';

  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private currentFilePath = '';
  private filesList: string[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    private extensionUri: vscode.Uri,
    private gitService: GitService,
    private onStageChange?: () => void,
  ) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.html = this.getHtml();
    this.panel.webview.onDidReceiveMessage(
      msg => this.handleMessage(msg),
      null,
      this.disposables,
    );
  }

  static createOrShow(
    extensionUri: vscode.Uri,
    gitService: GitService,
    filePath: string,
    filesList: string[] = [],
    onStageChange?: () => void,
  ): CommitReviewPanel {
    const fileName = path.basename(filePath);
    if (CommitReviewPanel.currentPanel) {
      CommitReviewPanel.currentPanel.panel.title = `Diff: ${fileName}`;
      CommitReviewPanel.currentPanel.panel.reveal(vscode.ViewColumn.Active, true);
      CommitReviewPanel.currentPanel.loadFile(filePath, filesList);
      return CommitReviewPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      CommitReviewPanel.viewType,
      `Diff: ${fileName}`,
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist', 'webview'),
        ],
      },
    );

    CommitReviewPanel.currentPanel = new CommitReviewPanel(
      panel,
      extensionUri,
      gitService,
      onStageChange,
    );
    CommitReviewPanel.currentPanel.loadFile(filePath, filesList);
    return CommitReviewPanel.currentPanel;
  }

  async loadFile(filePath: string, filesList?: string[]): Promise<void> {
    this.currentFilePath = filePath;
    if (filesList) this.filesList = filesList;
    const fileName = path.basename(filePath);
    this.panel.title = `Diff: ${fileName}`;

    try {
      const diff = await this.gitService.getFileDiff(filePath);
      let baseContent = '';
      try {
        baseContent = await this.gitService.exec(['show', `HEAD:${filePath}`]);
      } catch {
        baseContent = '';
      }
      let currentContent = '';
      try {
        const fullPath = path.join(this.gitService.getCwd(), filePath);
        if (require('fs').existsSync(fullPath)) {
          currentContent = require('fs').readFileSync(fullPath, 'utf8');
        }
      } catch {
        currentContent = '';
      }
      const currentFileIndex = this.filesList.indexOf(filePath);
      this.panel.webview.postMessage({
        type: 'fileDiff',
        payload: {
          path: filePath,
          fileName,
          fileDir: path.dirname(filePath) === '.' ? '' : path.dirname(filePath),
          diff,
          baseContent,
          currentContent,
          filesList: this.filesList,
          currentFileIndex: currentFileIndex !== -1 ? currentFileIndex : 0,
        },
      });
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to load diff: ${err.message}`);
    }
  }

  private async handleMessage(msg: { type: string; payload?: any }): Promise<void> {
    switch (msg.type) {
      case 'ready': {
        if (this.currentFilePath) {
          this.loadFile(this.currentFilePath, this.filesList);
        }
        break;
      }
      case 'refreshDiff': {
        const filePath = msg.payload || this.currentFilePath;
        this.loadFile(filePath, this.filesList);
        break;
      }
      case 'navigateFile': {
        const newIndex = msg.payload as number;
        if (newIndex >= 0 && newIndex < this.filesList.length) {
          const newPath = this.filesList[newIndex];
          this.loadFile(newPath, this.filesList);
        }
        break;
      }
      case 'applyHunkPatch': {
        const { patch, reverse } = msg.payload;
        try {
          await this.gitService.applyHunkPatch(patch, reverse);
          if (this.onStageChange) this.onStageChange();
          this.loadFile(this.currentFilePath, this.filesList);
        } catch (err: any) {
          vscode.window.showErrorMessage(`Apply patch failed: ${err.message}`);
        }
        break;
      }
      case 'rollbackHunk': {
        const { patch } = msg.payload;
        try {
          await this.gitService.applyHunkPatch(patch, true);
          if (this.onStageChange) this.onStageChange();
          this.loadFile(this.currentFilePath, this.filesList);
          vscode.window.showInformationMessage('Hunk rolled back.');
        } catch (err: any) {
          vscode.window.showErrorMessage(`Rollback hunk failed: ${err.message}`);
        }
        break;
      }
    }
  }

  private getHtml(): string {
    const scriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'commit', 'review.js'),
    );
    const styleUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'commit', 'commit.css'),
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline' ${this.panel.webview.cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri}">
  <title>Code Review</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private dispose(): void {
    CommitReviewPanel.currentPanel = undefined;
    for (const d of this.disposables) d.dispose();
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
