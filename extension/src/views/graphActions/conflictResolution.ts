import * as vscode from 'vscode';
import { GitService } from '../../git/gitService';

export async function withSmartStashOnConflict(
  gitService: GitService,
  actionLabel: 'Checkout' | 'Update' | 'Merge',
  targetRef: string,
  runAction: () => Promise<void>,
  onSuccess: () => void
): Promise<void> {
  try {
    await runAction();
    onSuccess();
  } catch (err: any) {
    const rawError = err?.message || String(err);
    const isConflict =
      /Your local changes to the following files would be overwritten by (merge|checkout)/i.test(rawError) ||
      /The following untracked working tree files would be overwritten by (merge|checkout)/i.test(rawError);

    if (!isConflict) {
      const is3WayConflict =
        rawError.includes('CONFLICT') ||
        rawError.includes('Automatic merge failed') ||
        rawError.includes('fix conflicts');
      if (actionLabel === 'Merge' && is3WayConflict) {
        vscode.window.showWarningMessage(
          `Merge conflicts detected while merging '${targetRef}'. Resolve them to complete the merge.`,
          'Resolve Conflicts'
        ).then(choice => {
          if (choice === 'Resolve Conflicts') {
            vscode.commands.executeCommand('intellij-git.resolveConflicts');
          }
        });
        onSuccess();
        return;
      }
      vscode.window.showErrorMessage(`${actionLabel} failed: ${rawError}`);
      return;
    }

    const isUntracked = /The following untracked working tree files would be overwritten/i.test(rawError);
    const filesMatch = rawError.match(/overwritten by (?:merge|checkout):([\s\S]*?)(?:Please commit|Aborting|$)/i);
    let filesText = '';
    if (filesMatch) {
      const list = filesMatch[1]
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('error:'));
      if (list.length > 0) {
        filesText = '\n\nConflicting files:\n' + list.map(f => `• ${f}`).join('\n');
      }
    }

    const smartLabel = `Smart ${actionLabel}`;
    const stashLabel = `Stash & ${actionLabel}`;
    let pastAction = 'merging';
    if (actionLabel === 'Checkout') {
      pastAction = `switching to '${targetRef}'`;
    } else if (actionLabel === 'Update') {
      pastAction = `updating '${targetRef}'`;
    } else if (actionLabel === 'Merge') {
      pastAction = `merging '${targetRef}' into current branch`;
    }
    const message = `${actionLabel} Failed: Your local changes would be overwritten by ${pastAction}.${filesText}\n\nIntelliJ Git can stash your changes, perform the ${actionLabel.toLowerCase()}, and optionally re-apply them.`;

    const choice = await vscode.window.showWarningMessage(
      message,
      { modal: true },
      smartLabel,
      stashLabel
    );

    if (!choice) return;

    const stashPrefix = actionLabel.toLowerCase();
    const stashName = `autostash-${stashPrefix}-${(targetRef || 'HEAD').replace(/[^a-zA-Z0-9_-]/g, '_')}-${Date.now()}`;
    const stashArgs = isUntracked
      ? ['stash', 'push', '-u', '-m', stashName]
      : ['stash', 'push', '-m', stashName];

    let stashed = false;
    try {
      const stashOut = await gitService.exec(stashArgs);
      if (!stashOut.includes('No local changes to save')) {
        stashed = true;
      }
    } catch (stashErr: any) {
      vscode.window.showErrorMessage(`Failed to stash changes: ${stashErr.message}`);
      return;
    }

    try {
      await runAction();
    } catch (actionErr: any) {
      const actMsg = actionErr?.message || String(actionErr);
      const is3Way =
        actMsg.includes('CONFLICT') ||
        actMsg.includes('Automatic merge failed') ||
        actMsg.includes('fix conflicts');

      if (stashed && is3Way) {
        vscode.window.showWarningMessage(
          `Merge resulted in conflicts. Your local changes were safely saved to stash '${stashName}'. Resolve merge conflicts first, then apply your stash.`,
          'Resolve Conflicts'
        ).then(res => {
          if (res === 'Resolve Conflicts') {
            vscode.commands.executeCommand('intellij-git.resolveConflicts');
          }
        });
        onSuccess();
        return;
      }

      if (stashed) {
        try {
          await gitService.exec(['stash', 'pop']);
        } catch {}
      }
      vscode.window.showErrorMessage(`${actionLabel} failed: ${actionErr.message}`);
      return;
    }

    if (choice === smartLabel && stashed) {
      try {
        await gitService.exec(['stash', 'pop']);
        vscode.window.showInformationMessage(`${smartLabel} completed: Restored your changes.`);
      } catch (popErr: any) {
        vscode.window.showWarningMessage(
          `${actionLabel} succeeded, but applying stashed changes resulted in merge conflicts. Please resolve them.`,
          'Resolve Conflicts'
        ).then(res => {
          if (res === 'Resolve Conflicts') {
            vscode.commands.executeCommand('intellij-git.resolveConflicts');
          }
        });
      }
    } else if (choice === stashLabel && stashed) {
      vscode.window.showInformationMessage(`${actionLabel} succeeded. Your changes were safely saved to Stash.`);
    }

    onSuccess();
  }
}

export async function handleCheckoutWithConflictResolution(
  gitService: GitService,
  ref: string,
  onSuccess: () => void
): Promise<void> {
  await withSmartStashOnConflict(
    gitService,
    'Checkout',
    ref,
    async () => {
      await gitService.checkout(ref);
      vscode.window.showInformationMessage(`Checked out ${ref}`);
    },
    onSuccess
  );
}

export async function handleMergeWithConflictResolution(
  gitService: GitService,
  ref: string,
  onSuccess: () => void
): Promise<void> {
  await withSmartStashOnConflict(
    gitService,
    'Merge',
    ref,
    async () => {
      await gitService.merge(ref);
      vscode.window.showInformationMessage(`Merged '${ref}' into current branch.`);
    },
    onSuccess
  );
}

export async function handlePullWithConflictResolution(
  gitService: GitService,
  branch: string,
  onSuccess: () => void
): Promise<void> {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Updating '${branch}'...`,
      cancellable: false,
    },
    async () => {
      await withSmartStashOnConflict(
        gitService,
        'Update',
        branch,
        async () => {
          const out = await gitService.pull(branch);
          vscode.window.showInformationMessage(`Updated ${branch}: ${out || 'Already up to date.'}`);
        },
        onSuccess
      );
    }
  );
}
