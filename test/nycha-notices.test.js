import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { EHV_NOTICE, MOVING_NOTICE, PROGRAMS, SOURCES, TABLE_NOTE, showMovingNotice } from '../src/afterYouFind.js'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('the specialist wording is copied exactly', () => {
  assert.equal(EHV_NOTICE.title, 'Emergency Housing Voucher update')
  assert.equal(EHV_NOTICE.body, "HUD has announced that EHV funding will end in late 2026. Check how this affects you and what to do next on NYCHA's Section 8 Program Updates page.")
  assert.equal(SOURCES[EHV_NOTICE.source].label, "Read NYCHA's update")
  assert.equal(SOURCES[EHV_NOTICE.source].href, 'https://www.nyc.gov/site/nycha/section-8/section-8-program-updates.page')
  assert.equal(MOVING_NOTICE.title, 'Moving with Section 8?')
  assert.equal(MOVING_NOTICE.body, "Since May 1, 2026, NYCHA only approves voluntary (non-emergency) moves if the new apartment's rent plus utility allowance is the same as or lower than your current one. That limit can be lower than the payment standard we show. Emergency transfers don't have this limit.")
  assert.equal(SOURCES[MOVING_NOTICE.source].label, 'NYCHA Section 8 Tenants FAQ')
  assert.equal(SOURCES[MOVING_NOTICE.source].href, 'https://www.nyc.gov/site/nycha/section-8/tenants-faq.page')
  assert.equal(TABLE_NOTE.body, 'Section 8 in NYC is run by three agencies: NYCHA (the largest), HPD, and NYS Homes and Community Renewal (HCR). Each has its own rules and rent limits. You usually pay about 30% of your adjusted monthly income toward rent.')
  assert.equal(TABLE_NOTE.sourceLabel, 'About Section 8 (NYCHA)')
  assert.equal(SOURCES[TABLE_NOTE.source].href, 'https://www.nyc.gov/site/nycha/section-8/about-section-8.page')
})

test('HCR is a table row by name only, with no link', () => {
  const hcr = PROGRAMS.find((row) => /HCR/.test(row.program))
  assert.ok(hcr)
  assert.equal(hcr.source, undefined)
})

test('the moving warning is NYCHA Section 8 only, and skipped for people not renting now', () => {
  const renting = { program: 'Section 8', situation: 'Renting now' }
  assert.equal(showMovingNotice(renting, { section8Agency: 'NYCHA' }), true)
  assert.equal(showMovingNotice({ program: 'Section 8', situation: '' }, { section8Agency: 'NYCHA' }), true)
  assert.equal(showMovingNotice({ program: 'Section 8', situation: 'Unsure' }, { section8Agency: 'NYCHA' }), true)
  assert.equal(showMovingNotice(renting, { section8Agency: 'HPD' }), false)
  assert.equal(showMovingNotice(renting, { section8Agency: 'HCR' }), false)
  assert.equal(showMovingNotice(renting, { section8Agency: '' }), false)
  assert.equal(showMovingNotice({ ...renting, program: 'CityFHEPS' }, { section8Agency: 'NYCHA' }), false)
  for (const situation of ['Shelter or transitional housing', 'Doubled up with someone else', 'HASA SRO or supportive housing']) {
    assert.equal(showMovingNotice({ program: 'Section 8', situation }, { section8Agency: 'NYCHA' }), false, situation)
  }
  const detail = read('src/components/DetailPage.jsx')
  assert.match(detail, /\{showMovingNotice\(plan, checks\) && <MovingNotice \/>\}/)
  assert.match(read('src/components/AfterYouFindPage.jsx'), /NYCHA Section 8 only/)
})

test('no EHV end date beyond the wording, no replacement program, no counts', async () => {
  const { LEASE_UP_KNOWLEDGE } = await import('../server/guide.js')
  const notices = [EHV_NOTICE.body, MOVING_NOTICE.body, TABLE_NOTE.body].join(' ')
  const ruby = LEASE_UP_KNOWLEDGE.slice(LEASE_UP_KNOWLEDGE.indexOf('- Section 8 in NYC'), LEASE_UP_KNOWLEDGE.indexOf('- HAVP'))
  for (const text of [notices, ruby]) {
    assert.doesNotMatch(text, /\b(January|February|March|April|June|July|August|September|October|November|December)\b/)
    assert.doesNotMatch(text, /\b\d{1,3}(,\d{3})+\b|\bmillion\b|\bhouseholds\b|\bowners\b/i)
    assert.doesNotMatch(text, /replac|successor|transition to/i)
  }
  for (const fact of [/EHV funding will end in late 2026/, /May 1, 2026/, /NYCHA rule only, never for HPD or HCR/, /NYCHA \(the largest\), HPD, and NYS Homes and Community Renewal \(HCR\)/, /section-8-program-updates\.page/, /tenants-faq\.page/]) {
    assert.match(ruby, fact)
  }
})
