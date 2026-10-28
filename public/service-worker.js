// Bump CACHE_VERSION when this file's caching rules change. Hashed files under /assets/
// are refreshed on every install, and old ones are pruned on activate.
const CACHE_PREFIX = 'leasepath-shell-'
const CACHE_VERSION = 'v8' // mobile redesign; route pages are lazy chunks: precache every chunk listed in /asset-manifest.json
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`

// App shell + icons. Hash routes (#/resources, #/steps, #/plan, …) load from '/' once cached,
// so Resources, the docs checklist (Steps), and My voucher work offline after the first visit.
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


function assetsIn(html) {
  return [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1])
}

// Every built file, including the lazy route chunks the shell HTML does not name (written by vite.config.js).
const ASSET_MANIFEST = '/asset-manifest.json'

async function manifestAssets(cache) {
  const cached = await cache.match(ASSET_MANIFEST)
  if (!cached) return []
  try {
    const data = await cached.clone().json()
    return Array.isArray(data.assets) ? data.assets.filter((path) => typeof path === 'string' && path.startsWith('/assets/')) : []
  } catch {
    return []
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await cache.addAll(SHELL.map((path) => new Request(path, { cache: 'reload' })))
      const shell = await cache.match('/')
      const html = shell ? await shell.text() : ''
      try {
        await cache.add(new Request(ASSET_MANIFEST, { cache: 'reload' }))
      } catch {
        // No manifest (dev server): lazy chunks are still cached the first time each route opens.
      }
      const assets = [...new Set([...assetsIn(html), ...(await manifestAssets(cache))])]
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
        const keep = new Set([...assetsIn(await shell.text()), ...(await manifestAssets(cache))])
        for (const request of await cache.keys()) {
          const path = new URL(request.url).pathname
          if (path.startsWith('/assets/') && !keep.has(path)) await cache.delete(request)
        }
      }
      await self.clients.claim()
    })(),
  )
})

// Never cache the API or anything signed in. Everything else is network first with cache fallback (offline).
function bypass(url) {
  return url.pathname === '/api' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/cdn-cgi/')
}

// Only '/' (the app shell) is stored under '/'. Server-rendered pages (/privacy, /terms, /search/...)
// are stored under their own path, so visiting one never replaces the shell that hash routes need offline.
function cacheKeyFor(request, url) {
  if (request.mode !== 'navigate') return request
  const path = url.pathname.replace(/\/+$/, '') || '/'
  return path === '/index.html' ? '/' : path
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
        if (response.ok && response.type === 'basic' && !response.redirected) {
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


// Match alerts: the page posts new on-device matches; show a notification only when the user already granted permission.
self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'leasepath-match-alert') return
  const title = typeof data.title === 'string' ? data.title : 'LeasePath match'
  const body = typeof data.body === 'string' ? data.body : ''
  const tag = typeof data.tag === 'string' ? data.tag : 'leasepath-match'
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      data: data.data || { open: '/#/plan' },
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = '/#/plan'
  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of clientsList) {
        if ('focus' in client) {
          await client.focus()
          if ('navigate' in client) {
            try { await client.navigate(target) } catch { /* older clients */ }
          }
          return
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow(target)
    })(),
  )
})
