import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { SHEET_LABEL, SHEET_LISTINGS, filterSheetListings, matchSheetListing, sheetListingsFor, telHref } from '../src/data/sheetListings.js'
import { searchHtmlForPath } from '../server/searchPages.js'
import { checkListing } from '../src/listingChecker.js'
import { UI_ES } from '../src/i18nUi.es.js'

const csv = readFileSync('/workspace/leasepath/listings/sheet-2026-10-27.csv', 'utf8')

test('35 rows, label is the HRA wording with no endorsement words', () => {
  assert.equal(SHEET_LISTINGS.length, 35)
  assert.equal(SHEET_LABEL, "From an HRA apartment list, Oct 2026. Call to confirm it's still available.")
  const src = readFileSync(new URL('../src/components/SheetListings.jsx', import.meta.url), 'utf8') + readFileSync(new URL('../src/data/sheetListings.js', import.meta.url), 'utf8')
  assert.doesNotMatch(src.replace(/^\/\/.*$/gm, ''), /HRA-approved|official|endorse|partner|accepts vouchers/i)
  assert.ok(UI_ES[SHEET_LABEL])
})

test('rows match the saved transcription exactly', () => {
  const lines = csv.trim().split('\n').slice(1)
  assert.equal(lines.length, 35)
  for (const [i, unit] of SHEET_LISTINGS.entries()) {
    const line = lines[i]
    assert.ok(line.startsWith(`${unit.number},${unit.rooms},${unit.street},${unit.unit || ''},${unit.borough},`), line)
    assert.ok(line.includes(`,${unit.rent},${unit.contact}`), line)
  }
})

test('Harlem rows are Manhattan with the neighborhood kept; Marcy Place stays Bronx', () => {
  for (const n of [4, 5, 21, 22, 23]) assert.deepEqual([SHEET_LISTINGS[n - 1].borough, SHEET_LISTINGS[n - 1].neighborhood], ['Manhattan', 'Harlem'])
  assert.deepEqual([SHEET_LISTINGS[10].borough, SHEET_LISTINGS[10].neighborhood], ['Manhattan', 'West Harlem'])
  assert.equal(SHEET_LISTINGS[32].borough, 'Bronx')
})

test('row 8 short phone gets no tel link; all others do', () => {
  assert.equal(SHEET_LISTINGS[7].tel, null)
  assert.ok(SHEET_LISTINGS[7].phoneFlag)
  assert.equal(SHEET_LISTINGS.filter((u) => !u.tel).length, 1)
  assert.equal(telHref('(917) 563-2458'), 'tel:+19175632458')
})

test('voucher fit uses the verified limits; #13 is over for a 1BR', () => {
  const limits = { studio: [2604, 2604, 2646], '1br': [2734, 2734, 2762], '2br': [2997, 2997, 3058], '3br': [3753, 3753, 3811] }
  for (const unit of SHEET_LISTINGS) {
    assert.deepEqual(unit.fit.map((r) => r.limit), limits[unit.sizeSlug], unit.id)
    for (const r of unit.fit) assert.equal(r.over, unit.rent > r.limit)
  }
  assert.ok(SHEET_LISTINGS[12].fit.every((r) => r.over && r.overBy >= 738))
  assert.ok(SHEET_LISTINGS[1].fit.every((r) => !r.over))
})

test('search filters apply to sheet listings', () => {
  assert.deepEqual(filterSheetListings({ borough: 'Bronx', beds: '2' }).map((u) => u.number), [17, 20, 19, 18, 16])
  assert.equal(filterSheetListings({}).length, 35)
  assert.ok(filterSheetListings({ q: 'harlem' }).length === 6)
  assert.ok(filterSheetListings({ maxRent: '2000' }).every((u) => u.rent <= 2000))
  assert.deepEqual(filterSheetListings({ savedOnly: true }), [])
  assert.equal(filterSheetListings({ beds: 'SRO' }).length, 0)
})

test('SEO pages list matching units with you-may-qualify / over wording', () => {
  const html = searchHtmlForPath('/search/nycha-section-8/manhattan/1br')
  assert.match(html, /293 Riverside Drive #5C/)
  assert.match(html, /Over the NYCHA Section 8 limit \(\$2,734\) by \$766/)
  assert.match(html, /You may qualify with NYCHA Section 8/)
  assert.match(html, /tel:\+12126726350/)
  assert.doesNotMatch(searchHtmlForPath('/search/cityfheps/staten-island/1br'), /HRA list/)
  assert.equal(sheetListingsFor('bronx', 'studio').length, 3)
  assert.match(searchHtmlForPath('/search/fheps/bronx/1br'), /Contact as printed: \(212\) 729-815/)
})

test('listing checker notes a pasted ad that names a listed address or phone', () => {
  assert.deepEqual(checkListing('Nice 1br, 293 Riverside Drive, $3500').sheetMatches.map((u) => u.number), [13])
  assert.deepEqual(matchSheetListing('call 718-313-3069').map((u) => u.number), [33])
  assert.deepEqual(checkListing('2br in Queens $2400 call 555 0100').sheetMatches, [])
})

test('only HRA-list apartments render: sample listings are archived behind SHOW_SAMPLE_LISTINGS', async () => {
  const { SHOW_SAMPLE_LISTINGS } = await import('../src/features.js')
  const { LISTINGS } = await import('../src/data.js')
  const { SAMPLE_LISTINGS } = await import('../src/data/sampleListings.archive.js')
  assert.equal(SHOW_SAMPLE_LISTINGS, false)
  assert.deepEqual(LISTINGS, [])
  assert.ok(SAMPLE_LISTINGS.length > 0, 'archived, not deleted')
  const page = readFileSync(new URL('../src/components/SearchPage.jsx', import.meta.url), 'utf8')
  assert.match(page, /<SheetListings filters=\{filters\} primary onChange=\{onChange\} \/>/)
  const sheet = readFileSync(new URL('../src/components/SheetListings.jsx', import.meta.url), 'utf8')
  assert.match(sheet, /No HRA-list apartment matches these filters\./)
})
