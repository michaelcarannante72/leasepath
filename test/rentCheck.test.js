import assert from 'node:assert/strict'
import test from 'node:test'
import { assessListing } from '../src/fit.js'
import { LISTINGS } from '../src/data.js'
import { ASK, ASK_SPECIALIST, askFor, cityfhepsCap, rentFlags, sourceText } from '../src/rentCheck.js'
import { CITYFHEPS_2026_ROWS, CITYFHEPS_RULES } from '../src/data/cityfheps.js'
import { HASA_ROWS, HASA_RULES } from '../src/data/hasa.js'
import { SECTION8_NEW_RENTAL_ROWS, SECTION8_NYCHA_ROWS, SECTION8_RULES } from '../src/data/section8.js'
import { sourceFor } from '../src/data/sourced.js'

const unit = (patch) => ({ id: 'x', unitKind: 'apartment', bedrooms: 1, rent: 1000, utilities: 'all', programs: [], ...patch })

// Typed here on purpose, independent of the data files, from the housing specialist's schedules.
const HASA_EXPECTED = [
  ['studio', 0, 1, 2646], ['apartment', 1, 1, 2762], ['apartment', 2, 3, 3058], ['apartment', 3, 5, 3811], ['apartment', 4, 7, 4111],
  ['apartment', 5, 9, 4728], ['apartment', 6, 11, 5345], ['apartment', 7, 13, 5962], ['apartment', 8, 15, 6579],
]
const CITYFHEPS_EXPECTED = [
  ['sro', 0, 1, 1953], ['studio', 0, 1, 2604], ['apartment', 1, 1, 2734], ['apartment', 2, 3, 2997], ['apartment', 3, 5, 3753],
  ['apartment', 4, 7, 4077], ['apartment', 5, 9, 4689], ['apartment', 6, 11, 5301], ['apartment', 7, 13, 5913], ['apartment', 8, 15, 6524],
]
const NYCHA_NEW_EXPECTED = [[0, 2604], [1, 2734], [2, 2997], [3, 3753], [4, 4077], [5, 4689], [6, 5301], [7, 5913], [8, 6524]]

const fmt = (n) => `$${n.toLocaleString('en-US')}`

function primary(flags) {
  return flags.find((flag) => flag.source && /^(good|watch|note)$/.test(flag.level) && flag.summary)
}

test('HASA rent check uses the HASA schedule for every bedroom size', () => {
  for (const [unitKind, bedrooms, people, cap] of HASA_EXPECTED) {
    const plan = { program: 'HASA', household: people }
    const within = primary(rentFlags(unit({ unitKind, bedrooms, rent: cap }), plan))
    assert.equal(within.level, 'good', `${unitKind} ${bedrooms}`)
    assert.ok(within.text.includes(fmt(cap)))
    assert.ok(within.text.includes('HASA schedule'))
    assert.equal(within.source.program, 'HASA')
    assert.equal(within.source.effectiveDate, '2025-09-10')
    const over = primary(rentFlags(unit({ unitKind, bedrooms, rent: cap + 1 }), plan))
    assert.equal(over.level, 'watch')
    assert.match(over.text, /\$1 higher/)
  }
})

test('CityFHEPS rent check uses the CityFHEPS 2026 standards for every size', () => {
  for (const [unitKind, bedrooms, people, cap] of CITYFHEPS_EXPECTED) {
    const plan = { program: 'CityFHEPS', household: people }
    const within = primary(rentFlags(unit({ unitKind, bedrooms, rent: cap }), plan))
    assert.equal(within.level, 'good', `${unitKind} ${bedrooms}`)
    assert.ok(within.text.includes(fmt(cap)))
    assert.ok(within.text.startsWith('CityFHEPS 2026 payment standard'))
    assert.equal(within.source.program, 'CityFHEPS')
    assert.equal(within.source.effectiveDate, '2026-04-01')
    assert.equal(primary(rentFlags(unit({ unitKind, bedrooms, rent: cap + 1 }), plan)).level, 'watch')
  }
})

