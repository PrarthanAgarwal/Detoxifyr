import { resolve } from 'path';
import { build } from 'vite';

// Build content script
await build({
  configFile: false,
  build: {
    outDir: resolve(__dirname, '../../dist'),
    lib: {
      entry: resolve(__dirname, './index.ts'),
      formats: ['es'],
      fileName: () => 'content.js',
    },
    emptyOutDir: false,
  },
}); 