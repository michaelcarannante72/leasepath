import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  LANDLORD_ROUTE,
  LIST_UNIT_HASH,
  NYCHA_CCC,
  REASONS,
  SOURCES,
} from '../src/landlordWelcome.js'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('list-unit hash matches landlord-listing-form and is a single constant', () => {
  assert.equal(LIST_UNIT_HASH, '#/list-unit')
  assert.match(read('src/components/LandlordWelcomePage.jsx'), /LIST_UNIT_HASH/)
  assert.match(read('src/components/LandlordWelcomePage.jsx'), /List a voucher-ready unit/)
})

test('reasons cover payment, inspection, and the law with official sources', () => {
  const ids = REASONS.map((r) => r.id)
  assert.ok(ids.includes('payment') && ids.includes('inspection') && ids.includes('law'))
  for (const reason of REASONS) {
    assert.ok(reason.sources.every((id) => SOURCES[id]), reason.id)
  }
  assert.equal(NYCHA_CCC.phone, '718-707-7771')
  assert.match(SOURCES.cchr.href, /cchr/)
})

test('page is routed and linked from Resources', () => {
  assert.equal(LANDLORD_ROUTE, '/landlord-welcome')
  assert.match(read('src/App.jsx'), /hash === '\/landlord-welcome'/)
  assert.match(read('src/App.jsx'), /route\.name === 'landlord' && <LandlordWelcomePage/)
  assert.match(read('src/components/ResourcesPage.jsx'), /#\/landlord-welcome/)
})
