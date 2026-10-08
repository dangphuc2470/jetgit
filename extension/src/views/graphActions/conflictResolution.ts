import * as vscode from 'vscode';
import { GitService } from '../../git/gitService';

export type SmartActionLabel = 'Checkout' | 'Update' | 'Merge' | 'Rebase' | 'Cherry-Pick' | 'Revert';

export async function withSmartStashOnConflict(
  gitService: GitService,
  actionLabel: SmartActionLabel,
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
      /The following untracked working tree files would be overwritten by (merge|checkout)/i.test(rawError) ||
      /cannot rebase: (?:You have unstaged changes|Your index contains uncommitted changes)/i.test(rawError) ||
      /cannot pull with rebase: (?:You have unstaged changes|Your index contains uncommitted changes)/i.test(rawError) ||
      /error: (?:cannot rebase|cannot cherry-pick|cannot revert):/i.test(rawError) ||
      /error: Your local changes to the following files would be overwritten/i.test(rawError) ||
      /Please commit or stash them before you (?:merge|rebase|cherry-pick|revert)/i.test(rawError);

    const is3WayConflict =
      rawError.includes('CONFLICT') ||
      rawError.includes('Automatic merge failed') ||
      rawError.includes('fix conflicts') ||
      rawError.includes('could not apply') ||
      rawError.includes('could not revert') ||
      rawError.includes('git rebase --continue');

    let pastAction = `${actionLabel.toLowerCase()} '${targetRef}'`;
    if (actionLabel === 'Checkout') {
      pastAction = `switching to '${targetRef}'`;
    } else if (actionLabel === 'Update') {
      pastAction = `updating '${targetRef}'`;
    } else if (actionLabel === 'Merge') {
      pastAction = `merging '${targetRef}' into current branch`;
    } else if (actionLabel === 'Rebase') {
      pastAction = `rebasing onto '${targetRef}'`;
    } else if (actionLabel === 'Cherry-Pick') {
      pastAction = `cherry-picking commit '${(targetRef || '').slice(0, 8)}'`;
    } else if (actionLabel === 'Revert') {
      pastAction = `reverting commit '${(targetRef || '').slice(0, 8)}'`;
    }

    if (!isConflict) {
      if (is3WayConflict && (actionLabel === 'Merge' || actionLabel === 'Rebase' || actionLabel === 'Cherry-Pick' || actionLabel === 'Revert')) {
        vscode.window.showWarningMessage(
          `${actionLabel} conflicts detected while ${pastAction}. Resolve them to complete the operation.`,
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
    const message = `${actionLabel} Failed: Your local changes would be overwritten by ${pastAction}.${filesText}\n\nIntelliJ Git can stash your changes, perform the ${actionLabel.toLowerCase()}, and optionally re-apply them.`;

    const choice = await vscode.window.showWarningMessage(
      message,
      { modal: true },
      smartLabel,
      stashLabel
    );

    if (!choice) return;

    const stashPrefix = actionLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
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
        actMsg.includes('fix conflicts') ||
        actMsg.includes('could not apply') ||
        actMsg.includes('could not revert') ||
        actMsg.includes('git rebase --continue');

      if (stashed && is3Way) {
        vscode.window.showWarningMessage(
          `${actionLabel} resulted in conflicts. Your local changes were safely saved to stash '${stashName}'. Resolve conflicts first, then apply your stash.`,
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

export async function handleRebaseWithConflictResolution(
  gitService: GitService,
  ref: string,
  onSuccess: () => void
): Promise<void> {
  await withSmartStashOnConflict(
    gitService,
    'Rebase',
    ref,
    async () => {
      await gitService.rebase(ref);
      vscode.window.showInformationMessage(`Rebased current branch onto ${ref}.`);
    },
    onSuccess
  );
}

export async function handleCheckoutAndRebaseWithConflictResolution(
  gitService: GitService,
  branch: string,
  onto: string,
  onSuccess: () => void
): Promise<void> {
  await withSmartStashOnConflict(
    gitService,
    'Rebase',
    onto,
    async () => {
      await gitService.checkoutAndRebase(branch, onto);
      vscode.window.showInformationMessage(`Rebased ${branch} onto ${onto}`);
    },
    onSuccess
  );
}

export async function handleCherryPickWithConflictResolution(
  gitService: GitService,
  hash: string,
  onSuccess: () => void
): Promise<void> {
  await withSmartStashOnConflict(
    gitService,
    'Cherry-Pick',
    hash,
    async () => {
      await gitService.cherryPick(hash);
      vscode.window.showInformationMessage(`Cherry-picked ${hash.slice(0, 8)} successfully.`);
    },
    onSuccess
  );
}

export async function handleRevertWithConflictResolution(
  gitService: GitService,
  hash: string,
  onSuccess: () => void
): Promise<void> {
  await withSmartStashOnConflict(
    gitService,
    'Revert',
    hash,
    async () => {
      await gitService.revertCommit(hash);
      vscode.window.showInformationMessage(`Reverted commit ${hash.slice(0, 8)}.`);
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
