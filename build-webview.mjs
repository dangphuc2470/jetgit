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
    },
    logLevel: 'info',
  });
}
