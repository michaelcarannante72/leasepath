const CACHE_NAME = 'leasepath-shell-v2'

const SHELL = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await cache.addAll(SHELL)
      const shell = await cache.match('/')
      const html = shell ? await shell.text() : ''
      const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1])
      if (assets.length) await cache.addAll(assets)
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names
          .filter((name) => (name.startsWith('leasepath-shell-') || name.startsWith('stoop-shell-')) && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      )
      await self.clients.claim()
    })(),
  )
})

function bypass(url) {
  return url.pathname.startsWith('/api/')
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin || bypass(url)) return

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request)
        if (response.ok && response.type === 'basic') {
          const cache = await caches.open(CACHE_NAME)
          const cacheKey = request.mode === 'navigate' ? '/' : request
          await cache.put(cacheKey, response.clone())
        }
        return response
      } catch (error) {
        const cached = await caches.match(request.mode === 'navigate' ? '/' : request)
        if (cached) return cached
        throw error
      }
    })(),
  )
})
