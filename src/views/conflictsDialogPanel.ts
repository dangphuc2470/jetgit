import * as vscode from 'vscode';
import * as path from 'path';
import { GitService } from '../git/gitService';
import { MergeEditorPanel } from './mergeEditorPanel';
import { getConflictsDialogHtml } from './conflictsDialogHtml';

export class ConflictsDialogPanel {
  public static currentPanel: ConflictsDialogPanel | undefined;
  public static readonly viewType = 'intellij-git.conflictsDialogWindow';

  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    private extensionUri: vscode.Uri,
    private gitService: GitService,
    private conflictInfo: any,
  ) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.onDidChangeViewState(
      e => {
        if (e.webviewPanel.active) {
          this.refresh();
        }
      },
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
  ): Promise<ConflictsDialogPanel | undefined> {
    try {
      const conflictInfo = await gitService.getConflictInfo();
      if (!conflictInfo.hasConflicts || conflictInfo.conflicts.length === 0) {
        vscode.window.showInformationMessage('No unresolved conflicts found in the repository.');
        return undefined;
      }

      if (ConflictsDialogPanel.currentPanel) {
        ConflictsDialogPanel.currentPanel.panel.reveal();
        ConflictsDialogPanel.currentPanel.update(conflictInfo);
        return ConflictsDialogPanel.currentPanel;
      }

      const panel = vscode.window.createWebviewPanel(
        ConflictsDialogPanel.viewType,
        'Resolve Conflicts',
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

      ConflictsDialogPanel.currentPanel = new ConflictsDialogPanel(
        panel,
        extensionUri,
        gitService,
        conflictInfo,
      );

      // Detach into its own floating auxiliary window
      try {
        await vscode.commands.executeCommand('workbench.action.moveEditorToNewWindow');
      } catch {
        // Fallback gracefully if auxiliary windows are disabled or not supported
      }

      return ConflictsDialogPanel.currentPanel;
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to open Conflicts dialog: ${err?.message || err}`);
      return undefined;
    }
  }

  public async refresh(): Promise<void> {
    try {
      const conflictInfo = await this.gitService.getConflictInfo();
      this.update(conflictInfo);
    } catch {}
  }

  public update(conflictInfo: any): void {
    this.conflictInfo = conflictInfo;
    this.panel.webview.postMessage({
      type: 'updateConflictInfo',
      payload: conflictInfo,
    });
  }

  private async handleMessage(msg: any): Promise<void> {
    switch (msg.type) {
      case 'close': {
        this.dispose();
        break;
      }
      case 'acceptYours': {
        const filePath = msg.payload?.path;
        if (filePath) {
          try {
            await this.gitService.acceptYours(filePath);
            vscode.window.showInformationMessage(`Accepted Yours for '${filePath}'`);
            await this.refresh();
          } catch (err: any) {
            vscode.window.showErrorMessage(`Accept Yours failed: ${err?.message || err}`);
          }
        }
        break;
      }
      case 'acceptTheirs': {
        const filePath = msg.payload?.path;
        if (filePath) {
          try {
            await this.gitService.acceptTheirs(filePath);
            vscode.window.showInformationMessage(`Accepted Theirs for '${filePath}'`);
            await this.refresh();
          } catch (err: any) {
            vscode.window.showErrorMessage(`Accept Theirs failed: ${err?.message || err}`);
          }
        }
        break;
      }
      case 'openMergeEditor': {
        const filePath = msg.payload?.path;
        if (filePath) {
          try {
            await MergeEditorPanel.createOrShow(this.extensionUri, this.gitService, filePath);
          } catch (err: any) {
            vscode.window.showErrorMessage(`Failed to open merge editor: ${err?.message || err}`);
          }
        }
        break;
      }
    }
  }

  public dispose(): void {
    ConflictsDialogPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private getHtml(): string {
    const rawConflictInfo = JSON.stringify(this.conflictInfo);
    return getConflictsDialogHtml(rawConflictInfo);
  }
}
