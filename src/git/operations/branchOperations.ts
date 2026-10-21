import * as path from 'path';
import { BranchInfo, TagInfo, PushInfo } from '../gitTypes';

export interface BranchExecContext {
  cwd: string;
  exec(args: string[], maxBuffer?: number, retries?: number): Promise<string>;
  getCurrentBranch(): Promise<string>;
  getRepoRoot(): Promise<string>;
  getRemotes(): Promise<string[]>;
  getDefaultRemote(branch?: string): Promise<string>;
}

export async function getBranches(ctx: BranchExecContext): Promise<BranchInfo[]> {
  const localOutput = await ctx.exec([
    'branch', '--format',
    '%(HEAD)%(refname:short)\t%(objectname:short)\t%(upstream:short)\t%(upstream:track,nobracket)',
  ]);
  const remoteOutput = await ctx.exec([
    'branch', '-r', '--format',
    '%(refname:short)\t%(objectname:short)',
  ]);

  const branches: BranchInfo[] = [];

  for (const line of localOutput.split('\n')) {
    if (!line.trim()) continue;
    const current = line[0] === '*';
    const rest = line.slice(1);
    const [name, hash, upstream, track] = rest.split('\t');
    let ahead = 0;
    let behind = 0;
    if (track) {
      const aheadMatch = track.match(/ahead (\d+)/);
      if (aheadMatch) ahead = parseInt(aheadMatch[1], 10);
      const behindMatch = track.match(/behind (\d+)/);
      if (behindMatch) behind = parseInt(behindMatch[1], 10);
    }
    const trimmedName = name.trim();
    if (trimmedName.startsWith('(') || trimmedName.startsWith('HEAD detached')) {
      continue;
    }
    branches.push({
      name: trimmedName,
      current,
      remote: undefined,
      upstream: upstream || undefined,
      hash: hash.trim(),
      ahead: ahead || undefined,
      behind: behind || undefined,
    });
  }

  for (const line of remoteOutput.split('\n')) {
    if (!line.trim()) continue;
    if (line.includes(' -> ')) continue;
    const [name, hash] = line.split('\t');
    const trimmedName = name.trim();
    if (!trimmedName.includes('/') || trimmedName.endsWith('/HEAD')) {
      continue;
    }
    const slashIdx = trimmedName.indexOf('/');
    const remoteName = slashIdx !== -1 ? trimmedName.slice(0, slashIdx) : 'origin';
    branches.push({
      name: trimmedName,
      current: false,
      remote: remoteName,
      upstream: undefined,
      hash: hash.trim(),
    });
  }

  return branches;
}

export async function getTags(ctx: BranchExecContext): Promise<TagInfo[]> {
  const output = await ctx.exec([
    'tag', '-l', '--format', '%(refname:short)\t%(objectname:short)',
  ]);
  const tags: TagInfo[] = [];
  for (const line of output.split('\n')) {
    if (!line.trim()) continue;
    const [name, hash] = line.split('\t');
    tags.push({ name, hash });
  }
  return tags;
}

export async function getCurrentBranch(ctx: BranchExecContext): Promise<string> {
  const output = await ctx.exec(['rev-parse', '--abbrev-ref', 'HEAD']);
  const branch = output.trim();
  if (branch === 'HEAD') {
    try {
      const desc = await ctx.exec(['describe', '--tags', '--exact-match', 'HEAD']);
      return `HEAD (detached at ${desc.trim()})`;
    } catch {
      const hash = await ctx.exec(['rev-parse', '--short', 'HEAD']);
      return `HEAD (detached at ${hash.trim()})`;
    }
  }
  return branch;
}

