import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: 'dist/webview',
    rollupOptions: {
      input: {
        graph: resolve(__dirname, 'webview/graph/index.html'),
        rebase: resolve(__dirname, 'webview/rebase/index.html'),
      },
      output: {
        entryFileNames: '[name]/[name].js',
        chunkFileNames: 'shared/[name].js',
        assetFileNames: '[name]/[name].[ext]',
      },
    },
  },
  resolve: {
    alias: {
      '$shared': resolve(__dirname, 'webview/shared'),
    },
  },
});