test('Section 8 NYCHA check uses the NYCHA new-rental standard for the voucher bedroom size', () => {
  for (const [voucherBedrooms, cap] of NYCHA_NEW_EXPECTED) {
    const plan = { program: 'Section 8', household: 1 }
    const options = { section8Agency: 'NYCHA', voucherBedrooms: String(voucherBedrooms) }
    // The sample is the same size as the voucher, so the NYCHA standard is compared.
    const shape = voucherBedrooms === 0 ? { unitKind: 'studio', bedrooms: 0 } : { unitKind: 'apartment', bedrooms: voucherBedrooms }
    const flags = rentFlags(unit({ ...shape, rent: cap }), plan, options)
    const within = primary(flags)
    assert.equal(within.level, 'good')
    assert.ok(within.text.includes(fmt(cap)))
    assert.equal(within.source.program, 'Section 8')
    assert.equal(within.source.effectiveDate, '2026-01-01')
    assert.equal(primary(rentFlags(unit({ ...shape, rent: cap + 1 }), plan, options)).level, 'watch')
  }
  assert.equal(SECTION8_NEW_RENTAL_ROWS.length, NYCHA_NEW_EXPECTED.length)
})

test('the same 1 bedroom gets a different answer under HASA and CityFHEPS', () => {
  const listing = unit({ bedrooms: 1, rent: 2750 })
  const hasa = primary(rentFlags(listing, { program: 'HASA', household: 1 }))
  const city = primary(rentFlags(listing, { program: 'CityFHEPS', household: 1 }))
  assert.equal(hasa.level, 'good')
  assert.ok(hasa.text.includes('$2,762'))
  assert.ok(!hasa.text.includes('$2,734'))
  assert.equal(city.level, 'watch')
  assert.ok(city.text.includes('$2,734'))
  assert.ok(!city.text.includes('$2,762'))
})

test('HASA never falls back to another program’s row, and has no SRO or room row', () => {
  for (const kind of ['sro', 'room']) {
    const flags = rentFlags(unit({ unitKind: kind, bedrooms: 0, rent: 1500 }), { program: 'HASA', household: 1 })
    assert.equal(flags.length, 1)
    assert.ok(flags[0].text.endsWith(`${ASK}.`))
    assert.doesNotMatch(flags[0].text, /\$\d/)
  }
  // A HASA household with only an SRO-shaped sample still gets no CityFHEPS SRO figure.
  assert.equal(HASA_ROWS.some((row) => row.unitKind === 'sro'), false)
})

test('HASA utility deduction is user-entered and never assumed', () => {
  const listing = unit({ bedrooms: 1, rent: 2700, utilities: 'tenant-electric' })
  const plan = { program: 'HASA', household: 1 }
  const none = rentFlags(listing, plan, {})
  const note = none.find((flag) => /does not know your amount/.test(flag.text))
  assert.ok(note)
  assert.equal(none.some((flag) => /limit is/.test(flag.text)), false)
  assert.ok(none.some((flag) => /deductions are not in the public schedule/.test(flag.text)))
  const entered = rentFlags(listing, plan, { hasaDeduction: '100' })
  const result = entered.find((flag) => flag.level === 'watch')
  assert.match(result.text, /\$100 utility amount you entered, the limit is \$2,662/)
  const fits = rentFlags({ ...listing, rent: 2600 }, plan, { hasaDeduction: '100' }).find((flag) => flag.level === 'good')
  assert.match(fits.text, /within it/)
  // The CityFHEPS allowance selection never changes a HASA check.
  const mixed = rentFlags(listing, plan, { cityfhepsAllowance: 'electric heat+hot water' })
  assert.deepEqual(mixed.map((flag) => flag.text), none.map((flag) => flag.text))
})

test('HASA household range mismatch is a note for the caseworker, not a denial', () => {
  const flags = rentFlags(unit({ bedrooms: 1, rent: 2700 }), { program: 'HASA', household: 3 })
  assert.ok(flags.some((flag) => /lists the 1 bedroom row for 1-2 people/.test(flag.text)))
  assert.equal(primary(flags).level, 'good')
})

