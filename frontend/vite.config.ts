import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize for production
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          ui: ['lucide-react', 'framer-motion'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
