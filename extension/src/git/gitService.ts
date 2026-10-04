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

  async exec(args: string[], maxBuffer = 10 * 1024 * 1024, retries = 5): Promise<string> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { stdout } = await execFileAsync('git', args, {
          cwd: this.cwd,
          maxBuffer,
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
    return branchOps.getBranches(this.asBranchContext());
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

  async getRemoteUrl(): Promise<string> {
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

  async fetchAll(): Promise<string> {
    return this.exec(['fetch', '--all', '--prune']);
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
