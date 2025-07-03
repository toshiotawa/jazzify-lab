/// <reference types="node" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const rootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(rootDir, './src'),
        '@/components': resolve(rootDir, './src/components'),
        '@/stores': resolve(rootDir, './src/stores'),
        '@/engines': resolve(rootDir, './src/engines'),
        '@/systems': resolve(rootDir, './src/systems'),
        '@/platform': resolve(rootDir, './src/platform'),
        '@/data': resolve(rootDir, './src/data'),
        '@/types': resolve(rootDir, './src/types'),
        '@/utils': resolve(rootDir, './src/utils')
      }
    },
    assetsInclude: ['**/*.wasm'],
    esbuild: {
      target: 'es2020',
      sourcemap: !isProduction,
      minifyIdentifiers: isProduction,
      minifySyntax: isProduction,
      minifyWhitespace: isProduction,
      legalComments: isProduction ? 'none' : 'eof',
      // プロダクション環境でコンソール関数とデバッガーを完全削除
      ...(isProduction && {
        drop: ['console', 'debugger'],
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
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'pixi': ['pixi.js'],
            'audio': ['tone'],
            'icons': ['react-icons'],
            'utils': ['clsx', 'tailwind-merge', 'zustand', 'immer']
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        },
        treeshake: {
          preset: 'recommended'
        }
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
        'immer'
      ],
      exclude: ['@/wasm'],
      esbuildOptions: {
        target: 'es2020'
      }
    },
    cacheDir: 'node_modules/.vite'
  };
}) 