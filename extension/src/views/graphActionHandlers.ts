import * as vscode from 'vscode';
import * as path from 'path';
import { GitService, Commit } from '../git/gitService';
import { GitContentProvider } from '../providers/gitContentProvider';
import { buildGraph } from '../git/graphBuilder';

export interface GraphActionHost {
  gitService: GitService;
  extensionUri: vscode.Uri;
  loadInitialData(): Promise<void>;
  openPushDialog(branch?: string): Promise<void>;
  view?: vscode.WebviewView;
  updateGraph(commits: Commit[]): void;
}

export async function handleGraphAction(
  type: string,
  payload: any,
  host: GraphActionHost
): Promise<boolean> {
  const { gitService } = host;

  switch (type) {
    case 'checkout': {
      const ref = payload as string;
      try {
        await gitService.checkout(ref);
        vscode.window.showInformationMessage(`Checked out ${ref}`);
        host.loadInitialData();
      } catch (err: any) {
        vscode.window.showErrorMessage(`Checkout failed: ${err.message}`);
      }
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
      try {
        await gitService.checkoutAndRebase(branch, onto);
        vscode.window.showInformationMessage(`Rebased ${branch} onto ${onto}`);
        host.loadInitialData();
      } catch (err: any) {
        vscode.window.showErrorMessage(`Checkout and rebase failed: ${err.message}`);
      }
      return true;
    }
    case 'rebase': {
      const branch = payload as string;
      try {
        await gitService.rebase(branch);
        vscode.window.showInformationMessage(`Rebased onto ${branch}`);
        host.loadInitialData();
      } catch (err: any) {
        vscode.window.showErrorMessage(`Rebase failed: ${err.message}`);
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
    case 'showDiff': {
      const { branch } = payload || {};
      try {
        const files = await gitService.getDiffFiles(branch);
        if (files.length === 0) {
          vscode.window.showInformationMessage(`No differences between ${branch} and working tree.`);
          return true;
        }
        const items = files.map(f => ({
          label: `${f.status} ${f.path}`,
          description: f.oldPath ? `from ${f.oldPath}` : '',
          file: f,
        }));
        const picked = await vscode.window.showQuickPick(items, {
          placeHolder: `Select a file changed against ${branch} to view diff`,
        });
        if (picked) {
          const filePath = picked.file.path;
          const leftUri = picked.file.status === 'A'
            ? GitContentProvider.emptyUri()
            : GitContentProvider.makeUri(branch, picked.file.oldPath || filePath);
          const rightUri = picked.file.status === 'D'
            ? GitContentProvider.emptyUri()
            : vscode.Uri.file(path.join(gitService.getCwd(), filePath));
          const fileName = filePath.split('/').pop() || filePath;
          await vscode.commands.executeCommand('vscode.diff', leftUri, rightUri, `${fileName} (${branch} ↔ Working Tree)`);
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Show diff failed: ${err.message}`);
      }
      return true;
    }
    case 'pull': {
      const branch = payload as string;
      try {
        const out = await gitService.pull(branch);
        vscode.window.showInformationMessage(`Updated ${branch}: ${out || 'Already up to date.'}`);
        host.loadInitialData();
      } catch (err: any) {
        vscode.window.showErrorMessage(`Update failed: ${err.message}`);
      }
      return true;
    }
    case 'fetchAll': {
      try {
        vscode.window.showInformationMessage('Checking remotes connectivity and fetching...');
        const result = await gitService.smartFetchAll((remote) => {
          vscode.window.showInformationMessage(`Fetched '${remote}' successfully.`);
          host.loadInitialData();
        });
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
      } catch (err: any) {
        vscode.window.showErrorMessage(`Fetch all failed: ${err.message}`);
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
      try {
        await gitService.push(branch, force, setUpstream, remote, tags, targetBranch);
        vscode.window.showInformationMessage(`Pushed ${branch || 'branch'} successfully to ${remote || 'remote'}.`);
        host.loadInitialData();
        vscode.commands.executeCommand('intellij-git.refreshBranches');
        host.view?.webview.postMessage({ type: 'pushSuccess' });
      } catch (err: any) {
        vscode.window.showErrorMessage(`Push failed: ${err.message}`);
        host.view?.webview.postMessage({ type: 'pushError', payload: { error: err.message } });
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
    case 'mergeBranch': {
      const ref = payload as string;
      try {
        await gitService.merge(ref);
        vscode.window.showInformationMessage(`Merged '${ref}' successfully.`);
        host.loadInitialData();
      } catch (err: any) {
        const errMsg: string = err.message || '';
        const hasConflicts =
          errMsg.includes('CONFLICT') ||
          errMsg.includes('conflict') ||
          errMsg.includes('Automatic merge failed') ||
          errMsg.includes('fix conflicts');

        if (hasConflicts) {
          host.loadInitialData();
          try {
            const conflictFiles = await gitService.getUnmergedFiles();
            if (conflictFiles.length === 0) {
              vscode.window.showWarningMessage(`Merge has conflicts. Please resolve them and commit.`);
              return true;
            }

            const items: vscode.QuickPickItem[] = conflictFiles.map(f => ({
              label: `$(git-merge) ${f}`,
              description: 'Conflict — click to open merge editor',
              detail: f,
            }));
            items.push({
              label: '$(check-all) All conflicts resolved — open Commit panel',
              description: '',
              detail: '__commit__',
            });

            const chosen = await vscode.window.showQuickPick(items, {
              placeHolder: `${conflictFiles.length} file(s) with conflicts — select a file to resolve`,
              canPickMany: false,
              title: `Merge conflicts: '${ref}' into current branch`,
            });

            if (chosen && chosen.detail && chosen.detail !== '__commit__') {
              const fileUri = vscode.Uri.joinPath(
                vscode.Uri.file(gitService.getCwd()),
                chosen.detail,
              );
              try {
                await vscode.commands.executeCommand('merge-conflict.accept.all-both');
              } catch {}
              await vscode.commands.executeCommand('vscode.open', fileUri);
              try {
                await vscode.commands.executeCommand('git.openMergeEditor', fileUri);
              } catch {}
            } else if (chosen && chosen.detail === '__commit__') {
              await vscode.commands.executeCommand('intellij-git.openCommit');
            }
          } catch {
            vscode.window.showWarningMessage(
              `Merge has conflicts. Please resolve them in the editor and commit when done.`,
            );
          }
        } else {
          vscode.window.showErrorMessage(`Merge failed: ${errMsg}`);
        }
      }
      return true;
    }
    case 'rebaseFromHere': {
      const hash = payload as string;
      await vscode.commands.executeCommand('intellij-git.interactiveRebase', hash);
      return true;
    }
    case 'cherryPick': {
      const { hash } = payload || {};
      try {
        await gitService.cherryPick(hash);
        vscode.window.showInformationMessage(`Cherry-picked ${hash.slice(0, 8)} successfully`);
        host.loadInitialData();
      } catch (err: any) {
        vscode.window.showErrorMessage(`Cherry-pick failed: ${err.message}`);
      }
      return true;
    }
    case 'revertCommit': {
      const { hash } = payload || {};
      try {
        await gitService.revertCommit(hash);
        vscode.window.showInformationMessage(`Reverted commit ${hash.slice(0, 8)}`);
        host.loadInitialData();
      } catch (err: any) {
        vscode.window.showErrorMessage(`Revert failed: ${err.message}`);
      }
      return true;
    }
    case 'resetToCommit': {
      const { hash } = payload || {};
      const mode = await vscode.window.showQuickPick([
        { label: 'Soft', description: 'Keep all local changes in index (staged)', mode: 'soft' },
        { label: 'Mixed', description: 'Keep all local changes in working tree (unstaged)', mode: 'mixed' },
        { label: 'Hard', description: 'Discard all local changes', mode: 'hard' },
      ], { placeHolder: `Reset current branch to ${hash.slice(0, 8)}` });
      if (mode) {
        if (mode.mode === 'hard') {
          const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to perform a HARD reset to ${hash.slice(0, 8)}? All uncommitted local changes will be lost!`,
            { modal: true },
            'Reset',
          );
          if (confirm !== 'Reset') return true;
        }
        try {
          await gitService.reset(hash, mode.mode as any);
          vscode.window.showInformationMessage(`Reset branch to ${hash.slice(0, 8)} (${mode.label})`);
          host.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Reset failed: ${err.message}`);
        }
      }
      return true;
    }
    case 'undoCommit': {
      try {
        await gitService.reset('HEAD~1', 'soft');
        vscode.window.showInformationMessage('Undid last commit (changes kept staged)');
        host.loadInitialData();
      } catch (err: any) {
        vscode.window.showErrorMessage(`Undo commit failed: ${err.message}`);
      }
      return true;
    }
    case 'createTag': {
      let { name, hash } = (payload || {}) as { name?: string; hash?: string };
      if (!name) {
        name = await vscode.window.showInputBox({
          prompt: `New tag name at ${hash?.slice(0, 8) || 'commit'}:`,
          placeHolder: 'v1.0.0',
        });
        if (!name) return true;
      }
      try {
        await gitService.createTag(name, hash);
        vscode.window.showInformationMessage(`Created tag ${name} at ${hash ? hash.slice(0, 8) : ''}`);
        host.loadInitialData();
      } catch (err: any) {
        vscode.window.showErrorMessage(`Create tag failed: ${err.message}`);
      }
      return true;
    }
    case 'createPatch': {
      const { hash } = payload || {};
      try {
        const patch = await gitService.createPatch(hash);
        const doc = await vscode.workspace.openTextDocument({
          content: patch,
          language: 'diff',
        });
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage(`Created patch for ${hash.slice(0, 8)}`);
      } catch (err: any) {
        vscode.window.showErrorMessage(`Create patch failed: ${err.message}`);
      }
      return true;
    }
    case 'compareWithLocal': {
      const { hash } = payload || {};
      try {
        const files = await gitService.getDiffFiles(hash);
        if (files.length === 0) {
          vscode.window.showInformationMessage(`No differences between ${hash.slice(0, 8)} and working tree.`);
          return true;
        }
        const items = files.map(f => ({
          label: `${f.status} ${f.path}`,
          description: f.oldPath ? `from ${f.oldPath}` : '',
          file: f,
        }));
        const picked = await vscode.window.showQuickPick(items, {
          placeHolder: `Select a file changed against ${hash.slice(0, 8)} to view diff`,
        });
        if (picked) {
          const filePath = picked.file.path;
          const leftUri = picked.file.status === 'A'
            ? GitContentProvider.emptyUri()
            : GitContentProvider.makeUri(hash, picked.file.oldPath || filePath);
          const rightUri = picked.file.status === 'D'
            ? GitContentProvider.emptyUri()
            : vscode.Uri.file(path.join(gitService.getCwd(), filePath));
          const fileName = filePath.split('/').pop() || filePath;
          await vscode.commands.executeCommand('vscode.diff', leftUri, rightUri, `${fileName} (${hash.slice(0, 8)} ↔ Working Tree)`);
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Compare with local failed: ${err.message}`);
      }
      return true;
    }
    case 'editCommitMessage': {
      const { hash, subject, message } = payload || {};
      let newMsg = message;
      if (!newMsg) {
        newMsg = await vscode.window.showInputBox({
          prompt: 'Edit Commit Message',
          value: subject || '',
        });
      }
      if (newMsg && newMsg.trim()) {
        try {
          const headHash = (await gitService.getLog({ maxCount: 1 }))[0]?.hash;
          if (headHash === hash) {
            await gitService.exec(['commit', '--amend', '-m', newMsg.trim()]);
            vscode.window.showInformationMessage('Commit message updated');
            host.loadInitialData();
          } else {
            vscode.window.showWarningMessage('Editing commit message of older commits requires interactive rebase.');
            await vscode.commands.executeCommand('intellij-git.interactiveRebase', hash);
          }
        } catch (err: any) {
          vscode.window.showErrorMessage(`Edit message failed: ${err.message}`);
        }
      }
      return true;
    }
    case 'dropCommit': {
      const { hash } = payload || {};
      try {
        const headHash = (await gitService.getLog({ maxCount: 1 }))[0]?.hash;
        if (headHash === hash) {
          await gitService.reset('HEAD~1', 'hard');
          vscode.window.showInformationMessage(`Dropped commit ${hash.slice(0, 8)}`);
          host.loadInitialData();
        } else {
          vscode.window.showInformationMessage(`Use Interactive Rebase to drop older commit ${hash.slice(0, 8)}`);
          await vscode.commands.executeCommand('intellij-git.interactiveRebase', hash);
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Drop commit failed: ${err.message}`);
      }
      return true;
    }
    case 'pushUpToHere': {
      const { hash } = payload || {};
      try {
        const currentBranch = await gitService.getCurrentBranch();
        const remote = await gitService.getDefaultRemote(currentBranch);
        await gitService.exec(['push', remote, `${hash}:refs/heads/${currentBranch}`]);
        vscode.window.showInformationMessage(`Pushed up to ${hash.slice(0, 8)} on ${currentBranch}`);
        host.loadInitialData();
      } catch (err: any) {
        vscode.window.showErrorMessage(`Push failed: ${err.message}`);
      }
      return true;
    }
    case 'showRepoAtRevision': {
      const { hash } = payload || {};
      try {
        const files = await gitService.getCommitFiles(hash);
        if (files.length === 0) {
          vscode.window.showInformationMessage(`No files changed in ${hash.slice(0, 8)}.`);
          return true;
        }
        const items = files.map(f => ({
          label: `${f.status} ${f.path}`,
          description: f.oldPath ? `from ${f.oldPath}` : '',
          path: f.path,
        }));
        const picked = await vscode.window.showQuickPick(items, {
          placeHolder: `Files changed in commit ${hash.slice(0, 8)}`,
        });
        if (picked) {
          const uri = GitContentProvider.makeUri(hash, picked.path);
          await vscode.commands.executeCommand('vscode.open', uri);
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Show revision failed: ${err.message}`);
      }
      return true;
    }
    case 'openInBrowser': {
      const { hash } = payload || {};
      try {
        const remoteUrl = await gitService.getRemoteUrl();
        if (!remoteUrl) {
          vscode.window.showWarningMessage('No remote URL found for this repository.');
          return true;
        }
        let httpUrl = remoteUrl
          .replace(/^ssh:\/\/git@([^/:]+)(?::\d+)?\//, 'https://$1/')
          .replace(/^git@([^:]+):/, 'https://$1/')
          .replace(/^https?:\/\/[^@]+@/, 'https://')
          .replace(/\.git$/, '');
        if (httpUrl.includes('gitlab.com') || httpUrl.includes('gitlab')) {
          httpUrl = `${httpUrl}/-/commit/${hash}`;
        } else {
          httpUrl = `${httpUrl}/commit/${hash}`;
        }
        await vscode.env.openExternal(vscode.Uri.parse(httpUrl));
      } catch (err: any) {
        vscode.window.showErrorMessage(`Open in browser failed: ${err.message}`);
      }
      return true;
    }
    default:
      return false;
  }
}
