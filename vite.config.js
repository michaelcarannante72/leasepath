import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { guidePlugin } from './server/guidePlugin.js'

export default defineConfig({
  plugins: [react(), guidePlugin()],
  server: {
    port: 5183,
    strictPort: true,
  },
  preview: {
    port: 5183,
    strictPort: true,
  },
})
