import assert from 'node:assert/strict'
import { untx } from './source-text.js'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { CAVEAT, CHAP, HAVP, LAST_REVIEWED, PROGRAMS, RIGHTS, SOURCES, STEPS } from '../src/afterYouFind.js'

const read = (path) => untx(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'))

test('the page has five tenant-side steps, tagged by program, each with an official source', () => {
  assert.deepEqual(STEPS.map((s) => s.id), ['program', 'ceiling', 'package', 'inspection', 'approval'])
  for (const step of STEPS) {
    assert.ok(step.applies.length > 0)
    for (const id of step.sources) assert.match(SOURCES[id].href, /^https:\/\/www\.nyc\.gov\//)
  }
  const inspection = STEPS.find((s) => s.id === 'inspection')
  assert.deepEqual(inspection.applies, ['Section 8', 'HAVP', 'CityFHEPS'])
  for (const word of [/smoke/i, /heat/i, /hot water/i, /locks/i, /windows/i, /leaks/i, /peeling/i]) assert.ok(inspection.checklist.some((c) => word.test(c)))
  assert.match(STEPS.find((s) => s.id === 'approval').body, /FARE Act/)
  assert.match(STEPS.find((s) => s.id === 'ceiling').body, /“may fit,” not “approved\.”/)
})

test('voucher table, rights box, CHAP card, caveat, and no landlord-site citations', () => {
  assert.deepEqual(PROGRAMS.map((p) => p.program), ['Section 8 (NYCHA)', 'Section 8 (HPD)', 'Section 8 (NYS HCR)', 'CityFHEPS', 'FHEPS', 'HASA', 'HAVP', 'Stability Vouchers (SV)', 'CHAP'])
  const agency = Object.fromEntries(PROGRAMS.map((p) => [p.program, p.agency]))
  assert.match(agency.HASA, /^HRA/)
  assert.equal(agency.HAVP, 'HPD')
  assert.equal(agency.CHAP, 'HPD')
  assert.match(PROGRAMS.find((p) => p.program === 'CHAP').serves, /January 2027 \(reported\)/)
  assert.deepEqual(HAVP.sources.map((id) => SOURCES[id].href), ['https://www.nyc.gov/site/hpd/services-and-information/about-hpd-havp.page', 'https://www.nyc.gov/assets/hpd/downloads/pdfs/services/havp-tenant-faq.pdf'])
  for (const fact of [/March 1, 2026/, /2030/, /\$32\.5 million/, /900 to 1,100/, /cannot apply on your own/, /120 days/, /60-day extension/, /30% of your adjusted income/, /HQS/]) assert.ok(HAVP.points.some((p) => fact.test(p)) || fact.test(HAVP.label), String(fact))
  assert.match(SOURCES[RIGHTS.source].href, /nyc\.gov\/site\/cchr\//)
  assert.match(CHAP.label, /Press reporting/)
  assert.match(SOURCES[CHAP.source].href, /^https:\/\/citylimits\.org\//)
  assert.ok(CHAP.points.some((p) => /not open yet/.test(p)))
  assert.match(CAVEAT, /Policy changes/)
  assert.ok(LAST_REVIEWED)
  const all = read('src/afterYouFind.js') + read('src/components/AfterYouFindPage.jsx')
  assert.doesNotMatch(all, /Wilhelm|Voro/i)
})

test('the page is routed, linked from Steps, Resources, and the rent check, and lights the Steps tab', () => {
  const app = read('src/App.jsx')
  assert.match(app, /hash === '\/after-you-find'/)
  assert.match(app, /route\.name === 'after' && <AfterYouFindPage \/>/)
  assert.match(app, /route\.name === 'after'\n\s*\? 'steps'/)
  assert.match(read('src/components/StepsPage.jsx'), /href="#\/after-you-find"/)
  assert.match(read('src/components/ResourcesPage.jsx'), /#\/after-you-find#chap/)
  assert.match(read('src/components/DetailPage.jsx'), /It is not an approval\. <a href="#\/after-you-find">/)
  const page = read('src/components/AfterYouFindPage.jsx')
  for (const part of ['Which voucher do I have?', 'id="havp"', 'id="chap"', 'RIGHTS.title', 'LAST_REVIEWED']) assert.ok(page.includes(part), part)
})

test('CHAP and HAVP stay out of the rent check, voucher picker, and calculators', () => {
  for (const file of ['src/rentCheck.js', 'src/fit.js', 'src/components/PlanPage.jsx', 'src/components/IncomePrescreen.jsx', 'src/components/SearchPage.jsx']) {
    assert.doesNotMatch(read(file), /CHAP|HAVP|Stability Voucher/, file)
  }
})

test('Ruby knows the lease-up notes and that CHAP is not open', async () => {
  const { SYSTEM, LEASE_UP_KNOWLEDGE } = await import('../server/guide.js')
  assert.ok(SYSTEM.includes(LEASE_UP_KNOWLEDGE))
  for (const fact of [/ceiling, not an approved rent/, /rent reasonableness/, /must pass inspection/, /walkthrough/, /move-in authorization/, /FARE Act/, /confirm with your agency or caseworker/, /CHAP .*is NOT open yet/, /City Limits, Aug 21, 2026/, /HPD, not HRA/, /Never say CHAP is open/]) {
    assert.match(LEASE_UP_KNOWLEDGE, fact)
  }
  assert.doesNotMatch(LEASE_UP_KNOWLEDGE, /Wilhelm|Voro/i)
  for (const fact of [/HAVP .*run in NYC by HPD/, /Nobody can apply on their own/, /Do not quote an HAVP income figure/]) assert.match(LEASE_UP_KNOWLEDGE, fact)
})
