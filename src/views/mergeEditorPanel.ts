import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitService } from '../git/gitService';
import { ConflictsDialogPanel } from './conflictsDialogPanel';
import { getThemeTokens, getNonce } from '../utils/themeTokens';
import { MergeToExtensionMessage, ExtensionToMergeMessage } from '../shared/protocol';
import { parseConflictHunksFromText, type ConflictHunk } from '../shared/mergeResolveUtil';

export class MergeEditorPanel {
  public static currentPanel: MergeEditorPanel | undefined;
  public static readonly viewType = 'jetgit.mergeEditor';

  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private currentFilePath = '';

  private constructor(
    panel: vscode.WebviewPanel,
    private extensionUri: vscode.Uri,
    private gitService: GitService,
    filePath: string,
  ) {
    this.panel = panel;
    this.currentFilePath = filePath;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    vscode.window.onDidChangeActiveColorTheme(
      () => this.sendThemeTokens(),
      null,
      this.disposables,
    );
    this.panel.webview.html = this.getHtml();
    this.panel.webview.onDidReceiveMessage(
      msg => this.handleMessage(msg),
      null,
      this.disposables,
    );
  }

  static async createOrShow(
    extensionUri: vscode.Uri,
    gitService: GitService,
    filePath: string,
  ): Promise<MergeEditorPanel> {
    const fileName = path.basename(filePath);
    if (MergeEditorPanel.currentPanel) {
      MergeEditorPanel.currentPanel.currentFilePath = filePath;
      MergeEditorPanel.currentPanel.panel.title = `Merge: ${fileName}`;
      MergeEditorPanel.currentPanel.panel.reveal(vscode.ViewColumn.Active, true);
      await MergeEditorPanel.currentPanel.loadConflictData(filePath);
      return MergeEditorPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      MergeEditorPanel.viewType,
      `Merge: ${fileName}`,
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist', 'webview'),
        ],
      },
    );

    MergeEditorPanel.currentPanel = new MergeEditorPanel(
      panel,
      extensionUri,
      gitService,
      filePath,
    );
    return MergeEditorPanel.currentPanel;
  }

  private async loadConflictData(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.gitService.getCwd(), filePath);
      let fileOnDisk = '';
      if (fs.existsSync(fullPath)) {
        fileOnDisk = fs.readFileSync(fullPath, 'utf8');
      }

      let baseContent = '';
      let yoursContent = '';
      let theirsContent = '';

      try {
        baseContent = await this.gitService.exec(['show', `:1:${filePath}`]);
      } catch {}
      try {
        yoursContent = await this.gitService.exec(['show', `:2:${filePath}`]);
      } catch {}
      try {
        theirsContent = await this.gitService.exec(['show', `:3:${filePath}`]);
      } catch {}

      const conflictInfo = await this.gitService.getConflictInfo().catch(() => ({
        yoursBranch: 'HEAD',
        theirsBranch: 'Incoming',
      }));

      const hunks = parseConflictHunksFromText(fileOnDisk, yoursContent, theirsContent, baseContent);

      this.panel.webview.postMessage({
        type: 'loadMergeData',
        payload: {
          filePath,
          fileName: path.basename(filePath),
          yoursBranch: conflictInfo.yoursBranch || 'Current version',
          theirsBranch: conflictInfo.theirsBranch || 'Incoming version',
          hunks,
          baseContent,
          yoursContent,
          theirsContent,
        },
      });
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to load merge conflict data: ${err.message || err}`);
    }
  }

  private async handleMessage(msg: MergeToExtensionMessage): Promise<void> {
    switch (msg.type) {
      case 'ready': {
        this.sendThemeTokens();
        if (this.currentFilePath) {
          await this.loadConflictData(this.currentFilePath);
        }
        break;
      }
      case 'applyMerge': {
        const { filePath, content } = msg.payload;
        try {
          const fullPath = path.join(this.gitService.getCwd(), filePath);
          fs.writeFileSync(fullPath, content, 'utf8');
          await this.gitService.stageFile(filePath);

          if (ConflictsDialogPanel.currentPanel) {
            await ConflictsDialogPanel.currentPanel.refresh();
          }

          vscode.window.showInformationMessage(`Successfully resolved and staged '${path.basename(filePath)}'`);
          this.panel.dispose();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Failed to apply merge: ${err?.message || err}`);
        }
        break;
      }
      case 'cancelMerge': {
        this.panel.dispose();
        break;
      }
    }
  }

  private sendThemeTokens(): void {
    const tokens = getThemeTokens();
    this.panel.webview.postMessage({
      type: 'themeTokens',
      payload: tokens,
    });
  }

  private getHtml(): string {
    const webview = this.panel.webview;
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'merge', 'merge.js'),
    );
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>3-Way Merge Editor</title>
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  public dispose(): void {
    MergeEditorPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }
}
