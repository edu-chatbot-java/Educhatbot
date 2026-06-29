import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://edu-backend-35971955178.asia-northeast3.run.app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
