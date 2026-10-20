import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import test from 'node:test'
import { NOT_AFFILIATED, landingSample } from '../src/landing.js'

const hero = readFileSync(new URL('../src/components/LandingHero.jsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

test('the not-affiliated line is rendered in the hero text and never hidden on either layout', () => {
  assert.equal(NOT_AFFILIATED, 'Not affiliated with HRA, NYCHA, or any government agency.')
  assert.match(hero, /<p className="not-affiliated">\{NOT_AFFILIATED\}<\/p>/)
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
  assert.match(hero, /onClick=\{onCheck\}>Check a listing<\/button>\s*<p className="hero-account"><a href="#\/" onClick=\{\(event\) => \{ event\.preventDefault\(\); openAccount\(\) \}\}>Create a free account<\/a>/)
  const header = readFileSync(new URL('../src/components/Header.jsx', import.meta.url), 'utf8')
  assert.match(header, /addEventListener\('leasepath:open-account'/)
  assert.match(css, /@media \(max-width: 899px\) \{\n {2}\.hero-photo \{ height: 180px;/)
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
  assert.match(hero, /<span className="mock-tag">Example<\/span>/)
  const mock = hero.slice(hero.indexOf('function PhoneMockup'), hero.indexOf('export function LandingHero'))
  assert.doesNotMatch(mock, /HASA|Section/, 'mockup is CityFHEPS only')
})

test('hero images stay under size budget', () => {
  const size = (f) => statSync(new URL(`../public/images/${f}`, import.meta.url)).size
  for (const ext of ['avif', 'webp', 'jpg']) {
    assert.ok(size(`brownstone-desktop.${ext}`) <= 150_000, `desktop ${ext}`)
    assert.ok(size(`brownstone-mobile.${ext}`) <= 60_000, `mobile ${ext}`)
  }
})
