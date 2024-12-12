import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    define: {
      'process.env.YOUTUBE_CLIENT_ID': JSON.stringify(env.VITE_YOUTUBE_CLIENT_ID),
      'process.env.YOUTUBE_API_KEY': JSON.stringify(env.VITE_YOUTUBE_API_KEY)
    },
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: 'manifest.json',
            dest: '.'
          },
          {
            src: 'icons/*',
            dest: 'icons'
          }
        ]
      })
    ],
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: 'index.html'
        },
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]'
        },
        external: [
          'child_process',
          'crypto',
          'fs',
          'http',
          'https',
          'net',
          'os',
          'path',
          'stream',
          'tls',
          'url',
          'util',
          'querystring',
          'buffer',
          'events',
          'assert'
        ]
      }
    }
  };
});