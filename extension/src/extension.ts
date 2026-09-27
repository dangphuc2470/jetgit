import * as vscode from 'vscode';
import { GitService } from './git/gitService';
import { RebaseHandler } from './git/rebaseHandler';
import { GraphViewProvider } from './views/graphPanel';
import { CommitViewProvider } from './views/commitPanel';
import { RebasePanel } from './views/rebasePanel';
import { BranchTreeProvider } from './views/branchTree';
import { ChangelistTreeProvider } from './views/changelistTree';
import { BlameDecorationProvider } from './providers/blameDecorations';
import { MergeProvider } from './providers/mergeProvider';
import { GitContentProvider } from './providers/gitContentProvider';

let log: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
  log = vscode.window.createOutputChannel('IntelliJ Git');
  context.subscriptions.push(log);
  log.appendLine('IntelliJ Git extension activating...');

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    log.appendLine('No workspace folder found — aborting activation.');
    return;
  }

  const workspaceRoot = workspaceFolder.uri.fsPath;
  log.appendLine(`Workspace root: ${workspaceRoot}`);

  const gitService = new GitService(workspaceRoot);
  const rebaseHandler = new RebaseHandler(workspaceRoot);

  // --- Git Content Provider (for diff views) ---
  const gitContentProvider = new GitContentProvider(gitService);
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      GitContentProvider.scheme,
      gitContentProvider,
    ),
  );

  // Verify git works
  gitService.getRepoRoot().then(
    root => log.appendLine(`Git repo root: ${root}`),
    err => log.appendLine(`Git repo not found: ${err.message}`),
  );

  // --- Git Log (bottom panel) ---
  const graphViewProvider = new GraphViewProvider(context.extensionUri, gitService, log);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      GraphViewProvider.viewType,
      graphViewProvider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  );

  // --- Commit Tool Window (activitybar) ---
  const commitViewProvider = new CommitViewProvider(context.extensionUri, gitService, log);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CommitViewProvider.viewType,
      commitViewProvider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  );

  // --- Branch Tree Sidebar (left) ---
  const branchTree = new BranchTreeProvider(gitService);
  const branchTreeView = vscode.window.createTreeView('intellij-git.branches', {
    treeDataProvider: branchTree,
    showCollapseAll: true,
  });
  context.subscriptions.push(branchTreeView);

  // --- Changelist Tree Sidebar ---
  const changelistTree = new ChangelistTreeProvider(gitService, workspaceRoot);
  const changelistTreeView = vscode.window.createTreeView('intellij-git.changelists', {
    treeDataProvider: changelistTree,
    showCollapseAll: true,
  });
  context.subscriptions.push(changelistTreeView);

  // --- Blame Decorations ---
  const blameProvider = new BlameDecorationProvider(workspaceRoot);
  context.subscriptions.push(blameProvider);

  // --- Merge Provider ---
  const mergeProvider = new MergeProvider(gitService, workspaceRoot);
  context.subscriptions.push(mergeProvider);

  // --- Commands ---

  // Commit Tool Window — reveal / focus (Cmd+K)
  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.openCommit', () => {
      vscode.commands.executeCommand('intellij-git.commitView.focus');
    }),
  );

  // Git Log — focus/reveal the bottom panel
  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.openLog', () => {
      vscode.commands.executeCommand('intellij-git.logView.focus');
    }),
  );

  // Show specific commit in git log (triggered by blame click)
  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.showCommitInLog', (hash: string) => {
      vscode.commands.executeCommand('intellij-git.logView.focus');
      graphViewProvider.selectCommit(hash);
    }),
  );

  // Toggle Blame
  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.toggleBlame', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        log.appendLine(`Toggling blame on ${editor.document.uri.fsPath}`);
        blameProvider.toggle(editor);
      } else {
        vscode.window.showWarningMessage('No active text editor for blame.');
      }
    }),
  );

  // Interactive Rebase
  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.interactiveRebase', async (baseHash?: string) => {
      if (!baseHash) {
        baseHash = await vscode.window.showInputBox({
          prompt: 'Base commit hash (rebase from this point)',
          placeHolder: 'e.g. HEAD~5 or a commit hash',
        });
      }
      if (!baseHash) return;
      RebasePanel.createOrShow(context.extensionUri, gitService, rebaseHandler, baseHash);
    }),
  );

  // Branch actions (kept for branch tree if re-added later)
  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.refreshBranches', () => {
      branchTree.refresh();
      graphViewProvider.refresh();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.checkoutBranch', async (node: any) => {
      const ref = node?.ref;
      if (!ref) return;
      try {
        await gitService.checkout(ref);
        graphViewProvider.refresh();
        vscode.window.showInformationMessage(`Checked out ${ref}`);
      } catch (err: any) {
        vscode.window.showErrorMessage(`Checkout failed: ${err.message}`);
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.createBranch', async (node: any) => {
      const name = await vscode.window.showInputBox({
        prompt: 'New branch name',
        placeHolder: 'feature/...',
      });
      if (!name) return;
      try {
        await gitService.createBranch(name, node?.ref);
        graphViewProvider.refresh();
        vscode.window.showInformationMessage(`Created and checked out ${name}`);
      } catch (err: any) {
        vscode.window.showErrorMessage(`Create branch failed: ${err.message}`);
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.deleteBranch', async (node: any) => {
      const ref = node?.ref;
      if (!ref) return;
      const confirm = await vscode.window.showWarningMessage(
        `Delete branch "${ref}"?`,
        { modal: true },
        'Delete',
      );
      if (confirm !== 'Delete') return;
      try {
        await gitService.deleteBranch(ref);
        graphViewProvider.refresh();
      } catch (err: any) {
        vscode.window.showErrorMessage(`Delete failed: ${err.message}`);
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.mergeBranch', async (node: any) => {
      const ref = node?.ref;
      if (!ref) return;
      try {
        await gitService.merge(ref);
        graphViewProvider.refresh();
        vscode.window.showInformationMessage(`Merged ${ref} into current branch.`);
      } catch (err: any) {
        if (err.message?.includes('CONFLICT')) {
          vscode.window.showWarningMessage(
            `Merge conflicts detected. Resolve them to complete the merge.`,
            'Resolve',
          ).then(choice => {
            if (choice === 'Resolve') {
              vscode.commands.executeCommand('intellij-git.resolveConflicts');
            }
          });
        } else {
          vscode.window.showErrorMessage(`Merge failed: ${err.message}`);
        }
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.rebaseBranch', async (node: any) => {
      const ref = node?.ref;
      if (!ref) return;
      try {
        await gitService.rebase(ref);
        graphViewProvider.refresh();
        vscode.window.showInformationMessage(`Rebased current branch onto ${ref}.`);
      } catch (err: any) {
        vscode.window.showErrorMessage(`Rebase failed: ${err.message}`);
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.compareBranch', async (node: any) => {
      const ref = node?.ref;
      if (!ref) return;
      try {
        const current = await gitService.getCurrentBranch();
        await vscode.commands.executeCommand('git.branchCompare', ref, current);
      } catch (err: any) {
        vscode.window.showErrorMessage(`Compare failed: ${err.message}`);
      }
    }),
  );

  // Merge conflict resolution
  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.resolveConflicts', () => {
      mergeProvider.resolveConflicts();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.acceptAllNonConflicting', () => {
      mergeProvider.acceptAllNonConflicting();
    }),
  );

  // Changelist commands
  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.newChangelist', () => {
      changelistTree.createChangelist();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.deleteChangelist', (node: any) => {
      if (node?.name) {
        changelistTree.deleteChangelist(node.name);
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.setActiveChangelist', (node: any) => {
      if (node?.name) {
        changelistTree.setActive(node.name);
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.commitChangelist', (node: any) => {
      changelistTree.commitChangelist(node?.name);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.refreshChangelists', () => {
      changelistTree.refresh();
    }),
  );

  // Watch for git changes to refresh views
  const gitWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(workspaceRoot, '.git/{HEAD,refs/**,index}'),
  );
  gitWatcher.onDidChange(() => {
    branchTree.refresh();
    graphViewProvider.refresh();
    commitViewProvider.refresh();
  });
  context.subscriptions.push(gitWatcher);

  log.appendLine('IntelliJ Git extension activated.');
}

export function deactivate(): void {
  // Cleanup handled by disposables
}
