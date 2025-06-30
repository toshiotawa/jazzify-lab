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
          preset: 'recommended',
          // console関数を不要コードとして削除
          manualPureFunctions: ['console.log', 'console.info', 'console.debug', 'console.warn', 'console.error'],
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