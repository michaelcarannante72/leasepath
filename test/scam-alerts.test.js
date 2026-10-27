import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { RED_FLAGS, REPORT, SCAM_ROUTE, SOURCES } from '../src/scamAlerts.js'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('red flags cover fees, fake agents, wire/crypto, and keys before viewing', () => {
  const blob = RED_FLAGS.map((f) => f.id + f.title + f.body).join(' ')
  assert.match(blob, /application|processing/i)
  assert.match(blob, /NYCHA agents|posing as NYCHA/i)
  assert.match(blob, /crypto|wire|gift card/i)
  assert.match(blob, /before you view|Keys/i)
  for (const flag of RED_FLAGS) {
    assert.ok(flag.sources.every((id) => SOURCES[id]), flag.id)
  }
})

test('report contacts include 311, DCWP, and NY AG with verified phones/links', () => {
  const ids = REPORT.map((r) => r.id)
  assert.ok(ids.includes('311') && ids.includes('dcwp') && ids.includes('ag'))
  assert.equal(SOURCES.dcwpComplaint.href, 'https://www.nyc.gov/site/dca/consumers/file-complaint.page')
  assert.equal(SOURCES.agHousing.href, 'https://ag.ny.gov/file-complaint/housing-real-estate')
  const ag = REPORT.find((r) => r.id === 'ag')
  assert.equal(ag.phone, '1-800-771-7755')
  const nycha = REPORT.find((r) => r.id === 'nycha-ig')
  assert.equal(nycha.phone, '212-306-3355')
  assert.match(read('src/scamAlerts.js'), /1-800-347-3735/)
})

test('page is routed and linked from Resources, listing fit note, and NYCHA scam warning', () => {
  assert.equal(SCAM_ROUTE, '/scam-alerts')
  const app = read('src/App.jsx')
  assert.match(app, /hash === '\/scam-alerts'/)
  assert.match(app, /route\.name === 'scam' && <ScamAlertsPage/)
  assert.match(read('src/components/ResourcesPage.jsx'), /#\/scam-alerts/)
  assert.match(read('src/components/DetailPage.jsx'), /#\/scam-alerts/)
  assert.match(read('src/components/AfterYouFindPage.jsx'), /#\/scam-alerts/)
  const page = read('src/components/ScamAlertsPage.jsx')
  assert.match(page, /Red flags/)
  assert.match(page, /How to report/)
  assert.doesNotMatch(page, /\bHIV\b|medical history/i)
})