test('CityFHEPS follows the bedroom standard for larger and smaller units', () => {
  assert.deepEqual(cityfhepsCap(unit({ bedrooms: 2 }), 2).row.bedrooms, 1)
  assert.equal(cityfhepsCap(unit({ bedrooms: 2 }), 2).reason, 'larger-unit')
  assert.equal(cityfhepsCap(unit({ bedrooms: 1 }), 4).row.bedrooms, 1)
  assert.equal(cityfhepsCap(unit({ bedrooms: 1 }), 4).reason, 'smaller-unit')
  assert.equal(cityfhepsCap(unit({ unitKind: 'studio', bedrooms: 0 }), 1).row.unitKind, 'studio')
  assert.equal(cityfhepsCap(unit({ unitKind: 'sro', bedrooms: 0 }), 2).reason, 'sro-one-adult')
  assert.equal(cityfhepsCap(unit({ bedrooms: 3 }), 20).row, null)
})

test('a CityFHEPS SRO for more than one person says ask your caseworker with no figure', () => {
  const flags = rentFlags(unit({ unitKind: 'sro', bedrooms: 0, rent: 1500 }), { program: 'CityFHEPS', household: 2 })
  assert.equal(flags.length, 1)
  assert.match(flags[0].text, /one-adult households only/)
  assert.ok(flags[0].text.endsWith(`${ASK}.`))
  assert.doesNotMatch(flags[0].text, /\$\d/)
})

test('CityFHEPS room maximum is shown with its source, and a room without utilities is flagged', () => {
  const flags = rentFlags(unit({ unitKind: 'room', bedrooms: 0, rent: 1150, utilities: 'tenant-electric' }), { program: 'CityFHEPS', household: 3 })
  assert.ok(flags.some((flag) => flag.level === 'watch' && flag.text.includes('$1,100') && flag.source.document === 'DSS-8j (E)'))
  assert.ok(flags.some((flag) => /does not include every utility/.test(flag.text)))
  assert.ok(flags.some((flag) => /no more than two adults/.test(flag.text)))
})

test('CityFHEPS utility allowance: 1 bedroom examples work, every other size is not yet loaded', () => {
  const plan = { program: 'CityFHEPS', household: 1 }
  const oneBed = unit({ bedrooms: 1, rent: 2650, utilities: 'tenant-electric' })
  const picked = rentFlags(oneBed, plan, { cityfhepsAllowance: 'electric heat+hot water' })
  const result = picked.find((flag) => flag.extraSources)
  assert.match(result.text, /\$106 allowance for electric heat\+hot water, the limit is \$2,628/)
  assert.equal(result.level, 'watch')
  assert.equal(result.extraSources[0].program, 'CityFHEPS')
  assert.match(sourceText(result.extraSources[0]), /not confirmed for the allowance schedule/)
  const unpicked = rentFlags(oneBed, plan, {})
  assert.ok(unpicked.some((flag) => /Pick yours on My voucher/.test(flag.text)))
  const twoBed = rentFlags(unit({ bedrooms: 2, rent: 2900, utilities: 'tenant-electric' }), { program: 'CityFHEPS', household: 3 }, { cityfhepsAllowance: 'heat pump' })
  const missing = twoBed.find((flag) => /not yet loaded/.test(flag.text))
  assert.match(missing.text, /a 2-bedroom apartment is not yet loaded/)
  assert.ok(missing.text.endsWith(`${ASK}.`))
  assert.equal(twoBed.some((flag) => flag.extraSources), false)
  assert.equal(twoBed.some((flag) => /\$37/.test(flag.text)), false)
  const studio = rentFlags(unit({ unitKind: 'studio', bedrooms: 0, rent: 2400, utilities: 'tenant-electric' }), plan, {})
  assert.ok(studio.some((flag) => /a studio is not yet loaded/.test(flag.text)))
})

