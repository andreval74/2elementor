import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// [TECH DECISION]: Vite com alias @/ para imports absolutos limpos
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/test/**/*.test.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          jszip: ['jszip'],
          icons: ['lucide-react'],
        },
      },
    },
  },
})
