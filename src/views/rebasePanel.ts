import * as vscode from 'vscode';
import { GitService, type Commit } from '../git/gitService';
import { RebaseHandler, type RebaseTodoItem } from '../git/rebaseHandler';
import { RebaseToExtensionMessage, ExtensionToRebaseMessage } from '../shared/protocol';

export class RebasePanel {
  public static currentPanel: RebasePanel | undefined;
  private static readonly viewType = 'jetgit.rebasePanel';

  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    private extensionUri: vscode.Uri,
    private gitService: GitService,
    private rebaseHandler: RebaseHandler,
    private baseHash: string,
  ) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.html = this.getHtml();
    this.panel.webview.onDidReceiveMessage(
      msg => this.handleMessage(msg),
      null,
      this.disposables,
    );
    this.loadCommits();
  }

  static createOrShow(
    extensionUri: vscode.Uri,
    gitService: GitService,
    rebaseHandler: RebaseHandler,
    baseHash: string,
  ): void {
    if (RebasePanel.currentPanel) {
      RebasePanel.currentPanel.panel.reveal();
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      RebasePanel.viewType,
      'Interactive Rebase',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist', 'webview'),
        ],
      },
    );
    RebasePanel.currentPanel = new RebasePanel(
      panel, extensionUri, gitService, rebaseHandler, baseHash,
    );
  }

  private async loadCommits(): Promise<void> {
    try {
      const commits = await this.gitService.getLogRange(this.baseHash);
      // Reverse so oldest is first (natural rebase order)
      commits.reverse();
      this.panel.webview.postMessage({
        type: 'commits',
        payload: commits.map(c => ({
          hash: c.hash,
          abbreviatedHash: c.abbreviatedHash,
          subject: c.subject,
          author: c.author,
          authorDate: c.authorDate,
        })),
      });
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to load commits for rebase: ${err.message}`);
    }
  }

  private async handleMessage(msg: RebaseToExtensionMessage): Promise<void> {
    switch (msg.type) {
      case 'startRebase': {
        const todoItems: RebaseTodoItem[] = msg.payload;
        this.panel.webview.postMessage({ type: 'rebaseStarted' });

        const result = await this.rebaseHandler.executeRebase(this.baseHash, todoItems);

        if (result.success) {
          vscode.window.showInformationMessage('Rebase completed successfully.');
          this.panel.dispose();
        } else if (result.error === 'conflict') {
          vscode.window.showWarningMessage(
            'Rebase paused due to conflicts. Resolve them and continue.',
            'Open Merge Editor',
          ).then(choice => {
            if (choice === 'Open Merge Editor') {
              vscode.commands.executeCommand('jetgit.resolveConflicts');
            }
          });
          this.panel.dispose();
        } else {
          vscode.window.showErrorMessage(`Rebase failed: ${result.error}`);
          this.panel.webview.postMessage({
            type: 'rebaseError',
            payload: result.error,
          });
        }
        break;
      }
      case 'abort': {
        try {
          await this.rebaseHandler.abortRebase();
          vscode.window.showInformationMessage('Rebase aborted.');
        } catch {
          // Not in a rebase — that's fine
        }
        this.panel.dispose();
        break;
      }
    }
  }

  private getHtml(): string {
    const webview = this.panel.webview;
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'rebase', 'rebase.js'),
    );
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interactive Rebase</title>
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private dispose(): void {
    RebasePanel.currentPanel = undefined;
    this.panel.dispose();
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
