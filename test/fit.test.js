import assert from 'node:assert/strict'
import test from 'node:test'
import { assessListing, filterListings, starterMessage } from '../src/fit.js'
import { LISTINGS } from '../src/data.js'

const oneBed = LISTINGS.find((listing) => listing.id === 'crown-heights-1br')
const twoBed = LISTINGS.find((listing) => listing.id === 'sunset-park-2br')
const room = LISTINGS.find((listing) => listing.id === 'inwood-room')
const sro = LISTINGS.find((listing) => listing.id === 'harlem-sro')

test('CityFHEPS household of 2 can use a 1 bedroom inside the 2026 maximum', () => {
  const flags = assessListing(oneBed, { program: 'CityFHEPS', household: 2, letterRent: '' })
  assert.ok(flags.some((flag) => flag.level === 'good' && flag.text.includes('$2,734')))
  assert.equal(flags.some((flag) => flag.level === 'watch'), false)
})

test('a rent above the letter is a watch even when the chart still fits', () => {
  const flags = assessListing(oneBed, { program: 'CityFHEPS', household: 2, letterRent: 2500 })
  assert.ok(flags.some((flag) => flag.text.includes('higher')))
})

test('a 2 bedroom is not the chart size for a household of 2', () => {
  const flags = assessListing(twoBed, { program: 'CityFHEPS', household: 2 })
  assert.ok(flags.some((flag) => flag.level === 'watch' && flag.text.includes('not the size')))
})

test('FHEPS does not borrow the CityFHEPS dollar chart', () => {
  const flags = assessListing(oneBed, { program: 'FHEPS', household: 2, letterRent: 3000 })
  assert.equal(flags.some((flag) => flag.text.includes('CityFHEPS 2026')), false)
  assert.ok(flags.some((flag) => flag.text.includes('FHEPS')))
  assert.ok(flags.some((flag) => flag.text.includes('within that amount')))
})

test('Section 8 does not borrow the CityFHEPS dollar chart', () => {
  const flags = assessListing(oneBed, { program: 'Section 8', household: 2, letterRent: 3000 })
  assert.equal(flags.some((flag) => flag.text.includes('CityFHEPS 2026')), false)
  assert.ok(flags.some((flag) => flag.text.includes('within that amount')))
})

test('HASA on a Section 8-only sample is a watch', () => {
  const flags = assessListing(twoBed, { program: 'HASA' })
  assert.ok(flags.some((flag) => flag.text.includes('not marked for HASA')))
})

test('a CityFHEPS room uses the $1,100 cap', () => {
  const flags = assessListing(room, { program: 'CityFHEPS', household: 1 })
  assert.ok(flags.some((flag) => flag.text.includes('$1,100')))
})

test('an SRO above $1,953 is over the chart for one person', () => {
  const over = { ...sro, rent: 2000 }
  const flags = assessListing(over, { program: 'CityFHEPS', household: 1 })
  assert.ok(flags.some((flag) => flag.level === 'watch' && flag.text.includes('$1,953')))
})

test('tenant-paid electric adds the utility allowance note', () => {
  const electric = LISTINGS.find((listing) => listing.id === 'elmhurst-1br')
  const flags = assessListing({ ...electric, programs: ['CityFHEPS'] }, { program: 'CityFHEPS', household: 1 })
  assert.ok(flags.some((flag) => flag.text.includes('utility allowance')))
})

test('filters keep the voucher, the borough, and the rent ceiling', () => {
  const result = filterListings(
    LISTINGS,
    { q: '', program: 'HASA', borough: 'Bronx', beds: 'Any', maxRent: 2500, sort: 'rent-asc' },
    [],
  )
  assert.deepEqual(result.map((listing) => listing.id), ['mott-haven-studio', 'fordham-1br'])
})

test('starter message names the program and the asking rent', () => {
  const text = starterMessage(oneBed, { program: 'CityFHEPS', letterRent: 2700 })
  assert.match(text, /CityFHEPS/)
  assert.match(text, /\$2,650/)
  assert.match(text, /\$2,700/)
  assert.doesNotMatch(text, /case number|Social Security/i)
})
