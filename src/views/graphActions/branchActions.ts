import * as vscode from 'vscode';
import * as path from 'path';
import { GraphActionHost } from './types';
import {
  handleCheckoutWithConflictResolution,
  handleCheckoutAndRebaseWithConflictResolution,
} from './conflictResolution';
import { isBranchAlreadyExistsError } from '../../git/conflictUtils';
import { taskManager } from '../../services/taskManager';

export async function handleBranchAction(
  type: string,
  payload: any,
  host: GraphActionHost
): Promise<boolean> {
  const { gitService } = host;

  switch (type) {
    case 'checkout': {
      let ref = '';
      let targetName: string | undefined;
      let force = false;

      if (typeof payload === 'string') {
        ref = payload;
      } else if (payload && typeof payload === 'object') {
        ref = payload.branch || payload.ref || '';
        targetName = payload.name;
        force = payload.force === true;
      }

      await handleCheckoutWithConflictResolution(gitService, ref, () => host.loadInitialData(), {
        name: targetName,
        force,
        openCheckoutDialog: (remoteRef, defaultName) => {
          (host as any).openCheckoutBranchDialog?.(remoteRef, defaultName);
        },
      });
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
        taskManager.notifyInfo(`Created branch ${name}`);
        host.loadInitialData();
      } catch (err: any) {
        const rawErr = String(err?.message || err);
        const branchExists = isBranchAlreadyExistsError(rawErr);
        if (branchExists) {
          const choice = await vscode.window.showErrorMessage(
            `A branch named '${branchExists}' already exists.`,
            `Checkout '${branchExists}'`,
            'Force Recreate'
          );
          if (choice === `Checkout '${branchExists}'`) {
            await handleCheckoutWithConflictResolution(gitService, branchExists, () => host.loadInitialData());
          } else if (choice === 'Force Recreate') {
            try {
              await gitService.createBranch(branchExists, startPoint, checkout !== false, true);
              taskManager.notifyInfo(`Recreated branch '${branchExists}'`);
              host.loadInitialData();
            } catch (createErr: any) {
              vscode.window.showErrorMessage(`Force recreate failed: ${createErr.message}`);
            }
          }
          return true;
        }
        vscode.window.showErrorMessage(`Create branch failed: ${err.message}`);
      }
      return true;
    }

    case 'deleteBranch': {
      const ref = payload as string;
      try {
        await gitService.deleteBranch(ref);
        taskManager.notifyInfo(`Deleted branch '${ref}'`);
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
              taskManager.notifyInfo(`Force deleted branch '${ref}'`);
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
        taskManager.notifyInfo(`Comparing commits between ${branch} and ${withBranch}`);
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
        taskManager.notifyInfo(`Renamed branch '${oldName}' to '${newName}'`);
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
        await taskManager.runTask(
          `Tracking '${branch}' -> '${upstream}'...`,
          async (signal) => {
            const slashIdx = upstream.indexOf('/');
            const remote = slashIdx !== -1 ? upstream.slice(0, slashIdx) : upstream;
            const remoteBranch = slashIdx !== -1 ? upstream.slice(slashIdx + 1) : branch;

            try {
              await gitService.exec(['fetch', remote, remoteBranch], undefined, undefined, undefined, signal);
            } catch (e: any) {
              if (e?.name === 'AbortError' || signal.aborted) throw e;
            }

            try {
              await gitService.exec(['branch', '--set-upstream-to', upstream, branch], undefined, undefined, undefined, signal);
            } catch (e: any) {
              if (e?.name === 'AbortError' || signal.aborted) throw e;
              await gitService.exec(['config', `branch.${branch}.remote`, remote], undefined, undefined, undefined, signal);
              await gitService.exec(['config', `branch.${branch}.merge`, `refs/heads/${remoteBranch}`], undefined, undefined, undefined, signal);
            }
            host.loadInitialData();
            vscode.commands.executeCommand('jetgit.refreshBranches');
            return `Branch '${branch}' is now tracking '${upstream}'.`;
          },
          { cancellable: true }
        );
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          taskManager.notifyError('Set upstream failed', err.message);
        }
      }
      return true;
    }

    case 'unsetUpstream': {
      const { branch } = payload || {};
      if (!branch) return true;
      try {
        await gitService.exec(['branch', '--unset-upstream', branch]);
        taskManager.notifyInfo(`Unset tracked branch for '${branch}'.`);
        host.loadInitialData();
        vscode.commands.executeCommand('jetgit.refreshBranches');
      } catch (err: any) {
        vscode.window.showErrorMessage(`Unset upstream failed: ${err.message}`);
      }
      return true;
    }

    case 'trackAllBranchesToRemote': {
      const { remote, prefix } = payload || {};
      if (!remote) return true;
      const displayTarget = prefix ? `${remote}/${prefix}` : remote;
      await taskManager.runTask(
        `Tracking branches to '${displayTarget}'...`,
        async (signal, updateDetail) => {
          try {
            try {
              await gitService.exec(['fetch', remote], undefined, undefined, undefined, signal);
            } catch {}

            const branches = await gitService.getBranches();
            const allLocals = branches.filter(b => !b.remote && !b.name.startsWith('('));
            const locals = prefix
              ? allLocals.filter(b => b.name === prefix || b.name.startsWith(prefix + '/'))
              : allLocals;

            let trackedCount = 0;
            const errors: string[] = [];

            for (const local of locals) {
              if (signal.aborted) break;
              const targetRemoteBranch = `${remote}/${local.name}`;
              try {
                try {
                  await gitService.exec(['branch', '--set-upstream-to', targetRemoteBranch, local.name], undefined, undefined, undefined, signal);
                } catch {
                  await gitService.exec(['config', `branch.${local.name}.remote`, remote], undefined, undefined, undefined, signal);
                  await gitService.exec(['config', `branch.${local.name}.merge`, `refs/heads/${local.name}`], undefined, undefined, undefined, signal);
                }
                trackedCount++;
                updateDetail(`Tracked ${trackedCount}/${locals.length} branches...`);
              } catch (err: any) {
                errors.push(`${local.name}: ${err.message}`);
              }
            }

            if (trackedCount > 0) {
              host.loadInitialData();
              vscode.commands.executeCommand('jetgit.refreshBranches');
              return `Successfully tracked ${trackedCount} local branch${trackedCount > 1 ? 'es' : ''} to '${displayTarget}'.`;
            } else {
              return `No matching local branches found to track to '${displayTarget}'.`;
            }
          } catch (err: any) {
            if (err?.name !== 'AbortError') {
              taskManager.notifyError('Track branches failed', err.message);
            }
            throw err;
          }
        },
        { cancellable: true }
      );
      return true;
    }

    case 'newWorktreeFromBranch': {
      const { branch } = (payload || {}) as { branch?: string };
      if (!branch) return true;
      try {
        const repoRoot = await gitService.getRepoRoot();
        const repoName = path.basename(repoRoot);
        const parentDir = path.dirname(repoRoot);
        const sanitizedBranch = branch.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
        const defaultPath = path.join(parentDir, `${repoName}-${sanitizedBranch || 'worktree'}`);

        const targetPath = await vscode.window.showInputBox({
          title: `New Worktree from '${branch}'`,
          prompt: 'Enter path for the new Git worktree directory',
          value: defaultPath,
          validateInput: (val) => (!val.trim() ? 'Worktree path cannot be empty' : undefined),
        });
        if (!targetPath || !targetPath.trim()) return true;
        const resolvedPath = path.resolve(targetPath.trim());

        const branches = await gitService.getBranches();
        const isRemote = branches.some((b) => b.remote && b.name === branch);
        const localBranches = new Set(branches.filter((b) => !b.remote).map((b) => b.name));

        await taskManager.runTask(
          `Creating worktree at '${resolvedPath}'...`,
          async (signal) => {
            if (isRemote) {
              const slashIdx = branch.indexOf('/');
              const shortName = slashIdx !== -1 ? branch.slice(slashIdx + 1) : branch;
              if (!localBranches.has(shortName)) {
                await gitService.exec(['worktree', 'add', '-b', shortName, resolvedPath, branch], undefined, undefined, undefined, signal);
              } else {
                await gitService.exec(['worktree', 'add', '--detach', resolvedPath, branch], undefined, undefined, undefined, signal);
              }
            } else {
              await gitService.exec(['worktree', 'add', resolvedPath, branch], undefined, undefined, undefined, signal);
            }
            host.loadInitialData();
            return `Created worktree for '${branch}' at '${resolvedPath}'.`;
          },
          { cancellable: true }
        );

        const openAction = await vscode.window.showInformationMessage(
          `Created worktree at '${resolvedPath}'.`,
          'Open in New Window'
        );
        if (openAction === 'Open in New Window') {
          await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(resolvedPath), { forceNewWindow: true });
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          vscode.window.showErrorMessage(`Failed to create worktree: ${err?.message || err}`);
        }
      }
      return true;
    }

    default:
      return false;
  }
}
