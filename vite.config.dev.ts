import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/stores': resolve(__dirname, './src/stores'),
      '@/engines': resolve(__dirname, './src/engines'),
      '@/systems': resolve(__dirname, './src/systems'),
      '@/platform': resolve(__dirname, './src/platform'),
      '@/data': resolve(__dirname, './src/data'),
      '@/types': resolve(__dirname, './src/types'),
      '@/utils': resolve(__dirname, './src/utils')
    }
  },
  assetsInclude: ['**/*.wasm'],
  esbuild: {
    target: 'es2020',
    sourcemap: true,
    minifyIdentifiers: false,
    minifySyntax: false,
    minifyWhitespace: false,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: false, // 開発時はminifyを無効化
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
    cssMinify: false, // 開発時はCSS minifyを無効化
    reportCompressedSize: false,
    write: true,
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
        output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'pixi': ['pixi.js'],
          'audio': ['tone'],
          'icons': ['react-icons'],
          'utils': ['clsx', 'tailwind-merge', 'zustand', 'immer'],
          'supabase': ['@supabase/supabase-js'],
          'stripe': ['@stripe/stripe-js'],
            'music': ['vexflow', 'tonal']
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      treeshake: false, // 開発時はtreeshakeを無効化
      maxParallelFileOps: 4, // 並列処理を増加
      cache: true
    },
    commonjsOptions: {
      transformMixedEsModules: true
    },
    copyPublicDir: true
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  optimizeDeps: {
      include: [
      'react', 
      'react-dom', 
      'react-icons',
      'clsx',
      'tailwind-merge',
      'zustand',
      'immer',
      '@supabase/supabase-js',
      '@stripe/stripe-js',
        'vexflow',
      'tonal',
      'pixi.js',
      'tone'
    ],
    exclude: ['@/wasm'],
    esbuildOptions: {
      target: 'es2020'
    },
    force: false
  },
  cacheDir: 'node_modules/.vite',
  logLevel: 'error', // ログレベルを最小限に
  clearScreen: false
}) 