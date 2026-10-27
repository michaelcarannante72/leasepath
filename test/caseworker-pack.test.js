import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  DOCS_TRACKER_KEY,
  LISTING_CHECK_KEY,
  PACK_ROUTE,
  buildPackPdf,
  loadPackSnapshot,
  packFilename,
  packLines,
  shareOrDownloadPack,
} from '../src/caseworkerPack.js'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('pack snapshot reads steps, plan, and optional listing/docs keys without network', () => {
  const store = {
    'leasepath.plan': { program: 'CityFHEPS', household: '3', letterRent: '2300', utilities: '', situation: '', receiving: 'has' },
    'leasepath.steps': [0, 2],
    'leasepath.checks': { letterDate: '2026-09-01' },
    [LISTING_CHECK_KEY]: { address: '123 Test Ave', askingRent: '2200', programs: ['CityFHEPS'] },
    [DOCS_TRACKER_KEY]: { shoppingLetter: 'have', photoId: 'missing' },
  }
  const snapshot = loadPackSnapshot((key, fallback) => (key in store ? store[key] : fallback))
  assert.equal(snapshot.plan.program, 'CityFHEPS')
  assert.equal(snapshot.steps.filter((s) => s.done).length, 2)
  assert.equal(snapshot.listingCheck.address, '123 Test Ave')
  assert.equal(snapshot.docsTracker.photoId, 'missing')
  const empty = loadPackSnapshot(() => null)
  assert.equal(empty.listingCheck, null)
  assert.equal(empty.docsTracker, null)
  const src = read('src/caseworkerPack.js') + read('src/components/CaseworkerPackPage.jsx')
  assert.doesNotMatch(src, /fetch\(|XMLHttpRequest|sendBeacon/)
  assert.match(src, /never uploads|Never uploads|did not upload/i)
})

test('PDF starts with %PDF and includes checklist marks', () => {
  const snapshot = {
    generatedAt: '2026-10-27T12:00:00.000Z',
    plan: { program: 'HASA', household: '1', letterRent: '1500', utilities: '', situation: '', receiving: 'has' },
    checks: {},
    steps: [{ title: 'Name the program', detail: '', done: true }, { title: 'Get the rent', detail: '', done: false }],
    listingCheck: null,
    docsTracker: null,
  }
  const lines = packLines(snapshot)
  assert.ok(lines.some((l) => l.includes('[x] Name the program')))
  assert.ok(lines.some((l) => l.includes('[ ] Get the rent')))
  assert.ok(lines.some((l) => /No listing check saved/i.test(l)))
  const pdf = buildPackPdf(snapshot, lines)
  const head = new TextDecoder().decode(pdf.slice(0, 8))
  assert.equal(head.startsWith('%PDF'), true)
  assert.ok(pdf.byteLength > 200)
  assert.match(packFilename(new Date('2026-10-27T15:00:00Z')), /leasepath-caseworker-pack-20261027\.pdf/)
})

test('shareOrDownloadPack prefers share sheet then falls back to download', async () => {
  const pdf = new TextEncoder().encode('%PDF-1.4 fake')
  const shared = []
  const downloaded = []
  const result = await shareOrDownloadPack(pdf, {
    filename: 't.pdf',
    canShare: () => true,
    share: async (payload) => { shared.push(payload) },
    download: (blob, name) => downloaded.push({ blob, name }),
  })
  assert.equal(result.method, 'share')
  assert.equal(shared[0].files[0].name, 't.pdf')
  assert.equal(downloaded.length, 0)

  const dl = await shareOrDownloadPack(pdf, {
    filename: 't.pdf',
    share: null,
    download: (blob, name) => downloaded.push(name),
  })
  assert.equal(dl.method, 'download')
  assert.deepEqual(downloaded, ['t.pdf'])
})

test('route, Steps/Plan links, and page copy are wired', () => {
  assert.equal(PACK_ROUTE, '/caseworker-pack')
  const app = read('src/App.jsx')
  assert.match(app, /hash === '\/caseworker-pack'/)
  assert.match(app, /route\.name === 'pack' && <CaseworkerPackPage/)
  assert.match(read('src/components/StepsPage.jsx'), /#\/caseworker-pack/)
  assert.match(read('src/components/PlanPage.jsx'), /#\/caseworker-pack/)
  const page = read('src/components/CaseworkerPackPage.jsx')
  assert.match(page, /Share or download PDF/)
  assert.match(page, /Stays on this device/)
})
