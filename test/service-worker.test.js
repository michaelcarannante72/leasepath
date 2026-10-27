import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const source = readFileSync(new URL('../public/service-worker.js', import.meta.url), 'utf8')
const ORIGIN = 'https://leasepath.test'

function keyOf(input) {
  const raw = typeof input === 'string' ? input : input.url
  const url = new URL(raw, ORIGIN)
  return url.origin === ORIGIN ? url.pathname + url.search : url.href
}

function makeWorker({ routes, offline = false, existingCaches = {} }) {
  const stores = new Map(Object.entries(existingCaches).map(([name, entries]) => [name, new Map(Object.entries(entries))]))
  const listeners = {}
  const fetched = []
  const makeResponse = (body, init = {}) => ({
    ok: (init.status || 200) < 400,
    status: init.status || 200,
    type: init.type || 'basic',
    body,
    clone() { return this },
    async text() { return this.body },
  })
  const cacheApi = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map())
      const store = stores.get(name)
      return {
        async addAll(list) {
          for (const item of list) {
            const path = keyOf(item)
            const found = routes[path]
            if (!found || found.status >= 400) throw new Error(`addAll failed for ${path}`)
            store.set(path, makeResponse(found.body, found))
          }
        },
        async put(request, response) { store.set(keyOf(request), response) },
        async match(request) { return store.get(keyOf(request)) },
        async keys() { return [...store.keys()].map((path) => ({ url: ORIGIN + path })) },
        async delete(request) { return store.delete(keyOf(request)) },
      }
    },
    async keys() { return [...stores.keys()] },
    async delete(name) { return stores.delete(name) },
    async match(request) {
      for (const store of stores.values()) if (store.has(keyOf(request))) return store.get(keyOf(request))
      return undefined
    },
  }
  const self = {
    location: { origin: ORIGIN },
    addEventListener(type, handler) { listeners[type] = handler },
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  }
  const context = {
    self,
    caches: cacheApi,
    URL,
    Request: class { constructor(path) { this.url = new URL(path, ORIGIN).href } },
    fetch: async (request) => {
      const path = keyOf(request)
      fetched.push(path)
      if (offline) throw new TypeError('offline')
      const found = routes[path] || { status: 404, body: 'missing' }
      return makeResponse(found.body, found)
    },
  }
  vm.createContext(context)
  vm.runInContext(source, context)
  const wait = async (type) => {
    let pending
    listeners[type]({ waitUntil(promise) { pending = promise } })
    await pending
  }
  const request = (path, mode = 'cors', method = 'GET') => ({ url: ORIGIN + path, mode, method })
  const fire = async (req) => {
    let pending
    listeners.fetch({ request: req, respondWith(promise) { pending = promise } })
    if (!pending) return { passedThrough: true }
    return pending
  }
  return { stores, fetched, wait, fire, request, context }
}

const SHELL_ROUTES = {
  '/': { body: '<title>LeasePath</title><script src="/assets/index-NEW.js"></script><link href="/assets/index-NEW.css">' },
  '/manifest.webmanifest': { body: '{}' },
  '/favicon.svg': { body: '<svg/>' },
  '/icons/icon-192.png': { body: 'png' },
  '/icons/icon-512.png': { body: 'png' },
  '/icons/icon-maskable-192.png': { body: 'png' },
  '/icons/icon-maskable-512.png': { body: 'png' },
  '/icons/apple-touch-icon.png': { body: 'png' },
  '/assets/index-NEW.js': { body: 'js' },
  '/assets/index-NEW.css': { body: 'css' },
  '/privacy': { body: '<title>Privacy Notice</title>' },
}

test('install precaches the shell and the hashed assets named in index.html', async () => {
  const worker = makeWorker({ routes: SHELL_ROUTES })
  await worker.wait('install')
  const store = worker.stores.get('leasepath-shell-v6')
  assert.ok(store.has('/'))
  assert.ok(store.has('/assets/index-NEW.js'))
  assert.ok(store.has('/assets/index-NEW.css'))
})

