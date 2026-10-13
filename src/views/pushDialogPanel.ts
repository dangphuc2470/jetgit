import * as vscode from 'vscode';
import * as path from 'path';
import { GitService } from '../git/gitService';
import { CommitReviewPanel } from './commitReviewPanel';
import { getNonce } from '../utils/themeTokens';
import { PushToExtensionMessage, ExtensionToPushMessage } from '../shared/protocol';

export class PushDialogPanel {
  public static currentPanel: PushDialogPanel | undefined;
  public static readonly viewType = 'intellij-git.pushDialogWindow';

  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    private extensionUri: vscode.Uri,
    private gitService: GitService,
    private pushInfo: any,
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

  static async createOrShow(
    extensionUri: vscode.Uri,
    gitService: GitService,
    targetBranch?: string,
  ): Promise<PushDialogPanel | undefined> {
    try {
      const pushInfo = await gitService.getPushInfo(targetBranch);
      if (!pushInfo) {
        vscode.window.showInformationMessage('No branch or commits found to push.');
        return undefined;
      }

      if (PushDialogPanel.currentPanel) {
        PushDialogPanel.currentPanel.panel.reveal();
        PushDialogPanel.currentPanel.update(pushInfo);
        return PushDialogPanel.currentPanel;
      }

      const panel = vscode.window.createWebviewPanel(
        PushDialogPanel.viewType,
        `Push Commits - ${pushInfo.currentBranch}`,
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

      PushDialogPanel.currentPanel = new PushDialogPanel(
        panel,
        extensionUri,
        gitService,
        pushInfo,
      );

      // Move Webview to its own floating auxiliary window
      try {
        await vscode.commands.executeCommand('workbench.action.moveEditorToNewWindow');
      } catch {
        // Fallback gracefully if auxiliary windows are disabled or not supported
      }

      return PushDialogPanel.currentPanel;
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to open Push dialog: ${err?.message || err}`);
      return undefined;
    }
  }

  public update(pushInfo: any): void {
    this.pushInfo = pushInfo;
    this.panel.title = `Push Commits - ${pushInfo.currentBranch}`;
    this.panel.webview.postMessage({
      type: 'updatePushInfo',
      payload: pushInfo,
    });
  }

  private async handleMessage(msg: any): Promise<void> {
    switch (msg.type) {
      case 'ready': {
        this.panel.webview.postMessage({
          type: 'updatePushInfo',
          payload: this.pushInfo,
        });
        break;
      }
      case 'close': {
        this.dispose();
        break;
      }
      case 'openReviewInCenter': {
        const { filePath, commitHash, filesList } = msg.payload || {};
        if (filePath) {
          let revisions: any = undefined;
          if (commitHash && commitHash !== 'ALL') {
            revisions = {
              baseRef: `${commitHash}~1`,
              targetRef: commitHash,
              baseTitle: `Parent (${commitHash.slice(0, 7)}~1)`,
              targetTitle: `Commit (${commitHash.slice(0, 7)})`,
            };
          } else {
            const commits = this.pushInfo.commits || [];
            if (commits.length > 0) {
              const oldestHash = commits[commits.length - 1].hash;
              revisions = {
                baseRef: `${oldestHash}~1`,
                targetRef: 'HEAD',
                baseTitle: `${this.pushInfo.remote}/${this.pushInfo.remoteBranch || this.pushInfo.currentBranch}`,
                targetTitle: `${this.pushInfo.currentBranch} (HEAD)`,
              };
            }
          }

          CommitReviewPanel.createOrShow(
            this.extensionUri,
            this.gitService,
            filePath,
            filesList || [],
            undefined,
            true, // readOnly
            revisions,
          );
        }
        break;
      }
      case 'executePush': {
        const payload = msg.payload;
        try {
          await this.gitService.push(
            payload.branch,
            payload.force,
            payload.setUpstream,
            payload.remote,
            payload.tags,
            payload.targetBranch,
          );
          vscode.window.showInformationMessage(
            `Pushed branch '${payload.branch}' to ${payload.remote}/${payload.targetBranch || payload.branch} successfully!`,
          );
          this.dispose();
        } catch (err: any) {
          this.panel.webview.postMessage({
            type: 'pushFailed',
            error: err?.message || String(err),
          });
          vscode.window.showErrorMessage(`Push failed: ${err?.message || err}`);
        }
        break;
      }
    }
  }

  public dispose(): void {
    PushDialogPanel.currentPanel = undefined;
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
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'push', 'push.js'),
    );
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Push Commits</title>
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}
