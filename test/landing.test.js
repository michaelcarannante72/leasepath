import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import test from 'node:test'
import { HERO_PHOTO, NOT_AFFILIATED, landingSample } from '../src/landing.js'

const hero = readFileSync(new URL('../src/components/LandingHero.jsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

test('the not-affiliated line is rendered in the hero text and never hidden on either layout', () => {
  assert.equal(NOT_AFFILIATED, 'Not affiliated with HRA, NYCHA, or any government agency.')
  const i18n = readFileSync(new URL('../src/i18n.js', import.meta.url), 'utf8')
  assert.match(i18n, /'hero\.notAffiliated': 'Not affiliated with HRA, NYCHA, or any government agency\.'/)
  assert.match(hero, /className="not-affiliated">\{t\(["']hero\.notAffiliated["']\)\}<\/p>/)
  // Lives in .hero-text, which shows on mobile and desktop.
  const text = hero.slice(hero.indexOf('className="hero-text"'), hero.indexOf('</section>'))
  assert.ok(text.includes('not-affiliated'), 'line sits inside .hero-text')
  for (const block of css.split('@media')) {
    assert.doesNotMatch(block, /\.(not-affiliated|hero-text)[^{]*\{[^}]*display:\s*none/, 'never display:none')
  }
})

test('mobile has no sticky Get started bar, and the hero links to account creation', () => {
  const page = readFileSync(new URL('../src/components/SearchPage.jsx', import.meta.url), 'utf8')
  for (const src of [hero, page, css]) assert.doesNotMatch(src, /get-started|GetStartedBar|Get started/)
  assert.match(hero, /onClick=\{onCheck\}>\{t\(["']hero\.cta["']\)\}<\/button>\s*<p className="hero-account"><a className="hero-account-link" href="#\/" onClick=\{\(event\) => \{ event\.preventDefault\(\); openAccount\(\) \}\}>\{t\(["']hero\.account["']\)\}<\/a>/)
  const i18nEn = readFileSync(new URL('../src/i18n.js', import.meta.url), 'utf8')
  assert.match(i18nEn, /'hero\.cta': 'Check a listing'/)
  assert.match(i18nEn, /'hero\.account': 'Create a free account'/)
  const header = readFileSync(new URL('../src/components/Header.jsx', import.meta.url), 'utf8')
  assert.match(header, /addEventListener\('leasepath:open-account'/)
})

test('phones get no photo; desktop moves the nav into the header and drops the dock', () => {
  // The photo is only rendered on wide screens, so phones never download it.
  assert.match(hero, /\{wide && \(\n\s*<div className="hero-photo">/)
  assert.doesNotMatch(hero, /brownstone-mobile/)
  assert.match(css, /@media \(max-width: 899px\) \{[^]*?\.hero-photo \{ display: none; \}/)
  // Mobile keeps the two big buttons, the any-phone line, and the not-affiliated line.
  assert.match(css, /@media \(max-width: 899px\) \{[^]*?\.hero-account-link \{[^}]*min-height: 52px/)
  assert.match(hero, /t\(["']hero\.anyPhone["']\)/)
  assert.match(readFileSync(new URL('../src/i18n.js', import.meta.url), 'utf8'), /'hero\.anyPhone': 'Works on any phone, no download needed\.'/)
  // Desktop: dock hidden, header nav shown, both from the same tabs.
  assert.match(css, /@media \(min-width: 1024px\) \{\n {2}\.dock \{ display: none; \}/)
  assert.match(css, /\.topnav \{ display: none; \}/)
  const header = readFileSync(new URL('../src/components/Header.jsx', import.meta.url), 'utf8')
  assert.match(header, /<nav className="topnav" aria-label=\{t\(["']nav\.main["']\)\}>\s*\{NAV_TABS\.map/)
  const dock = readFileSync(new URL('../src/components/Dock.jsx', import.meta.url), 'utf8')
  assert.match(dock, /import \{ NAV_TABS \} from '..\/navTabs.js'/)
})

test('the mockup rent figure sits next to "effective April 1, 2026" and is a CityFHEPS example', () => {
  const s = landingSample()
  assert.equal(s.program, 'CityFHEPS')
  assert.equal(s.limit, 2734)
  assert.equal(s.effective, 'effective April 1, 2026')
  assert.equal(s.fits, true)
  assert.equal(s.line, 'Sample: 1-bedroom, household of 2, $2,650/mo with all utilities included — fits your CityFHEPS limit ($2,734).')
  assert.match(hero, /<span className="mock-rent">\{s\.usd\(s\.limit\)\}<\/span>\s*<span className="mock-effective">\{s\.program\} · \{s\.effective\}<\/span>/)
  assert.match(hero, /<span className="mock-label">Max rent<\/span>\s*<span className="mock-rent">\{s\.usd\(s\.limit\)\}/)
  assert.match(hero, /<span className="mock-tag">\{t\(["']hero\.mock\.tag["']\)\}<\/span>/)
  const mock = hero.slice(hero.indexOf('function PhoneMockup'), hero.indexOf('export function LandingHero'))
  assert.doesNotMatch(mock, /HASA|Section/, 'mockup is CityFHEPS only')
})

test('hero images stay under size budget', () => {
  const size = (f) => statSync(new URL(`../public/images/${f}`, import.meta.url)).size
  for (const ext of ['avif', 'webp', 'jpg']) {
    assert.ok(size(`brownstone-desktop.${ext}`) <= 150_000, `desktop ${ext}`)
  }
})

test('Ruby replaces the housing coach in the UI, and the persona keeps the safety rules', async () => {
  const { LANDING_STEPS } = await import('../src/landing.js')
  const { NAV_TABS } = await import('../src/navTabs.js')
  assert.equal(LANDING_STEPS[2].title, 'Consult Ruby, our Resource Navigator')
  assert.equal(NAV_TABS.find((tab) => tab.id === 'assistant').label, 'Ruby')
  const ui = ['src/landing.js', 'src/App.jsx', 'src/components/AssistantSheet.jsx', 'src/components/CookiePrompt.jsx', 'src/components/Paywall.jsx', 'src/premium.js', 'src/sitePages.js']
    .map((f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'))
  for (const src of ui) {
    // Only the internal FREE_COACH_QUESTIONS constant may still say coach.
    assert.doesNotMatch(src.replace(/FREE_COACH_QUESTIONS|coachLimit/g, ''), /coach/i)
  }
  const sheet = ui[2]
  assert.match(sheet, /Resource Navigator/)
  assert.match(sheet, /Ruby is an AI assistant\. Not affiliated with HRA, NYCHA, or any government agency\./)

  const { SYSTEM } = await import('../server/guide.js')
  assert.match(SYSTEM, /^You are Ruby, LeasePath's Resource Navigator and voucher specialist\./)
  assert.doesNotMatch(SYSTEM, /LeasePath coach/)
  for (const rule of [
    /Warm, spunky, straightforward, and you do not take nonsense/,
    /Call out scams plainly/,
    /illegal source-of-income discrimination/,
    /"mija" or "oye," but rarely/,
    /Never write in a fake accent/,
    /never curse/,
    /never stereotype/,
    /If you are unsure .* say so plainly/,
    /an AI assistant from LeasePath, not a person/,
    /not affiliated with HRA, NYCHA, or any government agency/,
    /Never ask for a Social Security number/,
  ]) assert.match(SYSTEM, rule)
})

test('Ruby sits in the center of the dock and the middle of the header nav, from one list', async () => {
  const { NAV_TABS } = await import('../src/navTabs.js')
  const i = NAV_TABS.findIndex((tab) => tab.id === 'assistant')
  assert.equal(NAV_TABS[i].label, 'Ruby')
  assert.equal(NAV_TABS[i].center, true)
  assert.equal(i, 3, 'three tabs before Ruby, two after')
  // Left 3 x 2fr = right 2 x 3fr, so the Ruby column is centered.
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 2fr\)\) 72px repeat\(2, minmax\(0, 3fr\)\);/)
})

test('the Ruby theme is scoped to the assistant sheet and dock button, and respects reduced motion', () => {
  const sheet = readFileSync(new URL('../src/components/AssistantSheet.jsx', import.meta.url), 'utf8')
  assert.match(sheet, /className="sheet ruby-theme"/)
  assert.match(css, /\.ruby-theme, \.ruby-dock \{\n {2}--ruby: #9b1b30;[^}]*--ruby-gold: #d4af37;/)
  // Ruby variables are never declared on :root, and every use of them sits under a Ruby selector.
  const root = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')))
  assert.doesNotMatch(root, /--ruby/)
  for (const [, selector] of css.matchAll(/([^{}]+)\{[^}]*var\(--ruby/g)) {
    assert.match(selector, /ruby-theme|ruby-dock/, `unscoped Ruby color in ${selector.trim()}`)
  }
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\n {2}\.ruby-theme \.sheet-head::after, \.dock-center\.ruby-dock \.dock-icon::after \{ animation: none; \}/)
})

test('Ruby theme text colors pass WCAG AA (4.5:1)', () => {
  const lum = (hex) => {
    const c = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
  }
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
  for (const [fg, bg] of [['ffffff', '9b1b30'], ['9b1b30', 'f4f7fb'], ['7a1526', 'ffffff'], ['9b1b30', 'fffffd'], ['ffffff', 'a85866']]) {
    assert.ok(ratio(fg, bg) >= 4.5, `#${fg} on #${bg} is ${ratio(fg, bg).toFixed(2)}`)
  }
  // Gold is only a border or shimmer, never text on a light background.
  assert.doesNotMatch(css, /[^-]color: var\(--ruby-gold/)
})

test('Ruby opens the chat with Michael\'s exact welcome, in paragraphs, plus Yes / Not yet replies', async () => {
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const i18n = readFileSync(new URL('../src/i18n.js', import.meta.url), 'utf8')
  const expected = [
    "Hi, I'm Ruby. I'm designed to assist you in your housing search and help you navigate the complex and fiercely competitive NYC rental market.",
    'I help you stay focused on finding that apartment with a housing voucher.',
    'I know it can be difficult, even exhausting, to search for an apartment with a voucher.',
    "From here on out, you don't have to do it alone. I will walk you through every step: from homeless to shelter, to SRO, to navigating the complexities of HRA's bureaucracy. I'll help you keep track of your documents and deadlines for your landlord, broker and caseworker.",
    "Welcome to LeasePath. Let's get you into an apartment.",
    'Have you been given a shopping letter yet by your caseworker?',
  ].join('\n\n')
  assert.match(app, /welcomeMessage\(/)
  assert.match(app, /i18nT\(lang, 'ruby\.welcome'\)/)
  assert.ok(i18n.includes("Hi, I'm Ruby. I'm designed to assist you in your housing search"), 'WELCOME content found')
  // Prefer the live EN table so escaped newlines stay exact.
  const { EN } = await import('../src/i18n.js')
  assert.equal(EN['ruby.welcome'], expected)
  // Bubbles keep the paragraph breaks.
  assert.match(css, /\.bubble \{[^}]*white-space: pre-wrap/)
  const sheet = readFileSync(new URL('../src/components/AssistantSheet.jsx', import.meta.url), 'utf8')
  assert.match(sheet, /\{ label: 'Yes', text: 'Yes, my caseworker gave me a shopping letter\.' \}/)
  assert.match(sheet, /\{ label: 'Not yet', text: 'Not yet\. My caseworker has not given me a shopping letter\.' \}/)
  assert.match(sheet, /messages\.length === 1 && LETTER_REPLIES\.map/)
})

test('the hero uses the E. 126th St photo with its CC BY 2.0 credit and source link', () => {
  assert.equal(HERO_PHOTO.credit, 'Photo: edwardhblake, Wikimedia Commons, CC BY 2.0')
  assert.equal(HERO_PHOTO.sourceUrl, 'https://commons.wikimedia.org/wiki/File:17_E._126th_St,_Harlem.jpg')
  assert.match(HERO_PHOTO.alt, /East 126th Street in Harlem/)
  assert.match(hero, /<a className="photo-by" href=\{HERO_PHOTO\.sourceUrl\}[^>]*>\{HERO_PHOTO\.credit\}<\/a>/)
})
