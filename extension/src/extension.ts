import * as vscode from 'vscode';
import { GitService } from './git/gitService';
import { RebaseHandler } from './git/rebaseHandler';
import { GraphViewProvider } from './views/graphPanel';
import { CommitViewProvider } from './views/commitPanel';
import { CommitReviewPanel } from './views/commitReviewPanel';
import { RebasePanel } from './views/rebasePanel';
import { PushDialogPanel } from './views/pushDialogPanel';
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
  changelistTree.setTreeView(changelistTreeView);
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
      commitViewProvider.openConflictsDialog();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.acceptAllNonConflicting', () => {
      mergeProvider.acceptAllNonConflicting();
    }),
  );

  // Push Commits dialog (Floating Window)
  context.subscriptions.push(
    vscode.commands.registerCommand('intellij-git.pushDialog', async (branch?: string) => {
      await PushDialogPanel.createOrShow(context.extensionUri, gitService, branch);
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

  // Helper for debouncing frequent events
  function debounce(fn: (...args: any[]) => void, delay = 600): (...args: any[]) => void {
    let timer: NodeJS.Timeout | undefined;
    return (...args: any[]) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  // 1. Watch for git changes (commits, branches, index, tags, logs, conflicts) in real-time
  // Narrow down pattern from .git/** to HEAD, refs, and packed-refs to prevent triggering on transient lock files
  const gitWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(workspaceRoot, '.git/{HEAD,refs/**,packed-refs}'),
  );
  const onGitChange = debounce(() => {
    log.appendLine('Git change detected — refreshing views...');
    branchTree.refresh();
    graphViewProvider.refresh();
    commitViewProvider.refresh();
    mergeProvider.refresh();
    if (CommitReviewPanel.currentPanel) {
      CommitReviewPanel.currentPanel.refresh();
    }
  }, 600);

  const handleGitFsEvent = (uri: vscode.Uri) => {
    const fsPath = uri?.fsPath || uri?.path || '';
    if (
      fsPath.endsWith('.lock') ||
      fsPath.includes('/objects/') ||
      fsPath.includes('\\objects\\') ||
      fsPath.endsWith('COMMIT_EDITMSG')
    ) {
      return;
    }
    onGitChange();
  };

  gitWatcher.onDidChange(handleGitFsEvent);
  gitWatcher.onDidCreate(handleGitFsEvent);
  gitWatcher.onDidDelete(handleGitFsEvent);
  context.subscriptions.push(gitWatcher);

  // Hook into built-in vscode.git extension for guaranteed instant git state changes
  // Note: vscode.git already handles .gitignore rules and working tree file watching without CPU overhead
  try {
    const gitExt = vscode.extensions.getExtension('vscode.git');
    if (gitExt) {
      const gitApi = gitExt.exports.getAPI?.(1);
      if (gitApi) {
        gitApi.repositories.forEach((repo: any) => {
          repo.state.onDidChange(onGitChange);
        });
        gitApi.onDidOpenRepository((repo: any) => {
          repo.state.onDidChange(onGitChange);
        });
      }
    }
  } catch (err: any) {
    log.appendLine(`Failed to hook into vscode.git: ${err.message}`);
  }

  // 2. Unified debounced handler for all workspace file events (save, create, delete, rename)
  // Prevents the previous pattern where onDidSaveTextDocument fired commitViewProvider.refresh()
  // (6 git commands) AND changelistTree.syncWithGitStatus() (1 more git status) simultaneously.
  const onWorkspaceFileChange = debounce((doc?: vscode.TextDocument) => {
    commitViewProvider.refresh();
    changelistTree.syncChangelists();
    if (
      doc &&
      CommitReviewPanel.currentPanel &&
      doc.uri.fsPath.endsWith(CommitReviewPanel.currentPanel.getCurrentFilePath())
    ) {
      CommitReviewPanel.currentPanel.refresh();
    }
  }, 400);

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(doc => {
      if (doc.uri.scheme === 'file') {
        onWorkspaceFileChange(doc);
      }
    }),
  );

  // 3. Watch for file create / delete / rename within editor workspace (respects editor boundaries)
  context.subscriptions.push(
    vscode.workspace.onDidCreateFiles(() => onWorkspaceFileChange()),
    vscode.workspace.onDidDeleteFiles(() => onWorkspaceFileChange()),
    vscode.workspace.onDidRenameFiles(() => onWorkspaceFileChange()),
  );

  // 4. Auto-sync on window focus (IntelliJ frame activation sync)
  context.subscriptions.push(
    vscode.window.onDidChangeWindowState(e => {
      if (e.focused) {
        commitViewProvider.refresh();
        branchTree.refresh();
        mergeProvider.refresh();
      }
    }),
  );

  log.appendLine('IntelliJ Git extension activated.');
}

export function deactivate(): void {
  // Cleanup handled by disposables
}
