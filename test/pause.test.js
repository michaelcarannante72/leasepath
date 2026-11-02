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
const { isApiPath, isAssetPath, sitePaused, comingSoonHtml, PAUSED_ROBOTS, PAUSED_SITEMAP } = await import('../worker/pause.js')
const base = 'https://leasepath.test'

const memoryNamespace = () => ({
  getByName() {
    return { read: async () => 0, consume: async () => ({ ok: true, count: 1 }), release: async () => {} }
  },
})

// An env with nothing set: the pause switch fails closed, which is the default state.
const pausedEnv = { USAGE_METER: memoryNamespace(), LEASEPATH_AUTH_SECRET: 's' }

async function get(path, env = pausedEnv, method = 'GET') {
  return worker.fetch(new Request(`${base}${path}`, { method }), env)
}

test('the switch fails closed when the variable is absent or meaningless', () => {
  for (const env of [{}, { SITE_PAUSED: '' }, { SITE_PAUSED: '  ' }, { SITE_PAUSED: '1' }, { SITE_PAUSED: 'true' }, { SITE_PAUSED: 'paused' }, { SITE_PAUSED: 'on' }]) {
    assert.equal(sitePaused(env), true, JSON.stringify(env))
  }
})

test('the switch opens on each live word, in any case', () => {
  for (const value of ['0', 'false', 'off', 'no', 'live', 'open', ' OFF ', 'Live']) {
    assert.equal(sitePaused({ SITE_PAUSED: value }), false, value)
  }
})

test('the placeholder is the wording Mikey asked for, and asks not to be indexed', () => {
  assert.match(comingSoonHtml(), /Coming soon to a New York City neighborhood near you\./)
  assert.match(comingSoonHtml(), /<meta name="robots" content="noindex, nofollow">/)
  assert.doesNotMatch(comingSoonHtml(), /voucher apartments|HASA, CityFHEPS, and Section 8\.</)
})

test('robots and sitemap are pages, not assets, so a pause can change them', () => {
  assert.equal(isAssetPath('/robots.txt'), false)
  assert.equal(isAssetPath('/sitemap.xml'), false)
  assert.equal(isAssetPath('/favicon.svg'), true)
  assert.equal(isAssetPath('/icons/icon-192.png'), true)
  assert.equal(isAssetPath('/assets/index-abc.js'), true)
  assert.equal(isAssetPath('/'), false)
  assert.equal(isAssetPath('/search'), false)
})

test('the API is recognised with and without a trailing segment', () => {
  assert.equal(isApiPath('/api'), true)
  assert.equal(isApiPath('/api/guide'), true)
  assert.equal(isApiPath('/apis'), false)
})

test('every public page serves the placeholder while paused', async () => {
  for (const path of ['/', '/privacy', '/terms', '/search', '/search/cityfheps/bronx/sro', '/plan', '/list-unit', '/edit-listing', '/listings-admin', '/a-page-that-does-not-exist']) {
    const response = await get(path)
    assert.equal(response.status, 200, path)
    assert.match(response.headers.get('content-type'), /text\/html/, path)
    assert.equal(response.headers.get('cache-control'), 'no-store', path)
    assert.match(await response.text(), /Coming soon to a New York City neighborhood near you\./, path)
  }
})

test('a HEAD request gets no body but the same status', async () => {
  const response = await get('/', pausedEnv, 'HEAD')
  assert.equal(response.status, 200)
  assert.equal(await response.text(), '')
})

test('a write is refused outright rather than served a page', async () => {
  for (const method of ['POST', 'PUT', 'DELETE']) {
    const response = await get('/book', pausedEnv, method)
    assert.equal(response.status, 503, method)
    assert.equal(response.headers.get('allow'), 'GET, HEAD', method)
  }
})

test('the API answers 503 with a pointer to real help, not a stack trace', async () => {
  const response = await get('/api/listings/approved')
  assert.equal(response.status, 503)
  const data = await response.json()
  assert.equal(data.error, 'paused')
  assert.match(data.message, /nyc\.gov\/hra/)
})

test('chat is behind the same door, so a pause costs no model credits', async () => {
  const response = await worker.fetch(new Request(`${base}/api/guide`, {
    method: 'POST',
    body: '{}',
    headers: { origin: base },
  }), pausedEnv)
  assert.equal(response.status, 503)
})

test('robots.txt closes and the sitemap empties', async () => {
  const robots = await get('/robots.txt')
  assert.equal(robots.status, 200)
  assert.equal(await robots.text(), PAUSED_ROBOTS)
  assert.match(PAUSED_ROBOTS, /Disallow: \//)
  const sitemap = await get('/sitemap.xml')
  assert.equal(sitemap.status, 200)
  assert.equal(await sitemap.text(), PAUSED_SITEMAP)
  assert.doesNotMatch(PAUSED_SITEMAP, /<url>/)
})

test('the icon and fonts still serve, so the placeholder renders right', async () => {
  // Asset requests never reach the Worker (they are not in run_worker_first), so this
  // asserts the routing rule rather than a fetch: they must not be classified as pages.
  for (const path of ['/favicon.svg', '/icons/icon-192.png', '/fonts/inter-latin.woff2', '/manifest.webmanifest']) {
    assert.equal(isAssetPath(path), true, path)
  }
})

test('with the switch open the storefront is back, unchanged', async () => {
  const liveEnv = { ...pausedEnv, SITE_PAUSED: '0' }
  // /privacy is rendered by the Worker itself, so it is a direct read of live mode.
  const privacy = await get('/privacy', liveEnv)
  assert.equal(privacy.status, 200)
  const html = await privacy.text()
  assert.doesNotMatch(html, /Coming soon to a New York City/)
  assert.match(html, /LeasePath/)
  // The API comes back too.
  const api = await get('/api/listings/approved', liveEnv)
  assert.equal(api.status, 200)
})
