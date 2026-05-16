import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // У dev-режимі всі запити /api/* проксюються на бекенд
      // Змініть target на адресу вашого бекенду
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // Якщо бекенд не має префікса /api — розкоментуйте:
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
