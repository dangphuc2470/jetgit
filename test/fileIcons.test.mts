import test from 'node:test';
import assert from 'node:assert/strict';
import { getFileIcon } from '../webview/shared/fileIcons.ts';

test('fileIcons: Java file renders Android Studio Class C icon', () => {
  const icon = getFileIcon('OAuthController.java');
  assert.ok(icon.includes('<circle'));
  assert.ok(icon.includes('>C<'));
  assert.ok(icon.includes('#389FD6'));
});

test('fileIcons: Svelte, TypeScript, JavaScript files have dedicated icons', () => {
  const svelteIcon = getFileIcon('App.svelte');
  assert.ok(svelteIcon.includes('#FF3E00')); // Svelte orange

  const mtsIcon = getFileIcon('gitOperationsIntegration.test.mts');
  assert.ok(mtsIcon.includes('#3178C6')); // TS blue

  const tsIcon = getFileIcon('commitPanel.ts');
  assert.ok(tsIcon.includes('#3178C6')); // TS blue

  const jsIcon = getFileIcon('bundle.js');
  assert.ok(jsIcon.includes('#F7DF1E')); // JS yellow
});

test('fileIcons: Fallbacks to VS Code file document icon for general text/code files', () => {
  const confIcon = getFileIcon('custom.config');
  // Should not be question mark
  assert.ok(!confIcon.includes('>C<'));
  assert.ok(!confIcon.includes('9.03c0')); // question mark path
  assert.ok(confIcon.includes('#8C8C8C')); // VS Code file icon color
});

test('fileIcons: Fallbacks to VS Code file document icon for extensionless or unrecognized files', () => {
  const unknownIcon = getFileIcon('unknown_file_without_ext');
  assert.ok(!unknownIcon.includes('9.03c0'));
  assert.ok(unknownIcon.includes('#8C8C8C'));
});
