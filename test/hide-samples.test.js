import test from 'node:test'
import assert from 'node:assert/strict'
import { SAMPLE_LISTINGS_ENABLED } from '../src/features.js'
import { LISTINGS } from '../src/data.js'
import { SHEET_LISTINGS, filterSheetListings } from '../src/data/sheetListings.js'
import { matchFeed } from '../src/data/matchFeed.js'

test('sample apartments are switched off by a flag, and the sample data is kept', () => {
  assert.equal(SAMPLE_LISTINGS_ENABLED, false)
  assert.ok(LISTINGS.length > 0, 'sample data stays in src/data.js')
})

test('with samples off, Search has HRA-list apartments and match alerts have no sample units', () => {
  assert.ok(SHEET_LISTINGS.length > 0)
  assert.equal(filterSheetListings({}).length, SHEET_LISTINGS.length)
  assert.ok(matchFeed().every((item) => item.kind !== 'unit'))
})
