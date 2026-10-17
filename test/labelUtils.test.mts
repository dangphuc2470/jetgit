import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shortenRefName, parseRef, MAX_LABEL_LENGTH } from '../src/shared/labelUtils.ts';

test('shortenRefName leaves strings <= MAX_LABEL_LENGTH untouched', () => {
  assert.equal(shortenRefName('master'), 'master');
  assert.equal(shortenRefName('feature/login'), 'feature/login');
  assert.equal(shortenRefName('1234567890123456789012'), '1234567890123456789012');
});

test('shortenRefName truncates long branches preserving prefix when possible', () => {
  const longFeature = 'feature/super-extra-long-task-name';
  const shortened = shortenRefName(longFeature, 22);
  assert.equal(shortened.length <= 22, true);
  assert.equal(shortened.startsWith('feature/'), true);
  assert.equal(shortened.includes('..'), true);
});

test('shortenRefName handles long names without slashes with middle ellipsis', () => {
  const longName = 'very-long-unslashed-branch-name-123456';
  const shortened = shortenRefName(longName, 22);
  assert.equal(shortened.length <= 22, true);
  assert.equal(shortened.includes('..'), true);
});

test('parseRef correctly categorizes ref types', () => {
  const headRef = parseRef('HEAD -> main');
  assert.equal(headRef.type, 'head');
  assert.equal(headRef.displayName, 'main');

  const pureHead = parseRef('HEAD');
  assert.equal(pureHead.type, 'head');
  assert.equal(pureHead.displayName, 'HEAD');

  const tagRef = parseRef('tag: v1.0.0');
  assert.equal(tagRef.type, 'tag');
  assert.equal(tagRef.displayName, 'v1.0.0');

  const remoteRef = parseRef('origin/feature-x');
  assert.equal(remoteRef.type, 'remote');
  assert.equal(remoteRef.displayName, 'origin/feature-x');

  const localRef = parseRef('bugfix-123');
  assert.equal(localRef.type, 'branch');
  assert.equal(localRef.displayName, 'bugfix-123');
});