export async function checkout(ctx: BranchExecContext, ref: string): Promise<void> {
  let isRemoteBranch = false;
  let targetRemote = '';
  let localBranchName = '';

  try {
    const remotes = await ctx.getRemotes();
    for (const remote of remotes) {
      if (ref.startsWith(remote + '/')) {
        isRemoteBranch = true;
        targetRemote = remote;
        localBranchName = ref.slice(remote.length + 1);
        break;
      }
    }
  } catch {}

  if (isRemoteBranch && targetRemote && localBranchName) {
    try {
      await ctx.exec(['fetch', targetRemote, `refs/heads/${localBranchName}:refs/remotes/${targetRemote}/${localBranchName}`]);
    } catch {}

    const branchCheck = await ctx.exec(['branch', '--list', localBranchName]);
    if (branchCheck.trim()) {
      await ctx.exec(['checkout', localBranchName]);
      const upstream = await ctx.exec(['rev-parse', '--abbrev-ref', `${localBranchName}@{upstream}`]).catch(() => '');
      if (!upstream.trim()) {
        await ctx.exec(['branch', '--set-upstream-to', ref, localBranchName]).catch(() => {});
      }
    } else {
      await ctx.exec(['checkout', '-b', localBranchName, '--track', ref]);
    }
    return;
  }

  await ctx.exec(['checkout', ref]);
}

export async function createBranch(
  ctx: BranchExecContext,
  name: string,
  startPoint?: string,
  checkout = true,
  force = false
): Promise<void> {
  if (checkout) {
    const args = ['checkout', force ? '-B' : '-b', name];
    if (startPoint) args.push(startPoint);
    await ctx.exec(args);
  } else {
    const args = ['branch'];
    if (force) args.push('-f');
    args.push(name);
    if (startPoint) args.push(startPoint);
    await ctx.exec(args);
  }
}

