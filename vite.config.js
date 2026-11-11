import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        seller: resolve(import.meta.dirname, 'seller.html'),
        buyer: resolve(import.meta.dirname, 'buyer.html'),
      },
    },
  },
})
