import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const entries = [
  { input: 'webview/graph/main.ts', outfile: 'dist/webview/graph/graph.js' },
  { input: 'webview/rebase/main.ts', outfile: 'dist/webview/rebase/rebase.js' },
  { input: 'webview/commit/main.ts', outfile: 'dist/webview/commit/commit.js' },
  { input: 'webview/review/main.ts', outfile: 'dist/webview/commit/review.js' },
  { input: 'webview/merge/main.ts', outfile: 'dist/webview/merge/merge.js' },
  { input: 'webview/conflicts/main.ts', outfile: 'dist/webview/conflicts/conflicts.js' },
  { input: 'webview/push/main.ts', outfile: 'dist/webview/push/push.js' },
];

for (const entry of entries) {
  if (!fs.existsSync(entry.input)) {
    console.log(`Skipping missing entry: ${entry.input}`);
    continue;
  }
  await esbuild.build({
    entryPoints: [entry.input],
    bundle: true,
    outfile: entry.outfile,
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    sourcemap: false,
    plugins: [
      sveltePlugin({
        compilerOptions: {
          css: 'injected',
        },
      }),
    ],
    alias: {
      '$shared': path.resolve(__dirname, 'webview/shared'),
      '$protocol': path.resolve(__dirname, 'src/shared/protocol.ts'),
      '$labelUtils': path.resolve(__dirname, 'src/shared/labelUtils.ts'),
      '$mergeResolveUtil': path.resolve(__dirname, 'src/shared/mergeResolveUtil.ts'),
    },
  });
}

const staticAssets = [
  { from: 'webview/commit/commit.css', to: 'dist/webview/commit/commit.css' },
];

for (const asset of staticAssets) {
  if (fs.existsSync(asset.from)) {
    fs.mkdirSync(path.dirname(asset.to), { recursive: true });
    fs.copyFileSync(asset.from, asset.to);
  }
}