test('activate removes old shell caches and stale hashed files, and leaves other caches alone', async () => {
  const worker = makeWorker({
    routes: SHELL_ROUTES,
    existingCaches: {
      'leasepath-shell-v2': { '/': { body: 'old' } },
      'unrelated-cache': { '/x': { body: 'keep' } },
    },
  })
  await worker.wait('install')
  const store = worker.stores.get('leasepath-shell-v6')
  store.set('/assets/index-OLD.js', { body: 'stale' })
  await worker.wait('activate')
  assert.equal(worker.stores.has('leasepath-shell-v2'), false)
  assert.equal(worker.stores.has('unrelated-cache'), true)
  assert.equal(store.has('/assets/index-OLD.js'), false)
  assert.equal(store.has('/assets/index-NEW.js'), true)
})

test('the API is never intercepted or cached', async () => {
  const worker = makeWorker({ routes: { ...SHELL_ROUTES, '/api/guide': { body: '{}' }, '/api/account': { body: '{}' } } })
  await worker.wait('install')
  assert.equal((await worker.fire(worker.request('/api/guide'))).passedThrough, true)
  assert.equal((await worker.fire(worker.request('/api/account'))).passedThrough, true)
  assert.equal((await worker.fire(worker.request('/api/pantries?x=1'))).passedThrough, true)
  assert.equal(worker.stores.get('leasepath-shell-v6').has('/api/guide'), false)
  assert.equal((await worker.fire(worker.request('/anything', 'cors', 'POST'))).passedThrough, true)
})

test('visiting a server-rendered policy page does not replace the offline app shell', async () => {
  const online = makeWorker({ routes: SHELL_ROUTES })
  await online.wait('install')
  await online.fire(online.request('/privacy', 'navigate'))
  const store = online.stores.get('leasepath-shell-v6')
  assert.match(store.get('/').body, /<title>LeasePath<\/title>/)
  assert.match(store.get('/privacy').body, /Privacy Notice/)
  // Same stores, now offline.
  const offline = makeWorker({ routes: SHELL_ROUTES, offline: true, existingCaches: { 'leasepath-shell-v6': Object.fromEntries(store) } })
  assert.match((await offline.fire(offline.request('/', 'navigate'))).body, /<title>LeasePath<\/title>/)
  assert.match((await offline.fire(offline.request('/privacy', 'navigate'))).body, /Privacy Notice/)
  // A policy page that was never opened falls back to the shell instead of the browser error page.
  assert.match((await offline.fire(offline.request('/terms', 'navigate'))).body, /<title>LeasePath<\/title>/)
})

test('a 404 is passed through and never stored over the app shell', async () => {
  const worker = makeWorker({ routes: SHELL_ROUTES })
  await worker.wait('install')
  const response = await worker.fire(worker.request('/cookies', 'navigate'))
  assert.equal(response.status, 404)
  assert.match(worker.stores.get('leasepath-shell-v6').get('/').body, /<title>LeasePath<\/title>/)
})

test('offline, a missing non-page request still errors instead of returning HTML', async () => {
  const worker = makeWorker({ routes: SHELL_ROUTES, offline: true, existingCaches: { 'leasepath-shell-v6': { '/': { body: 'shell' } } } })
  await assert.rejects(worker.fire(worker.request('/icons/never-cached.png', 'no-cors')))
})

test('a server-rendered /search page is cached under its own path and never replaces the app shell', async () => {
  const routes = { ...SHELL_ROUTES, '/search/fheps/bronx/1br': { body: '<title>FHEPS Bronx 1BR</title>' } }
  const online = makeWorker({ routes })
  await online.wait('install')
  await online.fire(online.request('/search/fheps/bronx/1br', 'navigate'))
  const store = online.stores.get('leasepath-shell-v6')
  assert.match(store.get('/').body, /<title>LeasePath<\/title>/)
  const offline = makeWorker({ routes: {}, offline: true, existingCaches: { 'leasepath-shell-v6': Object.fromEntries(store) } })
  assert.match((await offline.fire(offline.request('/', 'navigate'))).body, /<title>LeasePath<\/title>/)
  assert.match((await offline.fire(offline.request('/search/fheps/bronx/1br', 'navigate'))).body, /FHEPS Bronx 1BR/)
})
