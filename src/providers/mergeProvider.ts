import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitService } from '../git/gitService';

export class MergeProvider implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private statusBarItem: vscode.StatusBarItem;

  constructor(private gitService: GitService, private workspaceRoot: string) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.statusBarItem.command = 'jetgit.resolveConflicts';
    this.disposables.push(this.statusBarItem);

    this.checkForConflicts();
  }

  refresh(): void {
    this.checkForConflicts();
  }

  private async checkForConflicts(): Promise<void> {
    try {
      const gitDir = path.join(this.workspaceRoot, '.git');
      // Only execute git commands when an active merge/rebase/cherry-pick conflict actually exists
      const hasConflictState =
        fs.existsSync(path.join(gitDir, 'MERGE_HEAD')) ||
        fs.existsSync(path.join(gitDir, 'rebase-apply')) ||
        fs.existsSync(path.join(gitDir, 'rebase-merge')) ||
        fs.existsSync(path.join(gitDir, 'CHERRY_PICK_HEAD'));

      if (!hasConflictState) {
        this.statusBarItem.hide();
        return;
      }
      const unmerged = await this.gitService.getUnmergedFiles();
      if (unmerged.length > 0) {
        this.statusBarItem.text = `$(git-merge) ${unmerged.length} conflict${unmerged.length > 1 ? 's' : ''}`;
        this.statusBarItem.tooltip = `${unmerged.length} unresolved merge conflict(s). Click to resolve.`;
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.warningBackground',
        );
        this.statusBarItem.show();
      } else {
        this.statusBarItem.hide();
      }
    } catch {
      this.statusBarItem.hide();
    }
  }

  async resolveConflicts(): Promise<void> {
    const unmerged = await this.gitService.getUnmergedFiles();
    if (unmerged.length === 0) {
      vscode.window.showInformationMessage('No merge conflicts to resolve.');
      return;
    }

    // Show quickpick to select file
    const items = unmerged.map(f => ({
      label: f,
      description: 'Unresolved conflict',
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `${unmerged.length} file(s) with conflicts — select to resolve`,
      canPickMany: false,
    });

    if (selected) {
      const fileUri = vscode.Uri.joinPath(
        vscode.Uri.file(this.workspaceRoot),
        selected.label,
      );
      // Open in VS Code's built-in merge editor
      await vscode.commands.executeCommand('vscode.open', fileUri);
    }
  }

  async acceptAllNonConflicting(): Promise<void> {
    try {
      const status = await this.gitService.getStatus();
      let staged = 0;
      for (const entry of status) {
        // Auto-stage files that have been resolved (not 'U' unmerged)
        if (entry.x === 'M' && entry.y === ' ') {
          await this.gitService.stageFile(entry.path);
          staged++;
        }
      }
      if (staged > 0) {
        vscode.window.showInformationMessage(`Auto-staged ${staged} resolved file(s).`);
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed: ${err.message}`);
    }
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
  }
}