export async function getRemotes(ctx: BranchExecContext): Promise<string[]> {
  try {
    const out = await ctx.exec(['remote']);
    return out.split('\n').map(s => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export async function getDefaultRemote(ctx: BranchExecContext, branch?: string): Promise<string> {
  try {
    const curBranch = branch || await ctx.getCurrentBranch().catch(() => '');
    if (curBranch) {
      try {
        const r = await ctx.exec(['config', `branch.${curBranch}.remote`]);
        if (r.trim()) return r.trim();
      } catch {}
    }
    const remotes = await getRemotes(ctx);
    if (remotes.includes('origin')) return 'origin';
    if (remotes.length > 0) return remotes[0];
  } catch {}
  return 'origin';
}

export async function getRemoteUrl(ctx: BranchExecContext): Promise<string> {
  try {
    const remote = await getDefaultRemote(ctx);
    const out = await ctx.exec(['remote', 'get-url', remote]);
    return out.trim();
  } catch {
    return '';
  }
}

export async function pull(ctx: BranchExecContext, branch?: string): Promise<string> {
  const curBranch = await ctx.getCurrentBranch();
  if (!branch || branch === curBranch) {
    return ctx.exec(['pull']);
  }

  try {
    const remote = await getDefaultRemote(ctx, branch);

    let targetBranch = branch;
    if (branch.startsWith(remote + '/')) {
      targetBranch = branch.slice(remote.length + 1);
    }

    const branchCheck = await ctx.exec(['branch', '--list', targetBranch]);
    if (branchCheck.trim()) {
      const out = await ctx.exec(['fetch', remote, `${targetBranch}:${targetBranch}`]);
      return out || `Updated branch '${targetBranch}' successfully.`;
    } else {
      const out = await ctx.exec(['fetch', remote, targetBranch]);
      return out || `Fetched '${targetBranch}' successfully.`;
    }
  } catch (err: any) {
    if (err.message && (err.message.includes('non-fast-forward') || err.message.includes('rejected'))) {
      throw new Error(`Cannot fast-forward branch '${branch}' because local commits diverged. Please checkout '${branch}' to merge or rebase.`);
    }
    throw err;
  }
}

export async function getPushInfo(ctx: BranchExecContext, targetBranch?: string): Promise<PushInfo> {
  const currentBranch = targetBranch || await ctx.getCurrentBranch();
  const remote = await getDefaultRemote(ctx, currentBranch);
  const remoteBranch = currentBranch;
  const repoRoot = await ctx.getRepoRoot().catch(() => ctx.cwd);
  const repoName = path.basename(repoRoot);

  let isNew = true;
  try {
    await ctx.exec(['rev-parse', '--verify', `refs/remotes/${remote}/${currentBranch}`]);
    isNew = false;
  } catch {
    isNew = true;
  }

  let logArgs: string[] = [];
  if (!isNew) {
    logArgs = ['log', `${remote}/${currentBranch}..${currentBranch}`, '--format=%H%x00%h%x00%an%x00%ad%x00%s'];
  } else {
    logArgs = ['log', currentBranch, `--not`, `--remotes=${remote}`, '--format=%H%x00%h%x00%an%x00%ad%x00%s'];
  }

  let rawLog = '';
  try {
    rawLog = await ctx.exec(logArgs);
  } catch {
    try {
      rawLog = await ctx.exec(['log', '-n', '10', '--format=%H%x00%h%x00%an%x00%ad%x00%s']);
    } catch {}
  }

  const lines = rawLog.split('\n').filter(l => l.trim());
  const commits: PushInfo['commits'] = [];
  const fileMap = new Map<string, { status: string; path: string; name: string; dir: string }>();

  for (const line of lines) {
    const parts = line.split('\0');
    if (parts.length < 5) continue;
    const [hash, shortHash, author, date, message] = parts;

    let commitFiles: Array<{ status: string; path: string; name: string; dir: string }> = [];
    try {
      const diffOut = await ctx.exec(['diff-tree', '--no-commit-id', '--name-status', '-r', hash]);
      commitFiles = diffOut.split('\n').filter(l => l.trim()).map(dl => {
        const tokens = dl.trim().split(/\s+/);
        const status = tokens[0] || 'M';
        const p = tokens.length > 2 ? tokens[2] : (tokens[1] || '');
        const dir = path.dirname(p) === '.' ? '' : path.dirname(p);
        const fObj = {
          status: status.charAt(0),
          path: p,
          name: path.basename(p),
          dir,
        };
        if (!fileMap.has(p)) {
          fileMap.set(p, fObj);
        }
        return fObj;
      });
    } catch {}

    commits.push({
      hash,
      shortHash,
      message,
      author,
      date,
      files: commitFiles,
    });
  }

  const totalFiles = Array.from(fileMap.values());
  const remotes = await getRemotes(ctx);

  return {
    currentBranch,
    remote,
    remoteBranch,
    remotes: remotes.length > 0 ? remotes : [remote],
    repoName,
    isNew,
    commits,
    totalFiles,
  };
}

export async function push(
  ctx: BranchExecContext,
  branch?: string,
  force = false,
  setUpstream = false,
  remoteName?: string,
  tags = false,
  targetBranch?: string
): Promise<string> {
  const curBranch = branch || await ctx.getCurrentBranch();
  const remote = remoteName || await getDefaultRemote(ctx, curBranch);
  const args = ['push'];
  if (force) args.push('--force-with-lease');
  if (tags) args.push('--tags');

  let hasUpstream = false;
  try {
    const upstream = await ctx.exec(['rev-parse', '--abbrev-ref', `${curBranch}@{u}`]);
    if (upstream.trim()) hasUpstream = true;
  } catch {}

  const remoteRef = targetBranch && targetBranch.trim() ? targetBranch.trim() : curBranch;
  const isCustomTarget = remoteRef !== curBranch;
  const refspec = isCustomTarget ? `${curBranch}:${remoteRef}` : curBranch;

  if (setUpstream || !hasUpstream || isCustomTarget) {
    args.push('-u', remote, refspec);
  } else {
    args.push(remote, refspec);
  }

  return ctx.exec(args);
}
