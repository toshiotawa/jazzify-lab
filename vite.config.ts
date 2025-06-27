import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react({
    babel: {
      plugins: process.env.NODE_ENV === 'development' ? [] : undefined
    }
  })],
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
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    legalComments: 'none'
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: (id) => {
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('pixi.js')) {
            return 'pixi';
          }
          if (id.includes('tone')) {
            return 'audio';
          }
          if (id.includes('zustand') || id.includes('immer')) {
            return 'state';
          }
          if (id.includes('react-icons') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'ui-libs';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: false
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
      'tailwind-merge'
    ],
    exclude: ['@/wasm'],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  cacheDir: 'node_modules/.vite'
}) 