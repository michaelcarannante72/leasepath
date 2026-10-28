import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { isOnline, OFFLINE_READY, subscribeOnline } from '../src/offline.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

test('isOnline reads navigator.onLine and defaults to true when missing', () => {
  assert.equal(isOnline({ navigator: { onLine: false } }), false)
  assert.equal(isOnline({ navigator: { onLine: true } }), true)
  assert.equal(isOnline({}), true)
})

test('subscribeOnline listens for online and offline events', () => {
  const handlers = {}
  const win = {
    navigator: { onLine: true },
    addEventListener: (type, fn) => { handlers[type] = fn },
    removeEventListener: (type, fn) => { if (handlers[type] === fn) delete handlers[type] },
  }
  const seen = []
  const stop = subscribeOnline((value) => seen.push(value), win)
  win.navigator.onLine = false
  handlers.offline()
  win.navigator.onLine = true
  handlers.online()
  assert.deepEqual(seen, [false, true])
  stop()
  assert.equal(handlers.online, undefined)
})

test('offline-ready routes cover Resources, Steps checklist, and key pages', () => {
  const hashes = OFFLINE_READY.map((item) => item.hash)
  for (const need of ['/', '/steps', '/resources', '/plan']) {
    assert.ok(hashes.includes(need), need)
  }
  assert.ok(OFFLINE_READY.some((item) => /docs checklist/i.test(item.label)))
})

test('OfflineBanner and App wire the status banner', () => {
  const banner = read('src/components/OfflineBanner.jsx')
  assert.match(banner, /You are offline/)
  assert.match(banner, /Resources/)
  assert.match(banner, /docs checklist/)
  assert.match(banner, /Ruby and sign-in need a connection/)
  const app = read('src/App.jsx')
  assert.match(app, /OfflineBanner/)
})

test('service worker precaches the shell and falls back offline for app pages', () => {
  const sw = read('public/service-worker.js')
  assert.match(sw, /CACHE_VERSION = 'v10'/)
  assert.match(sw, /Resources, the docs checklist/)
  assert.match(sw, /network first with cache fallback/)
  assert.match(sw, /cache\.addAll\(SHELL/)
  assert.match(sw, /assetsIn/)
})

test('Resources and Steps content ship in the client bundle sources (no network fetch)', () => {
  const resources = read('src/components/ResourcesPage.jsx')
  assert.match(resources, /t\(["']resources\.title["']\)/)
  const i18n = read('src/i18n.js')
  assert.match(i18n, /NYC resources for housing/)
  const steps = read('src/components/StepsPage.jsx')
  assert.match(steps, /From the letter to the lease/)
  const data = read('src/data.js')
  assert.match(data, /export const RESOURCES/)
  assert.match(data, /export const STEPS/)
  assert.doesNotMatch(resources, /fetch\(|XMLHttpRequest/)
  assert.doesNotMatch(steps, /fetch\(|XMLHttpRequest/)
})
