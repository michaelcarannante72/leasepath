import { untx } from './source-text.js'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { incomeLinesBlock, programFiguresBlock } from '../server/figures.js'
import { HASA_RULES } from '../src/data/hasa.js'
import { POVERTY_ROWS, POVERTY_RECHECK_NOTE, extendedPovertyLine, monthlyMax, povertyLine, povertySource } from '../src/data/poverty.js'
import { INCOME_HINT, INCOME_LABEL, PRESCREEN_EXPLAIN, PRESCREEN_PROGRAMS, PRESCREEN_TWICE, annualIncome, incomePrescreen, isPrescreenProgram, parseIncome, storedIncome } from '../src/incomePrescreen.js'
import { sanitizePlace } from '../server/accounts.js'
import { prepareGuide } from '../server/guide.js'
import { assessListing } from '../src/fit.js'
import { LISTINGS } from '../src/data.js'
import { normalizeHousehold, rentFlags, sourceText } from '../src/rentCheck.js'

const read = (path) => untx(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'))

// The figures the housing specialist stated in the request. The data file is the source of truth. This test
// is the discrepancy check: if the file and these figures ever differ, it fails and someone must look.
// [size, 200% yearly, monthly rounded down]. The rounded-to-nearest monthly figures ($3,607, $6,447, $9,287) overstate the
// line for sizes 2, 5 and 8, so they are never shown.
const STATED = [
  [1, 31920, 2660], [2, 43280, 3606], [3, 54640, 4553], [4, 66000, 5500],
  [5, 77360, 6446], [6, 88720, 7393], [7, 100080, 8340], [8, 111440, 9286],
]

test('the copied data matches the figures the housing specialist stated, sizes 1 to 8, with the monthly floor', () => {
  assert.equal(POVERTY_ROWS.length, 8)
  for (const [size, annual, floor] of STATED) {
    const line = povertyLine(size)
    assert.equal(line.annual, annual, `size ${size} annual`)
    assert.equal(line.monthlyFloor, floor, `size ${size} monthly floor`)
    assert.equal(Math.floor(annual / 12), floor, `size ${size} floor is annual / 12 rounded down`)
    assert.equal(POVERTY_ROWS[size - 1].annual200, POVERTY_ROWS[size - 1].annual100 * 2, `size ${size} is 2 x the 100% figure`)
  }
  // The nearest-dollar monthly figure overstates the line for exactly these sizes.
  assert.deepEqual(POVERTY_ROWS.filter((row) => row.monthlyRounded * 12 > row.annual200).map((row) => row.householdSize), [2, 5, 8])
})

test('no screen or assistant figure is built for a household of 9 or more', () => {
  assert.equal(povertyLine(9), null)
  assert.equal(povertyLine(12), null)
  for (const bad of [0, -1, 2.5, 'abc', '', null, undefined, '9+']) assert.equal(povertyLine(bad), null, String(bad))
  // The extension in the data (size-8 line plus the per-person step) is pinned here and used nowhere else.
  assert.equal(extendedPovertyLine(9).annual, 111440 + 11360)
  assert.equal(extendedPovertyLine(10).annual - extendedPovertyLine(9).annual, 11360)
  assert.equal(extendedPovertyLine(8), null)
  for (const file of ['src/incomePrescreen.js', 'src/components/IncomePrescreen.jsx', 'server/figures.js', 'server/guide.js', 'src/rentCheck.js']) {
    assert.doesNotMatch(read(file), /extendedPovertyLine/, file)
  }
})

test('the figures are labeled 2026 HHS poverty guidelines with the effective date, the Federal Register source, and no DSS or HRA confirmation', () => {
  const source = povertySource()
  assert.equal(source.program, '2026 HHS poverty guidelines')
  assert.equal(source.effectiveDate, '2026-01-13')
  assert.equal(source.url, 'https://www.govinfo.gov/content/pkg/FR-2026-01-15/html/2026-00755.htm')
  assert.match(source.document, /91 FR 1797/)
  assert.match(source.dateNote, /have not confirmed these dollar figures or the year/)
  assert.match(sourceText(source), /2026 HHS poverty guidelines · 91 FR 1797 .* · effective January 13, 2026 .* · figures copied on /)
  assert.equal(POVERTY_RECHECK_NOTE, 'Re-check in January 2027 when new HHS guidelines are published')
})

test('the data file carries the January 2027 re-check note', () => {
  const file = JSON.parse(read('src/data/criteria/poverty-guidelines.json'))
  assert.equal(file.app_note, 'Re-check in January 2027 when new HHS guidelines are published')
  assert.equal(file.year, 2026)
})

test('the copy matches the specialist file when that folder is present', { skip: !existsSync('/workspace/criteria/poverty-guidelines.json') }, () => {
  const source = JSON.parse(readFileSync('/workspace/criteria/poverty-guidelines.json', 'utf8'))
  const { app_note: note, ...copy } = JSON.parse(read('src/data/criteria/poverty-guidelines.json'))
  assert.ok(note)
  assert.deepEqual(copy, source)
})

test('boundary on the yearly figure: HASA is strictly below, CityFHEPS is at or below, at every household size 1 to 8', () => {
  for (let size = 1; size <= 8; size += 1) {
    const { annual } = povertyLine(size)
    const at = { household: size, income: annual, period: 'year' }
    assert.equal(incomePrescreen('HASA', at).status, 'over', `HASA equal, size ${size}`)
    assert.equal(incomePrescreen('HASA', at).passes, false)
    assert.equal(incomePrescreen('CityFHEPS', at).status, 'at', `CityFHEPS equal, size ${size}`)
    assert.equal(incomePrescreen('CityFHEPS', at).passes, true)
    for (const program of ['HASA', 'CityFHEPS']) {
      assert.equal(incomePrescreen(program, { ...at, income: annual - 1 }).status, 'under', `${program} ${size} one dollar under`)
      assert.equal(incomePrescreen(program, { ...at, income: annual + 1 }).status, 'over', `${program} ${size} one dollar over`)
    }
  }
})

test('boundary on monthly entries (x12) for both programs at every size, and the monthly amount shown agrees with the check', () => {
  for (let size = 1; size <= 8; size += 1) {
    const { annual } = povertyLine(size)
    for (const [program, inclusive] of [['HASA', false], ['CityFHEPS', true]]) {
      const top = monthlyMax(annual, inclusive)
      // The largest monthly amount that passes, the next dollar does not, and the check is the yearly comparison.
      assert.equal(top * 12 < annual || (inclusive && top * 12 === annual), true, `${program} ${size} top passes by arithmetic`)
      assert.equal((top + 1) * 12 < annual || (inclusive && (top + 1) * 12 === annual), false, `${program} ${size} next dollar fails by arithmetic`)
      const pass = incomePrescreen(program, { household: size, income: top, period: 'month' })
      const fail = incomePrescreen(program, { household: size, income: top + 1, period: 'month' })
      assert.ok(['under', 'at'].includes(pass.status), `${program} size ${size} $${top} a month`)
      assert.equal(fail.status, 'over', `${program} size ${size} $${top + 1} a month`)
      // The sentence on screen shows exactly that top amount, so what is shown and what is checked cannot disagree.
      const shown = /\(\$([\d,]+) a month or less\)/.exec(pass.details.join(' '))
      assert.equal(Number(shown[1].replace(/,/g, '')), top, `${program} size ${size} shown monthly amount`)
      assert.ok(pass.details.join(' ').includes(`$${annual.toLocaleString('en-US')} a year`), 'the exact yearly figure leads')
    }
    // CityFHEPS shows the file's monthly floor exactly.
    assert.equal(monthlyMax(annual, true), POVERTY_ROWS[size - 1].monthlyFloor)
  }
  // Where the line is a whole number of dollars a month (sizes 1, 4, 7) HASA's top amount is one dollar lower.
  for (const size of [1, 4, 7]) assert.equal(monthlyMax(povertyLine(size).annual, false), monthlyMax(povertyLine(size).annual, true) - 1)
  for (const size of [2, 3, 5, 6, 8]) assert.equal(monthlyMax(povertyLine(size).annual, false), monthlyMax(povertyLine(size).annual, true))
})

test('the rounded-up monthly figures are never shown: size 2 reads over at $3,607 a month and shows $3,606 or less', () => {
  const at3607 = incomePrescreen('HASA', { household: 2, income: 3607, period: 'month' })
  assert.equal(at3607.status, 'over')
  const text = incomePrescreen('CityFHEPS', { household: 2, income: 3000, period: 'month' }).details.join(' ')
  assert.match(text, /\$43,280 a year \(\$3,606 a month or less\)/)
  assert.match(incomePrescreen('HASA', { household: 2, income: 3000 }).details.join(' '), /\$43,280 a year, and your income must be under it \(\$3,606 a month or less\)/)
  for (const [size, rounded] of [[2, '3,607'], [5, '6,447'], [8, '9,287']]) {
    for (const program of ['HASA', 'CityFHEPS']) {
      assert.doesNotMatch(incomePrescreen(program, { household: size, income: 100 }).details.join(' '), new RegExp(`\\$${rounded}`))
    }
  }
  assert.equal(incomePrescreen('HASA', { household: 1, income: 2660, period: 'month' }).status, 'over')
  assert.match(incomePrescreen('HASA', { household: 1, income: 100 }).details.join(' '), /\(\$2,659 a month or less\)/)
  assert.match(incomePrescreen('CityFHEPS', { household: 1, income: 100 }).details.join(' '), /\(\$2,660 a month or less\)/)
  assert.equal(annualIncome('3606', 'month'), 43272)
  assert.equal(annualIncome('43280', 'year'), 43280)
  assert.equal(annualIncome('100', 'anything else'), 1200, 'an unknown period counts as a month')
})

test('typed amounts: decimals drop the cents, negatives and junk are refused, nothing is misread', () => {
  assert.deepEqual(parseIncome('2,660.50'), { status: 'ok', dollars: 2660 })
  assert.deepEqual(parseIncome('$1,234.99'), { status: 'ok', dollars: 1234 })
  assert.deepEqual(parseIncome('2660.'), { status: 'ok', dollars: 2660 })
  assert.deepEqual(parseIncome('0'), { status: 'ok', dollars: 0 })
  assert.deepEqual(parseIncome('007'), { status: 'ok', dollars: 7 })
  assert.deepEqual(parseIncome(' 2 660 '), { status: 'ok', dollars: 2660 })
  assert.deepEqual(parseIncome(''), { status: 'empty' })
  assert.deepEqual(parseIncome(undefined), { status: 'empty' })
  for (const bad of ['-500', '-0', '+5', 'abc', '12e3', '1.2.3', '1,2,3x', '99999999', '(500)', '5-5']) {
    assert.equal(parseIncome(bad).status, 'invalid', bad)
  }
  assert.equal(annualIncome('2,660.50', 'month'), 31920, '2,660.50 a month is read as 2,660, not 266,050')
  assert.equal(annualIncome('-500', 'month'), null)
  for (const program of ['HASA', 'CityFHEPS']) {
    const negative = incomePrescreen(program, { household: 1, income: '-500', period: 'month' })
    assert.equal(negative.status, 'invalid')
    assert.equal(negative.headline, 'Enter a valid amount in whole dollars, with no minus sign and no letters. For example 2660.')
    assert.equal(negative.sources.length, 0)
    assert.equal(negative.line, undefined)
    assert.equal(incomePrescreen(program, { household: 1, income: '2,660.50', period: 'month' }).status, program === 'HASA' ? 'over' : 'at')
  }
  assert.equal(storedIncome('2,660.50'), '2,660.50')
  assert.equal(storedIncome('-500'), '-500')
  assert.equal(storedIncome('abc12'), '12')
  assert.equal(storedIncome(null), '')
  assert.equal(storedIncome('1'.repeat(40)).length, 14)
})

test('the income box has the approved label, a whole-dollars hint tied to it, and says nothing about which sources count', () => {
  assert.equal(INCOME_LABEL, 'Enter your gross household income before deductions')
  assert.match(INCOME_HINT, /^Whole dollars only\./)
  const screen = read('src/components/IncomePrescreen.jsx')
  assert.match(screen, /aria-describedby="income-hint"/)
  assert.match(screen, /<p id="income-hint" className="fine">\{INCOME_HINT\}<\/p>/)
  assert.match(screen, /<span>\{INCOME_LABEL\}<\/span>/)
  const words = [INCOME_LABEL, INCOME_HINT, PRESCREEN_EXPLAIN, read('src/incomePrescreen.js'), screen].join('\n')
  assert.doesNotMatch(words, /Cash Assistance|\bSSI\b|\bSSD\b|Social Security|unemployment|child support|wages|pension|benefits/i)
})

test('plain words: about twice the poverty income, and what a pre-screen is and who decides', () => {
  assert.equal(PRESCREEN_TWICE, 'About twice the federal poverty income for your household size.')
  assert.match(PRESCREEN_EXPLAIN, /pre-screen is a quick early look/)
  assert.match(PRESCREEN_EXPLAIN, /not an application and not an approval/)
  assert.match(PRESCREEN_EXPLAIN, /caseworker and DSS\/HRA/)
  for (const program of ['HASA', 'CityFHEPS']) {
    assert.equal(incomePrescreen(program, { household: 3, income: 100 }).details[0], PRESCREEN_TWICE)
  }
  const screen = read('src/components/IncomePrescreen.jsx')
  assert.match(screen, /\{PRESCREEN_EXPLAIN\}/)
})

test('HASA and CityFHEPS are separate checks with their own rows, words, and sources, and never share a result', () => {
  assert.deepEqual(Object.keys(PRESCREEN_PROGRAMS).sort(), ['CityFHEPS', 'HASA'])
  assert.equal(PRESCREEN_PROGRAMS.HASA.inclusive, false)
  assert.equal(PRESCREEN_PROGRAMS.CityFHEPS.inclusive, true)
  assert.equal(PRESCREEN_PROGRAMS.HASA.word, 'below')
  assert.equal(PRESCREEN_PROGRAMS.CityFHEPS.word, 'at or below')
  const hasaIds = PRESCREEN_PROGRAMS.HASA.rules.map((rule) => rule.id)
  const cityIds = PRESCREEN_PROGRAMS.CityFHEPS.rules.map((rule) => rule.id)
  assert.deepEqual(hasaIds, ['hasa-income-limit-200-fpl'])
  assert.deepEqual(cityIds, ['cityfheps-eligibility-community-200fpl', 'cityfheps-eligibility-shelter-200fpl'])
  assert.equal(hasaIds.filter((id) => cityIds.includes(id)).length, 0)

  const input = { household: 3, income: 4000, period: 'month' }
  const hasa = incomePrescreen('HASA', input)
  const city = incomePrescreen('CityFHEPS', input)
  const sourceNames = (result) => result.sources.map((source) => `${source.program}|${source.document}`)
  assert.ok(sourceNames(hasa).includes('HASA|SPSVC-18 (E)'))
  assert.ok(sourceNames(city).includes('CityFHEPS|DSS-7r (E)'))
  assert.ok(sourceNames(city).includes('CityFHEPS|DSS-7n (E)'))
  assert.ok(sourceNames(hasa).every((name) => name.startsWith('HASA|')), 'no CityFHEPS source on the HASA result')
  assert.ok(sourceNames(city).every((name) => name.startsWith('CityFHEPS|')), 'no HASA source on the CityFHEPS result')
  assert.doesNotMatch([hasa.headline, ...hasa.details].join(' '), /CityFHEPS|DSS-7/)
  assert.doesNotMatch([city.headline, ...city.details].join(' '), /HASA|SPSVC/)
  // The same equal-to-the-line income gives different answers, so the results cannot be shared.
  const equal = { household: 1, income: 31920, period: 'year' }
  assert.notEqual(incomePrescreen('HASA', equal).status, incomePrescreen('CityFHEPS', equal).status)
})

test('programs with no 200% rule get no income result', () => {
  for (const program of ['Section 8', 'FHEPS', '', undefined]) {
    assert.equal(isPrescreenProgram(program), false)
    const result = incomePrescreen(program, { household: 2, income: 1000 })
    assert.equal(result.status, 'unavailable')
    assert.doesNotMatch(result.headline, /\$\d/)
    assert.equal(result.sources.length, 0)
  }
  assert.match(incomePrescreen('Section 8', {}).headline, /Ask your housing specialist/)
})

test('under the line: the approved wording, no approval', () => {
  for (const program of ['HASA', 'CityFHEPS']) {
    const result = incomePrescreen(program, { household: 2, income: 2000, period: 'month' })
    assert.equal(result.status, 'under')
    assert.equal(result.headline, 'Your income is under the 200% pre-screen line. This is not an approval; DSS/HRA decides.')
  }
})

test('over the line is calm: may not qualify, ask your caseworker, never a rejection', () => {
  const rejecting = /denied|reject|ineligible|not eligible|disqualif|fail|error|do not qualify|don’t qualify|cannot qualify/i
  for (const program of ['HASA', 'CityFHEPS']) {
    const result = incomePrescreen(program, { household: 1, income: 5000, period: 'month' })
    assert.equal(result.status, 'over')
    assert.equal(result.headline, 'Your income is over the 200% pre-screen line, so you may not qualify. Ask your caseworker.')
    assert.doesNotMatch([result.headline, ...result.details].join(' '), rejecting)
  }
  // The equal-to-the-line HASA result is calm too.
  const equal = incomePrescreen('HASA', { household: 1, income: 31920, period: 'year' })
  assert.match(equal.headline, /may not qualify\. Ask your caseworker\.$/)
  assert.doesNotMatch(equal.headline, rejecting)
})

test('the minimum-wage exception is shown only on an over-the-line CityFHEPS result', () => {
  const over = { household: 1, income: 5000, period: 'month' }
  const cityOver = incomePrescreen('CityFHEPS', over).details.join(' ')
  assert.match(cityOver, /single adult who earns minimum wage and works 35 or more hours a week may be over the line and still be eligible/)
  assert.doesNotMatch(incomePrescreen('HASA', over).details.join(' '), /minimum wage/)
  assert.doesNotMatch(incomePrescreen('CityFHEPS', { household: 1, income: 1000, period: 'month' }).details.join(' '), /minimum wage/)
})

test('HASA is income only and says eligibility needs more; it never asks about health', () => {
  const result = incomePrescreen('HASA', { household: 1, income: 1000, period: 'month' })
  const text = result.details.join(' ')
  assert.match(text, /income only/)
  assert.match(text, /diagnosis of HIV illness or AIDS and living in New York City/)
  assert.match(text, /LeasePath does not ask about health/)
  assert.ok(result.sources.some((source) => source.url === 'https://www.nyc.gov/site/hra/help/hiv-aids-services.page'))
  assert.match(incomePrescreen('CityFHEPS', { household: 1, income: 1000 }).details.join(' '), /income only/)
})

test('the line text names the program, the 2026 HHS guidelines, the size, and the exact yearly figure first', () => {
  const text = incomePrescreen('CityFHEPS', { household: 2, income: 1000, period: 'month' }).details[1]
  assert.match(text, /^CityFHEPS says at or below 200% of the federal poverty level\./)
  assert.match(text, /2026 HHS poverty guidelines/)
  assert.match(text, /For 2 people/)
  assert.match(text, /\$43,280 a year \(\$3,606 a month or less\)/)
  assert.match(incomePrescreen('HASA', { household: 1, income: 1 }).details[1], /^HASA says below 200%/)
  for (const program of ['HASA', 'CityFHEPS']) {
    const all = incomePrescreen(program, { household: 4, income: 1000 }).details.join(' ')
    assert.doesNotMatch(all, /(DSS|HRA) (has |have )?(confirmed|verified|says? the dollar)/i)
    assert.doesNotMatch(all, /about \$/, 'no rounded "about" monthly figure')
  }
})

test('missing inputs ask for them and give no result and no figure', () => {
  for (const program of ['HASA', 'CityFHEPS']) {
    const none = incomePrescreen(program, {})
    assert.equal(none.status, 'missing')
    assert.deepEqual(none.missing, ['the number of people in your household', 'your gross household income before deductions'])
    assert.match(none.headline, new RegExp(`^To see the ${program} pre-screen, enter the number of people in your household and your gross household income before deductions\\.$`))
    assert.equal(none.line, undefined)
    assert.equal(none.sources.length, 0)
    assert.equal(incomePrescreen(program, { household: '', income: '500' }).status, 'missing')
    const noIncome = incomePrescreen(program, { household: 2, income: '' })
    assert.equal(noIncome.status, 'missing')
    assert.deepEqual(noIncome.missing, ['your gross household income before deductions'])
    assert.equal(incomePrescreen(program, { household: 2, income: 'abc' }).status, 'invalid')
    assert.doesNotMatch(noIncome.headline, /\$\d|under|over/)
  }
  // Zero is an answer, not a missing value.
  assert.equal(incomePrescreen('HASA', { household: 1, income: '0' }).status, 'under')
  assert.equal(incomePrescreen('CityFHEPS', { household: 1, income: 0 }).status, 'under')
})

test('a rule row that is not an official sourced row gives "Ask your caseworker" and no number', () => {
  const rule = HASA_RULES.incomeLimit
  const saved = rule.sourceUrl
  try {
    rule.sourceUrl = ''
    const result = incomePrescreen('HASA', { household: 1, income: 100 })
    assert.equal(result.status, 'unavailable')
    assert.equal(result.headline, 'Ask your caseworker.')
    assert.equal(result.sources.length, 0)
  } finally {
    rule.sourceUrl = saved
  }
  assert.equal(incomePrescreen('HASA', { household: 1, income: 100 }).status, 'under')
})

test('income is on-device only: stored under the existing checks key and never in a network body', () => {
  const app = read('src/App.jsx')
  assert.match(app, /const CHECKS_KEY = 'leasepath\.checks'/)
  assert.match(app, /writeItem\(CHECKS_KEY, JSON\.stringify\(next\)\)/)
  assert.match(app, /incomeAmount: ''/)
  assert.match(app, /incomePeriod: 'month'/)
  // Every request body in the app, found by matching parentheses.
  const bodies = []
  for (let at = app.indexOf('body: JSON.stringify('); at !== -1; at = app.indexOf('body: JSON.stringify(', at + 1)) {
    let depth = 0
    let end = at + 'body: JSON.stringify'.length
    for (; end < app.length; end += 1) {
      if (app[end] === '(') depth += 1
      if (app[end] === ')') { depth -= 1; if (depth === 0) break }
    }
    bodies.push(app.slice(at, end))
  }
  assert.ok(bodies.length >= 4, `found ${bodies.length} request bodies`)
  for (const body of bodies) assert.doesNotMatch(body, /checks|income|poverty/i, body.slice(0, 80))
  for (const path of ['server/api.js', 'server/guide.js', 'worker/index.js']) {
    assert.doesNotMatch(read(path), /incomeAmount|incomePeriod|checks\./, path)
  }
  // The only module that reads the income also never imports a network call.
  assert.doesNotMatch(read('src/incomePrescreen.js'), /fetch\(|XMLHttpRequest|sendBeacon/)
  assert.doesNotMatch(read('src/components/IncomePrescreen.jsx'), /fetch\(|XMLHttpRequest|sendBeacon/)
})

test('the screen is calm and accessible: no error styling, an icon plus text, a polite live region, 14px text, no hiding', () => {
  const screen = read('src/components/IncomePrescreen.jsx')
  assert.doesNotMatch(screen, /error|danger|flag-watch|role="alert"|aria-invalid|disabled|(?<!aria-)hidden/i)
  assert.match(screen, /aria-live="polite"/)
  assert.match(screen, /<span aria-hidden="true">\{tag\.icon\}<\/span> \{tag\.label\}/)
  assert.match(screen, /May not qualify/)
  const css = read('src/index.css')
  const start = css.indexOf('/* Income pre-screen.')
  const next = css.indexOf('\n/* ', start + 1)
  const block = css.slice(start, next === -1 ? undefined : next)
  assert.match(block, /\.prescreen-result \{/)
  assert.doesNotMatch(block, /var\(--watch|red|#f00|#c00|error/i)
  for (const [, size] of block.matchAll(/font-size: ([\d.]+)rem/g)) assert.ok(Number(size) * 16 >= 14, `${size}rem is under 14px`)
  // The pre-screen never feeds the listing search, so no program or listing can be hidden by income.
  assert.doesNotMatch(read('src/fit.js'), /incomePrescreen|poverty|incomeAmount/)
  assert.doesNotMatch(read('src/components/SearchPage.jsx'), /incomePrescreen|poverty|incomeAmount/)
})

test('the plan page shows HASA and CityFHEPS checks apart, and none for other programs', () => {
  const screen = read('src/components/IncomePrescreen.jsx')
  assert.match(screen, /isPrescreenProgram\(program\) \? \[program\] : program === '' \? PRESCREEN_ORDER : \[\]/)
  assert.match(screen, /HASA check \(income only\)/)
  assert.match(screen, /CityFHEPS check \(income only\)/)
  // The pre-screen moved from My voucher to its own page (#/income-check); My voucher links to it.
  assert.match(read('src/components/PlanToolPages.jsx'), /<IncomePrescreen plan=\{plan\} checks=\{checks\} onChecks=\{onChecks\} onClear=\{onClear\} \/>/)
  assert.match(read('src/components/PlanPage.jsx'), /href="#\/income-check"/)
  assert.match(read('src/App.jsx'), /<IncomeCheckPage plan=\{plan\} checks=\{checks\} onChecks=\{updateChecks\} onClear=\{clearIncome\} \/>/)
})

test('the assistant pack gives the lines with program, year, effective date, source, and the January 2027 re-check', () => {
  const pack = programFiguresBlock()
  const block = incomeLinesBlock()
  assert.ok(pack.includes(block))
  for (const [size, annual] of STATED) {
    const hasa = monthlyMax(annual, false).toLocaleString('en-US')
    const city = monthlyMax(annual, true).toLocaleString('en-US')
    assert.match(block, new RegExp(`${size} (person|people): \\$${annual.toLocaleString('en-US')} a year \\(monthly: HASA \\$${hasa} or less, CityFHEPS \\$${city} or less\\)`))
  }
  assert.doesNotMatch(block, /\$3,607|\$6,447|\$9,287|about \$/, 'no rounded-up monthly figure')
  assert.doesNotMatch(block, /add \$11,360|each person after the eighth/)
  assert.match(block, /household of 9 or more there is no figure here: do not add up or extend the table/)
  assert.match(pack, /household of 9 or more has no HASA or CityFHEPS rent comparison in this pack/)
  assert.match(block, /Lead with the yearly figure, which is exact/)
  assert.match(block, /2026 HHS poverty guidelines/)
  assert.match(block, /effective January 13, 2026/)
  assert.match(block, /https:\/\/www\.govinfo\.gov\/content\/pkg\/FR-2026-01-15\/html\/2026-00755\.htm/)
  assert.match(block, /HASA says household income must be below 200% \(strictly below/)
  assert.match(block, /CityFHEPS says income at or below 200% \(equal is allowed\)/)
  assert.match(block, /SPSVC-18/)
  assert.match(block, /DSS-7r/)
  assert.match(block, /DSS-7n/)
  assert.match(block, /diagnosis of HIV illness or AIDS and living in New York City/)
  assert.match(block, /never say DSS or HRA confirmed these dollars/i)
  assert.match(block, /Re-check in January 2027 when new HHS guidelines are published/)
})

test('the assistant refuses an income limit that is not in the data and never uses the expansion figure', () => {
  const block = incomeLinesBlock()
  assert.match(block, /no 200% line in this pack for Section 8, FHEPS, SOTA, Homebase, supportive housing, or any new or expanded program/i)
  assert.match(block, /do not use any area-median-income figure/)
  assert.match(block, /Never use one program’s comparison word for the other/)
  const knowledge = read('server/hraKnowledge.js')
  assert.match(knowledge, /use only the INCOME PRE-SCREEN LINES block/)
  assert.doesNotMatch(knowledge, /Do not convert 200 percent/)
  const guide = read('server/guide.js')
  assert.match(guide, /Income lines: give one only from the INCOME PRE-SCREEN LINES block/)
  assert.match(guide, /Never give an income limit for Section 8, FHEPS, SOTA, supportive housing, or a new or expanded program, and never use an area-median-income figure/)
  for (const text of [block, knowledge, guide, read('server/figures.js'), read('src/incomePrescreen.js')]) {
    assert.doesNotMatch(text, /50\s?(%|percent)\s*(of\s+)?(AMI|area median)/i)
  }
})

test('a household of 9 or more is ask-only for the income pre-screen and the rent lookups, with no figure', () => {
  for (const program of ['HASA', 'CityFHEPS']) {
    const result = incomePrescreen(program, { household: '9+', income: 2000, period: 'month' })
    assert.equal(result.status, 'ask')
    assert.equal(result.headline, `LeasePath shows no income pre-screen for a household of 9 or more. Ask your caseworker.`)
    assert.doesNotMatch(result.headline, /\$\d/)
    assert.equal(result.details.length, 0)
    assert.equal(result.sources.length, 0)
    assert.equal(result.line, undefined)
    // Even with a huge or empty income, nothing is calculated.
    assert.equal(incomePrescreen(program, { household: '9+', income: '', period: 'year' }).status, 'ask')
    for (const listing of LISTINGS) {
      const flags = rentFlags(listing, { program, household: '9+' })
      assert.equal(flags.length, 1, `${listing.id} ${program}`)
      assert.equal(flags[0].text, `LeasePath shows no ${program} rent comparison for a household of 9 or more. Ask your caseworker.`)
      assert.equal(flags[0].source, undefined)
      assert.doesNotMatch(flags[0].text, /\$\d/)
      const card = assessListing(listing, { program, household: '9+', letterRent: '' }).filter((flag) => flag.kind === 'program')
      assert.equal(card.length, 1)
      assert.equal(card[0].summary, undefined)
    }
  }
  // Section 8 is by voucher size, not household size, so it does not change.
  const eh = LISTINGS.find((listing) => listing.unitKind === 'apartment')
  assert.deepEqual(rentFlags(eh, { program: 'Section 8', household: '9+' }, { section8Agency: 'NYCHA', voucherBedrooms: String(eh.bedrooms) }), rentFlags(eh, { program: 'Section 8', household: '' }, { section8Agency: 'NYCHA', voucherBedrooms: String(eh.bedrooms) }))
})

test('household values that come from storage, the account, or another client all end up ask-only at 9 or more', () => {
  for (const stored of ['9+', '9', 9, '10', 12, ' 15 ', '19', '100']) assert.equal(normalizeHousehold(stored), '9+', String(stored))
  for (const stored of ['1', '8', 8, '5']) assert.equal(normalizeHousehold(stored), String(stored).trim())
  for (const stored of ['', '0', 0, -3, 2.5, 'abc', null, undefined, {}, [], true, '9++']) assert.equal(normalizeHousehold(stored), '', JSON.stringify(stored))
  const app = read('src/App.jsx')
  assert.match(app, /household: normalizeHousehold\(stored\.household\)/, 'stored plan on this device')
  assert.match(app, /household: normalizeHousehold\(place\.household\)/, 'plan saved to the account')
  // The account accepts 9+ and nothing else outside 1 to 8.
  assert.equal(sanitizePlace({ household: '9+' }).household, '9+')
  assert.equal(sanitizePlace({ household: '12' }).household, '')
  assert.equal(sanitizePlace({ household: '8' }).household, '8')
  // Both selects offer "9 or more".
  for (const file of ['src/components/PlanPage.jsx', 'src/components/Onboarding.jsx']) {
    assert.match(read(file), /HOUSEHOLD_CHOICES\.map/, file)
    assert.match(read(file), /'9 or more'/, file)
  }
})

test('the assistant is told a household of 9 or more has no figure, from 9+ or from any number of 9 or more', () => {
  const listing = { id: 'x', neighborhood: 'Test', borough: 'Bronx', crossStreets: 'A and B', unitKind: 'apartment', bedrooms: 1, rent: 2750, utilities: 'all', programs: [] }
  for (const household of ['9+', '9', 12, '15']) {
    for (const program of ['HASA', 'CityFHEPS']) {
      const { input } = prepareGuide({ messages: [{ role: 'user', content: 'Is this OK?' }], includePlan: true, plan: { program, household }, listing })
      const text = input[input.length - 1].content
      assert.match(text, /Household size: 9 or more\. LeasePath shows no rent or income figure for this size\. Say to ask the caseworker\./)
      assert.match(text, new RegExp(`LeasePath shows no ${program} rent comparison for a household of 9 or more\\. Ask your caseworker\\.`))
      assert.doesNotMatch(text.slice(text.indexOf('RENT CHECK')), /\$\d/)
    }
  }
})

test('income is cleared by a Clear income button, on sign-out, and on account delete', () => {
  const app = read('src/App.jsx')
  assert.match(app, /const clearIncome = useCallback\(\(\) => \{[\s\S]*?incomeAmount: '', incomePeriod: 'month'[\s\S]*?writeItem\(CHECKS_KEY, JSON\.stringify\(next\)\)/)
  const signOut = app.slice(app.indexOf('const signOut = useCallback'), app.indexOf('const openResources'))
  assert.match(signOut, /clearIncome\(\)/)
  assert.match(signOut, /\[accountLive, applyAccess, checked, clearIncome, filters\.q, lang, plan, saved\]/)
  const del = app.slice(app.indexOf('const deleteAccount = useCallback'), app.indexOf('const signOut = useCallback'))
  assert.match(del, /clearIncome\(\)/)
  // Cleared right after the person confirms, before the network call, so a failed call still clears it.
  assert.ok(del.indexOf('clearIncome()') < del.indexOf("fetch('/api/account'"))
  // The typed-DELETE dialog lists income among what is erased.
  assert.match(read('src/components/DeleteAccountDialog.jsx'), /<li>Income you typed in the pre-screen<\/li>/)
  const screen = read('src/components/IncomePrescreen.jsx')
  assert.match(screen, /onClick=\{onClear\}>Clear income</)
  assert.match(app, /<IncomeCheckPage [^>]*onClear=\{clearIncome\}/)
})

test('screen readers hear one short line after typing stops, not both result blocks on every keystroke', () => {
  const screen = read('src/components/IncomePrescreen.jsx')
  assert.equal(screen.match(/aria-live=/g).length, 1, 'only one live region')
  assert.match(screen, /<p className="sr-only" role="status" aria-live="polite">\{spoken\}<\/p>/)
  assert.doesNotMatch(screen, /<div className="prescreen-results"[^>]*aria-live/)
  assert.match(screen, /ANNOUNCE_DELAY_MS = 1200/)
  assert.match(screen, /setTimeout\(\(\) => setSpoken\(text\), ANNOUNCE_DELAY_MS\)/)
  assert.match(screen, /return \(\) => clearTimeout\(timer\)/)
  // The spoken line is the headline only, never the detail paragraphs or the source lines.
  assert.match(screen, /`\$\{result\.program\}: \$\{result\.headline\}`/)
  assert.match(screen, /result\.status !== 'missing'/)
  assert.match(screen, /first\.current/, 'nothing is announced when the page opens')
})
