import { Commit, FileChange, LOG_FORMAT, SEP } from '../gitTypes';
import { LRUCache } from '../../cache';

export interface CommitExecContext {
  cwd: string;
  commitCache: LRUCache<string, Commit>;
  exec(args: string[], maxBuffer?: number, retries?: number): Promise<string>;
  stageFiles(paths: string[]): Promise<void>;
  push(): Promise<string>;
}

export function parseRefs(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw.split(',').map(r => {
    r = r.trim();
    r = r.replace(/^HEAD -> /, '');
    r = r.replace(/^refs\/heads\//, '');
    r = r.replace(/^refs\/tags\//, 'tag: ');
    r = r.replace(/^refs\/remotes\//, '');
    return r;
  });
}

export async function getLog(
  ctx: CommitExecContext,
  options: {
    maxCount?: number;
    skip?: number;
    branch?: string;
    author?: string;
    after?: string;
    before?: string;
    path?: string;
    all?: boolean;
    query?: string;
    order?: 'date' | 'topo';
    firstParent?: boolean;
    noMerges?: boolean;
  } = {}
): Promise<Commit[]> {
  const args = ['log', `--format=${LOG_FORMAT}`];
  if (options.order === 'topo') {
    args.push('--topo-order');
  } else {
    args.push('--date-order');
  }
  if (options.firstParent) {
    args.push('--first-parent');
  }
  if (options.noMerges) {
    args.push('--no-merges');
  }

  // JetBrains IntelliJ Git standard:
  // Instead of '--all' (which exposes internal refs/stash and refs/notes as dangling commits),
  // query HEAD, --branches, --remotes, and --tags explicitly.
  const LOG_ALL = ['HEAD', '--branches', '--remotes', '--tags'];

  if (options.all === true || (!options.branch && options.all !== false)) {
    args.push(...LOG_ALL);
  }
  args.push('--decorate=full');

  if (options.maxCount) args.push(`-n${options.maxCount}`);
  if (options.skip) args.push(`--skip=${options.skip}`);
  if (options.author) args.push(`--author=${options.author}`);
  if (options.after) args.push(`--after=${options.after}`);
  if (options.before) args.push(`--before=${options.before}`);
  if (options.query) {
    args.push(`--grep=${options.query}`);
    args.push('-i');
  }
  if (options.branch) {
    let branchExists = false;
    try {
      await ctx.exec(['rev-parse', '--verify', options.branch]);
      branchExists = true;
    } catch {
      const slashIdx = options.branch.indexOf('/');
      if (slashIdx !== -1) {
        const remote = options.branch.slice(0, slashIdx);
        const leafBranch = options.branch.slice(slashIdx + 1);
        try {
          await ctx.exec(['fetch', remote, `refs/heads/${leafBranch}:refs/remotes/${remote}/${leafBranch}`]);
          await ctx.exec(['rev-parse', '--verify', options.branch]);
          branchExists = true;
        } catch {
          branchExists = false;
        }
      }
    }
    if (branchExists) {
      args.push(options.branch);
    } else if (!args.includes('--branches')) {
      args.push(...LOG_ALL);
    }
  }
  if (options.path) {
    args.push('--');
    args.push(options.path);
  }

  const output = await ctx.exec(args);
  const commits: Commit[] = [];

  for (const chunk of output.split('\0')) {
    if (!chunk.trim()) continue;
    const parts = chunk.split(SEP);
    if (parts.length < 9) continue;

    const commit: Commit = {
      hash: parts[0].trim(),
      abbreviatedHash: parts[1],
      parents: parts[2] ? parts[2].split(' ').filter(Boolean) : [],
      author: parts[3],
      authorEmail: parts[4],
      authorDate: parts[5],
      subject: parts[6],
      body: parts[7],
      refs: parts[8] ? parseRefs(parts[8]) : [],
    };
    ctx.commitCache.set(commit.hash, commit);
    commits.push(commit);
  }

  if (options.query && /^[0-9a-f]{4,40}$/i.test(options.query.trim())) {
    try {
      const hashOut = await ctx.exec(['log', '-n1', `--format=${LOG_FORMAT}`, '--decorate=full', options.query.trim()]);
      for (const chunk of hashOut.split('\0')) {
        if (!chunk.trim()) continue;
        const parts = chunk.split(SEP);
        if (parts.length >= 9) {
          const hashCommit: Commit = {
            hash: parts[0].trim(),
            abbreviatedHash: parts[1],
            parents: parts[2] ? parts[2].split(' ').filter(Boolean) : [],
            author: parts[3],
            authorEmail: parts[4],
            authorDate: parts[5],
            subject: parts[6],
            body: parts[7],
            refs: parts[8] ? parseRefs(parts[8]) : [],
          };
          ctx.commitCache.set(hashCommit.hash, hashCommit);
          if (!commits.some(c => c.hash === hashCommit.hash)) {
            commits.unshift(hashCommit);
          }
        }
      }
    } catch {}
  }

  return commits;
}

export async function getCommitFiles(ctx: CommitExecContext, hash: string): Promise<FileChange[]> {
  const output = await ctx.exec([
    'diff-tree', '--no-commit-id', '-r', '--name-status', '-M', hash,
  ]);
  const changes: FileChange[] = [];
  for (const line of output.split('\n')) {
    if (!line.trim()) continue;
    const parts = line.split('\t');
    const status = parts[0][0];
    if (parts.length === 3) {
      changes.push({ status, path: parts[2], oldPath: parts[1] });
    } else {
      changes.push({ status, path: parts[1] });
    }
  }
  return changes;
}

export async function getAuthorRecentCommitMessages(ctx: CommitExecContext, count = 10): Promise<string[]> {
  try {
    let author = '';
    try {
      author = (await ctx.exec(['config', 'user.email'])).trim();
    } catch {}
    if (!author) {
      try {
        author = (await ctx.exec(['config', 'user.name'])).trim();
      } catch {}
    }

    const isMergeOrMr = (msg: string) => {
      const lower = msg.toLowerCase().trim();
      return (
        lower.startsWith('merge ') ||
        lower.startsWith('merge branch') ||
        lower.startsWith('merge remote-tracking') ||
        lower.startsWith('revert ') ||
        lower.startsWith('resolve conflict') ||
        lower.includes('merge request') ||
        lower.includes('pull request') ||
        lower.startsWith('see merge request') ||
        /^mr\s*!/i.test(lower) ||
        /^pr\s*#/i.test(lower)
      );
    };

    const args = ['log', '-n', '50', '--no-merges', '--pretty=%s'];
    if (author) {
      args.push(`--author=${author}`);
    }

    let out = '';
    try {
      out = await ctx.exec(args);
    } catch {
      out = await ctx.exec(['log', '-n', '30', '--no-merges', '--pretty=%s']);
    }

    const cleanList = out
      .split('\n')
      .map(s => s.trim())
      .filter(s => Boolean(s) && !isMergeOrMr(s));

    if (cleanList.length > 0) {
      return cleanList.slice(0, count);
    }

    const fallbackOut = await ctx.exec(['log', '-n', '30', '--no-merges', '--pretty=%s']);
    return fallbackOut
      .split('\n')
      .map(s => s.trim())
      .filter(s => Boolean(s) && !isMergeOrMr(s))
      .slice(0, count);
  } catch {
    return [];
  }
}

export async function getStashes(ctx: CommitExecContext): Promise<{ index: string; message: string; date: string }[]> {
  try {
    const out = await ctx.exec(['stash', 'list', '--format=%gd\x1e%gs\x1e%cr']);
    const list: { index: string; message: string; date: string }[] = [];
    for (const line of out.split('\n')) {
      if (!line.trim()) continue;
      const [index, message, date] = line.split('\x1e');
      list.push({ index: index?.trim(), message: message?.trim(), date: date?.trim() });
    }
    return list;
  } catch {
    return [];
  }
}

export async function commitFiles(
  ctx: CommitExecContext,
  message: string,
  filesToStage?: string[],
  amend = false
): Promise<void> {
  if (filesToStage && filesToStage.length > 0) {
    await ctx.stageFiles(filesToStage);
  }
  const args = ['commit'];
  if (amend) args.push('--amend');
  args.push('-m', message);
  await ctx.exec(args);
}
