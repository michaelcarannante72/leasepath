import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { RESOURCES } from '../src/data.js'

const COPY = "HASA (part of NYC HRA) helps NYC residents living with HIV or AIDS with case management, housing help, and benefits. You don't need an AIDS diagnosis or symptoms to qualify. In most HASA rental help, you pay about 30% of your income and HASA pays the rest. HASA will ask for medical proof; LeasePath never asks for or stores it."

test('the HASA card uses the exact copy with the HRA link and the FAQs as a second link', () => {
  const card = RESOURCES.find((item) => item.title === 'HASA services')
  assert.equal(card.detail, COPY)
  assert.equal(card.href, 'https://www.nyc.gov/site/hra/help/hiv-aids-services.page')
  assert.deepEqual(card.more, { label: 'HASA FAQs', href: 'https://www.nyc.gov/site/hra/help/hasa-faqs.page' })
  assert.match(readFileSync(new URL('../src/components/ResourcesPage.jsx', import.meta.url), 'utf8'), /item\.more &&/)
})

test('Ruby has the same HASA facts plus the 30% scope and the five boroughs', async () => {
  const { SYSTEM } = await import('../server/guide.js')
  for (const fact of [/HASA \(part of NYC HRA\) helps NYC residents living with HIV or AIDS with case management, housing help, and benefits/, /don't need an AIDS diagnosis or symptoms/, /about 30 percent of your income and HASA pays the rest/, /isn't already in HASA housing \(SRO, congregate, or scatter-site\)/, /only Cash Assistance, SSI, SSD, or veterans' benefits/, /LeasePath never asks for or stores it/, /HASA centers in all five boroughs/, /hasa-faqs\.page/]) {
    assert.match(SYSTEM, fact)
  }
})

test('no 12-month recertification and no HOPWA anywhere on the site or in Ruby', async () => {
  const { SYSTEM } = await import('../server/guide.js')
  const site = ['src/data.js', 'src/afterYouFind.js', 'src/components/ResourcesPage.jsx', 'src/components/ProgramPanels.jsx', 'server/hraKnowledge.js'].map((f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')).join(' ')
  for (const text of [SYSTEM, site]) {
    assert.doesNotMatch(text, /HOPWA/i)
    assert.doesNotMatch(text, /(12|twelve)[- ]month[^.]{0,40}recertif|recertif[^.]{0,40}(12|twelve)[- ]month/i)
    assert.doesNotMatch(text, /HASA[^.]{0,80}recertif/i)
  }
})