test('Section 8 gives no figure until the agency is chosen, and none for HPD or a missing voucher size', () => {
  const plan = { program: 'Section 8', household: 2 }
  const listing = unit({ rent: 2000 })
  for (const options of [{}, { section8Agency: 'NYCHA' }, { section8Agency: 'NYCHA', voucherBedrooms: '' }, { section8Agency: 'HPD', voucherBedrooms: '1' }, { section8Agency: 'NYCHA', voucherBedrooms: '9' }]) {
    const flags = rentFlags(listing, plan, options)
    assert.ok(flags.length >= 1)
    for (const flag of flags) assert.doesNotMatch(flag.text, /\$[\d,]{4,}/, JSON.stringify(options))
  }
  const hpd = rentFlags(listing, plan, { section8Agency: 'HPD' })
  assert.ok(hpd[0].text.includes(ASK_SPECIALIST))
  assert.doesNotMatch(hpd[0].text, /caseworker/)
  assert.match(hpd[0].text, /ZIP/)
  assert.match(hpd[0].text, /“?"?Monthly amount on your letter"?”? box on My voucher|Monthly amount on your letter/)
})

test('a row with no source link or unverified confidence gives "Ask your caseworker" and no number, in every program', () => {
  const cases = [
    [HASA_ROWS, 'HASA', { unitKind: 'apartment', bedrooms: 1 }, {}],
    [CITYFHEPS_2026_ROWS, 'CityFHEPS', { unitKind: 'apartment', bedrooms: 1 }, {}],
    [SECTION8_NYCHA_ROWS, 'Section 8', { unitKind: 'apartment', bedrooms: 1 }, { section8Agency: 'NYCHA', voucherBedrooms: '1' }],
  ]
  for (const [rows, program, shape, options] of cases) {
    const row = rows.find((item) => item.bedrooms === 1 && item.rentType !== 'annual-recertification')
    for (const damage of [{ sourceUrl: '' }, { confidence: 'unverified' }, { confidence: 'press-only' }]) {
      const before = { ...row }
      Object.assign(row, damage)
      try {
        const flags = rentFlags(unit({ ...shape, rent: 2000 }), { program, household: 1 }, options)
        assert.ok(flags.length >= 1, program)
        for (const flag of flags) {
          assert.doesNotMatch(flag.text, /\$\d/, `${program} ${JSON.stringify(damage)}: ${flag.text}`)
          assert.equal(flag.source?.url === '', false)
        }
        assert.ok(flags.some((flag) => flag.text.includes(askFor(program))), program)
        assert.ok(flags.every((flag) => !flag.summary), 'no good or watch verdict without a source')
      } finally {
        Object.assign(row, before)
      }
    }
  }
})

test('every rent flag that carries a figure also carries program, effective date, date copied, and a source link', () => {
  const programs = [
    ['HASA', {}], ['CityFHEPS', { cityfhepsAllowance: 'heat pump' }], ['Section 8', { section8Agency: 'NYCHA', voucherBedrooms: '1' }],
  ]
  let figures = 0
  for (const listing of LISTINGS) {
    for (const [program, options] of programs) {
      const flags = assessListing(listing, { program, household: 1, letterRent: '' }, options)
      for (const flag of flags) {
        // Marked-for and letter flags are about the user's own letter, not a program rent figure.
        if (/^(Marked for|This sample is not marked|Your .*letter|Your letter)/.test(flag.text)) continue
        if (!/\$\d/.test(flag.text)) continue
        figures += 1
        assert.ok(flag.source, `${listing.id} ${program}: ${flag.text}`)
        assert.equal(flag.source.program, program, `${listing.id} ${program}`)
        assert.ok(flag.text.includes(program === 'Section 8' ? 'NYCHA Section 8' : program) || /^(You would|HASA utility|HASA lists)/.test(flag.text), flag.text)
        assert.match(flag.source.copiedOn, /^\d{4}-\d{2}-\d{2}$/)
        assert.ok(flag.source.url.startsWith('https://'))
        const line = sourceText(flag.source)
        assert.match(line, new RegExp(`^${program}`))
        assert.match(line, /effective|effective date not stated/)
        assert.match(line, /figures copied on/)
        assert.ok(flag.summary || flag.level !== 'good', 'primary flags have a no-figure summary for cards')
        if (flag.summary) assert.doesNotMatch(flag.summary, /\$\d/)
      }
    }
  }
  assert.ok(figures > 20)
})

