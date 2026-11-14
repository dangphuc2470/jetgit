import * as vscode from 'vscode';
import { GitService } from '../../git/gitService';
import { taskManager } from '../../services/taskManager';

import {
  type SmartActionLabel,
  isDirtyTreeConflict,
  isThreeWayConflict,
  extractOverwrittenFiles,
  makeStashName,
  detectInProgressOperation,
  isIndexLockError,
  isBranchAlreadyExistsError,
} from '../../git/conflictUtils';

export {
  type SmartActionLabel,
  isDirtyTreeConflict,
  isThreeWayConflict,
  extractOverwrittenFiles,
  makeStashName,
  detectInProgressOperation,
  isIndexLockError,
  isBranchAlreadyExistsError,
};

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
    const rawError = `${err?.message || ''}\n${err?.stdout || ''}\n${err?.stderr || ''}`.trim() || String(err);
    const conflictInfo = await gitService.getConflictInfo().catch(() => null);
    const hasActiveConflicts = Boolean(conflictInfo && conflictInfo.hasConflicts && conflictInfo.conflicts.length > 0);

    const inProgress = detectInProgressOperation(rawError);
    if (inProgress) {
      const choice = await vscode.window.showErrorMessage(
        `Cannot ${actionLabel.toLowerCase()}: A ${inProgress.title} operation is currently in progress.`,
        { modal: true },
        'Resolve Conflicts',
        `Abort ${inProgress.title}`
      );
      if (choice === 'Resolve Conflicts') {
        vscode.commands.executeCommand('intellij-git.refreshCommit');
        await vscode.commands.executeCommand('intellij-git.resolveConflicts');
      } else if (choice === `Abort ${inProgress.title}`) {
        try {
          await gitService.abortOperation(inProgress.type);
          taskManager.notifyInfo(`Aborted ${inProgress.title} successfully.`);
          onSuccess();
        } catch (abortErr: any) {
          vscode.window.showErrorMessage(`Failed to abort ${inProgress.title}: ${abortErr.message}`);
        }
      }
      return;
    }

    if (isIndexLockError(rawError)) {
      const choice = await vscode.window.showErrorMessage(
        `Git index is locked by another process (.git/index.lock). Would you like to remove the lock and retry?`,
        'Unlock & Retry'
      );
      if (choice === 'Unlock & Retry') {
        const unlocked = await gitService.removeIndexLock();
        if (unlocked) {
          taskManager.notifyInfo('Removed .git/index.lock. Retrying action...');
          return withSmartStashOnConflict(gitService, actionLabel, targetRef, runAction, onSuccess);
        } else {
          vscode.window.showErrorMessage('Could not remove .git/index.lock. Please check if another Git process is still active.');
        }
      }
      return;
    }

    const branchExists = isBranchAlreadyExistsError(rawError);
    if (branchExists) {
      const choice = await vscode.window.showErrorMessage(
        `A branch named '${branchExists}' already exists.`,
        `Switch to '${branchExists}'`
      );
      if (choice === `Switch to '${branchExists}'`) {
        await handleCheckoutWithConflictResolution(gitService, branchExists, onSuccess);
      }
      return;
    }

    const isConflict = isDirtyTreeConflict(rawError);
    const is3WayConflict = isThreeWayConflict(rawError, hasActiveConflicts);

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
        vscode.commands.executeCommand('intellij-git.refreshCommit');
        await vscode.commands.executeCommand('intellij-git.resolveConflicts');
        onSuccess();
        return;
      }
      const detailErr = (err?.stderr || err?.stdout || err?.message || rawError).trim();
      if (is3WayConflict) {
        const choice = await vscode.window.showErrorMessage(
          `${actionLabel} resulted in conflicts: ${detailErr}`,
          'Resolve Conflicts'
        );
        if (choice === 'Resolve Conflicts') {
          vscode.commands.executeCommand('intellij-git.refreshCommit');
          await vscode.commands.executeCommand('intellij-git.resolveConflicts');
        }
        return;
      }
      vscode.window.showErrorMessage(`${actionLabel} failed: ${detailErr}`);
      return;
    }

    const isUntracked = /The following untracked working tree files would be overwritten/i.test(rawError);
    const overwrittenFiles = extractOverwrittenFiles(rawError);
    let filesText = '';
    if (overwrittenFiles.length > 0) {
      filesText = '\n\nConflicting files:\n' + overwrittenFiles.map(f => `• ${f}`).join('\n');
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

    const stashName = makeStashName(actionLabel, targetRef);
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
      const actMsg = `${actionErr?.message || ''}\n${actionErr?.stdout || ''}\n${actionErr?.stderr || ''}`.trim() || String(actionErr);
      const conflictInfoPost = await gitService.getConflictInfo().catch(() => null);
      const is3Way =
        Boolean(conflictInfoPost && conflictInfoPost.hasConflicts && conflictInfoPost.conflicts.length > 0) ||
        actMsg.includes('CONFLICT') ||
        actMsg.includes('Automatic merge failed') ||
        actMsg.includes('fix conflicts') ||
        actMsg.includes('could not apply') ||
        actMsg.includes('could not revert') ||
        actMsg.includes('git rebase --continue');

      if (stashed && is3Way) {
        vscode.commands.executeCommand('intellij-git.refreshCommit');
        await vscode.commands.executeCommand('intellij-git.resolveConflicts');
        const warnChoice = await vscode.window.showWarningMessage(
          `${actionLabel} resulted in conflicts. Your local changes were safely saved to stash '${stashName}'. Resolve conflicts first, then apply your stash.`,
          'Resolve Conflicts'
        );
        if (warnChoice === 'Resolve Conflicts') {
          vscode.commands.executeCommand('intellij-git.refreshCommit');
          await vscode.commands.executeCommand('intellij-git.resolveConflicts');
        }
        onSuccess();
        return;
      }

      if (stashed) {
        try {
          await gitService.exec(['stash', 'pop']);
        } catch {}
      }
      const detailErr = (actionErr?.stderr || actionErr?.stdout || actionErr?.message || actMsg).trim();
      vscode.window.showErrorMessage(`${actionLabel} failed: ${detailErr}`);
      return;
    }

    if (choice === smartLabel && stashed) {
      try {
        await gitService.exec(['stash', 'pop']);
        taskManager.notifyInfo(`${smartLabel} completed: Restored your changes.`);
      } catch (popErr: any) {
        vscode.commands.executeCommand('intellij-git.refreshCommit');
        await vscode.commands.executeCommand('intellij-git.resolveConflicts');
        const warnChoice = await vscode.window.showWarningMessage(
          `${actionLabel} succeeded, but applying stashed changes resulted in merge conflicts. Please resolve them.`,
          'Resolve Conflicts',
          'Rollback Stash'
        );
        if (warnChoice === 'Resolve Conflicts') {
          vscode.commands.executeCommand('intellij-git.refreshCommit');
          await vscode.commands.executeCommand('intellij-git.resolveConflicts');
        } else if (warnChoice === 'Rollback Stash') {
          try {
            await gitService.exec(['reset', '--hard', 'HEAD']);
            taskManager.notifyInfo(`Rolled back working tree. Your changes remain safely stored in Stash.`);
            vscode.commands.executeCommand('intellij-git.refreshCommit');
            onSuccess();
          } catch (rollbackErr: any) {
            vscode.window.showErrorMessage(`Rollback failed: ${rollbackErr.message}`);
          }
        }
      }
    } else if (choice === stashLabel && stashed) {
      taskManager.notifyInfo(`${actionLabel} succeeded. Your changes were safely saved to Stash.`);
    }

    onSuccess();
  }
}

