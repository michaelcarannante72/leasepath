import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { searchHtmlForPath, sitemapXml } from '../server/searchPages.js'
import { checkListing } from '../src/listingChecker.js'
import { SHOW_SAMPLE_LISTINGS } from '../src/features.js'
import { LISTINGS } from '../src/data.js'
import { SAMPLE_LISTINGS } from '../src/data/sampleListings.archive.js'
import { searchPagesForFilters } from '../src/data/voucherSearches.js'
import { UI_ES } from '../src/i18nUi.es.js'

const root = fileURLToPath(new URL('..', import.meta.url))

const HRA_MARKERS = [
  '1405 Vyse',
  '2515 Olinville',
  '785 Fairmount',
  '293 Riverside Drive',
  '167 Sands Street',
  '35-16 28th Street',
  '876 Greene Avenue',
  '200 Marcy Place',
  '917-563-2458',
  '718-582-3710',
  '718-313-3069',
  '212-672-6350',
  'hra-sheet-',
  'Apartments from an HRA list',
  'From an HRA apartment list',
  'SHEET_LISTINGS',
  'sheetListings.js',
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '.git' || name === '.wrangler' || name === 'social' || name === 'images' || name === 'fonts' || name === 'icons') continue
    const path = join(dir, name)
    const stat = statSync(path)
    if (stat.isDirectory()) walk(path, out)
    else if (/\.(js|jsx|css|html|xml|json|txt|md)$/.test(name)) out.push(path)
  }
  return out
}

test('HRA apartment list files and units are gone from the current tree', () => {
  assert.equal(existsSync(new URL('../src/data/sheetListings.js', import.meta.url)), false)
  assert.equal(existsSync(new URL('../src/components/SheetListings.jsx', import.meta.url)), false)
  const hits = []
  for (const file of walk(root)) {
    const text = readFileSync(file, 'utf8')
    // This test file names a few markers on purpose; skip it.
    if (file.endsWith('sheet-listings.test.js')) continue
    for (const marker of HRA_MARKERS) {
      if (text.includes(marker)) hits.push(`${relative(root, file)}: ${marker}`)
    }
  }
  assert.deepEqual(hits, [], hits.join('\n'))
})

test('archived sample listings do not contain HRA-list addresses or phones', () => {
  const text = readFileSync(new URL('../src/data/sampleListings.archive.js', import.meta.url), 'utf8')
  for (const marker of HRA_MARKERS) assert.equal(text.includes(marker), false, marker)
  assert.ok(SAMPLE_LISTINGS.length > 0, 'archived sample listings are kept for tests')
})

test('sample listings stay archived; search shows the empty state and landlord pitch', () => {
  assert.equal(SHOW_SAMPLE_LISTINGS, false)
  assert.deepEqual(LISTINGS, [])
  const page = readFileSync(new URL('../src/components/SearchPage.jsx', import.meta.url), 'utf8')
  assert.match(page, /<LandlordPitch \/>/)
  assert.match(page, /<SearchEmptyState filters=\{filters\} \/>/)
  assert.doesNotMatch(page, /SheetListings/)
  const pitch = readFileSync(new URL('../src/components/LandlordPitch.jsx', import.meta.url), 'utf8')
  const empty = readFileSync(new URL('../src/components/SearchEmptyState.jsx', import.meta.url), 'utf8')
  const headline = 'Place your apartment on LeasePath and reach voucher-ready tenants.'
  assert.match(pitch, /Place your apartment on LeasePath and reach voucher-ready tenants/)
  assert.match(empty, /Search listings at this limit/)
  assert.match(empty, /Housing Connect lotteries/)
  assert.ok(UI_ES[headline])
  assert.notEqual(UI_ES[headline], headline)
})

test('SEO pages no longer embed HRA units and include the landlord pitch plus search links', () => {
  const html = searchHtmlForPath('/search/nycha-section-8/manhattan/1br')
  assert.doesNotMatch(html, /293 Riverside|1405 Vyse|2515 Olinville|HRA list|HRA apartment/)
  assert.match(html, /Place your apartment on LeasePath and reach voucher-ready tenants/)
  assert.match(html, /\/#\/list-unit/)
  assert.match(html, /Craigslist/)
  assert.match(html, /StreetEasy/)
  assert.match(html, /Housing Connect/)
  assert.doesNotMatch(searchHtmlForPath('/search/cityfheps/staten-island/1br'), /HRA list|1405 Vyse/)
  const sitemap = sitemapXml()
  for (const marker of ['1405 Vyse', '2515 Olinville', 'hra-sheet-', 'HRA list']) {
    assert.equal(sitemap.includes(marker), false, marker)
  }
})

test('listing checker no longer matches former HRA-list addresses or phones', () => {
  const result = checkListing('Nice 1br, 293 Riverside Drive, $3500')
  assert.equal('sheetMatches' in result, false)
  assert.ok(result.parsed.rent === 3500)
})

test('searchPagesForFilters returns prefilled Craigslist and StreetEasy pages', () => {
  const all = searchPagesForFilters({})
  assert.ok(all.length > 0)
  assert.ok(all.every((page) => page.voucherSlug === 'cityfheps' && page.sizeSlug === '1br'))
  const exact = searchPagesForFilters({ program: 'CityFHEPS', borough: 'Bronx', beds: '1' })
  assert.equal(exact.length, 1)
  assert.match(exact[0].craigslist, /craigslist\.org/)
  assert.match(exact[0].streeteasy, /streeteasy\.com/)
  assert.equal(exact[0].borough.name, 'Bronx')
})
