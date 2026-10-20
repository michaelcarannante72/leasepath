import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { CAVEAT, CHAP, LAST_REVIEWED, PROGRAMS, RIGHTS, SOURCES, STEPS } from '../src/afterYouFind.js'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('the page has five tenant-side steps, tagged by program, each with an official source', () => {
  assert.deepEqual(STEPS.map((s) => s.id), ['program', 'ceiling', 'package', 'inspection', 'approval'])
  for (const step of STEPS) {
    assert.ok(step.applies.length > 0)
    for (const id of step.sources) assert.match(SOURCES[id].href, /^https:\/\/www\.nyc\.gov\//)
  }
  const inspection = STEPS.find((s) => s.id === 'inspection')
  assert.deepEqual(inspection.applies, ['Section 8', 'CityFHEPS'])
  for (const word of [/smoke/i, /heat/i, /hot water/i, /locks/i, /leaks/i, /peeling/i]) assert.ok(inspection.checklist.some((c) => word.test(c)))
  assert.match(STEPS.find((s) => s.id === 'approval').body, /FARE Act/)
})

test('voucher table, rights box, CHAP card, caveat, and no landlord-site citations', () => {
  assert.deepEqual(PROGRAMS.map((p) => p.program), ['Section 8 (NYCHA)', 'Section 8 (HPD)', 'CityFHEPS', 'FHEPS', 'HASA'])
  assert.match(SOURCES[RIGHTS.source].href, /nyc\.gov\/site\/cchr\//)
  assert.match(CHAP.label, /Press reporting/)
  assert.match(SOURCES[CHAP.source].href, /^https:\/\/citylimits\.org\//)
  assert.ok(CHAP.points.some((p) => /not open yet/.test(p)))
  assert.match(CAVEAT, /Policy changes/)
  assert.ok(LAST_REVIEWED)
  const all = read('src/afterYouFind.js') + read('src/components/AfterYouFindPage.jsx')
  assert.doesNotMatch(all, /Wilhelm|Voro|HAVP/i)
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
  for (const part of ['Which voucher do I have?', 'id="chap"', 'RIGHTS.title', 'LAST_REVIEWED']) assert.ok(page.includes(part), part)
})

test('CHAP stays out of the rent check, voucher picker, and calculators', () => {
  for (const file of ['src/rentCheck.js', 'src/fit.js', 'src/components/PlanPage.jsx', 'src/components/IncomePrescreen.jsx', 'src/components/SearchPage.jsx']) {
    assert.doesNotMatch(read(file), /CHAP/, file)
  }
})

test('Ruby knows the lease-up notes and that CHAP is not open', async () => {
  const { SYSTEM, LEASE_UP_KNOWLEDGE } = await import('../server/guide.js')
  assert.ok(SYSTEM.includes(LEASE_UP_KNOWLEDGE))
  for (const fact of [/ceiling, not an approved rent/, /rent reasonableness/, /must pass inspection/, /walkthrough/, /move-in authorization/, /FARE Act/, /confirm with your agency or caseworker/, /CHAP .*is NOT open yet/, /City Limits, Aug 21, 2026/, /HPD, not HRA/, /Never say CHAP is open/]) {
    assert.match(LEASE_UP_KNOWLEDGE, fact)
  }
  assert.doesNotMatch(LEASE_UP_KNOWLEDGE, /Wilhelm|Voro|HAVP/i)
})
