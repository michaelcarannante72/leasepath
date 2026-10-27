import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { CCHR, RIGHTS_ROUTE, CARD_LINES, LAW_POINTS } from '../src/knowYourRights.js'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('CCHR link and phone match the official source-of-income page', () => {
  assert.equal(CCHR.href, 'https://www.nyc.gov/site/cchr/media/source-of-income.page')
  assert.equal(CCHR.reportHref, 'https://www.nyc.gov/site/cchr/about/report-discrimination.page')
  assert.equal(CCHR.phone, '212-416-0197')
  assert.ok(LAW_POINTS.length >= 3)
  assert.ok(CARD_LINES.some((l) => l.includes('212-416-0197')))
})

test('page is printable, routed, and linked from Resources and After you find', () => {
  assert.equal(RIGHTS_ROUTE, '/know-your-rights')
  assert.match(read('src/App.jsx'), /hash === '\/know-your-rights'/)
  assert.match(read('src/App.jsx'), /route\.name === 'rights' && <KnowYourRightsPage/)
  assert.match(read('src/components/ResourcesPage.jsx'), /#\/know-your-rights/)
  assert.match(read('src/components/AfterYouFindPage.jsx'), /#\/know-your-rights/)
  const page = read('src/components/KnowYourRightsPage.jsx')
  assert.match(page, /Print rights card/)
  assert.match(page, /window\.print/)
  assert.match(page, /What to say to a landlord/)
  assert.doesNotMatch(page, /collect.*HIV|medical history/i)
})
