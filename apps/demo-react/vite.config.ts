import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@isometric-design/react/tokens.css': path.resolve(
        __dirname,
        '../../packages/react/src/tokens.css',
      ),
      '@isometric-design/react': path.resolve(
        __dirname,
        '../../packages/react/src/index.ts',
      ),
      '@isometric-design/core': path.resolve(
        __dirname,
        '../../packages/core/src/index.js',
      ),
    },
  },
  server: {
    port: 5173,
    open: true,
    fs: {
      allow: ['../..'],
    },
  },
});
