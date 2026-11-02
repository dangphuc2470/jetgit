import * as vscode from 'vscode';
import { GraphActionHost } from './types';
import {
  handlePullWithConflictResolution,
  withSmartStashOnConflict,
} from './conflictResolution';
import { isPushRejectedError } from '../../git/conflictUtils';

export async function handleRemoteAction(
  type: string,
  payload: any,
  host: GraphActionHost
): Promise<boolean> {
  const { gitService } = host;

  switch (type) {
    case 'pull': {
      const branch = payload as string;
      await handlePullWithConflictResolution(gitService, branch, () => host.loadInitialData());
      return true;
    }

    case 'fetchAll': {
      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Fetching remotes...',
            cancellable: false,
          },
          async (progress) => {
            progress.report({ message: 'Checking connectivity...' });
            const result = await gitService.smartFetchAll(
              (remote) => {
                vscode.window.showInformationMessage(`Fetched '${remote}' successfully.`);
                host.loadInitialData();
              },
              (status) => {
                progress.report({ message: status });
              }
            );

            if (result.successful.length > 0) {
              if (result.failed.length > 0 || result.skipped.length > 0) {
                const missed = [...result.failed, ...result.skipped];
                vscode.window.showInformationMessage(`Finished fetching. (Skipped offline: ${missed.join(', ')})`);
              } else {
                vscode.window.showInformationMessage(`Fetched all remotes successfully: ${result.successful.join(', ')}.`);
              }
            } else if (result.failed.length > 0 || result.skipped.length > 0) {
              vscode.window.showWarningMessage(`Could not reach remotes: ${[...result.failed, ...result.skipped].join(', ')}.`);
            } else {
              vscode.window.showInformationMessage('No remotes configured.');
            }

            if (result.needsAuth && result.needsAuth.length > 0) {
              const target = result.needsAuth[0];
              let defaultUser = '';
              try {
                defaultUser = (await gitService.exec(['config', 'user.name'])).trim();
              } catch {}
              host.view?.webview.postMessage({
                type: 'showAuthDialog',
                payload: {
                  remote: target.remote,
                  url: target.url,
                  host: target.host,
                  defaultUsername: defaultUser,
                },
              });
            }
          }
        );
      } catch (err: any) {
        vscode.window.showErrorMessage(`Fetch all failed: ${err.message}`);
      } finally {
        host.loadInitialData();
      }
      return true;
    }

    case 'fetchRemote': {
      const { remote, depth } = (payload || {}) as { remote?: string; depth?: number };
      if (!remote) return true;
      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Fetching '${remote}'${depth ? ` (--depth=${depth})` : ''}...`,
            cancellable: false,
          },
          async () => {
            const args = ['fetch'];
            if (depth && depth > 0) {
              args.push(`--depth=${depth}`);
            }
            args.push(remote, '--prune');
            await gitService.exec(args, 10 * 1024 * 1024, 1, 90000);
            vscode.window.showInformationMessage(`Fetched remote '${remote}'${depth ? ` (depth ${depth})` : ''} successfully.`);
          }
        );
      } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to fetch '${remote}': ${err.message}`);
      } finally {
        host.loadInitialData();
      }
      return true;
    }

    case 'fetchSingleBranch': {
      const { branch, depth } = (payload || {}) as { branch?: string; depth?: number };
      if (!branch) return true;
      const slashIdx = branch.indexOf('/');
      if (slashIdx === -1) return true;
      const remoteName = branch.slice(0, slashIdx);
      const branchName = branch.slice(slashIdx + 1);
      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Fetching '${branch}'${depth ? ` (--depth=${depth})` : ''}...`,
            cancellable: false,
          },
          async () => {
            await gitService.fetchSingleBranch(remoteName, branchName, depth);
            vscode.window.showInformationMessage(`Fetched branch '${branch}'${depth ? ` (depth ${depth})` : ''} successfully.`);
          }
        );
      } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to fetch branch '${branch}': ${err.message}`);
      } finally {
        host.loadInitialData();
      }
      return true;
    }

    case 'openAuthDialog': {
      const { remote } = (payload || {}) as { remote?: string };
      const remotes = await gitService.getRemotes();
      const targetRemote = remote || (remotes.includes('apistudio-os') ? 'apistudio-os' : (remotes[0] || 'origin'));
      const url = await gitService.getRemoteUrl(targetRemote);
      let hostName = targetRemote;
      try {
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
          hostName = new URL(url).host;
        }
      } catch {}
      let defaultUser = '';
      try {
        defaultUser = (await gitService.exec(['config', 'user.name'])).trim();
      } catch {}
      host.view?.webview.postMessage({
        type: 'showAuthDialog',
        payload: {
          remote: targetRemote,
          url,
          host: hostName,
          defaultUsername: defaultUser,
        },
      });
      return true;
    }

    case 'saveGitCredentials': {
      const { remote, url, authType, username, token, password, remember } = payload || {};
      try {
        const secret = authType === 'token' ? token : password;
        if (!secret) {
          throw new Error('Access token or password cannot be empty');
        }
        let targetUrl = url || await gitService.getRemoteUrl(remote);
        if (!targetUrl) {
          throw new Error(`Could not find URL for remote '${remote}'`);
        }
        if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
          const parsed = new URL(targetUrl);
          if (username) {
            parsed.username = encodeURIComponent(username);
          }
          parsed.password = encodeURIComponent(secret);
          targetUrl = parsed.toString();
        }
        if (remember) {
          await gitService.exec(['remote', 'set-url', remote, targetUrl]);
        }
        // Test fetch immediately
        await gitService.exec(['-c', 'http.timeout=15', 'fetch', remote, '--prune']);
        host.view?.webview.postMessage({ type: 'authSuccess', payload: { remote } });
        vscode.window.showInformationMessage(`Authenticated and fetched '${remote}' successfully.`);
        host.loadInitialData();
      } catch (err: any) {
        host.view?.webview.postMessage({
          type: 'authError',
          payload: { remote, error: err.message || 'Authentication failed' },
        });
      }
      return true;
    }

    case 'push':
    case 'openPushDialog': {
      const branch = payload as string;
      await host.openPushDialog(branch);
      return true;
    }

    case 'executePush': {
      const { branch, targetBranch, force, setUpstream, remote, tags } = payload || {};
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Pushing '${branch || 'branch'}' to '${remote || 'remote'}'...`,
          cancellable: false,
        },
        async () => {
          try {
            await gitService.push(branch, force, setUpstream, remote, tags, targetBranch);
            vscode.window.showInformationMessage(`Pushed ${branch || 'branch'} successfully to ${remote || 'remote'}.`);
            host.loadInitialData();
            vscode.commands.executeCommand('intellij-git.refreshBranches');
            host.view?.webview.postMessage({ type: 'pushSuccess' });
          } catch (err: any) {
            const rawErr = String(err?.message || err);
            if (isPushRejectedError(rawErr)) {
              host.view?.webview.postMessage({ type: 'pushError', payload: { error: err.message } });
              const currentBranch = branch || await gitService.getCurrentBranch().catch(() => '');
              const choice = await vscode.window.showErrorMessage(
                `Push rejected: Remote repository has newer changes that you do not have locally. Update your branch first.`,
                'Pull (Rebase)',
                'Pull (Merge)'
              );
              if (choice === 'Pull (Rebase)') {
                await vscode.window.withProgress(
                  {
                    location: vscode.ProgressLocation.Notification,
                    title: `Pulling changes with rebase...`,
                    cancellable: false,
                  },
                  async () => {
                    await withSmartStashOnConflict(
                      gitService,
                      'Rebase',
                      currentBranch,
                      async () => {
                        await gitService.exec(['pull', '--rebase']);
                        vscode.window.showInformationMessage(`Pulled remote changes with rebase. You can now push your commits.`);
                      },
                      () => host.loadInitialData()
                    );
                  }
                );
              } else if (choice === 'Pull (Merge)') {
                await vscode.window.withProgress(
                  {
                    location: vscode.ProgressLocation.Notification,
                    title: `Pulling changes with merge...`,
                    cancellable: false,
                  },
                  async () => {
                    await withSmartStashOnConflict(
                      gitService,
                      'Merge',
                      currentBranch,
                      async () => {
                        await gitService.exec(['pull', '--no-rebase']);
                        vscode.window.showInformationMessage(`Merged remote changes into local branch. You can now push your commits.`);
                      },
                      () => host.loadInitialData()
                    );
                  }
                );
              }
              return;
            }
            vscode.window.showErrorMessage(`Push failed: ${err.message}`);
            host.view?.webview.postMessage({ type: 'pushError', payload: { error: err.message } });
          }
        }
      );
      return true;
    }

    case 'pushUpToHere': {
      const { hash } = payload || {};
      const shortHash = (hash || '').slice(0, 8);
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Pushing up to ${shortHash}...`,
          cancellable: false,
        },
        async () => {
          try {
            const currentBranch = await gitService.getCurrentBranch();
            const remote = await gitService.getDefaultRemote(currentBranch);
            await gitService.exec(['push', remote, `${hash}:refs/heads/${currentBranch}`]);
            vscode.window.showInformationMessage(`Pushed up to ${shortHash} on ${currentBranch}`);
            host.loadInitialData();
          } catch (err: any) {
            vscode.window.showErrorMessage(`Push failed: ${err.message}`);
          }
        }
      );
      return true;
    }

    default:
      return false;
  }
}
