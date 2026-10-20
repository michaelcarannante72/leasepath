import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { ALLOWED_KEYS, CONSENT_KEY, GTM_ID, PAGE_EVENT, isSensitiveView, loadGtm, readConsent, safePush, sanitizedPage, trackView, writeConsent } from '../src/analytics.js'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

function fakePage() {
  const appended = []
  const doc = { head: { appendChild: (node) => appended.push(node) }, createElement: (tag) => ({ tagName: tag }) }
  const win = { location: { origin: 'https://leasepath.app' } }
  return { win, doc, appended }
}

function memoryStorage() {
  const map = new Map()
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) }
}

test('GTM never loads and nothing is pushed without consent', () => {
  for (const consent of [null, 'denied', undefined, 'yes']) {
    const { win, doc, appended } = fakePage()
    assert.equal(loadGtm(win, doc, consent), false)
    assert.equal(trackView(win, doc, { hashPath: '/steps', assistantOpen: false, consent }), null)
    assert.equal(appended.length, 0)
    assert.equal(win.dataLayer, undefined)
  }
  const index = read('index.html')
  assert.doesNotMatch(index, /googletagmanager|GTM-|dataLayer/)
  assert.doesNotMatch(index + read('src/main.jsx'), /ns\.html/)
})

test('with consent, GTM loads once with the right container and one sanitized page event per view', () => {
  const { win, doc, appended } = fakePage()
  trackView(win, doc, { hashPath: '/steps', assistantOpen: false, consent: 'granted' })
  trackView(win, doc, { hashPath: '/after-you-find', assistantOpen: false, consent: 'granted' })
  assert.equal(appended.length, 1)
  assert.equal(appended[0].src, `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`)
  const views = win.dataLayer.filter((item) => item.event === PAGE_EVENT)
  assert.deepEqual(views.map((v) => v.page_path), ['/#/steps', '/#/after-you-find'])
  assert.equal(views[0].page_location, 'https://leasepath.app/#/steps')
  // The sanitized page fields are set before the GTM start event.
  const first = win.dataLayer.findIndex((item) => item.page_location)
  const start = win.dataLayer.findIndex((item) => item.event === 'gtm.js')
  assert.ok(first < start)
})

test('HASA and Ruby views push nothing and do not load GTM', () => {
  const sensitive = [
    { hashPath: '/plan', assistantOpen: false },
    { hashPath: '/resources', assistantOpen: false },
    { hashPath: '/blog/hasa-rent-tips', assistantOpen: false },
    { hashPath: '/info/HASA', assistantOpen: false },
    { hashPath: '/steps', assistantOpen: true },
    { hashPath: '/listing/crown-heights-1br', assistantOpen: true },
  ]
  for (const view of sensitive) {
    assert.equal(isSensitiveView(view), true, JSON.stringify(view))
    const { win, doc, appended } = fakePage()
    assert.equal(trackView(win, doc, { ...view, consent: 'granted' }), null)
    assert.equal(appended.length, 0)
    assert.equal(win.dataLayer, undefined)
  }
  // After GTM is loaded on a normal page, moving to a sensitive view adds nothing.
  const { win, doc } = fakePage()
  trackView(win, doc, { hashPath: '/steps', assistantOpen: false, consent: 'granted' })
  const count = win.dataLayer.length
  trackView(win, doc, { hashPath: '/plan', assistantOpen: false, consent: 'granted' })
  trackView(win, doc, { hashPath: '/steps', assistantOpen: true, consent: 'granted' })
  assert.equal(win.dataLayer.length, count)
})

test('no sensitive keys or values ever go into dataLayer', () => {
  const win = {}
  const pushed = safePush(win, { event: PAGE_EVENT, page_path: '/#/steps', program: 'HASA', voucher: 'CityFHEPS', income: 2400, letterRent: '2800', household: 3, message: 'my case number', answers: { a: 1 }, page_title: 'x' })
  assert.deepEqual(Object.keys(pushed).sort(), ['event', 'page_path', 'page_title'])
  assert.deepEqual(ALLOWED_KEYS, ['event', 'page_location', 'page_path', 'page_title'])
  assert.equal(sanitizedPage('/listing/a?income=2400&program=HASA').page_path, '/#/listing/a')
  // Only analytics.js touches dataLayer, and only through safePush or the GTM start object.
  const app = read('src/App.jsx')
  assert.doesNotMatch(app, /dataLayer/)
  assert.match(app, /trackView\(window, document, \{ hashPath: [^}]*assistantOpen, consent: analyticsConsent \}\)/)
  const source = read('src/analytics.js')
  assert.equal((source.match(/dataLayer\.push\(/g) || []).length, 2)
})

test('the choice is stored on the device and can be changed from the footer', () => {
  const storage = memoryStorage()
  assert.equal(readConsent(storage), null)
  writeConsent('granted', storage)
  assert.equal(storage.getItem(CONSENT_KEY), 'granted')
  writeConsent('denied', storage)
  assert.equal(readConsent(storage), 'denied')
  assert.match(read('src/components/AnalyticsConsent.jsx'), />No thanks<\/button>[\s\S]*>Allow<\/button>/)
  assert.match(read('src/components/Footer.jsx'), /Analytics choice/)
})

test('the Privacy Notice carries the approved analytics line, and cookie copy names the _ga cookies', async () => {
  const { SITE_PAGES } = await import('../src/sitePages.js')
  const { PRIVACY_DRAFT } = await import('../src/analytics.js')
  const privacy = SITE_PAGES.find((p) => p.slug === 'privacy').body
  const cookies = SITE_PAGES.find((p) => p.slug === 'cookies').body
  assert.ok(privacy.includes(PRIVACY_DRAFT))
  for (const text of [privacy, cookies, read('src/components/CookiePrompt.jsx')]) {
    assert.match(text, /Google Analytics sets its own cookies \(_ga\) for analytics only/)
    assert.match(text, /no advertising cookies and no sale of information/)
  }
  assert.doesNotMatch(cookies, /uses three cookies/)
})