export async function handleCheckoutWithConflictResolution(
  gitService: GitService,
  ref: string,
  onSuccess: () => void,
  options?: {
    name?: string;
    force?: boolean;
    openCheckoutDialog?: (remoteRef: string, defaultName: string) => void;
  }
): Promise<void> {
  let isRemote = false;
  let remoteName = '';
  let localBranchName = options?.name || '';
  try {
    const remotes = await gitService.getRemotes();
    for (const r of remotes) {
      if (ref.startsWith(r + '/')) {
        isRemote = true;
        remoteName = r;
        if (!localBranchName) {
          localBranchName = ref.slice(r.length + 1);
        }
        break;
      }
    }
  } catch {}

  if (isRemote) {
    const verifyTarget = ref.startsWith('refs/') ? ref : `refs/remotes/${ref}`;
    const hasLocalRef = await gitService
      .exec(['rev-parse', '--verify', verifyTarget])
      .then(() => true)
      .catch(() => false);

    if (!hasLocalRef) {
      const remoteBranchPart = ref.slice(remoteName.length + 1);
      const action = await vscode.window.showWarningMessage(
        `Remote branch '${ref}' has not been fetched to your local repository yet.`,
        'Fetch & Checkout'
      );
      if (action === 'Fetch & Checkout') {
        let fetchSuccess = false;
        try {
          await taskManager.runTask(
            `Fetching '${ref}'...`,
            async (signal) => {
              await gitService.fetchSingleBranch(remoteName, remoteBranchPart, undefined, signal);
              fetchSuccess = true;
              return `Fetched '${ref}' successfully.`;
            },
            { cancellable: true }
          );
        } catch (err: any) {
          if (err?.name !== 'AbortError') {
            taskManager.notifyError(`Failed to fetch '${ref}'`, err.message);
          }
        }
        if (!fetchSuccess) {
          return;
        }
      } else {
        return;
      }
    }
  }

  const targetName = options?.name || localBranchName;
  const isForce = options?.force === true;

  if (isForce) {
    await withSmartStashOnConflict(
      gitService,
      'Checkout',
      ref,
      async () => {
        await gitService.checkout(ref, { name: targetName, force: true });
        taskManager.notifyInfo(`Checked out and overwritten '${targetName || ref}' to '${ref}'.`);
      },
      async () => {
        onSuccess();
        vscode.commands.executeCommand('intellij-git.refreshBranches');
      }
    );
    return;
  }

  if (isRemote && localBranchName) {

    const branchCheck = (await gitService.exec(['branch', '--list', localBranchName]).catch(() => '')).trim();
    if (branchCheck) {
      if (options?.openCheckoutDialog) {
        options.openCheckoutDialog(ref, localBranchName);
        return;
      }

      const choice = await vscode.window.showWarningMessage(
        `Branch '${localBranchName}' already exists at local. Do you want to overwrite it with '${ref}'?`,
        { modal: true },
        'Overwrite Branch',
        'Checkout Existing'
      );
      if (choice === 'Overwrite Branch') {
        await withSmartStashOnConflict(
          gitService,
          'Checkout',
          ref,
          async () => {
            await gitService.checkout(ref, { name: localBranchName, force: true });
            taskManager.notifyInfo(`Checked out and overwritten '${localBranchName}' to '${ref}'.`);
          },
          async () => {
            onSuccess();
            vscode.commands.executeCommand('intellij-git.refreshBranches');
          }
        );
        return;
      }
      if (choice === 'Checkout Existing') {
        await withSmartStashOnConflict(
          gitService,
          'Checkout',
          localBranchName,
          async () => {
            await gitService.checkout(localBranchName);
            taskManager.notifyInfo(`Checked out '${localBranchName}'.`);
          },
          async () => {
            onSuccess();
            vscode.commands.executeCommand('intellij-git.refreshBranches');
          }
        );
        return;
      }
      return;
    }
  }

  await withSmartStashOnConflict(
    gitService,
    'Checkout',
    ref,
    async () => {
      await gitService.checkout(ref, { name: targetName, force: false });
      taskManager.notifyInfo(`Checked out ${targetName || ref}`);
    },
    async () => {
      onSuccess();
      vscode.commands.executeCommand('intellij-git.refreshBranches');
    }
  );
}

