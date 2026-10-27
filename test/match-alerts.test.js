import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { HOUSING_CONNECT, housingConnectItems, matchFeed, unitItems } from '../src/data/matchFeed.js'
import {
  buildNotification,
  emptyMatchPrefs,
  findMatches,
  findNewMatches,
  itemMatchesPrefs,
  loadMatchPrefs,
  markSeen,
  MATCH_PREFS_KEY,
  saveMatchPrefs,
} from '../src/matchAlerts.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

const memory = new Map()
globalThis.localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => { memory.set(k, String(v)) },
  removeItem: (k) => { memory.delete(k) },
  clear: () => memory.clear(),
  get length() { return memory.size },
  key: (i) => [...memory.keys()][i] ?? null,
}

test('Housing Connect feed cites official HPD / Housing Connect URLs and hotline', () => {
  assert.equal(HOUSING_CONNECT.href, 'https://housingconnect.nyc.gov/PublicWeb/')
  assert.match(HOUSING_CONNECT.hpd, /nyc\.gov\/site\/hpd/)
  assert.equal(HOUSING_CONNECT.hotline, '212-863-7990')
  const items = housingConnectItems()
  assert.equal(items.length, 5)
  for (const item of items) {
    assert.equal(item.kind, 'lottery')
    assert.equal(item.href, HOUSING_CONNECT.href)
    assert.match(item.detail, /you may qualify/i)
  }
})

test('unit feed comes from sample LISTINGS and is not sold as a vacancy', () => {
  const units = unitItems()
  assert.ok(units.length >= 5)
  for (const item of units) {
    assert.equal(item.kind, 'unit')
    assert.match(item.detail, /not a vacancy/i)
    assert.match(item.href, /^#\/listing\//)
  }
  assert.ok(matchFeed().length > units.length)
})

test('prefs stay on device and matching filters borough, size, and voucher', () => {
  memory.clear()
  assert.deepEqual(loadMatchPrefs(), emptyMatchPrefs())
  const prefs = saveMatchPrefs({
    enabled: true,
    borough: 'Brooklyn',
    bedrooms: '1',
    program: 'CityFHEPS',
    notify: false,
    seenIds: [],
  })
  assert.equal(prefs.enabled, true)
  assert.equal(JSON.parse(memory.get(MATCH_PREFS_KEY)).borough, 'Brooklyn')

  const feed = [
    { id: 'a', kind: 'unit', borough: 'Brooklyn', bedrooms: 1, programs: ['CityFHEPS'], title: 'A' },
    { id: 'b', kind: 'unit', borough: 'Queens', bedrooms: 1, programs: ['CityFHEPS'], title: 'B' },
    { id: 'c', kind: 'unit', borough: 'Brooklyn', bedrooms: 2, programs: ['CityFHEPS'], title: 'C' },
    { id: 'd', kind: 'lottery', borough: 'Brooklyn', bedrooms: null, programs: ['CityFHEPS'], title: 'D' },
    { id: 'e', kind: 'unit', borough: 'Brooklyn', bedrooms: 1, programs: ['HASA'], title: 'E' },
  ]
  const hits = findMatches(prefs, feed).map((item) => item.id)
  assert.deepEqual(hits.sort(), ['a', 'd'])
  assert.equal(itemMatchesPrefs(feed[1], prefs), false)
})

test('new matches exclude seen ids; markSeen records them locally', () => {
  memory.clear()
  let prefs = saveMatchPrefs({
    enabled: true,
    borough: 'Brooklyn',
    bedrooms: '',
    program: '',
    seenIds: ['old'],
  })
  const feed = [
    { id: 'old', kind: 'unit', borough: 'Brooklyn', bedrooms: 1, programs: ['CityFHEPS'], title: 'Old' },
    { id: 'new', kind: 'unit', borough: 'Brooklyn', bedrooms: 1, programs: ['CityFHEPS'], title: 'New' },
  ]
  assert.deepEqual(findNewMatches(prefs, feed).map((i) => i.id), ['new'])
  prefs = markSeen(prefs, ['new'])
  assert.ok(prefs.seenIds.includes('new'))
  assert.ok(prefs.lastCheckedAt)
  assert.deepEqual(findNewMatches(prefs, feed), [])
})

test('notification copy stays on-device and does not claim eligibility', () => {
  const note = buildNotification([
    { id: '1', title: 'Check NYC Housing Connect lotteries in Brooklyn' },
    { id: '2', title: 'Crown Heights sample' },
  ])
  assert.match(note.title, /on this device/i)
  assert.match(note.body, /Preferences stay on this phone|Crown Heights|and 1 more/i)
  assert.equal(note.tag, 'leasepath-match')
})

test('UI and service worker only notify after explicit permission wiring', () => {
  const card = read('src/components/MatchAlertsCard.jsx')
  assert.match(card, /requestNotifyPermission/)
  assert.match(card, /Allow phone notifications/)
  assert.match(card, /Turn on match alerts/)
  assert.doesNotMatch(card, /HIV|diagnosis|medical/i)

  const sw = read('public/service-worker.js')
  assert.match(sw, /leasepath-match-alert/)
  assert.match(sw, /showNotification/)
  assert.match(sw, /notificationclick/)
  assert.match(sw, /CACHE_VERSION = 'v7'/)

  const app = read('src/App.jsx')
  assert.match(app, /runMatchCheck/)
  assert.match(app, /MatchAlertBanner/)
  assert.match(app, /matchPrefs/)
})

test('Match alerts page hosts the card and My voucher links to it', () => {
  const page = read('src/components/PlanToolPages.jsx')
  assert.match(page, /<MatchAlertsCard prefs=\{prefs\} onPrefs=\{onPrefs\} seed=\{seed\} \/>/)
  assert.match(read('src/components/PlanPage.jsx'), /href="#\/match-alerts"/)
  assert.match(read('src/App.jsx'), /<MatchAlertsPage prefs=\{matchPrefs\}/)
})
