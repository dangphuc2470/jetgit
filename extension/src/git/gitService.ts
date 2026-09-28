import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
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
  ahead?: number;
  behind?: number;
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
  '%x00%H', // hash with null byte commit delimiter
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

  getCwd(): string {
    return this.cwd;
  }

  setCwd(newCwd: string): void {
    this.cwd = newCwd;
    this.commitCache.clear();
  }

  async isGitRepo(): Promise<boolean> {
    try {
      await this.exec(['rev-parse', '--is-inside-work-tree']);
      return true;
    } catch {
      return false;
    }
  }

  async findSubRepos(): Promise<{ name: string; path: string }[]> {
    const results: { name: string; path: string }[] = [];
    try {
      const entries = fs.readdirSync(this.cwd, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
          const subPath = path.join(this.cwd, entry.name);
          const subGit = path.join(subPath, '.git');
          if (fs.existsSync(subGit)) {
            results.push({ name: entry.name, path: subPath });
          }
        }
      }
    } catch {}
    return results;
  }

  async initRepo(): Promise<void> {
    await execFileAsync('git', ['init'], { cwd: this.cwd });
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
    // Get local branches with ahead/behind tracking
    const localOutput = await this.exec([
      'branch', '--format',
      '%(HEAD)%(refname:short)\t%(objectname:short)\t%(upstream:short)\t%(upstream:track,nobracket)',
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
      const [name, hash, upstream, track] = rest.split('\t');
      let ahead = 0;
      let behind = 0;
      if (track) {
        const aheadMatch = track.match(/ahead (\d+)/);
        if (aheadMatch) ahead = parseInt(aheadMatch[1], 10);
        const behindMatch = track.match(/behind (\d+)/);
        if (behindMatch) behind = parseInt(behindMatch[1], 10);
      }
      branches.push({
        name: name.trim(),
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

  async fetchAll(): Promise<string> {
    return this.exec(['fetch', '--all', '--prune']);
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

  async renameBranch(oldName: string, newName: string): Promise<void> {
    await this.exec(['branch', '-m', oldName, newName]);
  }

  async pull(branch?: string): Promise<string> {
    const args = ['pull'];
    if (branch) args.push('origin', branch);
    return this.exec(args);
  }

  async push(branch?: string): Promise<string> {
    const args = ['push'];
    if (branch) args.push('origin', branch);
    return this.exec(args);
  }

  async checkoutAndRebase(branch: string, onto: string): Promise<string> {
    await this.checkout(branch);
    return this.rebase(onto);
  }

  async merge(branch: string): Promise<string> {
    return this.exec(['merge', branch]);
  }

  async rebase(onto: string): Promise<string> {
    return this.exec(['rebase', onto]);
  }

  async getDiffFiles(branch: string): Promise<FileChange[]> {
    const output = await this.exec(['diff', '--name-status', '-M', branch]);
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

  async stageFileContent(filePath: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = execFile('git', ['hash-object', '-w', '--stdin'], { cwd: this.cwd }, (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        const sha = stdout.trim();
        this.exec(['update-index', '--cacheinfo', `100644,${sha},${filePath}`])
          .then(() => resolve())
          .catch(reject);
      });
      proc.stdin?.write(content);
      proc.stdin?.end();
    });
  }

  async unstageFile(path: string): Promise<void> {
    await this.exec(['reset', 'HEAD', '--', path]);
  }

  async unstageFiles(paths: string[]): Promise<void> {
    await this.exec(['reset', 'HEAD', '--', ...paths]);
  }

  async rollbackFiles(paths: string[]): Promise<void> {
    const status = await this.getStatus();
    const untracked = new Set(status.filter(s => s.x === '?' && s.y === '?').map(s => s.path));
    const toClean: string[] = [];
    const toRestore: string[] = [];
    for (const p of paths) {
      if (untracked.has(p)) {
        toClean.push(p);
      } else {
        toRestore.push(p);
      }
    }
    if (toRestore.length > 0) {
      try {
        await this.exec(['checkout', 'HEAD', '--', ...toRestore]);
      } catch {
        await this.exec(['restore', '--staged', '--worktree', '--', ...toRestore]);
      }
    }
    for (const p of toClean) {
      try {
        const fullPath = path.join(this.cwd, p);
        if (fs.existsSync(fullPath)) {
          if (fs.statSync(fullPath).isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(fullPath);
          }
        }
      } catch {}
    }
  }

  async getFileDiff(filePath: string): Promise<string> {
    const status = await this.getStatus();
    const entry = status.find(s => s.path === filePath);
    if (entry && entry.x === '?' && entry.y === '?') {
      try {
        const fullPath = path.join(this.cwd, filePath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        const diffHeader = `--- /dev/null\n+++ b/${filePath}\n@@ -0,0 +1,${lines.length} @@\n`;
        return diffHeader + lines.map(l => `+${l}`).join('\n');
      } catch {
        return '';
      }
    }
    try {
      const diff = await this.exec(['diff', 'HEAD', '--', filePath]);
      if (diff.trim()) return diff;
      return await this.exec(['diff', '--', filePath]);
    } catch {
      return await this.exec(['diff', '--', filePath]);
    }
  }

  async applyHunkPatch(patchContent: string, reverse = false): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = ['apply', '--cached', '--recount', '--whitespace=nowarn'];
      if (reverse) args.push('--reverse');
      args.push('-');
      const proc = execFile('git', args, { cwd: this.cwd }, (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        resolve(stdout);
      });
      proc.stdin?.write(patchContent);
      proc.stdin?.end();
    });
  }

  async getRecentCommitMessages(count = 10): Promise<string[]> {
    try {
      const out = await this.exec(['log', `-n${count}`, '--pretty=%s']);
      return out.split('\n').map(s => s.trim()).filter(Boolean);
    } catch {
      return [];
    }
  }

  async getMergeMessage(): Promise<string> {
    try {
      const mergeMsgPath = path.join(this.cwd, '.git', 'MERGE_MSG');
      if (fs.existsSync(mergeMsgPath)) {
        return fs.readFileSync(mergeMsgPath, 'utf8').trim();
      }
    } catch {}
    return '';
  }

  async getStashes(): Promise<{ index: string; message: string; date: string }[]> {
    try {
      const out = await this.exec(['stash', 'list', '--format=%gd\x1e%gs\x1e%cr']);
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

  async stashSave(message?: string): Promise<string> {
    const args = ['stash', 'push'];
    if (message) args.push('-m', message);
    return this.exec(args);
  }

  async stashPop(index = 'stash@{0}'): Promise<string> {
    return this.exec(['stash', 'pop', index]);
  }

  async stashApply(index = 'stash@{0}'): Promise<string> {
    return this.exec(['stash', 'apply', index]);
  }

  async stashDrop(index = 'stash@{0}'): Promise<string> {
    return this.exec(['stash', 'drop', index]);
  }

  async commitFiles(message: string, filesToStage?: string[], amend = false): Promise<void> {
    if (filesToStage && filesToStage.length > 0) {
      await this.stageFiles(filesToStage);
    }
    const args = ['commit'];
    if (amend) args.push('--amend');
    args.push('-m', message);
    await this.exec(args);
  }

  async commitAndPush(message: string, filesToStage?: string[], amend = false): Promise<string> {
    await this.commitFiles(message, filesToStage, amend);
    return await this.push();
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
