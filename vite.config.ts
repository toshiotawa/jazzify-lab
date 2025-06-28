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
    sourcemap: process.env.NODE_ENV === 'development',
    minifyIdentifiers: process.env.NODE_ENV !== 'development',
    minifySyntax: process.env.NODE_ENV !== 'development',
    minifyWhitespace: process.env.NODE_ENV !== 'development',
    legalComments: 'none'
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
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
}) 