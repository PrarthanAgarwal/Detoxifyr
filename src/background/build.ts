import { resolve } from 'path';
import { build } from 'vite';

// Build background script
await build({
  configFile: false,
  build: {
    outDir: resolve(__dirname, '../../dist'),
    lib: {
      entry: resolve(__dirname, './worker.ts'),
      formats: ['es'],
      fileName: () => 'background.js',
    },
    emptyOutDir: false,
  },
}); 