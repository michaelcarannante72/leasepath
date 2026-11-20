import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { SPONSOR_CONTACT } from '../src/data/sponsors.js'
import { UI_ES } from '../src/i18nUi.es.js'

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')
const page = () => read('src/components/LeasebotPage.jsx')
const banner = () => read('src/components/LeasebotBanner.jsx')
const all = () => page() + banner()

test('Leasebot is a hash route with a clean /leasebot 301', () => {
  const app = read('src/App.jsx')
  assert.match(app, /hash === '\/leasebot'/)
  assert.match(app, /LeasebotPage/)
  assert.match(read('worker/index.js'), /'leasebot'/)
  assert.match(read('public/sitemap.xml'), /<loc>https:\/\/leasepath\.app\/leasebot<\/loc>/)
  assert.match(read('wrangler.jsonc'), /"\/leasebot"/)
  assert.match(read('src/components/SearchPage.jsx'), /from '\.\/LeasebotBanner\.jsx'/)
  assert.match(read('src/components/Footer.jsx'), /#\/leasebot/)
  assert.match(banner(), /export const LEASEBOT_HASH = '#\/leasebot'/)
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

test('chat card is labeled Preview and uses only made-up names', () => {
  const src = page()
  assert.match(src, /tx\('Preview'\)/)
  assert.match(src, /Jordan at Cedar Place/)
  assert.match(src, /Found 4 new 1BRs under your limit in the Bronx/)
  assert.match(src, /Flagged 1 ad: says 'no programs'/)
  assert.match(src, /Viewing booked Sat 11am/)
  assert.doesNotMatch(all(), /White Plains|623 East 178/)
})

test('does not over-claim or invent a scrape', () => {
  const src = all()
  assert.doesNotMatch(src, /handles everything/i)
  assert.doesNotMatch(src, /guaranteed/i)
  assert.doesNotMatch(src, /scrape/i)
  assert.doesNotMatch(src, /endorsed by HRA|HRA-approved|official HASA/i)
})

test('Need help now box is on the launch page and the home banner, not behind the waitlist', () => {
  const launch = page()
  const helpIdx = launch.indexOf('<LeasebotHelpNow headingId="leasebot-page-help-now"')
  const waitIdx = launch.indexOf('<WaitlistForm')
  assert.notEqual(helpIdx, -1)
  assert.notEqual(waitIdx, -1)
  assert.ok(helpIdx < waitIdx, 'help box must appear before the waitlist in the page tree')
  assert.match(banner(), /LeasebotHelpNow headingId="leasebot-home-help-now"/)
  assert.match(all(), /href="tel:311"/)
  assert.match(all(), /Need shelter tonight\? Call 311\./)
  assert.match(all(), /href="tel:718-557-1399"/)
  assert.match(all(), /HASA ServiceLine: 718-557-1399, weekdays 9am to 5pm/)
})

test('waitlist collects email only, uses mailto, and sends nothing to analytics', () => {
  const src = all()
  assert.match(src, /type="email"/)
  assert.match(src, /htmlFor="leasebot-email"/)
  assert.doesNotMatch(src, /name="(program|voucher|hasa)"/i)
  assert.doesNotMatch(src, /which voucher|voucher program/i)
  assert.doesNotMatch(src, /from ['"].*analytics/)
  assert.doesNotMatch(src, /trackView|gtag|trackEvent/)
  assert.match(src, /SPONSOR_CONTACT/)
  assert.match(src, /waitlistMailto/)
  assert.match(src, /mailto:\$\{SPONSOR_CONTACT\}/)
  assert.equal(SPONSOR_CONTACT, 'michaelcarannante@yahoo.com')
})

test('Spanish exists for every new Leasebot string', () => {
  const keys = [
    'Your voucher just got a sidekick.',
    'Your AI apartment hunter for NYC voucher holders. It searches, flags scams, and follows up with landlords. You approve every message.',
    "You approve every message before it goes out. Leasebot never shares HIV status, HASA, or medical details unless you turn that on. By default it only says you have a rental subsidy. LeasePath isn't a city agency.",
    'Coming soon',
    'Join the waitlist',
    'Need shelter tonight? Call 311.',
    'HASA ServiceLine: 718-557-1399, weekdays 9am to 5pm',
    'How Leasebot works',
    'You stay in control',
    'Preview',
    'Your email',
  ]
  for (const key of keys) {
    const es = UI_ES[key]
    assert.equal(typeof es, 'string', key)
    if (key !== 'Preview') assert.notEqual(es, key, key)
  }
})

test('Leasebot page has a visible English/Español switch even when the header toggle is off', () => {
  const src = page()
  assert.match(src, /LanguageSwitch/)
  assert.match(read('src/components/LanguageToggle.jsx'), /export function LanguageSwitch/)
  assert.match(read('src/features.js'), /SPANISH_UI_ENABLED = false/)
  const provider = read('src/components/LanguageProvider.jsx')
  assert.match(provider, /writeLang\(next\)/)
  assert.doesNotMatch(provider, /SPANISH_UI_ENABLED \? next/)
  assert.match(read('src/components/Header.jsx'), /SPANISH_UI_ENABLED && <LanguageToggle/)
})
