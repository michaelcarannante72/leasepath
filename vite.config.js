import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { criteriaRedactPlugin } from './server/criteriaRedact.js'
import { guidePlugin } from './server/guidePlugin.js'

export default defineConfig({
  plugins: [criteriaRedactPlugin(), react(), guidePlugin()],
  server: {
    port: 5183,
    strictPort: true,
  },
  preview: {
    port: 5183,
    strictPort: true,
  },
})
