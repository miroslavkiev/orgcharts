import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/orgchart/' : '/',
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 3000
  }
})
