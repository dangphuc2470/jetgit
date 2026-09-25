import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const entries = [
  { input: 'webview/graph/main.ts', outfile: 'dist/webview/graph/graph.js' },
  { input: 'webview/rebase/main.ts', outfile: 'dist/webview/rebase/rebase.js' },
];

for (const entry of entries) {
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
