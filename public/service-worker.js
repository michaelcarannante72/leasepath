// Bump CACHE_VERSION when this file's caching rules change. Hashed files under /assets/
// are refreshed on every install, and old ones are pruned on activate.
const CACHE_PREFIX = 'leasepath-shell-'
const CACHE_VERSION = 'v3'
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`

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

// Pages the Worker renders itself. They are not the app shell and must never be stored under '/'.
const SERVER_PAGES = ['/privacy', '/terms']

function assetsIn(html) {
  return [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1])
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await cache.addAll(SHELL.map((path) => new Request(path, { cache: 'reload' })))
      const shell = await cache.match('/')
      const html = shell ? await shell.text() : ''
      const assets = assetsIn(html)
      if (assets.length) await cache.addAll(assets.map((path) => new Request(path, { cache: 'reload' })))
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)),
      )
      // Drop hashed files from earlier builds so the cache does not grow on every deploy.
      const cache = await caches.open(CACHE_NAME)
      const shell = await cache.match('/')
      if (shell) {
        const keep = new Set(assetsIn(await shell.text()))
        for (const request of await cache.keys()) {
          const path = new URL(request.url).pathname
          if (path.startsWith('/assets/') && !keep.has(path)) await cache.delete(request)
        }
      }
      await self.clients.claim()
    })(),
  )
})

// Never cache the API or anything signed in. Everything else is network first.
function bypass(url) {
  return url.pathname === '/api' || url.pathname.startsWith('/api/')
}

function cacheKeyFor(request, url) {
  if (request.mode !== 'navigate') return request
  return SERVER_PAGES.includes(url.pathname.replace(/\/+$/, '')) ? url.pathname.replace(/\/+$/, '') : '/'
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin || bypass(url)) return

  event.respondWith(
    (async () => {
      const key = cacheKeyFor(request, url)
      try {
        const response = await fetch(request)
        // Only a real page or file is stored. A 404 for a navigation must not replace the app shell.
        if (response.ok && response.type === 'basic') {
          const cache = await caches.open(CACHE_NAME)
          await cache.put(key, response.clone())
        }
        return response
      } catch (error) {
        // ignoreVary: precached copies were stored by a no-cors request, a module script is a cors request.
        const cached = await caches.match(key, { ignoreVary: true })
        if (cached) return cached
        // A server page that was never visited falls back to the app shell while offline.
        if (request.mode === 'navigate') {
          const shell = await caches.match('/', { ignoreVary: true })
          if (shell) return shell
        }
        throw error
      }
    })(),
  )
})
