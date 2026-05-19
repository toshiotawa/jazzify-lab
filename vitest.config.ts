import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
    reporters: ['verbose'],
    /** fork worker 落ちを避けるためテストファイルを逐次実行（CI/低メモリ向け） */
    fileParallelism: false,
    maxWorkers: 1,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'import.meta.env.BASE_URL': JSON.stringify('/'),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('http://localhost'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('vitest-anon-key'),
  },
});