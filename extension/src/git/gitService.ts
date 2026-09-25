import { execFile } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { LRUCache } from '../cache';

const execFileAsync = promisify(execFile);

export interface Commit {
  hash: string;
  abbreviatedHash: string;
  parents: string[];
  author: string;
  authorEmail: string;
  authorDate: string;
  subject: string;
  body: string;
  refs: string[];
}

export interface FileChange {
  status: string; // 'A' | 'M' | 'D' | 'R' | 'C'
  path: string;
  oldPath?: string;
}

export interface BranchInfo {
  name: string;
  current: boolean;
  remote?: string;
  upstream?: string;
  hash: string;
}

export interface TagInfo {
  name: string;
  hash: string;
}

export interface StatusEntry {
  x: string; // index status
  y: string; // worktree status
  path: string;
  origPath?: string;
}

// Field separator unlikely to appear in commit messages
const SEP = '\x1e';
const LOG_FORMAT = [
  '%H',   // hash
  '%h',   // abbreviated hash
  '%P',   // parent hashes
  '%an',  // author name
  '%ae',  // author email
  '%aI',  // author date ISO
  '%s',   // subject
  '%b',   // body
  '%D',   // ref names
].join(SEP);

export class GitService {
  private commitCache = new LRUCache<string, Commit>(5000);
  private cwd: string;

  constructor(workspaceRoot: string) {
    this.cwd = workspaceRoot;
  }

  private async exec(args: string[], maxBuffer = 10 * 1024 * 1024): Promise<string> {
    const { stdout } = await execFileAsync('git', args, {
      cwd: this.cwd,
      maxBuffer,
    });
    return stdout;
  }

  async getRepoRoot(): Promise<string> {
    const out = await this.exec(['rev-parse', '--show-toplevel']);
    return out.trim();
  }

  async getLog(options: {
    maxCount?: number;
    skip?: number;
    branch?: string;
    author?: string;
    after?: string;
    before?: string;
    path?: string;
    all?: boolean;
  } = {}): Promise<Commit[]> {
    const args = ['log', `--format=${LOG_FORMAT}`];

    if (options.all !== false) {
      args.push('--all');
    }
    args.push('--decorate=full');

    if (options.maxCount) args.push(`-n${options.maxCount}`);
    if (options.skip) args.push(`--skip=${options.skip}`);
    if (options.author) args.push(`--author=${options.author}`);
    if (options.after) args.push(`--after=${options.after}`);
    if (options.before) args.push(`--before=${options.before}`);
    if (options.branch) args.push(options.branch);
    if (options.path) {
      args.push('--');
      args.push(options.path);
    }

    const output = await this.exec(args);
    const commits: Commit[] = [];

    for (const line of output.split('\n')) {
      if (!line.trim()) continue;
      const parts = line.split(SEP);
      if (parts.length < 9) continue;

      const commit: Commit = {
        hash: parts[0],
        abbreviatedHash: parts[1],
        parents: parts[2] ? parts[2].split(' ') : [],
        author: parts[3],
        authorEmail: parts[4],
        authorDate: parts[5],
        subject: parts[6],
        body: parts[7],
        refs: parts[8] ? parseRefs(parts[8]) : [],
      };
      this.commitCache.set(commit.hash, commit);
      commits.push(commit);
    }

    return commits;
  }

  async getCommitFiles(hash: string): Promise<FileChange[]> {
    const output = await this.exec([
      'diff-tree', '--no-commit-id', '-r', '--name-status', '-M', hash,
    ]);
    const changes: FileChange[] = [];
    for (const line of output.split('\n')) {
      if (!line.trim()) continue;
      const parts = line.split('\t');
      const status = parts[0][0]; // First char only (R100 -> R)
      if (parts.length === 3) {
        // Rename
        changes.push({ status, path: parts[2], oldPath: parts[1] });
      } else {
        changes.push({ status, path: parts[1] });
      }
    }
    return changes;
  }

