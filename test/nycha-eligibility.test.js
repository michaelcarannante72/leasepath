import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { NYCHA_ELIGIBILITY, NYCHA_INCOME_LIMITS, NYCHA_SCAM_WARNING } from '../src/afterYouFind.js'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const SCAM = "NYCHA never charges a fee to apply for public housing or Section 8, or to process a Section 8 rental. If anyone asks you for money, report it to the NYCHA Inspector General at ig@nycha.nyc.gov or 212-306-3355, or to HUD's Inspector General at 1-800-347-3735."

test('the scam warning is the exact copy, linked to NYCHA eligibility, on the page, the Section 8 card, and in Ruby', async () => {
  assert.equal(NYCHA_SCAM_WARNING, SCAM)
  assert.equal(NYCHA_ELIGIBILITY.href, 'https://www.nyc.gov/site/nycha/eligibility/eligibility.page')
  assert.match(read('src/components/AfterYouFindPage.jsx'), /<NychaScamWarning \/>/)
  assert.match(read('src/components/ProgramPanels.jsx'), /<NychaScamWarning \/>/)
  const { SYSTEM } = await import('../server/guide.js')
  assert.ok(SYSTEM.includes(SCAM))
  assert.ok(SYSTEM.includes(NYCHA_ELIGIBILITY.href))
})

test('the income limits table has the posted figures, label, notes, and rules', () => {
  assert.equal(NYCHA_INCOME_LIMITS.label, "NYCHA's posted limits, check before applying")
  assert.deepEqual(NYCHA_INCOME_LIMITS.section8, [56700, 64800, 72900, 81000, 87500, 94000, 100450, 106950])
  assert.deepEqual(NYCHA_INCOME_LIMITS.publicHousing, [95000, 108600, 122150, 135700, 146600, 157450, 168300, 179150, 190000, 200850, 211700, 222550, 233450, 244300, 255150])
  const notes = NYCHA_INCOME_LIMITS.notes.join(' ')
  assert.match(notes, /Section 8 income is checked when the voucher is issued/)
  assert.match(notes, /18 or older, or an emancipated minor/)
  assert.match(notes, /senior buildings require everyone in the household to be 62 or older/)
})

test('the limits stay out of the rent check, voucher picker, and calculators, and Ruby quotes no limit figures', async () => {
  for (const file of ['src/rentCheck.js', 'src/fit.js', 'src/incomePrescreen.js', 'src/components/PlanPage.jsx', 'src/components/IncomePrescreen.jsx', 'src/components/SearchPage.jsx', 'src/components/DetailPage.jsx', 'src/components/ProgramPanels.jsx']) {
    assert.doesNotMatch(read(file), /NYCHA_INCOME_LIMITS|56,?700|95,?000/, file)
  }
  const { SYSTEM } = await import('../server/guide.js')
  assert.doesNotMatch(SYSTEM, /56,?700|95,?000|106,?950|255,?150/)
})

test('immigration status is never mentioned on the new copy or in Ruby’s new notes', async () => {
  const { LEASE_UP_KNOWLEDGE } = await import('../server/guide.js')
  for (const text of [read('src/afterYouFind.js'), read('src/components/AfterYouFindPage.jsx'), LEASE_UP_KNOWLEDGE]) {
    assert.doesNotMatch(text, /immigra|citizen|alien|green card|visa\b/i)
  }
})
