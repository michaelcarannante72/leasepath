import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { COMMUNITY_SECTIONS } from '../src/freeFood.js'
import { RESOURCES } from '../src/data.js'
import { BOROUGHS, filterSection, matchesQuery, normalize } from '../src/resourceFilter.js'

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')
const page = read('src/components/ResourcesPage.jsx')
const filter = read('src/resourceFilter.js')
const names = (section, opts) => filterSection(section, opts).map((item) => item.name)
const food = COMMUNITY_SECTIONS.find((s) => s.id === 'free-food-title')
const health = COMMUNITY_SECTIONS.find((s) => s.id === 'health-title')

test('search and filters stay in the browser: no network, no storage, no analytics', () => {
  for (const src of [page, filter].map((code) => code.replace(/^\s*\/\/.*$/gm, ''))) {
    assert.doesNotMatch(src, /fetch\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB|document\.cookie|dataLayer|gtag|analytics|history\.(push|replace)State|location\.hash\s*=/)
  }
  assert.match(page, /useState\(''\)/)
})

test('search matches name, neighborhood, borough, and type words, all words required', () => {
  assert.deepEqual(names(food, { query: 'bushwick' }), ['Bushwick Free Store'])
  assert.deepEqual(names(food, { query: 'jackson heights' }), ['Mercadito Solidario Project'])
  assert.ok(names(food, { query: 'Clinton Hill' }).includes('Adelphi Free Store'))
  assert.ok(names(food, { query: 'groceries' }).includes('Community Solidarity'))
  assert.equal(names(food, { query: 'food' }).length, food.items.length)
  assert.deepEqual(names(health, { query: 'naloxone' }), ['PartySafe Medics'])
  assert.deepEqual(names(food, { query: 'bronx zzzz' }), [])
  assert.equal(normalize('  Café  BRONX '), 'cafe bronx')
  assert.ok(matchesQuery({ name: 'X' }, food, '   '))
})

test('borough chips: community listings by area, Online for national services, city programs everywhere', () => {
  assert.deepEqual(BOROUGHS, ['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Online'])
  assert.deepEqual(names(food, { borough: 'Bronx' }), ['Bronx Mutual Aid'])
  assert.ok(names(food, { borough: 'Queens' }).includes('Young Black Queens NYC'))
  assert.ok(names(food, { borough: 'Brooklyn' }).includes('Young Black Queens NYC'))
  const all = COMMUNITY_SECTIONS.flatMap((s) => filterSection(s, { borough: 'Online' }).map((i) => i.name))
  assert.deepEqual(all.sort(), ['AARP Connect2Affect', 'ANAD Communities of Healing', 'Abortion Finder'])
  assert.equal(filterSection({ items: [{ name: 'SNAP', citywide: true }] }, { borough: 'Queens' }).length, 1)
})

test('every listing is still on the page: nothing deleted, sections show counts', () => {
  const count = COMMUNITY_SECTIONS.reduce((sum, s) => sum + s.items.length, 0)
  assert.equal(count, 19)
  for (const s of COMMUNITY_SECTIONS) assert.equal(filterSection(s).length, s.items.length)
  assert.ok(RESOURCES.length >= 20)
  assert.match(page, /RESOURCES\.filter\(\(item\) => item\.group === group\)/)
  assert.match(page, /<span className="section-count">\{count\}<\/span>/)
  assert.match(page, /<PantryFinder \/>/)
})

test('collapsible sections are buttons with aria-expanded and aria-controls; cards have a More disclosure', () => {
  assert.match(page, /aria-expanded=\{open\}/)
  assert.match(page, /aria-controls=\{panel\}/)
  assert.match(page, /hidden=\{!open\}/)
  assert.match(page, /<details className="card-more">/)
  assert.match(page, /<label htmlFor="resource-q">Search resources<\/label>/)
  assert.match(page, /aria-pressed=/)
  assert.match(page, /role="status" aria-live="polite"/)
})

test('category chips cover the five community sections plus city programs', () => {
  assert.deepEqual(COMMUNITY_SECTIONS.map((s) => s.jump),
    ['Food and clothing', 'Housing and drop-in', 'Getting around', 'Health and support', 'Older New Yorkers'])
  assert.match(page, /City programs/)
  const css = read('src/index.css')
  assert.match(css, /\.community-jump \{ position: sticky; top: 0;/)
})

test('Need help now box: 311 for shelter, 988 for crisis, jumps to Food and Health; no Ali Forney stay link', () => {
  assert.match(page, /href="tel:311">Need shelter tonight\? Call 311</)
  assert.match(page, /href="tel:988">/)
  assert.match(page, /988 for a mental health crisis/)
  assert.match(page, /jumpTo\('free-food-title'\)\}>Food</)
  assert.match(page, /jumpTo\('health-title'\)\}>Health and support</)
  const box = page.slice(page.indexOf('<aside className="help-now"'), page.indexOf('</aside>'))
  assert.doesNotMatch(box, /Ali Forney|aliforney|place to stay/i)
})

test('phones are tap-to-call and outside links open in a new tab with noopener noreferrer', () => {
  assert.match(page, /href=\{tel\(item\.phone\)\}/)
  for (const tag of page.match(/<a [^>]*target=[^>]*>/g)) assert.match(tag, /noopener noreferrer/)
  assert.doesNotMatch(page, /rel="noreferrer"/)
})

test('Resources framing is universal for everyone in NYC, not HASA-only; HASA stays labeled in its section', () => {
  assert.match(page, /NYC resources for housing, food, health, and legal help/)
  assert.match(page, /For anyone in New York City who needs help/)
  assert.match(page, /with or without a voucher/)
  assert.doesNotMatch(page, /Open resources for a HASA voucher/)
  assert.doesNotMatch(page, /already has HASA rental assistance/)
  assert.match(page, /HASA-specific/)
  assert.match(page, /Resource Navigator/)
  assert.match(page, /Applying is always free/)
  const data = read('src/data.js')
  assert.match(data, /Rent help and vouchers/)
  assert.doesNotMatch(data, /Rent help next to HASA/)
  assert.match(data, /group: 'HASA voucher'/)
})

test('resource cards share a consistent layout with name, one-line what, meta, and actions', () => {
  assert.match(page, /className="resource-card/)
  assert.match(page, /resource-card-name/)
  assert.match(page, /resource-card-what/)
  assert.match(page, /resource-card-meta/)
  assert.match(page, /className="card-actions"/)
  assert.match(page, /section-icon/)
  assert.match(page, /chip-category/)
  assert.match(page, /resource-empty/)
})
