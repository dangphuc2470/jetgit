import * as fs from 'fs';
import * as path from 'path';
import { ConflictInfo } from '../gitTypes';

export interface GitExecContext {
  cwd: string;
  exec(args: string[], maxBuffer?: number, retries?: number): Promise<string>;
  getStatus(): Promise<any[]>;
  getCurrentBranch(): Promise<string>;
  stageFiles(paths: string[]): Promise<void>;
  getMergeMessage(): Promise<string>;
}

export async function getUnmergedFiles(ctx: GitExecContext): Promise<string[]> {
  const output = await ctx.exec(['diff', '--name-only', '--diff-filter=U']);
  return output.split('\n').filter(l => l.trim());
}

export async function getConflictInfo(ctx: GitExecContext): Promise<ConflictInfo> {
  const gitDir = path.join(ctx.cwd, '.git');
  const isMerging = fs.existsSync(path.join(gitDir, 'MERGE_HEAD'));
  const isRebasing =
    fs.existsSync(path.join(gitDir, 'rebase-merge')) ||
    fs.existsSync(path.join(gitDir, 'rebase-apply'));
  const isCherryPicking = fs.existsSync(path.join(gitDir, 'CHERRY_PICK_HEAD'));

  let yoursBranch = '';
  try {
    yoursBranch = await ctx.getCurrentBranch();
  } catch {}
  if (!yoursBranch) yoursBranch = 'HEAD';

  let theirsBranch = '';
  if (isMerging) {
    try {
      const mergeMsg = await ctx.getMergeMessage();
      const m = mergeMsg.match(/Merge branch '([^']+)'/) || mergeMsg.match(/Merge commit '([^']+)'/);
      if (m) {
        theirsBranch = m[1];
      } else {
        const mergeHead = fs.readFileSync(path.join(gitDir, 'MERGE_HEAD'), 'utf8').trim();
        theirsBranch = mergeHead.slice(0, 7);
      }
    } catch {}
  } else if (isRebasing) {
    try {
      const headNamePath = path.join(gitDir, 'rebase-merge', 'head-name');
      if (fs.existsSync(headNamePath)) {
        theirsBranch = fs.readFileSync(headNamePath, 'utf8').trim().replace('refs/heads/', '');
      }
    } catch {}
  }
  if (!theirsBranch) theirsBranch = 'Theirs';

  const statusEntries = await ctx.getStatus();
  const conflictCodes = new Set(['UU', 'UD', 'DU', 'AA', 'DD', 'AU', 'UA']);
  const conflictEntries = statusEntries.filter(
    e => conflictCodes.has(`${e.x}${e.y}`) || e.x === 'U' || e.y === 'U'
  );

  const conflicts = conflictEntries.map(e => {
    let yours = 'Modified';
    let theirs = 'Modified';
    const code = `${e.x}${e.y}`;
    if (code === 'UD') {
      yours = 'Modified';
      theirs = 'Deleted';
    } else if (code === 'DU') {
      yours = 'Deleted';
      theirs = 'Modified';
    } else if (code === 'AA') {
      yours = 'Added';
      theirs = 'Added';
    } else if (code === 'DD') {
      yours = 'Deleted';
      theirs = 'Deleted';
    } else if (code === 'AU') {
      yours = 'Added';
      theirs = 'Modified';
    } else if (code === 'UA') {
      yours = 'Modified';
      theirs = 'Added';
    }
    return {
      path: e.path,
      name: path.basename(e.path),
      dir: path.dirname(e.path) === '.' ? '' : path.dirname(e.path),
      yours,
      theirs,
      hasBothModified: yours === 'Modified' && theirs === 'Modified',
    };
  });

  return {
    hasConflicts: conflicts.length > 0,
    isMerging,
    isRebasing: isRebasing || isCherryPicking,
    yoursBranch,
    theirsBranch,
    conflicts,
  };
}

export async function acceptYours(ctx: GitExecContext, filePath: string): Promise<void> {
  const status = await ctx.getStatus();
  const entry = status.find(s => s.path === filePath);
  const code = entry ? `${entry.x}${entry.y}` : '';
  if (code === 'DU' || code === 'DD') {
    await ctx.exec(['rm', '-f', '--', filePath]).catch(() =>
      ctx.exec(['rm', '--cached', '--ignore-unmatch', '--', filePath])
    );
  } else {
    await ctx.exec(['checkout', '--ours', '--', filePath]);
    await ctx.stageFiles([filePath]);
  }
}

export async function acceptTheirs(ctx: GitExecContext, filePath: string): Promise<void> {
  const status = await ctx.getStatus();
  const entry = status.find(s => s.path === filePath);
  const code = entry ? `${entry.x}${entry.y}` : '';
  if (code === 'UD' || code === 'DD') {
    await ctx.exec(['rm', '-f', '--', filePath]).catch(() =>
      ctx.exec(['rm', '--cached', '--ignore-unmatch', '--', filePath])
    );
  } else {
    await ctx.exec(['checkout', '--theirs', '--', filePath]);
    await ctx.stageFiles([filePath]);
  }
}

export async function abortMerge(ctx: GitExecContext): Promise<void> {
  const gitDir = path.join(ctx.cwd, '.git');
  if (fs.existsSync(path.join(gitDir, 'rebase-merge')) || fs.existsSync(path.join(gitDir, 'rebase-apply'))) {
    await ctx.exec(['rebase', '--abort']);
  } else if (fs.existsSync(path.join(gitDir, 'CHERRY_PICK_HEAD'))) {
    await ctx.exec(['cherry-pick', '--abort']);
  } else {
    await ctx.exec(['merge', '--abort']);
  }
}

export async function getMergeMessage(cwd: string): Promise<string> {
  try {
    const mergeMsgPath = path.join(cwd, '.git', 'MERGE_MSG');
    if (fs.existsSync(mergeMsgPath)) {
      return fs.readFileSync(mergeMsgPath, 'utf8').trim();
    }
  } catch {}
  return '';
}