test('sourceText names the program and says when the effective date is not stated', () => {
  const source = sourceFor({ program: 'CityFHEPS', sourceDocNumber: 'DSS-8j (E)', effectiveDate: null, documentDate: '2026-01-28', sourceUrl: 'https://www.nyc.gov/x', confidence: 'official' })
  assert.equal(sourceText(source), 'CityFHEPS · DSS-8j (E) · effective date not stated, document dated January 28, 2026 · figures copied on October 18, 2026')
  const none = sourceFor({ program: 'HASA', sourceDocNumber: 'X', effectiveDate: null, sourceUrl: 'u', confidence: 'official' })
  assert.match(sourceText(none), /effective date not stated by the source/)
})

test('an unknown or missing program produces no rent figure', () => {
  assert.deepEqual(rentFlags(unit({}), { program: '', household: 2 }), [])
  assert.deepEqual(rentFlags(unit({}), { program: 'FHEPS', household: 2 }), [])
  assert.deepEqual(rentFlags(unit({}), null), [])
})

test('Section 8 rooms and SROs are ask-only: no figure and never "within"', () => {
  const options = { section8Agency: 'NYCHA', voucherBedrooms: '0' }
  for (const unitKind of ['room', 'sro']) {
    const flags = rentFlags(unit({ unitKind, bedrooms: 0, rent: 900 }), { program: 'Section 8', household: 1 }, options)
    assert.equal(flags.length, 1)
    assert.match(flags[0].text, /no row for (an SRO|a room)/)
    assert.ok(flags[0].text.endsWith(`${ASK_SPECIALIST}.`))
    assert.doesNotMatch(flags[0].text, /\$\d|within/)
    assert.equal(flags[0].summary, undefined)
  }
})

test('Section 8 unit-size mismatch is a caveat to confirm, never "within", with no figure', () => {
  const plan = { program: 'Section 8', household: 1 }
  const cases = [
    [unit({ unitKind: 'studio', bedrooms: 0, rent: 1500 }), '2'],
    [unit({ bedrooms: 1, rent: 1500 }), '3'],
    [unit({ bedrooms: 3, rent: 1500 }), '1'],
    [unit({ bedrooms: 1, rent: 1500 }), '0'],
  ]
  for (const [listing, voucherBedrooms] of cases) {
    const flags = rentFlags(listing, plan, { section8Agency: 'NYCHA', voucherBedrooms })
    assert.equal(flags.length, 1)
    assert.equal(flags[0].level, 'note')
    assert.match(flags[0].text, /has not confirmed whether a smaller or larger unit changes the NYCHA limit/)
    assert.ok(flags[0].text.endsWith(`${ASK_SPECIALIST}.`))
    assert.doesNotMatch(flags[0].text, /\$\d|within/)
    assert.equal(flags[0].source, undefined, 'no sourced claim for an unverified rule')
    assert.equal(flags[0].summary, undefined)
  }
  // Same size as the voucher still compares.
  assert.equal(primary(rentFlags(unit({ bedrooms: 2, rent: 1500 }), plan, { section8Agency: 'NYCHA', voucherBedrooms: '2' })).level, 'good')
})

test('every Section 8 result says housing specialist and never caseworker', () => {
  for (const listing of LISTINGS) {
    for (const options of [{}, { section8Agency: 'HPD' }, { section8Agency: 'NYCHA' }, ...[0, 1, 2, 3].map((n) => ({ section8Agency: 'NYCHA', voucherBedrooms: String(n) }))]) {
      for (const flag of rentFlags(listing, { program: 'Section 8', household: 2 }, options)) assert.doesNotMatch(flag.text, /caseworker/i, `${listing.id} ${flag.text}`)
    }
  }
})

test('HASA SRO and room are ask-only and cite the SPSVC-17 gap, not the bedroom exceptions', () => {
  for (const [unitKind, what] of [['sro', 'SRO row'], ['room', 'room row']]) {
    const [flag] = rentFlags(unit({ unitKind, bedrooms: 0, rent: 1500 }), { program: 'HASA', household: 1 })
    assert.equal(flag.text, `The public HASA schedule page has no ${what}. Ask your caseworker.`)
    assert.equal(flag.source.program, 'HASA')
    assert.equal(flag.source.effectiveDate, '2025-09-10')
    assert.match(flag.source.url, /Rent_Payment_Guidelines\.pdf$/)
    assert.equal(flag.source.document, 'SPSVC-17 (E)')
  }
})

