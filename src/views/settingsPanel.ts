import * as vscode from 'vscode';
import { getNonce } from '../utils/themeTokens';
import {
  getJetGitSettings,
  updateJetGitSetting,
  resetAllJetGitSettings,
} from '../utils/settings';

export class SettingsPanel {
  public static currentPanel: SettingsPanel | undefined;
  public static readonly viewType = 'jetgit.settingsWindow';

  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    private extensionUri: vscode.Uri,
  ) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.html = this.getHtml();
    this.panel.webview.onDidReceiveMessage(
      msg => this.handleMessage(msg),
      null,
      this.disposables,
    );

    vscode.workspace.onDidChangeConfiguration(
      e => {
        if (e.affectsConfiguration('jetgit')) {
          this.sendSettings();
        }
      },
      null,
      this.disposables,
    );
  }

  static createOrShow(extensionUri: vscode.Uri): SettingsPanel {
    if (SettingsPanel.currentPanel) {
      SettingsPanel.currentPanel.panel.reveal();
      SettingsPanel.currentPanel.sendSettings();
      return SettingsPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      SettingsPanel.viewType,
      'JetGit Settings',
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist', 'webview'),
          vscode.Uri.joinPath(extensionUri, 'resources'),
        ],
      },
    );

    SettingsPanel.currentPanel = new SettingsPanel(panel, extensionUri);
    return SettingsPanel.currentPanel;
  }

  private sendSettings(): void {
    this.panel.webview.postMessage({
      type: 'settingsUpdate',
      payload: getJetGitSettings(),
    });
  }

  private async handleMessage(msg: any): Promise<void> {
    switch (msg?.type) {
      case 'ready': {
        this.sendSettings();
        break;
      }
      case 'updateSetting': {
        const { key, value } = msg.payload || {};
        if (typeof key === 'string' && key.length > 0) {
          await updateJetGitSetting(key, value);
        }
        break;
      }
      case 'resetAll': {
        await resetAllJetGitSettings();
        break;
      }
      case 'openJson': {
        await vscode.commands.executeCommand('workbench.action.openSettingsJson');
        break;
      }
      case 'openVscodeSettings': {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'jetgit');
        break;
      }
    }
  }

  public dispose(): void {
    SettingsPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private getHtml(): string {
    const webview = this.panel.webview;
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'settings', 'settings.js'),
    );
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JetGit Settings</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}
