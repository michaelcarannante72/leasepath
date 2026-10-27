import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { register } from 'node:module'
import test from 'node:test'
import {
  SEARCH_PAGES,
  VERIFIED_LIMITS,
  VOUCHERS,
  BOROUGHS,
  parseSearchPath,
  FHEPS_2025_LIMITS,
} from '../src/data/voucherSearches.js'
import { searchHtmlForPath, sitemapXml } from '../server/searchPages.js'

const stub = 'export class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env } }'
register(`data:text/javascript,${encodeURIComponent(`
  export async function resolve(specifier, context, next) {
    if (specifier === 'cloudflare:workers') return { url: 'data:text/javascript,${encodeURIComponent(stub)}', shortCircuit: true }
    return next(specifier, context)
  }
`)}`)

const { default: worker } = await import('../worker/index.js')
const base = 'https://leasepath.test'
const env = { USAGE_METER: { getByName() { return { read: async () => 0, consume: async () => ({ ok: true, count: 1 }), release: async () => {} } } }, LEASEPATH_AUTH_SECRET: 'test-secret', GOOGLE_CLIENT_ID: 'client-id' }

test('popular search catalog covers only verified voucher × size rows across five boroughs', () => {
  assert.equal(SEARCH_PAGES.length, Object.keys(VERIFIED_LIMITS).length * BOROUGHS.length)
  assert.equal(SEARCH_PAGES.length, 80)
  for (const [key, limit] of Object.entries(VERIFIED_LIMITS)) {
    const [voucher, size] = key.split(':')
    const pages = SEARCH_PAGES.filter((page) => page.voucherSlug === voucher && page.sizeSlug === size)
    assert.equal(pages.length, 5, key)
    for (const page of pages) assert.equal(page.limit, limit, page.path)
  }
})

test('no HPD, HCR, or HASA dollar search pages exist', () => {
  for (const page of SEARCH_PAGES) {
    assert.doesNotMatch(page.path, /hpd|hcr|hasa/i)
    assert.doesNotMatch(page.voucherSlug, /hpd|hcr|hasa/i)
    assert.doesNotMatch(page.h1, /\bHPD\b|\bHCR\b|\bHASA\b/)
  }
  for (const voucher of VOUCHERS) {
    assert.ok(['cityfheps', 'nycha-section-8', 'fheps'].includes(voucher.slug))
  }
  assert.equal(FHEPS_2025_LIMITS['1br'], 2762)
})

test('Worker serves /search index and a detail page with SEO tags and security headers', async () => {
  const index = await worker.fetch(new Request(`${base}/search`), env)
  assert.equal(index.status, 200)
  assert.match(index.headers.get('content-type'), /text\/html/)
  assert.equal(index.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(index.headers.get('x-frame-options'), 'DENY')
  assert.match(index.headers.get('content-security-policy') || '', /default-src/)
  const indexHtml = await index.text()
  assert.match(indexHtml, /<title>Popular voucher searches · LeasePath<\/title>/)
  assert.match(indexHtml, /rel="canonical" href="https:\/\/leasepath\.app\/search"/)
  assert.match(indexHtml, /Consult our Resource Navigator/)
  assert.doesNotMatch(indexHtml, /housing coach/i)

  const path = '/search/cityfheps/bronx/1br'
  const page = await worker.fetch(new Request(`${base}${path}`), env)
  assert.equal(page.status, 200)
  const html = await page.text()
  assert.match(html, /<h1>CityFHEPS 1-bedroom apartments in the Bronx<\/h1>/)
  assert.match(html, /\$2,734/)
  assert.match(html, /Includes utilities/)
  assert.match(html, /craigslist\.org\/search\/brx\/apa\?max_price=2734&amp;min_bedrooms=1&amp;max_bedrooms=1/)
  assert.match(html, /streeteasy\.com\/for-rent\/bronx\/price:-2734%7Cbeds:1/)
  assert.match(html, /rel="canonical" href="https:\/\/leasepath\.app\/search\/cityfheps\/bronx\/1br"/)
  assert.match(html, /Applying is always free/)
  assert.match(html, /Consult our Resource Navigator/)
  assert.doesNotMatch(html, /housing coach/i)

  assert.equal((await worker.fetch(new Request(`${base}/search/hasa/bronx/1br`), env)).status, 404)
  assert.equal((await worker.fetch(new Request(`${base}/search/cityfheps/bronx/1br`, { method: 'POST' }), env)).status, 405)
  assert.equal((await worker.fetch(new Request(`${base}/search/`, { method: 'HEAD' }), env)).status, 200)
})

test('SRO pages exist only for CityFHEPS; studio uses zero beds on listing sites', () => {
  assert.equal(SEARCH_PAGES.filter((page) => page.sizeSlug === 'sro').length, 5)
  assert.ok(SEARCH_PAGES.every((page) => page.sizeSlug !== 'sro' || page.voucherSlug === 'cityfheps'))
  const sro = SEARCH_PAGES.find((page) => page.path === '/search/cityfheps/manhattan/sro')
  assert.equal(sro.limit, 1953)
  assert.doesNotMatch(sro.craigslist, /min_bedrooms/)
  const studio = SEARCH_PAGES.find((page) => page.path === '/search/nycha-section-8/queens/studio')
  assert.match(studio.craigslist, /min_bedrooms=0&max_bedrooms=0/)
  assert.match(studio.streeteasy, /beds:0/)
})

test('sitemap.xml lists the index and every search page; robots.txt points at it', () => {
  const xml = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
  const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8')
  assert.match(robots, /Sitemap:\s*https:\/\/leasepath\.app\/sitemap\.xml/)
  assert.match(xml, /<loc>https:\/\/leasepath\.app\/search<\/loc>/)
  for (const page of SEARCH_PAGES) {
    assert.match(xml, new RegExp(`<loc>https://leasepath\\.app${page.path.replaceAll('/', '\\/')}</loc>`))
  }
  assert.equal(sitemapXml().split('<url>').length - 1, 81)
  assert.ok(parseSearchPath('/search'))
  assert.ok(searchHtmlForPath('/search/fheps/brooklyn/2br').includes('$3,058'))
})

test('footer chips and wrangler run_worker_first cover /search', () => {
  const footer = readFileSync(new URL('../src/components/Footer.jsx', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
  const config = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')
  assert.match(footer, /Popular voucher searches/)
  assert.match(footer, /popular-searches-mobile/)
  assert.match(footer, /SEARCH_PAGES\.map/)
  assert.match(css, /\.popular-searches-mobile/)
  assert.match(css, /\.popular-searches-desktop/)
  assert.doesNotMatch(readFileSync(new URL('../src/components/Dock.jsx', import.meta.url), 'utf8'), /popular-search|Popular voucher/)
  assert.match(config, /"\/search", "\/search\/\*"/)
})
