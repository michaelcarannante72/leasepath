import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { assessListing, cardFlags, cardLabel, cardText, filterListings, leadFlag, starterMessage } from '../src/fit.js'
import { SAMPLE_LISTINGS as LISTINGS } from '../src/data/sampleListings.archive.js'

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

test('a 2 bedroom for a household of 2 is only paid up to the 1 bedroom CityFHEPS figure', () => {
  const flags = assessListing(twoBed, { program: 'CityFHEPS', household: 2 })
  const rent = flags.find((flag) => flag.level === 'watch' && flag.text.includes('only up to the 1 bedroom figure'))
  assert.ok(rent)
  assert.match(rent.text, /CityFHEPS 2026 payment standard/)
  assert.match(rent.text, /\$2,734/)
  assert.equal(rent.source.program, 'CityFHEPS')
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
  assert.ok(flags.some((flag) => flag.text.includes('allowance')))
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

const elmhurst = LISTINGS.find((listing) => listing.id === 'elmhurst-1br')

test('the card shows the program result even when the letter says "within"', () => {
  // The letter is high enough to fit, but the tenant pays electric, so the program line carries the caveat.
  const flags = assessListing({ ...elmhurst, programs: ['CityFHEPS'] }, { program: 'CityFHEPS', household: 1, letterRent: 3000 })
  assert.notEqual(leadFlag(flags).kind, 'program', 'the old lead flag was not the program result')
  const lines = cardFlags(flags)
  assert.equal(lines.length, 2)
  assert.equal(lines[0].kind, 'program')
  assert.equal(cardLabel(lines[0]), 'Check utilities')
  assert.equal(cardText(lines[0]), 'Asking rent may fit the CityFHEPS limit before any utility is subtracted. Open it for the figure and source.')
  assert.equal(lines[1].kind, 'letter')
  assert.equal(cardLabel(lines[1]), 'CityFHEPS letter')
  assert.doesNotMatch(lines.map(cardText).join(' '), /Fits the letter/)
})

test('card labels say what was compared and never read as an approval', () => {
  const labels = (flags) => cardFlags(flags).map(cardLabel)
  const fits = assessListing(oneBed, { program: 'HASA', household: 1, letterRent: '' })
  assert.ok(labels(fits).includes('May fit HASA limit'))
  const over = assessListing({ ...oneBed, rent: 3000 }, { program: 'CityFHEPS', household: 1 })
  assert.equal(labels(over)[0], 'Above CityFHEPS limit')
  for (const flags of [fits, over]) for (const line of cardFlags(flags)) assert.notEqual(cardLabel(line), 'Fits the letter')
})

test('a card line with a program figure never shows the figure, only the no-figure summary', () => {
  for (const program of ['HASA', 'CityFHEPS', 'Section 8']) {
    for (const listing of LISTINGS) {
      for (const line of cardFlags(assessListing(listing, { program, household: 1, letterRent: 2500 }, { section8Agency: 'NYCHA', voucherBedrooms: '1' }))) {
        if (line.kind === 'program') assert.doesNotMatch(cardText(line), /\$\d/, `${listing.id} ${program}`)
      }
    }
  }
})

test('an ask-your-caseworker program result stays on the card as its own line', () => {
  const sroTwo = { ...sro, rent: 1500 }
  const lines = cardFlags(assessListing(sroTwo, { program: 'CityFHEPS', household: 2, letterRent: 2000 }))
  assert.match(cardText(lines[0]), /one-adult households only\. Ask your caseworker\./)
  assert.equal(lines[1].kind, 'letter')
})

test('with no program selected the letter line says so and names no program', () => {
  const flags = assessListing(oneBed, { program: '', household: 1, letterRent: 2700 })
  const letter = flags.find((flag) => flag.kind === 'letter')
  assert.match(letter.text, /^No program selected\. Your letter says \$2,700\./)
  assert.equal(cardLabel(letter), 'No program selected')
  assert.doesNotMatch(letter.text, /HASA|CityFHEPS|Section 8/)
  const named = assessListing(oneBed, { program: 'HASA', household: 1, letterRent: 2700 }).find((flag) => flag.kind === 'letter')
  assert.match(named.text, /^Your HASA letter says/)
  assert.equal(cardLabel(named), 'HASA letter')
  assert.deepEqual(cardFlags(flags).map(cardLabel), ['No program selected'])
})

test('screens: flags carry a text label and icon, source text is 14px or larger, the timer is a polite live region, no March 1 date', () => {
  const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
  const css = read('src/index.css')
  const source = /\.source-line \{[^}]*font-size: ([\d.]+)rem/.exec(css)
  assert.ok(Number(source[1]) * 16 >= 14, 'source text is at least 14px')
  assert.match(css, /\.flag-tag/)
  const list = read('src/components/SourceLine.jsx')
  assert.match(list, /className="flag-tag"/)
  assert.match(list, /aria-hidden="true"/)
  const panels = read('src/components/ProgramPanels.jsx')
  assert.match(panels, /role="status"/)
  assert.match(panels, /aria-live="polite"/)
  assert.doesNotMatch(panels, /March/)
  assert.match(panels, /effective April 1, 2026/)
  assert.match(read('src/components/PlanPage.jsx'), /Monthly amount on your letter/)
  assert.doesNotMatch(read('src/components/SearchPage.jsx'), /Fits the letter/)
})

test('a CityFHEPS room that fits the maximum is tagged "Room: ask", not "Check utilities"', () => {
  const room = LISTINGS.find((listing) => listing.unitKind === 'room' && listing.utilities === 'all')
    || { ...LISTINGS.find((listing) => listing.unitKind === 'room'), utilities: 'all', rent: 900 }
  const lines = cardFlags(assessListing({ ...room, rent: Math.min(room.rent, 900) }, { program: 'CityFHEPS', household: 1, letterRent: '' }))
  assert.equal(cardLabel(lines[0]), 'Room: ask')
  assert.match(cardText(lines[0]), /Ask whether a room works for your household\./)
  assert.doesNotMatch(lines.map(cardLabel).join('|'), /Check utilities/)
})

test('search card lines are never clamped, so no caveat or tag can be cut off', () => {
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
  const rules = [...css.matchAll(/(^|\n)\s*\.match\s*\{([^}]*)\}/g)].map((m) => m[2])
  assert.ok(rules.length >= 1)
  for (const body of rules) assert.doesNotMatch(body, /line-clamp|overflow:\s*hidden/)
})