  async getBranches(): Promise<BranchInfo[]> {
    // Get local branches
    const localOutput = await this.exec([
      'branch', '--format',
      '%(HEAD)%(refname:short)\t%(objectname:short)\t%(upstream:short)',
    ]);
    // Get remote branches
    const remoteOutput = await this.exec([
      'branch', '-r', '--format',
      '%(refname:short)\t%(objectname:short)',
    ]);

    const branches: BranchInfo[] = [];

    for (const line of localOutput.split('\n')) {
      if (!line.trim()) continue;
      const current = line[0] === '*';
      const rest = line.slice(1);
      const [name, hash, upstream] = rest.split('\t');
      branches.push({
        name: name.trim(),
        current,
        remote: undefined,
        upstream: upstream || undefined,
        hash: hash.trim(),
      });
    }

    for (const line of remoteOutput.split('\n')) {
      if (!line.trim()) continue;
      if (line.includes(' -> ')) continue; // Skip HEAD pointers like origin/HEAD -> origin/main
      const [name, hash] = line.split('\t');
      const trimmedName = name.trim();
      // Extract remote name (first segment before /)
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

  async getTags(): Promise<TagInfo[]> {
    const output = await this.exec([
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

  async getCurrentBranch(): Promise<string> {
    const output = await this.exec(['rev-parse', '--abbrev-ref', 'HEAD']);
    return output.trim();
  }

  async checkout(ref: string): Promise<void> {
    await this.exec(['checkout', ref]);
  }

  async createBranch(name: string, startPoint?: string): Promise<void> {
    const args = ['checkout', '-b', name];
    if (startPoint) args.push(startPoint);
    await this.exec(args);
  }

  async deleteBranch(name: string, force = false): Promise<void> {
    await this.exec(['branch', force ? '-D' : '-d', name]);
  }

  async merge(branch: string): Promise<string> {
    return this.exec(['merge', branch]);
  }

  async rebase(onto: string): Promise<string> {
    return this.exec(['rebase', onto]);
  }

  async getStatus(): Promise<StatusEntry[]> {
    const output = await this.exec(['status', '--porcelain=v1', '-uall']);
    const entries: StatusEntry[] = [];
    for (const line of output.split('\n')) {
      if (!line) continue;
      const x = line[0];
      const y = line[1];
      const rest = line.slice(3);
      const arrowIdx = rest.indexOf(' -> ');
      if (arrowIdx !== -1) {
        entries.push({
          x, y,
          origPath: rest.slice(0, arrowIdx),
          path: rest.slice(arrowIdx + 4),
        });
      } else {
        entries.push({ x, y, path: rest });
      }
    }
    return entries;
  }

  async getUnmergedFiles(): Promise<string[]> {
    const output = await this.exec(['diff', '--name-only', '--diff-filter=U']);
    return output.split('\n').filter(l => l.trim());
  }

  async stageFile(path: string): Promise<void> {
    await this.exec(['add', path]);
  }

  async stageFiles(paths: string[]): Promise<void> {
    await this.exec(['add', '--', ...paths]);
  }

  async commit(message: string): Promise<void> {
    await this.exec(['commit', '-m', message]);
  }

  async showFileAtCommit(hash: string, filePath: string): Promise<string> {
    return this.exec(['show', `${hash}:${filePath}`]);
  }

  async diff(ref1: string, ref2: string): Promise<string> {
    return this.exec(['diff', ref1, ref2]);
  }

  async getLogRange(base: string, head = 'HEAD'): Promise<Commit[]> {
    return this.getLog({ all: false, branch: `${base}..${head}` });
  }

  clearCache(): void {
    this.commitCache.clear();
  }
}

function parseRefs(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw.split(',').map(r => {
    r = r.trim();
    // Strip decorators like HEAD -> , refs/heads/, refs/tags/, refs/remotes/
    r = r.replace(/^HEAD -> /, '');
    r = r.replace(/^refs\/heads\//, '');
    r = r.replace(/^refs\/tags\//, 'tag: ');
    r = r.replace(/^refs\/remotes\//, '');
    return r;
  });
}
