import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import {
  BOROUGH_GUIDES,
  GUIDE_SOURCES,
  HRA_HOURS,
  guideFor,
  guideList,
  searchLinksFor,
  telHref,
} from '../src/data/boroughGuides.js'
import { BOROUGHS } from '../src/data/voucherSearches.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

test('every borough in SEARCH has a voucher-renter guide', () => {
  assert.equal(guideList().length, BOROUGHS.length)
  for (const borough of BOROUGHS) {
    const guide = guideFor(borough.slug)
    assert.ok(guide, borough.slug)
    assert.equal(guide.slug, borough.slug)
    assert.equal(guide.name, borough.name)
    assert.ok(guide.transit.length >= 2, borough.slug)
    assert.ok(guide.tips.length >= 3, borough.slug)
    assert.ok(guide.offices.length >= 1, borough.slug)
  }
})

test('guide offices cite bac or snap and keep phones only when listed', () => {
  for (const guide of guideList()) {
    for (const office of guide.offices) {
      assert.ok(office.name)
      assert.ok(office.address)
      assert.ok(['bac', 'snap'].includes(office.source), office.name)
      if (office.phone) {
        assert.match(office.phone, /^\d{3}-\d{3}-\d{4}$/, office.phone)
        assert.match(telHref(office.phone), /^tel:\d{10}$/)
      }
    }
  }
  // Phones copied from the HRA Benefits Access Center page (verified for this branch).
  const phones = Object.values(BOROUGH_GUIDES).flatMap((g) => g.offices.map((o) => o.phone).filter(Boolean))
  for (const phone of [
    '929-252-7310',
    '929-252-3331',
    '212-331-4289',
    '929-221-2809',
    '718-636-2495',
    '212-274-5162',
    '212-331-5110',
    '718-523-2146',
    '718-784-5919',
    '718-637-2144',
    '929-221-7915',
  ]) {
    assert.ok(phones.includes(phone), phone)
  }
  // Lower Manhattan BAC had no phone on the HRA BAC page used for this branch.
  const lower = BOROUGH_GUIDES.manhattan.offices.find((o) => /Lower Manhattan/i.test(o.name))
  assert.ok(lower)
  assert.equal(lower.phone, undefined)
})

test('official source links stay on nyc.gov / mta / nycha / hpd', () => {
  for (const [id, source] of Object.entries(GUIDE_SOURCES)) {
    assert.ok(source.label, id)
    assert.match(
      source.href,
      /^https:\/\/(www\.)?(nyc\.gov|mta\.info)\//,
      `${id}: ${source.href}`,
    )
  }
  assert.match(HRA_HOURS, /Monday/)
  assert.match(GUIDE_SOURCES.bac.href, /job-locations-and-service-centers/)
  assert.match(GUIDE_SOURCES.snap.href, /snap-locations/)
})

test('each guide links into existing /search pages for that borough', () => {
  for (const guide of guideList()) {
    const links = searchLinksFor(guide.slug)
    assert.ok(links.length >= 2, guide.slug)
    for (const link of links) {
      assert.match(link.path, new RegExp(`^/search/[a-z0-9-]+/${guide.slug}/`))
      assert.ok(link.label)
    }
  }
})

test('BoroughGuidesPage and App wire /guides and /guides/:slug', () => {
  const page = read('src/components/BoroughGuidesPage.jsx')
  assert.match(page, /BoroughGuidesIndex/)
  assert.match(page, /BoroughGuidePage/)
  assert.match(page, /#\/guides\/\$\{guide\.slug\}/)
  assert.match(page, /you may qualify/i)
  assert.match(page, /HRA/)
  assert.doesNotMatch(page, /HIV|medical history|collect/i)

  const app = read('src/App.jsx')
  assert.match(app, /BoroughGuidesIndex/)
  assert.match(app, /name: 'guides'/)
  assert.match(app, /name: 'guide'/)
  assert.match(app, /BoroughGuidePage slug=\{route\.id\}/)

  const resources = read('src/components/ResourcesPage.jsx')
  assert.match(resources, /#\/guides/)
  assert.match(resources, /Borough voucher-renter guides/)
})

test('worker and wrangler share /guides like other app pages', () => {
  const worker = read('worker/index.js')
  assert.match(worker, /'guides'/)
  const config = read('wrangler.jsonc')
  assert.match(config, /"\/guides", "\/guides\/"/)
})

test('copy stays plain NYC and does not invent eligibility dollars', () => {
  const data = read('src/data/boroughGuides.js')
  assert.doesNotMatch(data, /\$\d{3,}/)
  assert.doesNotMatch(data, /you qualify(?! for more)/i)
  assert.match(data, /you may qualify/i)
  assert.match(data, /Resource Navigator|shopping letter|ACCESS HRA/i)
})
