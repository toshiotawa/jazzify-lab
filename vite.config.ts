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
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          pixi: ['pixi.js'],
          audio: ['tone']
        }
      }
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
    exclude: ['@/wasm']
  }
}) 