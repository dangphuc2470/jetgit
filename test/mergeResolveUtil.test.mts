import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseConflictHunksFromText,
  checkAutoResolveHunk,
  applyAllNonConflicting,
  areLinesEqual,
  type ConflictHunk,
} from '../src/shared/mergeResolveUtil.ts';

test('areLinesEqual correctly compares string arrays', () => {
  assert.equal(areLinesEqual(['a', 'b'], ['a', 'b']), true);
  assert.equal(areLinesEqual(['a'], ['b']), false);
  assert.equal(areLinesEqual([], []), true);
  assert.equal(areLinesEqual(undefined, undefined), true);
  assert.equal(areLinesEqual(['a'], undefined), false);
});

test('parseConflictHunksFromText parses standard conflict markers', () => {
  const content = `common top
<<<<<<< HEAD
const x = 1;
=======
const x = 2;
>>>>>>> feature
common bottom`;

  const hunks = parseConflictHunksFromText(content);
  assert.equal(hunks.length, 3);
  assert.equal(hunks[0].type, 'common');
  assert.deepEqual(hunks[0].commonLines, ['common top']);

  assert.equal(hunks[1].type, 'conflict');
  assert.deepEqual(hunks[1].yoursLines, ['const x = 1;']);
  assert.deepEqual(hunks[1].theirsLines, ['const x = 2;']);

  assert.equal(hunks[2].type, 'common');
  assert.deepEqual(hunks[2].commonLines, ['common bottom']);
});

test('parseConflictHunksFromText parses diff3 markers with base lines', () => {
  const content = `header
<<<<<<< HEAD
const foo = "yours";
||||||| base
const foo = "base";
=======
const foo = "theirs";
>>>>>>> incoming
footer`;

  const hunks = parseConflictHunksFromText(content);
  assert.equal(hunks.length, 3);
  assert.equal(hunks[1].type, 'conflict');
  assert.deepEqual(hunks[1].yoursLines, ['const foo = "yours";']);
  assert.deepEqual(hunks[1].baseLines, ['const foo = "base";']);
  assert.deepEqual(hunks[1].theirsLines, ['const foo = "theirs";']);
});

test('checkAutoResolveHunk resolves identical modifications on both sides', () => {
  const hunk: ConflictHunk = {
    id: 1,
    type: 'conflict',
    yoursLines: ['identical change'],
    theirsLines: ['identical change'],
  };

  const res = checkAutoResolveHunk(hunk);
  assert.equal(res.canResolve, true);
  assert.equal(res.side, 'yours');
  assert.deepEqual(res.lines, ['identical change']);
  assert.equal(res.reason, 'identical_modifications');
});

test('checkAutoResolveHunk resolves when only Theirs modified (Yours matches Base)', () => {
  const hunk: ConflictHunk = {
    id: 1,
    type: 'conflict',
    baseLines: ['original base line'],
    yoursLines: ['original base line'],
    theirsLines: ['updated by theirs'],
  };

  const res = checkAutoResolveHunk(hunk);
  assert.equal(res.canResolve, true);
  assert.equal(res.side, 'theirs');
  assert.deepEqual(res.lines, ['updated by theirs']);
  assert.equal(res.reason, 'yours_unmodified');
});

test('checkAutoResolveHunk resolves when only Yours modified (Theirs matches Base)', () => {
  const hunk: ConflictHunk = {
    id: 1,
    type: 'conflict',
    baseLines: ['original base line'],
    yoursLines: ['updated by yours'],
    theirsLines: ['original base line'],
  };

  const res = checkAutoResolveHunk(hunk);
  assert.equal(res.canResolve, true);
  assert.equal(res.side, 'yours');
  assert.deepEqual(res.lines, ['updated by yours']);
  assert.equal(res.reason, 'theirs_unmodified');
});

test('checkAutoResolveHunk refuses to auto-resolve true conflicting edits', () => {
  const hunk: ConflictHunk = {
    id: 1,
    type: 'conflict',
    baseLines: ['base'],
    yoursLines: ['yours branch different edit'],
    theirsLines: ['theirs branch conflicting edit'],
  };

  const res = checkAutoResolveHunk(hunk);
  assert.equal(res.canResolve, false);
});

test('applyAllNonConflicting batch-resolves non-conflicts and leaves true conflicts', () => {
  const hunks: ConflictHunk[] = [
    {
      id: 1,
      type: 'conflict',
      baseLines: ['base 1'],
      yoursLines: ['base 1'],
      theirsLines: ['theirs edit 1'],
      resolved: false,
    },
    {
      id: 2,
      type: 'conflict',
      baseLines: ['base 2'],
      yoursLines: ['conflict A'],
      theirsLines: ['conflict B'],
      resolved: false,
    },
    {
      id: 3,
      type: 'conflict',
      baseLines: ['base 3'],
      yoursLines: ['same change'],
      theirsLines: ['same change'],
      resolved: false,
    },
  ];

  const result = applyAllNonConflicting(hunks);
  assert.equal(result.resolvedCount, 2);
  assert.equal(result.remainingCount, 1);

  assert.equal(hunks[0].resolved, true);
  assert.equal(hunks[0].chosen, 'theirs');
  assert.deepEqual(hunks[0].resultLines, ['theirs edit 1']);

  assert.equal(hunks[1].resolved, false);

  assert.equal(hunks[2].resolved, true);
  assert.deepEqual(hunks[2].resultLines, ['same change']);
});
