import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { buildDirectoryTree } from '../webview/commit/treeView.ts';
import type { CommitFile } from '../webview/commit/types.ts';

function getGroupCheckState(groupFiles: CommitFile[], checkedFiles: Set<string>) {
  if (groupFiles.length === 0) return { checked: false, indeterminate: false };
  const anyPartiallyStaged = groupFiles.some(
    (f: any) => f.partiallyStaged || (f.totalChanges > 0 && f.stagedChanges > 0 && f.stagedChanges < f.totalChanges)
  );
  const allChecked = groupFiles.every((f) => checkedFiles.has(f.path) || (f.staged && !f.partiallyStaged));
  const someChecked =
    anyPartiallyStaged ||
    (!allChecked && groupFiles.some((f: any) => checkedFiles.has(f.path) || f.staged || f.stagedChanges > 0));
  return {
    checked: allChecked,
    indeterminate: someChecked && !allChecked,
  };
}

function getRepoGroups(filesList: CommitFile[], fallbackRepo: string) {
  const map = new Map<string, CommitFile[]>();
  for (const f of filesList) {
    const rName = f.repoName || fallbackRepo || 'Project';
    if (!map.has(rName)) map.set(rName, []);
    map.get(rName)!.push(f);
  }
  return Array.from(map.entries()).map(([name, groupList]) => ({ name, files: groupList }));
}

test('Multi-Repo: Groups files correctly by repository', () => {
  const files: CommitFile[] = [
    { path: 'repoA/src/index.ts', relativePath: 'src/index.ts', repoName: 'repoA', name: 'index.ts', dir: 'src', status: 'M' },
    { path: 'repoA/src/utils.ts', relativePath: 'src/utils.ts', repoName: 'repoA', name: 'utils.ts', dir: 'src', status: 'M' },
    { path: 'repoB/package.json', relativePath: 'package.json', repoName: 'repoB', name: 'package.json', dir: '', status: 'M' },
  ];

  const groups = getRepoGroups(files, 'fallback');
  assert.equal(groups.length, 2);
  assert.equal(groups[0].name, 'repoA');
  assert.equal(groups[0].files.length, 2);
  assert.equal(groups[1].name, 'repoB');
  assert.equal(groups[1].files.length, 1);
});

test('Multi-Repo: Checkboxes are completely independent per repository', () => {
  const repoAFiles: CommitFile[] = [
    { path: 'repoA/file1.ts', relativePath: 'file1.ts', repoName: 'repoA', name: 'file1.ts', dir: '', status: 'M' },
    { path: 'repoA/file2.ts', relativePath: 'file2.ts', repoName: 'repoA', name: 'file2.ts', dir: '', status: 'M' },
  ];
  const repoBFiles: CommitFile[] = [
    { path: 'repoB/file3.ts', relativePath: 'file3.ts', repoName: 'repoB', name: 'file3.ts', dir: '', status: 'M' },
    { path: 'repoB/file4.ts', relativePath: 'file4.ts', repoName: 'repoB', name: 'file4.ts', dir: '', status: 'M' },
  ];
  const allFiles = [...repoAFiles, ...repoBFiles];

  // Case 1: Repo A checked, Repo B unchecked
  const checked = new Set<string>(['repoA/file1.ts', 'repoA/file2.ts']);
  const stateRepoA = getGroupCheckState(repoAFiles, checked);
  const stateRepoB = getGroupCheckState(repoBFiles, checked);
  const stateTotal = getGroupCheckState(allFiles, checked);

  assert.deepEqual(stateRepoA, { checked: true, indeterminate: false });
  assert.deepEqual(stateRepoB, { checked: false, indeterminate: false });
  assert.deepEqual(stateTotal, { checked: false, indeterminate: true });

  // Case 2: 1 file in Repo A checked -> Repo A is indeterminate
  const checkedPartial = new Set<string>(['repoA/file1.ts']);
  assert.deepEqual(getGroupCheckState(repoAFiles, checkedPartial), { checked: false, indeterminate: true });
  assert.deepEqual(getGroupCheckState(repoBFiles, checkedPartial), { checked: false, indeterminate: false });

  // Case 3: Both repos checked
  const checkedAll = new Set<string>(['repoA/file1.ts', 'repoA/file2.ts', 'repoB/file3.ts', 'repoB/file4.ts']);
  assert.deepEqual(getGroupCheckState(repoAFiles, checkedAll), { checked: true, indeterminate: false });
  assert.deepEqual(getGroupCheckState(repoBFiles, checkedAll), { checked: true, indeterminate: false });
  assert.deepEqual(getGroupCheckState(allFiles, checkedAll), { checked: true, indeterminate: false });
});

test('Multi-Repo: buildDirectoryTree uses relativePath cleanly without repoName prefix', () => {
  const repoFiles: CommitFile[] = [
    { path: 'repoA/src/components/Header.ts', relativePath: 'src/components/Header.ts', repoName: 'repoA', name: 'Header.ts', dir: 'src/components', status: 'M' },
  ];
  const root = buildDirectoryTree(repoFiles);
  // Root child should be 'src' or 'src/components', not 'repoA'
  const firstChildName = Array.from(root.children.keys())[0];
  assert.ok(firstChildName.startsWith('src'));
  assert.ok(!firstChildName.includes('repoA'));
});
