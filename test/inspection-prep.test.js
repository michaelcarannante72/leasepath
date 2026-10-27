import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  CHECKLIST,
  LAST_REVIEWED,
  NYCHA_CCC,
  PREP_ROUTE,
  SOURCES,
} from '../src/inspectionPrep.js'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('checklist covers smoke, CO, heat, windows, paint, outlets from official sources', () => {
  const ids = CHECKLIST.map((item) => item.id)
  for (const need of ['smoke', 'co', 'heat-hot-water', 'windows', 'surfaces', 'outlets', 'window-guards']) {
    assert.ok(ids.includes(need), need)
  }
  assert.ok(CHECKLIST.length >= 8)
  for (const item of CHECKLIST) {
    assert.ok(item.title && item.tip && item.sources?.length, item.id)
    for (const sid of item.sources) assert.ok(SOURCES[sid], `${item.id} -> ${sid}`)
  }
  assert.match(LAST_REVIEWED, /2026/)
})

test('sources are official nyc.gov NYCHA/HPD pages only', () => {
  for (const source of Object.values(SOURCES)) {
    assert.match(source.href, /^https:\/\/www\.nyc\.gov\//, source.label)
  }
  assert.equal(NYCHA_CCC.phone, '718-707-7771')
  assert.match(read('src/inspectionPrep.js'), /718-707-7771/)
  assert.match(read('src/components/InspectionPrepPage.jsx'), /NYCHA_CCC\.phone/)
})

test('page is printable, routed, and linked from Steps, Resources, and After you find', () => {
  assert.equal(PREP_ROUTE, '/inspection-prep')
  const app = read('src/App.jsx')
  assert.match(app, /hash === '\/inspection-prep'/)
  assert.match(app, /route\.name === 'prep' && <InspectionPrepPage/)
  assert.match(read('src/components/StepsPage.jsx'), /#\/inspection-prep/)
  assert.match(read('src/components/ResourcesPage.jsx'), /#\/inspection-prep/)
  assert.match(read('src/components/AfterYouFindPage.jsx'), /#\/inspection-prep/)
  const page = read('src/components/InspectionPrepPage.jsx')
  assert.match(page, /Print this checklist/)
  assert.match(page, /window\.print/)
  assert.match(page, /Walk-through checklist/)
  assert.doesNotMatch(page, /HIV|medical history|blood/i)
})

test('no invented heat degree numbers without a cited official figure on this page', () => {
  const all = read('src/inspectionPrep.js') + read('src/components/InspectionPrepPage.jsx')
  assert.doesNotMatch(all, /68\s*°|62\s*°|120\s*°/)
})