test('rule text falls back to "Ask your caseworker" when its row fails, in every program', () => {
  const cases = [
    [HASA_RULES.heatHotWater, 'HASA', unit({ bedrooms: 1, rent: 2000 }), { program: 'HASA', household: 1 }, {}, /heat and hot water/],
    [HASA_RULES.utilityDeduction, 'HASA', unit({ bedrooms: 1, rent: 2000, utilities: 'tenant-electric' }), { program: 'HASA', household: 1 }, {}, /deductions are not in the public schedule/],
    [HASA_RULES.bedroomExceptions, 'HASA', unit({ bedrooms: 1, rent: 2000 }), { program: 'HASA', household: 3 }, {}, /Your caseworker decides/],
    [CITYFHEPS_RULES.roomTwoAdults, 'CityFHEPS', unit({ unitKind: 'room', bedrooms: 0, rent: 900 }), { program: 'CityFHEPS', household: 3 }, {}, /no more than two adults/],
    [CITYFHEPS_RULES.utilityAllowance, 'CityFHEPS', unit({ bedrooms: 2, rent: 2000, utilities: 'tenant-electric' }), { program: 'CityFHEPS', household: 3 }, {}, /not yet loaded/],
    [SECTION8_RULES.nychaUtilityAllowance, 'Section 8', unit({ bedrooms: 1, rent: 2000, utilities: 'tenant-electric' }), { program: 'Section 8', household: 1 }, { section8Agency: 'NYCHA', voucherBedrooms: '1' }, /utility allowance for tenant-paid/],
  ]
  for (const [rule, program, listing, plan, options, claim] of cases) {
    const before = { ...rule }
    try {
      const normal = rentFlags(listing, plan, options).map((flag) => flag.text).join('\n')
      assert.match(normal, claim, `${rule.id} normally states its rule`)
      rule.sourceUrl = ''
      const damaged = rentFlags(listing, plan, options)
      assert.ok(damaged.some((flag) => flag.text === `${askFor(program)}.` && !flag.source), rule.id)
      assert.doesNotMatch(damaged.map((flag) => flag.text).join('\n'), claim, `${rule.id} no longer states its rule`)
    } finally {
      Object.assign(rule, before)
    }
  }
})

test('a size with no displayable row makes no claim about the program', () => {
  const row = HASA_ROWS.find((item) => item.bedrooms === 1)
  const before = { ...row }
  row.confidence = 'unverified'
  try {
    const [flag] = rentFlags(unit({ bedrooms: 1 }), { program: 'HASA', household: 1 })
    assert.equal(flag.text, 'LeasePath cannot show a HASA figure for this size. Ask your caseworker.')
    assert.equal(flag.source, undefined)
  } finally {
    Object.assign(row, before)
  }
})

test('a within-limit result with a tenant-paid utility carries the "before any utility is subtracted" caveat', () => {
  const tenantPays = unit({ bedrooms: 1, rent: 2000, utilities: 'tenant-electric' })
  const cases = [
    [{ program: 'HASA', household: 1 }, {}],
    [{ program: 'CityFHEPS', household: 1 }, {}],
    [{ program: 'Section 8', household: 1 }, { section8Agency: 'NYCHA', voucherBedrooms: '1' }],
  ]
  for (const [plan, options] of cases) {
    const main = rentFlags(tenantPays, plan, options).find((flag) => flag.summary)
    assert.equal(main.level, 'note', plan.program)
    assert.match(main.summary, new RegExp(`within the ${plan.program} limit before any utility is subtracted`))
    assert.doesNotMatch(main.summary, /\$\d/)
    const allIn = rentFlags({ ...tenantPays, utilities: 'all' }, plan, options).find((flag) => flag.summary)
    assert.equal(allIn.level, 'good')
    assert.doesNotMatch(allIn.summary, /before any utility/)
  }
})
