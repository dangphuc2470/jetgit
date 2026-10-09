import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isDirtyTreeConflict,
  isThreeWayConflict,
  extractOverwrittenFiles,
  makeStashName,
  detectInProgressOperation,
  isIndexLockError,
  isPushRejectedError,
  isBranchAlreadyExistsError,
} from '../src/git/conflictUtils.ts';

test('isDirtyTreeConflict detects uncommitted local changes on checkout', () => {
  const err = `error: Your local changes to the following files would be overwritten by checkout:
\tsrc/views/graphPanel.ts
\tpackage.json
Please commit your changes or stash them before you switch branches.
Aborting`;
  assert.equal(isDirtyTreeConflict(err), true);
});

test('isDirtyTreeConflict detects uncommitted local changes on merge', () => {
  const err = `error: Your local changes to the following files would be overwritten by merge:
\ttest_config.json
\ttest_notes.md
Please commit your changes or stash them before you merge.
Aborting`;
  assert.equal(isDirtyTreeConflict(err), true);
});

test('isDirtyTreeConflict detects uncommitted local changes on rebase', () => {
  const err = `error: Your local changes to the following files would be overwritten by rebase:
\tsrc/core/engine.ts
Please commit your changes or stash them before you rebase.
Aborting`;
  assert.equal(isDirtyTreeConflict(err), true);
});

test('isDirtyTreeConflict detects untracked files overwrite on checkout and rebase', () => {
  const checkoutErr = `error: The following untracked working tree files would be overwritten by checkout:
\tuntracked_file.txt
Please move or remove them before you switch branches.
Aborting`;
  assert.equal(isDirtyTreeConflict(checkoutErr), true);

  const rebaseErr = `error: The following untracked working tree files would be overwritten by rebase:
\tbuild/temp.log
Please move or remove them before you rebase.
Aborting`;
  assert.equal(isDirtyTreeConflict(rebaseErr), true);
});

test('isDirtyTreeConflict detects unstaged changes on rebase', () => {
  const err = `cannot rebase: You have unstaged changes.
Please commit or stash them.`;
  assert.equal(isDirtyTreeConflict(err), true);
});

test('isDirtyTreeConflict detects uncommitted index on pull with rebase', () => {
  const err = `cannot pull with rebase: Your index contains uncommitted changes.
Please commit or stash them.`;
  assert.equal(isDirtyTreeConflict(err), true);
});

test('isThreeWayConflict detects merge conflicts from standard git stdout', () => {
  const stdout = `Auto-merging test_notes.md
CONFLICT (content): Merge conflict in test_notes.md
Automatic merge failed; fix conflicts and then commit the result.`;
  assert.equal(isThreeWayConflict(stdout), true);
});

test('isThreeWayConflict detects cherry-pick conflicts', () => {
  const err = `error: could not apply 7b89a01... Update readme
hint: After resolving the conflicts, mark them with
hint: "git add/rm <pathspec>", then run
hint: "git cherry-pick --continue"`;
  assert.equal(isThreeWayConflict(err), true);
});

test('isThreeWayConflict detects rebase conflicts', () => {
  const err = `error: could not apply a1b2c3d... Add new feature
Resolve all conflicts manually, mark them as resolved with
"git add/rm <conflicted_files>", then run "git rebase --continue".`;
  assert.equal(isThreeWayConflict(err), true);
});

test('isThreeWayConflict respects active repository conflict info flag', () => {
  assert.equal(isThreeWayConflict('generic error message', true), true);
  assert.equal(isThreeWayConflict('generic error message', false), false);
});

test('extractOverwrittenFiles correctly parses conflicting filenames on rebase and checkout', () => {
  const checkoutErr = `error: Your local changes to the following files would be overwritten by checkout:
\tsrc/file1.ts
\tsrc/components/Button.svelte
\tpackage.json
Please commit your changes or stash them before you switch branches.
Aborting`;
  const checkoutFiles = extractOverwrittenFiles(checkoutErr);
  assert.deepEqual(checkoutFiles, [
    'src/file1.ts',
    'src/components/Button.svelte',
    'package.json',
  ]);

  const rebaseErr = `error: Your local changes to the following files would be overwritten by rebase:
\tsrc/rebaseTarget.ts
\tdocs/rebase_spec.md
Please commit your changes or stash them before you rebase.
Aborting`;
  const rebaseFiles = extractOverwrittenFiles(rebaseErr);
  assert.deepEqual(rebaseFiles, [
    'src/rebaseTarget.ts',
    'docs/rebase_spec.md',
  ]);
});

test('extractOverwrittenFiles returns empty array when no files listed', () => {
  const err = 'fatal: refusing to merge unrelated histories';
  assert.deepEqual(extractOverwrittenFiles(err), []);
});

test('makeStashName sanitizes branch name and formats prefix cleanly', () => {
  const name = makeStashName('Merge', 'feature/login#issue-42', 1700000000000);
  assert.equal(name, 'autostash-merge-feature_login_issue-42-1700000000000');
});

test('makeStashName falls back to HEAD when target ref is empty', () => {
  const name = makeStashName('Checkout', '', 1700000000000);
  assert.equal(name, 'autostash-checkout-HEAD-1700000000000');
});

test('detectInProgressOperation detects ongoing merge, rebase, cherry-pick, and revert', () => {
  const mergeErr = 'fatal: You have not concluded your merge (MERGE_HEAD exists). Please, commit your changes before you merge.';
  assert.deepEqual(detectInProgressOperation(mergeErr), { type: 'merge', title: 'Merge' });

  const rebaseErr = 'fatal: cannot switch branch while rebasing\nfatal: A rebase is already in progress';
  assert.deepEqual(detectInProgressOperation(rebaseErr), { type: 'rebase', title: 'Rebase' });

  const cherryPickErr = 'fatal: cherry-pick is already in progress (CHERRY_PICK_HEAD exists)';
  assert.deepEqual(detectInProgressOperation(cherryPickErr), { type: 'cherry-pick', title: 'Cherry-Pick' });

  const revertErr = 'fatal: revert is already in progress (REVERT_HEAD exists)';
  assert.deepEqual(detectInProgressOperation(revertErr), { type: 'revert', title: 'Revert' });

  assert.equal(detectInProgressOperation('error: pathspec does not match any file(s) known to git'), null);
});

test('isIndexLockError detects index.lock lockouts correctly', () => {
  const lockErr1 = "fatal: Unable to create '/repo/.git/index.lock': File exists.";
  assert.equal(isIndexLockError(lockErr1), true);

  const lockErr2 = 'Another git process seems to be running in this repository: index.lock';
  assert.equal(isIndexLockError(lockErr2), true);

  assert.equal(isIndexLockError('error: regular git failure'), false);
});

test('isPushRejectedError detects non-fast-forward push rejection', () => {
  const rejected1 = '! [rejected]        master -> master (fetch first)\nerror: failed to push some refs';
  assert.equal(isPushRejectedError(rejected1), true);

  const rejected2 = 'error: failed to push some refs to remote. Updates were rejected because the tip of your current branch is behind';
  assert.equal(isPushRejectedError(rejected2), true);

  assert.equal(isPushRejectedError('error: authentication failed for remote'), false);
});

test('isBranchAlreadyExistsError extracts branch name correctly', () => {
  const existErr = "fatal: A branch named 'feature/billing' already exists.";
  assert.equal(isBranchAlreadyExistsError(existErr), 'feature/billing');

  assert.equal(isBranchAlreadyExistsError('fatal: branch not found'), null);
});

