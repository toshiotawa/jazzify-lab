import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
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
    assetsInclude: ['**/*.wasm', '**/*.webp', '**/*.png'],
    esbuild: {
      target: 'es2020',
      sourcemap: !isProduction,
      minifyIdentifiers: isProduction,
      minifySyntax: isProduction,
      minifyWhitespace: isProduction,
      legalComments: 'none',  // ファイル先頭に 'use strict' を二重に入れない
      banner: '',  // 追加のバナーを防ぐ
      // プロダクション環境でコンソール関数とデバッガーを完全削除
      ...(isProduction && {
        // drop: ['console', 'debugger'],  // console.logを残すためコメントアウト
        dropLabels: ['DEBUG'],
      }),
    },
    build: {
      target: 'es2020',
      sourcemap: false,
      minify: 'esbuild',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      cssMinify: 'esbuild',
      reportCompressedSize: false, // ビルド時間短縮
      // ビルド時間短縮のための追加設定
      write: true,
      outDir: 'dist',
      assetsDir: 'assets',
      // 並列処理の最適化
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
            'music': ['opensheetmusicdisplay', 'tonal']
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        },
        treeshake: {
          preset: 'recommended',
          // console関数を不要コードとして削除
          // manualPureFunctions: ['console.log', 'console.info', 'console.debug', 'console.warn', 'console.error'],  // console.logを残すためコメントアウト
        },
        // 並列処理の最適化
        maxParallelFileOps: 3,
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
        'opensheetmusicdisplay',
        'tonal',
        'pixi.js',
        'tone'
      ],
      exclude: ['@/wasm'],
      esbuildOptions: {
        target: 'es2020'
      },
      // 依存関係の最適化
      force: false
    },
    cacheDir: 'node_modules/.vite',
    // ビルド時間短縮のための追加設定
    logLevel: 'warn',
    clearScreen: false
  };
}) 