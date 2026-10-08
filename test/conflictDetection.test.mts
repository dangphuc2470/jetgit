import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isDirtyTreeConflict,
  isThreeWayConflict,
  extractOverwrittenFiles,
  makeStashName,
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

test('isDirtyTreeConflict detects untracked files overwrite', () => {
  const err = `error: The following untracked working tree files would be overwritten by checkout:
\tuntracked_file.txt
Please move or remove them before you switch branches.
Aborting`;
  assert.equal(isDirtyTreeConflict(err), true);
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

test('extractOverwrittenFiles correctly parses conflicting filenames', () => {
  const err = `error: Your local changes to the following files would be overwritten by checkout:
\tsrc/file1.ts
\tsrc/components/Button.svelte
\tpackage.json
Please commit your changes or stash them before you switch branches.
Aborting`;
  const files = extractOverwrittenFiles(err);
  assert.deepEqual(files, [
    'src/file1.ts',
    'src/components/Button.svelte',
    'package.json',
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
