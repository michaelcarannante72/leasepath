import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { PROGRAMS, SOURCES, SV } from '../src/afterYouFind.js'

test('Stability Vouchers are a referral-only table row and card, linked to the NYC Continuum of Care', () => {
  const row = PROGRAMS.find((p) => p.program === 'Stability Vouchers (SV)')
  assert.equal(row.agency, 'NYCHA')
  assert.match(row.serves, /Referral only/)
  assert.equal(SOURCES[row.source].href, 'https://www.nyc.gov/site/nycccoc/index.page')
  const text = SV.points.join(' ')
  for (const fact of [/homeless or at risk of homelessness/, /domestic violence, dating violence, stalking, or sexual assault/, /veterans or families with a veteran/, /can’t apply to NYCHA directly/, /referral from the NYC Continuum of Care or one of its providers/]) assert.match(text, fact)
  assert.match(readFileSync(new URL('../src/components/AfterYouFindPage.jsx', import.meta.url), 'utf8'), /id="sv"/)
})

test('SV copy never says it is open and gives no date; Ruby has the same facts', async () => {
  const { LEASE_UP_KNOWLEDGE } = await import('../server/guide.js')
  const ruby = LEASE_UP_KNOWLEDGE.slice(LEASE_UP_KNOWLEDGE.indexOf('- Stability Vouchers'), LEASE_UP_KNOWLEDGE.indexOf('- HAVP'))
  const card = [SV.title, SV.label, ...SV.points, PROGRAMS.find((p) => p.program.startsWith('Stability')).serves].join(' ')
  const claims = ruby.replace('Do not say the program is open now and do not give any date.', '')
  for (const text of [card, claims]) {
    assert.doesNotMatch(text, /\b(19|20)\d{2}\b|\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/)
    assert.doesNotMatch(text, /\bopen\b/i)
  }
  assert.doesNotMatch(card, /open/i)
  for (const fact of [/referral only/, /Continuum of Care/, /nycccoc\/index\.page/, /domestic violence/, /veteran/, /Do not say the program is open now/]) assert.match(ruby, fact)
})
