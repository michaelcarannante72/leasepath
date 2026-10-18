import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { CITYFHEPS_2025_HISTORICAL_ROWS, CITYFHEPS_2026_ROWS, CITYFHEPS_PROGRAM, CITYFHEPS_RULES, CITYFHEPS_UTILITY_ALLOWANCES_1BR } from '../src/data/cityfheps.js'
import { HASA_PROGRAM, HASA_ROWS, HASA_RULES } from '../src/data/hasa.js'
import { SECTION8_NYCHA_ROWS, SECTION8_PROGRAM } from '../src/data/section8.js'
import { COPIED_ON, allRuleIds, isDisplayable, ruleRow, scheduleRows } from '../src/data/sourced.js'
import { dayNumber } from '../src/dates.js'

const root = new URL('..', import.meta.url).pathname

test('each program has its own rows, program name, effective date, last-checked date, and source link', () => {
  const sets = [
    [HASA_PROGRAM, HASA_ROWS, 11, '2025-09-10'],
    [CITYFHEPS_PROGRAM, CITYFHEPS_2026_ROWS, 10, '2026-04-01'],
    [SECTION8_PROGRAM, SECTION8_NYCHA_ROWS, 18, '2026-01-01'],
  ]
  for (const [program, rows, count, effective] of sets) {
    assert.equal(rows.length, count, `${program} row count`)
    for (const row of rows) {
      assert.equal(row.program, program)
      assert.equal(row.effectiveDate, effective)
      assert.equal(row.copiedOn, COPIED_ON)
      assert.ok(dayNumber(row.copiedOn) !== null)
      assert.match(row.sourceUrl, /^https:\/\/www\.nyc\.gov\//)
      assert.equal(row.confidence, 'official')
      assert.ok(isDisplayable(row))
      assert.equal(typeof row.maxRent, 'number')
    }
  }
})

test('no row object is shared between programs, and a program cannot load another program’s rows', () => {
  const all = [...HASA_ROWS, ...CITYFHEPS_2026_ROWS, ...SECTION8_NYCHA_ROWS, ...CITYFHEPS_2025_HISTORICAL_ROWS]
  assert.equal(new Set(all).size, all.length)
  assert.throws(() => scheduleRows(HASA_PROGRAM, CITYFHEPS_2026_ROWS.map((row) => ({ program: row.program, scheduleId: row.scheduleId }))), /not HASA/)
})

test('HASA and CityFHEPS differ for the same bedroom size', () => {
  const hasa1 = HASA_ROWS.find((row) => row.bedrooms === 1)
  const city1 = CITYFHEPS_2026_ROWS.find((row) => row.bedrooms === 1)
  assert.equal(hasa1.maxRent, 2762)
  assert.equal(city1.maxRent, 2734)
  for (const bedrooms of [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
    const hasa = HASA_ROWS.find((row) => row.bedrooms === bedrooms && row.unitKind !== 'sro')
    const city = CITYFHEPS_2026_ROWS.find((row) => row.bedrooms === bedrooms && row.unitKind !== 'sro')
    assert.notEqual(hasa.maxRent, city.maxRent, `${bedrooms} bedrooms`)
    assert.notEqual(hasa.effectiveDate, city.effectiveDate)
  }
})

test('the CityFHEPS 2025 column is historical: it has no effective date and no current check reads it', () => {
  assert.equal(CITYFHEPS_2025_HISTORICAL_ROWS.length, 10)
  for (const row of CITYFHEPS_2025_HISTORICAL_ROWS) assert.equal(row.effectiveDate, null)
  const users = ['src/rentCheck.js', 'src/fees.js', 'server/figures.js', 'server/guide.js', 'src/components/ProgramPanels.jsx']
  for (const file of users) assert.doesNotMatch(readFileSync(join(root, file), 'utf8'), /2025_HISTORICAL|standards2025/, file)
})

test('the six CityFHEPS 1-bedroom utility allowance examples are loaded and nothing else is', () => {
  assert.deepEqual(
    CITYFHEPS_UTILITY_ALLOWANCES_1BR.map((item) => [item.label, item.amount]),
    [
      ['gas heat+hot water', 112],
      ['cooking gas+electric', 141],
      ['electric heat+hot water', 106],
      ['oil heat+hot water', 139],
      ['electric incl. range', 126],
      ['heat pump', 37],
    ],
  )
  for (const item of CITYFHEPS_UTILITY_ALLOWANCES_1BR) assert.equal(item.bedrooms, 1)
})

test('rules with no source link or unverified confidence are never displayable', () => {
  const unverified = allRuleIds().map((id) => ruleRow(id)).filter((rule) => !rule.sourceUrl || rule.confidence !== 'official')
  assert.ok(unverified.length >= 3)
  for (const rule of unverified) assert.equal(isDisplayable(rule), false, rule.id)
  assert.equal(isDisplayable(HASA_RULES.securityVoucher), false)
  assert.equal(isDisplayable(CITYFHEPS_RULES.householdShare30Press), false)
  assert.equal(isDisplayable(CITYFHEPS_RULES.expansionPending), false)
  assert.equal(isDisplayable(HASA_RULES.brokerFee2013), false)
})

test('rules the criteria say not to cite are not in the bundled extract', () => {
  const ids = allRuleIds()
  for (const id of ['nys-rpl-238a-landlord-fees', 'cas-517-form-not-found', 'w147n-prior-versions-not-found']) {
    assert.equal(ids.includes(id), false, id)
  }
})

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else out.push(path)
  }
  return out
}

test('the app never reads /workspace at runtime and does not hard-code the barred figures or form names', () => {
  const files = [...walk(join(root, 'src')), ...walk(join(root, 'server'))].filter((file) => /\.(jsx?|html)$/.test(file))
  const copy = files.filter((file) => !file.includes('/criteria/'))
  assert.ok(copy.length > 20)
  for (const file of copy) {
    const text = readFileSync(file, 'utf8')
    assert.doesNotMatch(text, /\/workspace\//, file)
    assert.doesNotMatch(text, /CAS-517|W-147N-a/, file)
    // The criteria bar a flat CityFHEPS share and the 2013 HASA broker percentage. The HASA estimator note
    // in the assistant pack is HRA’s own page and is checked separately below.
    assert.doesNotMatch(text, /CityFHEPS[^.\n]{0,60}30\s?(%|percent)/i, file)
    assert.doesNotMatch(text, /HASA[^.\n]{0,80}broker[^.\n]{0,40}50\s?(%|percent)/i, file)
    assert.doesNotMatch(text, /238-a/i, file)
  }
})

test('criteria copies match the housing specialist files when that folder is present', { skip: !existsSync('/workspace/criteria/rules.json') }, () => {
  for (const file of ['hasa', 'cityfheps-2026', 'cityfheps-2025', 'section8-nycha-2026']) {
    assert.equal(
      readFileSync(join(root, 'src/data/criteria', `${file}.json`), 'utf8'),
      readFileSync(`/workspace/criteria/rent-schedules/${file}.json`, 'utf8'),
      file,
    )
  }
  const source = JSON.parse(readFileSync('/workspace/criteria/rules.json', 'utf8'))
  for (const copy of JSON.parse(readFileSync(join(root, 'src/data/criteria/rules.json'), 'utf8'))) {
    assert.deepEqual(copy, source.find((rule) => rule.id === copy.id), copy.id)
  }
})
