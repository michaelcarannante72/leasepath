import assert from 'node:assert/strict'
import { register } from 'node:module'
import test from 'node:test'

// worker/ imports 'cloudflare:workers', which only exists in the Workers runtime. Map it to a stub.
const stub = 'export class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env } }'
register(`data:text/javascript,${encodeURIComponent(`
  export async function resolve(specifier, context, next) {
    if (specifier === 'cloudflare:workers') return { url: 'data:text/javascript,${encodeURIComponent(stub)}', shortCircuit: true }
    return next(specifier, context)
  }
`)}`)

const { default: worker } = await import('../worker/index.js')
const base = 'https://leasepath.test'

function memoryNamespace() {
  const counts = new Map()
  return {
    getByName(key) {
      return {
        read: async () => counts.get(key) || 0,
        consume: async (limit) => {
          const count = counts.get(key) || 0
          if (count >= limit) return { ok: false, count }
          counts.set(key, count + 1)
          return { ok: true, count: count + 1 }
        },
        release: async () => counts.set(key, Math.max(0, (counts.get(key) || 0) - 1)),
      }
    },
  }
}

const env = { USAGE_METER: memoryNamespace(), LEASEPATH_AUTH_SECRET: 'test-secret', GOOGLE_CLIENT_ID: 'client-id' }
const post = (body, headers = {}) =>
  worker.fetch(new Request(`${base}/api/guide`, { method: 'POST', body, headers: { origin: base, ...headers } }), env)

test('policy pages are served by the Worker with security headers', async () => {
  const response = await worker.fetch(new Request(`${base}/privacy`), env)
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /text\/html/)
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(response.headers.get('x-frame-options'), 'DENY')
  const head = await worker.fetch(new Request(`${base}/terms/`, { method: 'HEAD' }), env)
  assert.equal(head.status, 200)
  assert.equal((await worker.fetch(new Request(`${base}/privacy`, { method: 'POST' }), env)).status, 405)
})

test('API responses are not cached and carry security headers', async () => {
  const response = await worker.fetch(new Request(`${base}/api/guide`), env)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  const missing = await worker.fetch(new Request(`${base}/api/nope`), env)
  assert.equal(missing.status, 404)
})

test('bad bodies are refused before any work, including bodies with no Content-Length', async () => {
  assert.equal((await post('{not json')).status, 400)
  const huge = JSON.stringify({ messages: [{ role: 'user', content: 'x'.repeat(120_000) }] })
  assert.equal((await post(huge)).status, 413)
  const streamed = new Request(`${base}/api/guide`, {
    method: 'POST',
    headers: { origin: base },
    body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(huge)); controller.close() } }),
    duplex: 'half',
  })
  assert.equal((await worker.fetch(streamed, env)).status, 413)
  assert.equal((await post(JSON.stringify({ messages: [] }))).status, 400)
})

test('an unexpected error becomes a JSON 500 instead of a Worker crash', async () => {
  const broken = {
    ...env,
    get XAI_API_KEY() {
      throw new Error('boom')
    },
  }
  const response = await worker.fetch(
    new Request(`${base}/api/guide`, { method: 'POST', headers: { origin: base }, body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }) }),
    broken,
  )
  assert.equal(response.status, 500)
  assert.match(response.headers.get('content-type'), /json/)
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.equal((await response.json()).error, 'server')
})

test('/after-you-find and /after-you-find/ 301 to the hash route; other paths still 404', async () => {
  for (const path of ['/after-you-find', '/after-you-find/']) {
    const response = await worker.fetch(new Request(`${base}${path}`), env)
    assert.equal(response.status, 301, path)
    assert.equal(response.headers.get('location'), `${base}/#/after-you-find`)
    assert.equal(response.headers.get('x-frame-options'), 'DENY')
  }
  assert.equal((await worker.fetch(new Request(`${base}/after-you-findx`), env)).status, 404)
  const config = (await import('node:fs')).readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')
  assert.match(config, /"run_worker_first": \[[^\]]*"\/after-you-find", "\/after-you-find\/"/)
  assert.match(config, /"not_found_handling": "404-page"/)
})

test('/steps, /resources, /plan, /blog, /housing-connect, /sponsor, /listing-check, /docs-tracker, /guides, /partners (with or without slash) 301 to their hash routes', async () => {
  const config = (await import('node:fs')).readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')
  for (const page of ['steps', 'resources', 'plan', 'blog', 'housing-connect', 'sponsor', 'listing-check', 'docs-tracker', 'guides', 'partners']) {
    for (const path of [`/${page}`, `/${page}/`]) {
      const response = await worker.fetch(new Request(`${base}${path}`), env)
      assert.equal(response.status, 301)
      assert.equal(response.headers.get('location'), `${base}/#/${page}`)
    }
    assert.match(config, new RegExp(`"run_worker_first": \\[[^\\]]*"/${page}", "/${page}/"`))
  }
  assert.equal((await worker.fetch(new Request(`${base}/resourcesx`), env)).status, 404)
})

test('/list-unit, /listings-admin, /voucher-ready 301 to their hash routes', async () => {
  const config = (await import('node:fs')).readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')
  for (const page of ['list-unit', 'listings-admin', 'voucher-ready']) {
    for (const path of [`/${page}`, `/${page}/`]) {
      const response = await worker.fetch(new Request(`${base}${path}`), env)
      assert.equal(response.status, 301)
      assert.equal(response.headers.get('location'), `${base}/#/${page}`)
    }
  }
  assert.match(config, /\/list-unit/)
  assert.match(config, /\/listings-admin/)
  assert.match(config, /\/voucher-ready/)
})
