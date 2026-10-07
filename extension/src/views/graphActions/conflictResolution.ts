import * as vscode from 'vscode';
import { GitService } from '../../git/gitService';

export async function withSmartStashOnConflict(
  gitService: GitService,
  actionLabel: 'Checkout' | 'Update',
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
    const pastAction = actionLabel === 'Checkout' ? `switching to '${targetRef}'` : 'merging';
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
