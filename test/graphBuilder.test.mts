import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGraph, linearizeCommitsBek, graphWidth } from '../src/git/graphBuilder.ts';
import type { Commit } from '../src/git/gitService.ts';

function makeCommit(hash: string, parents: string[], date: string = '2026-10-17T00:00:00Z'): Commit {
  return {
    hash,
    abbreviatedHash: hash.slice(0, 7),
    parents,
    author: 'Dev',
    authorEmail: 'dev@test.com',
    authorDate: date,
    subject: `Commit ${hash}`,
    body: '',
    refs: [],
  };
}

test('buildGraph handles empty commit list', () => {
  assert.deepEqual(buildGraph([]), []);
});

test('buildGraph keeps single linear branch in column 0', () => {
  const c3 = makeCommit('c3', ['c2']);
  const c2 = makeCommit('c2', ['c1']);
  const c1 = makeCommit('c1', []);

  const nodes = buildGraph([c3, c2, c1]);
  assert.equal(nodes.length, 3);
  assert.equal(nodes[0].column, 0);
  assert.equal(nodes[1].column, 0);
  assert.equal(nodes[2].column, 0);
  assert.equal(graphWidth(nodes), 1);
});

test('linearizeCommitsBek groups feature branch commits next to merge commit', () => {
  // Main: base -> m1 -> merge
  // Feat: base -> f1 -> f2 -> merge
  // In raw date order, commits might be interleaved:
  // merge, m1, f2, f1, base
  const base = makeCommit('base', [], '2026-10-01T00:00:00Z');
  const f1 = makeCommit('f1', ['base'], '2026-10-02T00:00:00Z');
  const m1 = makeCommit('m1', ['base'], '2026-10-03T00:00:00Z');
  const f2 = makeCommit('f2', ['f1'], '2026-10-04T00:00:00Z');
  const merge = makeCommit('merge', ['m1', 'f2'], '2026-10-05T00:00:00Z');

  const raw = [merge, m1, f2, f1, base];
  const linearized = linearizeCommitsBek(raw);

  // LinearBek should cluster f2 and f1 immediately following merge
  const hashes = linearized.map(c => c.hash);
  assert.equal(hashes[0], 'merge');
  assert.equal(hashes[1], 'f2');
  assert.equal(hashes[2], 'f1');
  assert.equal(hashes[3], 'm1');
  assert.equal(hashes[4], 'base');
});

test('buildGraph keeps column 0 trunk continuous on merge', () => {
  const base = makeCommit('base', []);
  const f1 = makeCommit('f1', ['base']);
  const m1 = makeCommit('m1', ['base']);
  const merge = makeCommit('merge', ['m1', 'f1']);

  const nodes = buildGraph([merge, m1, f1, base]);
  // merge is at column 0
  assert.equal(nodes[0].column, 0);
  // m1 (first parent of merge) must stay in column 0
  const m1Node = nodes.find(n => n.hash === 'm1');
  assert.ok(m1Node);
  assert.equal(m1Node.column, 0);
});