export async function handleMergeWithConflictResolution(
  gitService: GitService,
  ref: string,
  onSuccess: () => void,
  options?: { noFastForward?: boolean }
): Promise<void> {
  const config = vscode.workspace.getConfiguration('jetgit');
  const fallbackConfig = vscode.workspace.getConfiguration('intellijGit');
  const alwaysNoFf = config.get<boolean>('merge.noFastForward') ?? fallbackConfig.get<boolean>('merge.noFastForward', false);
  const noFf = options?.noFastForward ?? alwaysNoFf;

  const currentBranch = await gitService.getCurrentBranch().catch(() => '');
  const targetLabel = currentBranch || 'current branch';

  await withSmartStashOnConflict(
    gitService,
    'Merge',
    ref,
    async () => {
      await gitService.merge(ref, { noFastForward: noFf });
      taskManager.notifyInfo(`Merged '${ref}' into ${targetLabel}.`);

      const branches = await gitService.getBranches().catch(() => []);
      const localBranch = branches.find(b => !b.remote && b.name === ref);
      if (localBranch && localBranch.name !== currentBranch) {
        const deleteAction = `Delete ${ref}`;
        vscode.window.showInformationMessage(
          `Merged ${ref} to ${targetLabel}`,
          deleteAction
        ).then(async (choice) => {
          if (choice === deleteAction) {
            try {
              await gitService.deleteBranch(ref);
              taskManager.notifyInfo(`Deleted branch '${ref}'`);
              vscode.window.showInformationMessage(`Deleted branch '${ref}'`);
              onSuccess();
              vscode.commands.executeCommand('intellij-git.refreshBranches');
            } catch (err: any) {
              if (err.message && (err.message.includes('not fully merged') || err.message.includes('not merged'))) {
                const forceChoice = await vscode.window.showWarningMessage(
                  `Branch '${ref}' is not fully merged. Do you want to force delete it?`,
                  { modal: true },
                  'Force Delete'
                );
                if (forceChoice === 'Force Delete') {
                  await gitService.deleteBranch(ref, true);
                  taskManager.notifyInfo(`Force deleted branch '${ref}'`);
                  vscode.window.showInformationMessage(`Force deleted branch '${ref}'`);
                  onSuccess();
                  vscode.commands.executeCommand('intellij-git.refreshBranches');
                }
              } else {
                vscode.window.showErrorMessage(`Delete failed: ${err.message}`);
              }
            }
          }
        });
      } else {
        vscode.window.showInformationMessage(`Merged ${ref} to ${targetLabel}`);
      }
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
      taskManager.notifyInfo(`Rebased current branch onto ${ref}.`);
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
      taskManager.notifyInfo(`Rebased ${branch} onto ${onto}`);
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
      taskManager.notifyInfo(`Cherry-picked ${hash.slice(0, 8)} successfully.`);
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
      taskManager.notifyInfo(`Reverted commit ${hash.slice(0, 8)}.`);
    },
    onSuccess
  );
}

export async function handlePullWithConflictResolution(
  gitService: GitService,
  branch: string,
  onSuccess: () => void
): Promise<void> {
  try {
    await taskManager.runTask(
      `Updating '${branch}'...`,
      async (signal) => {
        let resultMsg = '';
        await withSmartStashOnConflict(
          gitService,
          'Update',
          branch,
          async () => {
            const out = await gitService.pull(branch, signal);
            resultMsg = out ? `Updated ${branch}: ${out}` : `Updated ${branch}: Already up to date.`;
          },
          onSuccess
        );
        return resultMsg || `Updated '${branch}' successfully.`;
      },
      { cancellable: true }
    );
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      taskManager.notifyError(`Failed to update '${branch}'`, err.message);
    }
  }
}
