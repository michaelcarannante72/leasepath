import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { LEASEBOT_ONLY, LEASEBOT_SITEMAP_PATHS, leasebotSitemapXml } from '../src/features.js'
import { SPONSOR_CONTACT } from '../src/data/sponsors.js'
import { UI_ES } from '../src/i18nUi.es.js'

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')
const page = () => read('src/components/LeasebotPage.jsx')
const banner = () => read('src/components/LeasebotBanner.jsx')
const all = () => page() + banner()

test('LEASEBOT_ONLY is the reversible flag that makes / the Leasebot home', () => {
  assert.equal(LEASEBOT_ONLY, true)
  const features = read('src/features.js')
  assert.match(features, /export const LEASEBOT_ONLY = true/)
  assert.match(features, /Flip this to false/)
  const app = read('src/App.jsx')
  assert.match(app, /hash === '\/'/)
  assert.match(app, /LEASEBOT_ONLY \? 'leasebot' : 'search'/)
  assert.match(app, /hash === '\/leasebot'/)
  assert.match(app, /LeasebotPage/)
  assert.match(app, /is-leasebot-only/)
  assert.match(app, /\{!LEASEBOT_ONLY && <Dock/)
  assert.match(read('src/components/Header.jsx'), /onNav && !LEASEBOT_ONLY/)
  assert.match(read('src/components/Header.jsx'), /!LEASEBOT_ONLY && \(/)
  assert.match(read('src/components/Footer.jsx'), /if \(LEASEBOT_ONLY\)/)
  assert.match(read('src/components/Footer.jsx'), /LEGAL_SLUGS/)
  assert.match(read('src/components/Footer.jsx'), /#\/leasebot/)
})

test('Leasebot is a hash route with a clean /leasebot 301', () => {
  assert.match(read('worker/index.js'), /'leasebot'/)
  assert.match(read('public/sitemap.xml'), /<loc>https:\/\/leasepath\.app\/leasebot<\/loc>/)
  assert.match(read('wrangler.jsonc'), /"\/leasebot"/)
  assert.match(read('src/components/SearchPage.jsx'), /from '\.\/LeasebotBanner\.jsx'/)
  assert.match(banner(), /export const LEASEBOT_HASH = '#\/leasebot'/)
})

test('live sitemap shrinks to launch pages while LEASEBOT_ONLY is on', () => {
  const xml = leasebotSitemapXml()
  for (const loc of LEASEBOT_SITEMAP_PATHS) {
    assert.match(xml, new RegExp(`<loc>${loc.replaceAll('.', '\\.')}<\\/loc>`))
  }
  assert.doesNotMatch(xml, /\/search\//)
  assert.doesNotMatch(xml, /\/resources/)
  assert.doesNotMatch(xml, /\/blog/)
  const worker = read('worker/index.js')
  assert.match(worker, /from '\.\.\/src\/features\.js'/)
  assert.match(worker, /leasebotSitemapXml/)
  assert.match(worker, /url\.pathname === '\/sitemap\.xml' && LEASEBOT_ONLY/)
})

test('launch copy uses Michael\'s headline, the subhead, privacy, and agency line', () => {
  const src = all()
  assert.match(src, /Your voucher just got a sidekick\./)
  assert.match(src, /Your AI apartment hunter for NYC voucher holders\. It searches, flags scams, and follows up with landlords\. You approve every message\./)
  assert.match(src, /You approve every message before it goes out/)
  assert.match(src, /never shares HIV status, HASA, or medical details/)
  assert.match(src, /rental subsidy/)
  assert.match(src, /LeasePath isn't a city agency/)
})

test('chat card is labeled Preview, autoplays, and uses only made-up names', () => {
  const src = page()
  const css = read('src/index.css')
  assert.match(src, /tx\('Preview'\)/)
  assert.match(src, /I need a 2 bedroom in the Bronx, CityFHEPS/)
  assert.match(src, /Found 3 that fit your limit\. 1 looks like a scam, so I skipped it\./)
  assert.match(src, /Drafted a message to Jordan at Cedar Place\./)
  assert.match(src, /Approve & send/)
  assert.match(src, /Viewing booked Sat 11am/)
  assert.match(css, /leasebot-show-dots/)
  assert.match(css, /leasebot-approve-glow/)
  assert.match(css, /prefers-reduced-motion: reduce/)
  assert.doesNotMatch(all(), /White Plains|623 East 178/)
})

test('does not over-claim or invent a scrape', () => {
  const src = all()
  assert.doesNotMatch(src, /handles everything/i)
  assert.doesNotMatch(src, /guaranteed/i)
  assert.doesNotMatch(src, /scrape/i)
  assert.doesNotMatch(src, /endorsed by HRA|HRA-approved|official HASA/i)
})

test('Need help now box is on the launch page, not only the footer', () => {
  const launch = page()
  assert.match(launch, /<LeasebotHelpNow headingId="leasebot-page-help-now"/)
  assert.match(banner(), /LeasebotHelpNow headingId="leasebot-home-help-now"/)
  assert.match(all(), /href="tel:311"/)
  assert.match(all(), /Need shelter tonight\? Call 311\./)
  assert.match(all(), /href="tel:718-557-1399"/)
  assert.match(all(), /HASA ServiceLine: 718-557-1399, weekdays 9am to 5pm/)
  assert.doesNotMatch(read('src/components/Footer.jsx'), /LeasebotHelpNow/)
})

test('hero waitlist collects email only, posts to /api/waitlist, and sends nothing to analytics', () => {
  const src = all()
  assert.match(src, /type="email"/)
  assert.match(src, /htmlFor="leasebot-email"/)
  assert.match(src, /id=\{hero \? 'leasebot-hero-cta'/)
  assert.match(src, /Get early access/)
  assert.doesNotMatch(src, /name="(program|voucher|hasa)"/i)
  assert.doesNotMatch(src, /which voucher|voucher program/i)
  assert.doesNotMatch(src, /from ['"].*analytics/)
  assert.doesNotMatch(src, /trackView|gtag|trackEvent/)
  assert.match(src, /fetch\('\/api\/waitlist'/)
  assert.match(src, /waitlistMailto/)
  assert.equal(SPONSOR_CONTACT, 'michaelcarannante@yahoo.com')
})

test('three huge steps and a compact trust strip are on the page', () => {
  const src = page()
  assert.match(src, /leasebot-huge-steps/)
  assert.match(src, /Tell it what you need\./)
  assert.match(src, /It searches and follows up\./)
  assert.match(src, /You approve every message\./)
  assert.match(src, /leasebot-trust-strip/)
  assert.match(src, /Never shares your health or HASA info\./)
  assert.match(src, /Free to chat\./)
  assert.match(src, /Not a city agency\./)
  assert.match(src, /leasebot-wordmark/)
})

test('Spanish exists for every new Leasebot string', () => {
  const keys = [
    'Your voucher just got a sidekick.',
    'Your AI apartment hunter for NYC voucher holders. It searches, flags scams, and follows up with landlords. You approve every message.',
    "You approve every message before it goes out. Leasebot never shares HIV status, HASA, or medical details unless you turn that on. By default it only says you have a rental subsidy. LeasePath isn't a city agency.",
    'Coming soon',
    'Join the waitlist',
    'Get early access',
    'Need shelter tonight? Call 311.',
    'HASA ServiceLine: 718-557-1399, weekdays 9am to 5pm',
    'How Leasebot works',
    'Preview',
    'Your email',
    'Tell it what you need.',
    'It searches and follows up.',
    'You approve every message.',
    'Never shares your health or HASA info.',
    'Free to chat.',
    'Not a city agency.',
    'I need a 2 bedroom in the Bronx, CityFHEPS',
    'Found 3 that fit your limit. 1 looks like a scam, so I skipped it.',
    'Drafted a message to Jordan at Cedar Place.',
    'Approve & send',
    'Viewing booked Sat 11am',
  ]
  for (const key of keys) {
    const es = UI_ES[key]
    assert.equal(typeof es, 'string', key)
    if (key !== 'Preview') assert.notEqual(es, key, key)
  }
})

test('Leasebot page has a visible English/Español switch even when the header toggle is off', () => {
  assert.match(page(), /LanguageSwitch/)
  assert.match(read('src/components/LanguageToggle.jsx'), /export function LanguageSwitch/)
  assert.match(read('src/features.js'), /SPANISH_UI_ENABLED = false/)
  const provider = read('src/components/LanguageProvider.jsx')
  assert.match(provider, /writeLang\(next\)/)
  assert.doesNotMatch(provider, /SPANISH_UI_ENABLED \? next/)
  assert.match(read('src/components/Header.jsx'), /SPANISH_UI_ENABLED && <LanguageToggle/)
})
