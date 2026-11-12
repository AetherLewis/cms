import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // The API listens on PORT (default 3001); keep the dev proxy aligned with it.
    proxy: {
      '/api': process.env.VITE_API_PROXY_TARGET || 'http://localhost:3001',
    },
  },
})
