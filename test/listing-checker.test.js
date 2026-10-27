import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  checkListing,
  parseListingText,
  compareRentLimits,
  findRedFlags,
  SUGGESTED_QUESTIONS,
} from '../src/listingChecker.js'
import { VOUCHERS } from '../src/data/voucherSearches.js'

const sample = `Spacious 2BR in Bushwick, Brooklyn. $2,400/mo. Heat and hot water included. 312 Myrtle Avenue. Email for showing.`

test('parses rent, beds, borough, and a street address from listing text', () => {
  const parsed = parseListingText(sample)
  assert.equal(parsed.rent, 2400)
  assert.equal(parsed.beds, 2)
  assert.equal(parsed.unitKind, 'apartment')
  assert.equal(parsed.sizeSlug, '2br')
  assert.equal(parsed.borough, 'Brooklyn')
  assert.match(parsed.addressHint, /Myrtle/i)
})

test('parses studio, SRO, and worded bedroom counts', () => {
  assert.equal(parseListingText('Bright studio in Astoria, Queens — $1,950 a month').sizeSlug, 'studio')
  assert.equal(parseListingText('SRO room in the Bronx $1,100/mo').sizeSlug, 'sro')
  assert.equal(parseListingText('Three bedroom apartment in Manhattan rent $3800').beds, 3)
  assert.equal(parseListingText('1 bed near Fordham, Bronx $1800/month').borough, 'Bronx')
})

test('rent comparison uses only CityFHEPS, FHEPS, and NYCHA Section 8', () => {
  const parsed = parseListingText(sample)
  const rows = compareRentLimits(parsed)
  assert.deepEqual(rows.map((r) => r.program).sort(), ['CityFHEPS', 'FHEPS', 'NYCHA Section 8'].sort())
  assert.equal(rows.length, VOUCHERS.length)
  for (const row of rows) {
    assert.ok(row.status === 'within' || row.status === 'over' || row.status === 'skipped')
    assert.ok(row.source?.url)
    assert.doesNotMatch(row.summary, /HASA|HPD|HCR/)
  }
})

test('flags upfront fees, no-programs, wire/crypto, and missing address', () => {
  const bad = '1BR Manhattan $900. No programs. Pay holding fee by Zelle or bitcoin before viewing.'
  const parsed = parseListingText(bad)
  const flags = findRedFlags(bad, parsed)
  const ids = flags.map((f) => f.id)
  assert.ok(ids.includes('no-programs'))
  assert.ok(ids.includes('wire-crypto'))
  assert.ok(ids.includes('upfront-fee') || ids.includes('too-good'))
  assert.ok(ids.includes('no-address') || ids.includes('too-good'))
})

test('too-good-to-be-true fires when rent is far below the verified max', () => {
  const text = '4 bedroom in Manhattan $700/mo. 100 West 57th Street.'
  const parsed = parseListingText(text)
  assert.equal(parsed.rent, 700)
  const flags = findRedFlags(text, parsed)
  assert.ok(flags.some((f) => f.id === 'too-good'))
})

test('checkListing returns checklist, questions, and never claims approval', () => {
  const result = checkListing(sample)
  assert.equal(result.empty, false)
  assert.ok(result.checklist.length >= 6)
  assert.ok(result.checklist.every((item) => typeof item.pass === 'boolean'))
  assert.ok(result.questions.length >= 5)
  assert.equal(result.questions, SUGGESTED_QUESTIONS)
  const blob = JSON.stringify(result)
  assert.doesNotMatch(blob, /\byou qualify\b/i)
  assert.doesNotMatch(blob, /\bis approved\b/i)
})

test('empty paste returns empty result and does not invent flags', () => {
  const result = checkListing('   ')
  assert.equal(result.empty, true)
  assert.equal(result.flags.length, 0)
  assert.equal(result.comparisons.length, 0)
})

test('page, route, Resources link, and share path are wired; work stays on-device', () => {
  const page = readFileSync(new URL('../src/components/ListingCheckerPage.jsx', import.meta.url), 'utf8')
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const resources = readFileSync(new URL('../src/components/ResourcesPage.jsx', import.meta.url), 'utf8')
  const worker = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8')
  const module = readFileSync(new URL('../src/listingChecker.js', import.meta.url), 'utf8')

  assert.match(page, /Paste the listing text/)
  assert.match(page, /Stays on your phone/)
  assert.match(page, /source-of-income discrimination/)
  assert.match(page, /you may qualify/i)
  assert.doesNotMatch(page, /fetch\(|XMLHttpRequest|navigator\.sendBeacon/)
  assert.match(app, /listing-check/)
  assert.match(app, /ListingCheckerPage/)
  assert.match(resources, /#\/listing-check/)
  assert.match(worker, /'listing-check'/)
  assert.match(module, /Nothing leaves the device|on-device/i)
  assert.doesNotMatch(module, /HASA.*maxRent|hasaRow|HPD.*payment/)
})

test('Ruby points pasted ads to the on-device checker', () => {
  const guide = readFileSync(new URL('../server/guide.js', import.meta.url), 'utf8')
  assert.match(guide, /listing-check/)
  assert.match(guide, /on their phone/)
})
