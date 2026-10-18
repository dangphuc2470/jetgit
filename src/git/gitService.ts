import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { LRUCache } from '../cache';

import {
  Commit,
  FileChange,
  BranchInfo,
  TagInfo,
  StatusEntry,
  ConflictInfo,
  PushInfo,
  SEP,
  LOG_FORMAT,
} from './gitTypes';

import * as conflictOps from './operations/conflictOperations';
import * as branchOps from './operations/branchOperations';
import * as stagingOps from './operations/stagingOperations';
import * as commitOps from './operations/commitOperations';

export {
  Commit,
  FileChange,
  BranchInfo,
  TagInfo,
  StatusEntry,
  ConflictInfo,
  PushInfo,
  SEP,
  LOG_FORMAT,
};

const execFileAsync = promisify(execFile);

export class GitService {
  private commitCache = new LRUCache<string, Commit>(5000);
  private discoveredRemoteBranches = new Map<string, BranchInfo[]>();
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
    this.discoveredRemoteBranches.clear();
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

  async exec(args: string[], maxBuffer = 10 * 1024 * 1024, retries = 5, timeout = 0): Promise<string> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { stdout } = await execFileAsync('git', args, {
          cwd: this.cwd,
          maxBuffer,
          timeout: timeout > 0 ? timeout : undefined,
          env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
        });
        return stdout;
      } catch (err: any) {
        const isLockError = err?.message && (
          err.message.includes('index.lock') ||
          (err.message.includes('Unable to create') && err.message.includes('.lock'))
        );
        if (isLockError && attempt < retries - 1) {
          try {
            const dotGit = path.join(this.cwd, '.git');
            let lockPath = path.join(dotGit, 'index.lock');
            if (fs.existsSync(dotGit) && fs.statSync(dotGit).isFile()) {
              const content = fs.readFileSync(dotGit, 'utf8').trim();
              if (content.startsWith('gitdir:')) {
                const relOrAbs = content.replace(/^gitdir:\s*/, '');
                const actualGitDir = path.isAbsolute(relOrAbs) ? relOrAbs : path.resolve(this.cwd, relOrAbs);
                lockPath = path.join(actualGitDir, 'index.lock');
              }
            }
            if (fs.existsSync(lockPath)) {
              const stat = fs.statSync(lockPath);
              if (Date.now() - stat.mtimeMs > 5000) {
                fs.unlinkSync(lockPath);
                continue;
              }
            }
          } catch {}
          await new Promise(res => setTimeout(res, 200 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }
    throw new Error('Git command failed after retries');
  }

  async getRepoRoot(): Promise<string> {
    const out = await this.exec(['rev-parse', '--show-toplevel']);
    return out.trim();
  }

  async getGitDir(): Promise<string> {
    try {
      const out = await this.exec(['rev-parse', '--git-dir']);
      const dir = out.trim();
      if (path.isAbsolute(dir)) return dir;
      const root = await this.getRepoRoot();
      return path.resolve(root, dir);
    } catch {
      const root = await this.getRepoRoot();
      return path.join(root, '.git');
    }
  }

  async removeIndexLock(): Promise<boolean> {
    try {
      const gitDir = await this.getGitDir();
      const lockPath = path.join(gitDir, 'index.lock');
      if (fs.existsSync(lockPath)) {
        await fs.promises.unlink(lockPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async abortOperation(op: 'merge' | 'rebase' | 'cherry-pick' | 'revert'): Promise<void> {
    await this.exec([op, '--abort']);
  }

  async getCurrentUser(): Promise<{ name: string; email: string }> {
    let name = '';
    let email = '';
    try {
      name = (await this.exec(['config', 'user.name'])).trim();
    } catch {}
    try {
      email = (await this.exec(['config', 'user.email'])).trim();
    } catch {}
    return { name, email };
  }

  // --- Log & Commit Operations ---

  async getLog(options: {
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
  } = {}): Promise<Commit[]> {
    return commitOps.getLog(this.asCommitContext(), options);
  }

  async getCommitFiles(hash: string): Promise<FileChange[]> {
    return commitOps.getCommitFiles(this.asCommitContext(), hash);
  }

  async getAuthorRecentCommitMessages(count = 10): Promise<string[]> {
    return commitOps.getAuthorRecentCommitMessages(this.asCommitContext(), count);
  }

  async getRecentCommitMessages(count = 10): Promise<string[]> {
    try {
      const out = await this.exec(['log', `-n${count}`, '--pretty=%s']);
      return out.split('\n').map(s => s.trim()).filter(Boolean);
    } catch {
      return [];
    }
  }

  async commitFiles(message: string, filesToStage?: string[], amend = false): Promise<void> {
    return commitOps.commitFiles(this.asCommitContext(), message, filesToStage, amend);
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

  // --- Branch & Remote Operations ---

  async getBranches(): Promise<BranchInfo[]> {
    const localAndRemote = await branchOps.getBranches(this.asBranchContext());
    const existingNames = new Set(localAndRemote.map(b => b.name));

    const merged = [...localAndRemote];
    for (const [_, branches] of this.discoveredRemoteBranches) {
      for (const b of branches) {
        if (!existingNames.has(b.name)) {
          existingNames.add(b.name);
          merged.push(b);
        }
      }
    }
    return merged;
  }

  async refreshRemoteBranchNames(): Promise<{ remote: string; count: number }[]> {
    const remotes = await this.getRemotes();
    if (!remotes || remotes.length === 0) return [];

    const results: { remote: string; count: number }[] = [];

    await Promise.allSettled(
      remotes.map(async (r) => {
        try {
          const check = await this.isRemoteReachable(r, 2500);
          if (!check.reachable) return;

          // ls-remote --heads is ultra-fast (1-2s) and only fetches ref names
          const out = await this.exec(['ls-remote', '--heads', r], 2 * 1024 * 1024, 1, 10000);
          const list: BranchInfo[] = [];
          for (const line of out.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            const [hash, ref] = trimmed.split(/\s+/);
            if (!ref || !ref.startsWith('refs/heads/')) continue;
            const branchName = ref.replace(/^refs\/heads\//, '');
            list.push({
              name: `${r}/${branchName}`,
              current: false,
              remote: r,
              hash: hash || '',
            });
          }
          this.discoveredRemoteBranches.set(r, list);
          results.push({ remote: r, count: list.length });
        } catch {}
      })
    );

    return results;
  }

  async fetchSingleBranch(remote: string, branchName: string): Promise<string> {
    return this.exec([
      'fetch', remote,
      `refs/heads/${branchName}:refs/remotes/${remote}/${branchName}`
    ], 100 * 1024 * 1024, 1, 300000);
  }

  async getTags(): Promise<TagInfo[]> {
    return branchOps.getTags(this.asBranchContext());
  }

  async getCurrentBranch(): Promise<string> {
    return branchOps.getCurrentBranch(this.asBranchContext());
  }

  async checkout(ref: string): Promise<void> {
    return branchOps.checkout(this.asBranchContext(), ref);
  }

  async createBranch(name: string, startPoint?: string, checkout = true, force = false): Promise<void> {
    return branchOps.createBranch(this.asBranchContext(), name, startPoint, checkout, force);
  }

  async deleteBranch(name: string, force = false): Promise<void> {
    await this.exec(['branch', force ? '-D' : '-d', name]);
  }

  async renameBranch(oldName: string, newName: string): Promise<void> {
    await this.exec(['branch', '-m', oldName, newName]);
  }

  async getRemotes(): Promise<string[]> {
    return branchOps.getRemotes(this.asBranchContext());
  }

  async getDefaultRemote(branch?: string): Promise<string> {
    return branchOps.getDefaultRemote(this.asBranchContext(), branch);
  }

  async getRemoteUrl(remoteName?: string): Promise<string> {
    if (remoteName) {
      try {
        const url = await this.exec(['remote', 'get-url', remoteName]);
        return url.trim();
      } catch {
        return '';
      }
    }
    return branchOps.getRemoteUrl(this.asBranchContext());
  }

  async pull(branch?: string): Promise<string> {
    return branchOps.pull(this.asBranchContext(), branch);
  }

  async getPushInfo(targetBranch?: string): Promise<PushInfo> {
    return branchOps.getPushInfo(this.asBranchContext(), targetBranch);
  }

  async push(
    branch?: string,
    force = false,
    setUpstream = false,
    remoteName?: string,
    tags = false,
    targetBranch?: string
  ): Promise<string> {
    return branchOps.push(this.asBranchContext(), branch, force, setUpstream, remoteName, tags, targetBranch);
  }

  async isRemoteReachable(remoteName: string, timeoutMs = 3500): Promise<{ reachable: boolean; latency: number }> {
    const start = Date.now();
    try {
      const remoteUrl = await this.getRemoteUrl(remoteName);
      if (!remoteUrl) return { reachable: false, latency: 999999 };

      if (remoteUrl.startsWith('http://') || remoteUrl.startsWith('https://')) {
        try {
          const parsed = new URL(remoteUrl);
          const targetOrigin = `${parsed.protocol}//${parsed.host}`;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeoutMs);
          try {
            await fetch(targetOrigin, { method: 'HEAD', signal: controller.signal });
            clearTimeout(timer);
            return { reachable: true, latency: Date.now() - start };
          } catch {
            clearTimeout(timer);
            try {
              const c2 = new AbortController();
              const t2 = setTimeout(() => c2.abort(), 1500);
              await fetch(targetOrigin, { method: 'GET', signal: c2.signal });
              clearTimeout(t2);
              return { reachable: true, latency: Date.now() - start };
            } catch {
              return { reachable: false, latency: 999999 };
            }
          }
        } catch {
          return { reachable: false, latency: 999999 };
        }
      }

      await execFileAsync('git', [
        '-c', 'http.timeout=3',
        '-c', 'ssh.connectTimeout=3',
        'ls-remote', '--heads', remoteName, 'HEAD'
      ], {
        cwd: this.cwd,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
        timeout: timeoutMs,
      });
      return { reachable: true, latency: Date.now() - start };
    } catch {
      return { reachable: false, latency: 999999 };
    }
  }

  async smartFetchAll(
    onRemoteSuccess?: (remote: string) => void,
    onProgress?: (status: string) => void
  ): Promise<{
    successful: string[];
    failed: string[];
    skipped: string[];
    needsAuth: { remote: string; url: string; host: string }[];
  }> {
    const remotes = await this.getRemotes();
    if (!remotes || remotes.length === 0) {
      return { successful: [], failed: [], skipped: [], needsAuth: [] };
    }

    const needsAuth: { remote: string; url: string; host: string }[] = [];
    const isAuthError = (msg: string) =>
      /terminal prompts disabled|could not read Username|Authentication failed|HTTP 401|Access denied|not authorized/i.test(msg);

    if (remotes.length === 1) {
      const r = remotes[0];
      try {
        onProgress?.(`Fetching '${r}'...`);
        await this.exec(['fetch', r, '--prune'], 10 * 1024 * 1024, 1, 90000);
        onRemoteSuccess?.(r);
        return { successful: [r], failed: [], skipped: [], needsAuth: [] };
      } catch (err: any) {
        const msg = err?.message || '';
        if (isAuthError(msg)) {
          const url = await this.getRemoteUrl(r);
          let host = r;
          try { if (url) host = new URL(url).host; } catch {}
          needsAuth.push({ remote: r, url, host });
        }
        return { successful: [], failed: [r], skipped: [], needsAuth };
      }
    }

    onProgress?.('Checking remotes connectivity...');
    const checks = await Promise.allSettled(
      remotes.map(async r => {
        const res = await this.isRemoteReachable(r, 2500);
        return { remote: r, reachable: res.reachable, latency: res.latency };
      })
    );

    const probeResults: { remote: string; reachable: boolean; latency: number }[] = [];
    for (let i = 0; i < remotes.length; i++) {
      const c = checks[i];
      if (c.status === 'fulfilled') {
        probeResults.push(c.value);
      } else {
        probeResults.push({ remote: remotes[i], reachable: false, latency: 999999 });
      }
    }

    // Sort: reachable first, then lowest latency first
    probeResults.sort((a, b) => {
      if (a.reachable && !b.reachable) return -1;
      if (!a.reachable && b.reachable) return 1;
      return a.latency - b.latency;
    });

    const successful: string[] = [];
    const failed: string[] = [];
    const skipped: string[] = [];

    for (const item of probeResults) {
      if (!item.reachable) {
        skipped.push(item.remote);
        continue;
      }
      try {
        onProgress?.(`Fetching '${item.remote}'...`);
        await this.exec(['fetch', item.remote, '--prune'], 10 * 1024 * 1024, 1, 90000);
        successful.push(item.remote);
        // Notify immediately so UI reloads right after each remote succeeds
        onRemoteSuccess?.(item.remote);
      } catch (err: any) {
        const msg = err?.message || '';
        if (isAuthError(msg)) {
          const url = await this.getRemoteUrl(item.remote);
          let host = item.remote;
          try { if (url) host = new URL(url).host; } catch {}
          needsAuth.push({ remote: item.remote, url, host });
        }
        failed.push(item.remote);
      }
    }

    return { successful, failed, skipped, needsAuth };
  }

  async fetchAll(
    onRemoteSuccess?: (remote: string) => void
  ): Promise<{
    successful: string[];
    failed: string[];
    skipped: string[];
    needsAuth: { remote: string; url: string; host: string }[];
  }> {
    return this.smartFetchAll(onRemoteSuccess);
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

  async cherryPick(hash: string): Promise<string> {
    return this.exec(['cherry-pick', hash]);
  }

  async revertCommit(hash: string): Promise<string> {
    return this.exec(['revert', '--no-edit', hash]);
  }

  async reset(hash: string, mode: 'soft' | 'mixed' | 'hard' = 'mixed'): Promise<string> {
    return this.exec(['reset', `--${mode}`, hash]);
  }

  async createTag(name: string, hash?: string): Promise<void> {
    const args = ['tag', name];
    if (hash) args.push(hash);
    await this.exec(args);
  }

  async deleteTag(name: string): Promise<void> {
    await this.exec(['tag', '-d', name]);
  }

  async createPatch(hash: string): Promise<string> {
    return this.exec(['format-patch', '-1', hash, '--stdout']);
  }

  // --- Staging & Worktree Operations ---

  async getStatus(): Promise<StatusEntry[]> {
    return stagingOps.getStatus(this.asStagingContext());
  }

  async stageFile(filePath: string): Promise<void> {
    await this.stageFiles([filePath]);
  }

  async stageFiles(paths: string[]): Promise<void> {
    return stagingOps.stageFiles(this.asStagingContext(), paths);
  }

  async stageFileContent(filePath: string, content: string): Promise<void> {
    return stagingOps.stageFileContent(this.asStagingContext(), filePath, content);
  }

  async unstageFile(filePath: string): Promise<void> {
    await this.unstageFiles([filePath]);
  }

  async unstageFiles(paths: string[]): Promise<void> {
    return stagingOps.unstageFiles(this.asStagingContext(), paths);
  }

  async rollbackFiles(paths: string[]): Promise<void> {
    return stagingOps.rollbackFiles(this.asStagingContext(), paths);
  }

  async getFileDiff(filePath: string): Promise<string> {
    return stagingOps.getFileDiff(this.asStagingContext(), filePath);
  }

  async applyHunkPatch(patchContent: string, reverse = false): Promise<string> {
    return stagingOps.applyHunkPatch(this.asStagingContext(), patchContent, reverse);
  }

  async getStagedDiff(): Promise<string> {
    try {
      return await this.exec(['diff', '--cached']);
    } catch {
      return '';
    }
  }

  async setAssumeUnchanged(paths: string[], assume: boolean): Promise<void> {
    if (!paths || paths.length === 0) return;
    const flag = assume ? '--assume-unchanged' : '--no-assume-unchanged';
    try {
      await this.exec(['update-index', flag, '--', ...paths]);
    } catch {}
  }

  async unmaskAllAssumeUnchanged(): Promise<void> {
    try {
      const out = await this.exec(['ls-files', '-v']);
      const masked: string[] = [];
      for (const line of out.split('\n')) {
        if (/^[a-z]\s+/.test(line)) {
          const p = line.replace(/^[a-z]\s+/, '').trim();
          if (p) masked.push(p);
        }
      }
      if (masked.length > 0) {
        await this.exec(['update-index', '--no-assume-unchanged', '--', ...masked]);
      }
    } catch {}
  }

  // --- Conflict Operations ---

  async getUnmergedFiles(): Promise<string[]> {
    return conflictOps.getUnmergedFiles(this.asConflictContext());
  }

  async getConflictInfo(): Promise<ConflictInfo> {
    return conflictOps.getConflictInfo(this.asConflictContext());
  }

  async acceptYours(filePath: string): Promise<void> {
    return conflictOps.acceptYours(this.asConflictContext(), filePath);
  }

  async acceptTheirs(filePath: string): Promise<void> {
    return conflictOps.acceptTheirs(this.asConflictContext(), filePath);
  }

  async abortMerge(): Promise<void> {
    return conflictOps.abortMerge(this.asConflictContext());
  }

  async getMergeMessage(): Promise<string> {
    return conflictOps.getMergeMessage(this.cwd);
  }

  // --- Stash Operations ---

  async getStashes(): Promise<{ index: string; message: string; date: string }[]> {
    return commitOps.getStashes(this.asCommitContext());
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

  clearCache(): void {
    this.commitCache.clear();
  }

  // --- Private Execution Contexts ---

  private asBranchContext(): branchOps.BranchExecContext {
    return {
      cwd: this.cwd,
      exec: (args, mb, retries) => this.exec(args, mb, retries),
      getCurrentBranch: () => this.getCurrentBranch(),
      getRepoRoot: () => this.getRepoRoot(),
      getRemotes: () => this.getRemotes(),
      getDefaultRemote: (b) => this.getDefaultRemote(b),
    };
  }

  private asStagingContext(): stagingOps.StagingExecContext {
    return {
      cwd: this.cwd,
      exec: (args, mb, retries) => this.exec(args, mb, retries),
      getStatus: () => this.getStatus(),
    };
  }

  private asCommitContext(): commitOps.CommitExecContext {
    return {
      cwd: this.cwd,
      commitCache: this.commitCache,
      exec: (args, mb, retries) => this.exec(args, mb, retries),
      stageFiles: (paths) => this.stageFiles(paths),
      push: () => this.push(),
    };
  }

  private asConflictContext(): conflictOps.GitExecContext {
    return {
      cwd: this.cwd,
      exec: (args, mb, retries) => this.exec(args, mb, retries),
      getStatus: () => this.getStatus(),
      getCurrentBranch: () => this.getCurrentBranch(),
      stageFiles: (paths) => this.stageFiles(paths),
      getMergeMessage: () => this.getMergeMessage(),
    };
  }
}
