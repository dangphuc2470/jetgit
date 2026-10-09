import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import {
  isDirtyTreeConflict,
  isThreeWayConflict,
  extractOverwrittenFiles,
  detectInProgressOperation,
  isIndexLockError,
  isBranchAlreadyExistsError,
  isPushRejectedError,
} from '../src/git/conflictUtils.ts';

function createTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function runGit(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function safeRunGit(cwd: string, args: string[]): { ok: boolean; stdout: string; stderr: string; error?: any } {
  try {
    const out = runGit(cwd, args);
    return { ok: true, stdout: out, stderr: '' };
  } catch (err: any) {
    return {
      ok: false,
      stdout: err?.stdout?.toString() || '',
      stderr: err?.stderr?.toString() || '',
      error: err,
    };
  }
}

function setupTestRepo(): { repoDir: string; cleanup: () => void } {
  const repoDir = createTempDir('intellij-git-repo-');

  runGit(repoDir, ['init', '-b', 'master']);
  runGit(repoDir, ['config', 'user.name', 'Test Dev']);
  runGit(repoDir, ['config', 'user.email', 'test@example.com']);
  runGit(repoDir, ['config', 'commit.gpgsign', 'false']);

  fs.writeFileSync(path.join(repoDir, 'README.md'), '# Initial Repo\n');
  runGit(repoDir, ['add', 'README.md']);
  runGit(repoDir, ['commit', '-m', 'Initial commit']);

  const cleanup = () => {
    try {
      fs.rmSync(repoDir, { recursive: true, force: true });
    } catch {}
  };

  return { repoDir, cleanup };
}

test('Integration: Remote tracking branch checkout does not enter detached HEAD', async () => {
  const remoteDir = createTempDir('intellij-git-remote-');
  const localDir = createTempDir('intellij-git-local-');

  try {
    runGit(remoteDir, ['init', '--bare', '-b', 'master']);

    runGit(localDir, ['init', '-b', 'master']);
    runGit(localDir, ['config', 'user.name', 'Test Dev']);
    runGit(localDir, ['config', 'user.email', 'test@example.com']);
    runGit(localDir, ['config', 'commit.gpgsign', 'false']);
    fs.writeFileSync(path.join(localDir, 'file.txt'), 'base\n');
    runGit(localDir, ['add', 'file.txt']);
    runGit(localDir, ['commit', '-m', 'Initial commit']);
    runGit(localDir, ['remote', 'add', 'origin', remoteDir]);
    runGit(localDir, ['push', '-u', 'origin', 'master']);

    runGit(localDir, ['checkout', '-b', 'feature/real-flow']);
    fs.writeFileSync(path.join(localDir, 'feat.txt'), 'feature code\n');
    runGit(localDir, ['add', 'feat.txt']);
    runGit(localDir, ['commit', '-m', 'Feature commit']);
    runGit(localDir, ['push', '-u', 'origin', 'feature/real-flow']);

    runGit(localDir, ['checkout', 'master']);
    runGit(localDir, ['branch', '-D', 'feature/real-flow']);

    const targetRef = 'origin/feature/real-flow';
    const remotes = runGit(localDir, ['remote']).trim().split('\n').filter(Boolean);

    let isRemote = false;
    let localName = '';
    for (const r of remotes) {
      if (targetRef.startsWith(r + '/')) {
        isRemote = true;
        localName = targetRef.slice(r.length + 1);
        break;
      }
    }
    assert.equal(isRemote, true);
    assert.equal(localName, 'feature/real-flow');

    runGit(localDir, ['checkout', '-b', localName, '--track', targetRef]);

    const currentBranch = runGit(localDir, ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
    assert.equal(currentBranch, 'feature/real-flow');
    assert.equal(currentBranch.includes('detached'), false);

    const upstream = runGit(localDir, ['rev-parse', '--abbrev-ref', '@{upstream}']).trim();
    assert.equal(upstream, 'origin/feature/real-flow');
  } finally {
    try {
      fs.rmSync(remoteDir, { recursive: true, force: true });
      fs.rmSync(localDir, { recursive: true, force: true });
    } catch {}
  }
});

test('Integration: Real 3-Way Merge conflict, detection, and abort', async () => {
  const { repoDir, cleanup } = setupTestRepo();
  try {
    const fileToConflict = path.join(repoDir, 'shared.txt');

    fs.writeFileSync(fileToConflict, 'line 1\nline 2\n');
    runGit(repoDir, ['add', 'shared.txt']);
    runGit(repoDir, ['commit', '-m', 'Add shared.txt']);

    runGit(repoDir, ['checkout', '-b', 'branch-conflict-b']);
    fs.writeFileSync(fileToConflict, 'line 1\nbranch B change\n');
    runGit(repoDir, ['commit', '-am', 'Change on branch B']);

    runGit(repoDir, ['checkout', 'master']);
    fs.writeFileSync(fileToConflict, 'line 1\nmaster change\n');
    runGit(repoDir, ['commit', '-am', 'Change on master']);

    const res = safeRunGit(repoDir, ['merge', 'branch-conflict-b']);
    assert.equal(res.ok, false);

    const combinedError = `${res.stdout}\n${res.stderr}`;
    assert.equal(isThreeWayConflict(combinedError), true);

    const statusOut = runGit(repoDir, ['status', '--porcelain']);
    assert.ok(statusOut.includes('UU shared.txt') || statusOut.includes('U shared.txt'));

    const inProgress = detectInProgressOperation(combinedError);
    assert.ok(inProgress);
    assert.equal(inProgress?.type, 'merge');

    runGit(repoDir, ['merge', '--abort']);

    const statusAfterAbort = runGit(repoDir, ['status', '--porcelain']);
    assert.equal(statusAfterAbort.trim(), '');
  } finally {
    cleanup();
  }
});

test('Integration: Real Rebase conflict, detection, and abort', async () => {
  const { repoDir, cleanup } = setupTestRepo();
  try {
    const fileToConflict = path.join(repoDir, 'rebase-test.txt');

    fs.writeFileSync(fileToConflict, 'base content\n');
    runGit(repoDir, ['add', 'rebase-test.txt']);
    runGit(repoDir, ['commit', '-m', 'Add rebase-test.txt']);

    runGit(repoDir, ['checkout', '-b', 'feat-rebase']);
    fs.writeFileSync(fileToConflict, 'feature change\n');
    runGit(repoDir, ['commit', '-am', 'Change in feature']);

    runGit(repoDir, ['checkout', 'master']);
    fs.writeFileSync(fileToConflict, 'master change\n');
    runGit(repoDir, ['commit', '-am', 'Change in master']);

    runGit(repoDir, ['checkout', 'feat-rebase']);

    const res = safeRunGit(repoDir, ['rebase', 'master']);
    assert.equal(res.ok, false);

    const combinedError = `${res.stdout}\n${res.stderr}`;
    assert.equal(isThreeWayConflict(combinedError), true);

    const inProgress = detectInProgressOperation(combinedError);
    assert.ok(inProgress);
    assert.equal(inProgress?.type, 'rebase');

    runGit(repoDir, ['rebase', '--abort']);

    const status = runGit(repoDir, ['status', '--porcelain']);
    assert.equal(status.trim(), '');
  } finally {
    cleanup();
  }
});

test('Integration: Real Dirty working tree overwrite detection and file extraction', async () => {
  const { repoDir, cleanup } = setupTestRepo();
  try {
    const targetFile = path.join(repoDir, 'dirty.txt');

    fs.writeFileSync(targetFile, 'committed content\n');
    runGit(repoDir, ['add', 'dirty.txt']);
    runGit(repoDir, ['commit', '-m', 'Add dirty.txt']);

    runGit(repoDir, ['checkout', '-b', 'branch-clean']);
    fs.writeFileSync(targetFile, 'clean branch updated content\n');
    runGit(repoDir, ['commit', '-am', 'Update dirty.txt on clean branch']);

    runGit(repoDir, ['checkout', 'master']);
    fs.writeFileSync(targetFile, 'uncommitted local edit\n');

    const res = safeRunGit(repoDir, ['checkout', 'branch-clean']);
    assert.equal(res.ok, false);

    const rawError = `${res.stdout}\n${res.stderr}`;
    assert.equal(isDirtyTreeConflict(rawError), true);

    const overwritten = extractOverwrittenFiles(rawError);
    assert.ok(overwritten.includes('dirty.txt'));
  } finally {
    cleanup();
  }
});

test('Integration: Real Index lock collision and removal recovery', async () => {
  const { repoDir, cleanup } = setupTestRepo();
  try {
    const gitDir = path.join(repoDir, '.git');
    const lockPath = path.join(gitDir, 'index.lock');

    fs.writeFileSync(lockPath, 'stale lock');
    assert.equal(fs.existsSync(lockPath), true);

    fs.writeFileSync(path.join(repoDir, 'README.md'), '# Modified content\n');
    const res = safeRunGit(repoDir, ['add', 'README.md']);
    assert.equal(res.ok, false);

    const rawError = `${res.stdout}\n${res.stderr}`;
    assert.equal(isIndexLockError(rawError), true);

    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
    }
    assert.equal(fs.existsSync(lockPath), false);

    const retryRes = safeRunGit(repoDir, ['add', 'README.md']);
    assert.equal(retryRes.ok, true);
  } finally {
    cleanup();
  }
});

test('Integration: Real Duplicate branch collision detection', async () => {
  const { repoDir, cleanup } = setupTestRepo();
  try {
    runGit(repoDir, ['branch', 'feature/existing-one']);

    const res = safeRunGit(repoDir, ['branch', 'feature/existing-one']);
    assert.equal(res.ok, false);

    const rawError = `${res.stdout}\n${res.stderr}`;
    const dupBranch = isBranchAlreadyExistsError(rawError);
    assert.equal(dupBranch, 'feature/existing-one');
  } finally {
    cleanup();
  }
});

test('Integration: Real Push rejection on non-fast-forward push', async () => {
  const remoteDir = createTempDir('intellij-git-push-remote-');
  const cloneA = createTempDir('intellij-git-clone-a-');
  const cloneB = createTempDir('intellij-git-clone-b-');

  try {
    runGit(remoteDir, ['init', '--bare', '-b', 'master']);

    runGit(cloneA, ['init', '-b', 'master']);
    runGit(cloneA, ['config', 'user.name', 'Test Dev']);
    runGit(cloneA, ['config', 'user.email', 'test@example.com']);
    runGit(cloneA, ['config', 'commit.gpgsign', 'false']);
    fs.writeFileSync(path.join(cloneA, 'init.txt'), 'init');
    runGit(cloneA, ['add', 'init.txt']);
    runGit(cloneA, ['commit', '-m', 'Init']);
    runGit(cloneA, ['remote', 'add', 'origin', remoteDir]);
    runGit(cloneA, ['push', '-u', 'origin', 'master']);

    runGit(cloneB, ['clone', remoteDir, cloneB]);
    runGit(cloneB, ['config', 'user.name', 'Test Dev 2']);
    runGit(cloneB, ['config', 'user.email', 'test2@example.com']);
    runGit(cloneB, ['config', 'commit.gpgsign', 'false']);

    fs.writeFileSync(path.join(cloneA, 'devA.txt'), 'dev A commit');
    runGit(cloneA, ['add', 'devA.txt']);
    runGit(cloneA, ['commit', '-m', 'Commit from dev A']);
    runGit(cloneA, ['push', 'origin', 'master']);

    fs.writeFileSync(path.join(cloneB, 'devB.txt'), 'dev B commit');
    runGit(cloneB, ['add', 'devB.txt']);
    runGit(cloneB, ['commit', '-m', 'Commit from dev B']);

    const res = safeRunGit(cloneB, ['push', 'origin', 'master']);
    assert.equal(res.ok, false);

    const rawError = `${res.stdout}\n${res.stderr}`;
    assert.equal(isPushRejectedError(rawError), true);
  } finally {
    try {
      fs.rmSync(remoteDir, { recursive: true, force: true });
      fs.rmSync(cloneA, { recursive: true, force: true });
      fs.rmSync(cloneB, { recursive: true, force: true });
    } catch {}
  }
});
