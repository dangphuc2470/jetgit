import * as vscode from 'vscode';
import { GraphActionHost } from './types';
import {
  handleCheckoutWithConflictResolution,
  handleCheckoutAndRebaseWithConflictResolution,
} from './conflictResolution';

export async function handleBranchAction(
  type: string,
  payload: any,
  host: GraphActionHost
): Promise<boolean> {
  const { gitService } = host;

  switch (type) {
    case 'checkout': {
      const ref = payload as string;
      if (ref && ref.includes('/')) {
        const slashIdx = ref.indexOf('/');
        const remoteName = ref.slice(0, slashIdx);
        const branchName = ref.slice(slashIdx + 1);
        try {
          const remotes = await gitService.getRemotes();
          if (remotes.includes(remoteName)) {
            let fetchOk = false;
            await vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: `Fetching '${ref}' before checkout...`,
                cancellable: false,
              },
              async () => {
                try {
                  await gitService.fetchSingleBranch(remoteName, branchName);
                  fetchOk = true;
                } catch (fetchErr: any) {
                  vscode.window.showErrorMessage(`Failed to fetch '${ref}' from remote '${remoteName}': ${fetchErr.message}`);
                }
              }
            );
            if (!fetchOk) {
              return true;
            }
          }
        } catch {}
      }
      await handleCheckoutWithConflictResolution(gitService, ref, () => host.loadInitialData());
      return true;
    }

    case 'createBranch': {
      let { name, startPoint, checkout, force } = (payload || {}) as {
        name?: string;
        startPoint?: string;
        checkout?: boolean;
        force?: boolean;
      };
      if (!name) {
        name = await vscode.window.showInputBox({
          prompt: `New branch name (from '${startPoint || 'HEAD'}'):`,
          placeHolder: 'feature/...',
        });
        if (!name) return true;
      }
      try {
        await gitService.createBranch(name, startPoint, checkout !== false, force === true);
        vscode.window.showInformationMessage(`Created branch ${name}`);
        host.loadInitialData();
      } catch (err: any) {
        vscode.window.showErrorMessage(`Create branch failed: ${err.message}`);
      }
      return true;
    }

    case 'deleteBranch': {
      const ref = payload as string;
      try {
        await gitService.deleteBranch(ref);
        vscode.window.showInformationMessage(`Deleted branch '${ref}'`);
        host.loadInitialData();
      } catch (err: any) {
        if (err.message && (err.message.includes('not fully merged') || err.message.includes('not merged'))) {
          const force = await vscode.window.showWarningMessage(
            `Branch '${ref}' is not fully merged. Do you want to force delete it?`,
            { modal: true },
            'Force Delete',
          );
          if (force === 'Force Delete') {
            try {
              await gitService.deleteBranch(ref, true);
              vscode.window.showInformationMessage(`Force deleted branch '${ref}'`);
              host.loadInitialData();
            } catch (e: any) {
              vscode.window.showErrorMessage(`Delete failed: ${e.message}`);
            }
          }
        } else {
          vscode.window.showErrorMessage(`Delete failed: ${err.message}`);
        }
      }
      return true;
    }

    case 'checkoutAndRebase': {
      const { branch, onto } = payload || {};
      if (branch && onto) {
        await handleCheckoutAndRebaseWithConflictResolution(gitService, branch, onto, () => host.loadInitialData());
      }
      return true;
    }

    case 'compareBranch': {
      const { branch, withBranch } = payload || {};
      try {
        const commits = await gitService.getLog({
          branch: `${withBranch}..${branch}`,
          all: false,
        });
        host.updateGraph(commits);
        vscode.window.showInformationMessage(`Comparing commits between ${branch} and ${withBranch}`);
      } catch (err: any) {
        vscode.window.showErrorMessage(`Compare failed: ${err.message}`);
      }
      return true;
    }

    case 'renameBranch': {
      let { oldName, newName } = (payload || {}) as { oldName?: string; newName?: string };
      if (!newName && oldName) {
        newName = await vscode.window.showInputBox({
          prompt: `Rename branch '${oldName}' to:`,
          value: oldName,
        });
        if (!newName || newName === oldName) return true;
      }
      if (!oldName || !newName) return true;
      try {
        await gitService.renameBranch(oldName, newName);
        vscode.window.showInformationMessage(`Renamed branch '${oldName}' to '${newName}'`);
        host.loadInitialData();
      } catch (err: any) {
        vscode.window.showErrorMessage(`Rename failed: ${err.message}`);
      }
      return true;
    }

    case 'setUpstream': {
      const { branch, upstream } = payload || {};
      if (!branch || !upstream) return true;
      try {
        const slashIdx = upstream.indexOf('/');
        const remote = slashIdx !== -1 ? upstream.slice(0, slashIdx) : upstream;
        const remoteBranch = slashIdx !== -1 ? upstream.slice(slashIdx + 1) : branch;

        try {
          await gitService.exec(['fetch', remote, remoteBranch]);
        } catch {}

        try {
          await gitService.exec(['branch', '--set-upstream-to', upstream, branch]);
        } catch {
          await gitService.exec(['config', `branch.${branch}.remote`, remote]);
          await gitService.exec(['config', `branch.${branch}.merge`, `refs/heads/${remoteBranch}`]);
        }
        vscode.window.showInformationMessage(`Branch '${branch}' is now tracking '${upstream}'.`);
        host.loadInitialData();
        vscode.commands.executeCommand('intellij-git.refreshBranches');
      } catch (err: any) {
        vscode.window.showErrorMessage(`Set upstream failed: ${err.message}`);
      }
      return true;
    }

    case 'unsetUpstream': {
      const { branch } = payload || {};
      if (!branch) return true;
      try {
        await gitService.exec(['branch', '--unset-upstream', branch]);
        vscode.window.showInformationMessage(`Unset tracked branch for '${branch}'.`);
        host.loadInitialData();
        vscode.commands.executeCommand('intellij-git.refreshBranches');
      } catch (err: any) {
        vscode.window.showErrorMessage(`Unset upstream failed: ${err.message}`);
      }
      return true;
    }

    case 'trackAllBranchesToRemote': {
      const { remote, prefix } = payload || {};
      if (!remote) return true;
      const displayTarget = prefix ? `${remote}/${prefix}` : remote;
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Tracking branches to '${displayTarget}'...`,
          cancellable: false,
        },
        async () => {
          try {
            try {
              await gitService.exec(['fetch', remote]);
            } catch {}

            const branches = await gitService.getBranches();
            const allLocals = branches.filter(b => !b.remote && !b.name.startsWith('('));
            const locals = prefix
              ? allLocals.filter(b => b.name === prefix || b.name.startsWith(prefix + '/'))
              : allLocals;

            let trackedCount = 0;
            const errors: string[] = [];

            for (const local of locals) {
              const targetRemoteBranch = `${remote}/${local.name}`;
              try {
                try {
                  await gitService.exec(['branch', '--set-upstream-to', targetRemoteBranch, local.name]);
                } catch {
                  await gitService.exec(['config', `branch.${local.name}.remote`, remote]);
                  await gitService.exec(['config', `branch.${local.name}.merge`, `refs/heads/${local.name}`]);
                }
                trackedCount++;
              } catch (err: any) {
                errors.push(`${local.name}: ${err.message}`);
              }
            }

            if (trackedCount > 0) {
              vscode.window.showInformationMessage(`Successfully tracked ${trackedCount} local branch${trackedCount > 1 ? 'es' : ''} to '${displayTarget}'.`);
              host.loadInitialData();
              vscode.commands.executeCommand('intellij-git.refreshBranches');
            } else {
              vscode.window.showInformationMessage(`No matching local branches found to track to '${displayTarget}'.`);
            }
            if (errors.length > 0) {
              vscode.window.showWarningMessage(`Some branches could not be tracked:\n${errors.join('\n')}`);
            }
          } catch (err: any) {
            vscode.window.showErrorMessage(`Track branches failed: ${err.message}`);
          }
        }
      );
      return true;
    }

    default:
      return false;
  }
}
