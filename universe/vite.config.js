import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import nasaNewsApi from './server/vite-plugin-nasa-news.mjs'

export default defineConfig({
  plugins: [react(), nasaNewsApi()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.e2b.app', 'localhost'],
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['.e2b.app', 'localhost'],
  },
})
