import * as vscode from 'vscode';
import * as path from 'path';
import { GitContentProvider } from '../../providers/gitContentProvider';
import { GraphActionHost } from './types';
import {
  handleMergeWithConflictResolution,
  handleRebaseWithConflictResolution,
  handleCherryPickWithConflictResolution,
  handleRevertWithConflictResolution,
} from './conflictResolution';

export async function handleCommitAction(
  type: string,
  payload: any,
  host: GraphActionHost
): Promise<boolean> {
  const { gitService } = host;

  switch (type) {
    case 'rebase': {
      const branch = payload as string;
      await handleRebaseWithConflictResolution(gitService, branch, () => host.loadInitialData());
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

    case 'mergeBranch': {
      const ref = payload as string;
      await handleMergeWithConflictResolution(gitService, ref, () => host.loadInitialData());
      return true;
    }

    case 'rebaseFromHere': {
      const hash = payload as string;
      await vscode.commands.executeCommand('intellij-git.interactiveRebase', hash);
      return true;
    }

    case 'cherryPick': {
      const { hash } = payload || {};
      if (hash) {
        await handleCherryPickWithConflictResolution(gitService, hash, () => host.loadInitialData());
      }
      return true;
    }

    case 'revertCommit': {
      const { hash } = payload || {};
      if (hash) {
        await handleRevertWithConflictResolution(gitService, hash, () => host.loadInitialData());
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

    case 'deleteTag': {
      const tag = (typeof payload === 'string' ? payload : payload?.name) as string;
      if (!tag) return true;
      const confirm = await vscode.window.showWarningMessage(
        `Are you sure you want to delete tag '${tag}'?`,
        { modal: true },
        'Delete'
      );
      if (confirm === 'Delete') {
        try {
          await gitService.deleteTag(tag);
          vscode.window.showInformationMessage(`Deleted tag '${tag}'`);
          host.loadInitialData();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Delete tag failed: ${err.message}`);
        }
      }
      return true;
    }

    case 'pushTag': {
      const tag = (typeof payload === 'string' ? payload : payload?.name) as string;
      if (!tag) return true;
      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Pushing tag '${tag}' to origin...`,
            cancellable: false,
          },
          async () => {
            await gitService.exec(['push', 'origin', tag]);
            vscode.window.showInformationMessage(`Pushed tag '${tag}' successfully.`);
          }
        );
      } catch (err: any) {
        vscode.window.showErrorMessage(`Push tag failed: ${err.message}`);
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
