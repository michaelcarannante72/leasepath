import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { criteriaRedactPlugin } from './server/criteriaRedact.js'
import { guidePlugin } from './server/guidePlugin.js'

// Lists every built /assets/ file, so the service worker can precache the lazy route chunks for offline use.
function assetManifestPlugin() {
  return {
    name: 'leasepath-asset-manifest',
    apply: 'build',
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle).filter((file) => file.startsWith('assets/')).map((file) => `/${file}`).sort()
      this.emitFile({ type: 'asset', fileName: 'asset-manifest.json', source: `${JSON.stringify({ assets }, null, 2)}\n` })
    },
  }
}

export default defineConfig({
  plugins: [criteriaRedactPlugin(), react(), guidePlugin(), assetManifestPlugin()],
  server: {
    port: 5183,
    strictPort: true,
  },
  preview: {
    port: 5183,
    strictPort: true,
  },
})
