import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  ACCESS_HRA_URL,
  HRA_INFOLINE,
  MOVING_ROUTE,
  SECTIONS,
  SOURCES,
} from '../src/movingHelp.js'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('ACCESS HRA link is the official apply URL and One Shot is cited', () => {
  assert.equal(ACCESS_HRA_URL, 'https://a069-access.nyc.gov/accesshra/')
  assert.equal(SOURCES.oneShot.href, 'https://access.nyc.gov/programs/one-shot-deal/')
  assert.equal(SOURCES.specialGrant.href, 'https://www.nyc.gov/site/hra/help/special-grant-document-guide.page')
  assert.equal(HRA_INFOLINE.phone, '718-557-1399')
  const ids = SECTIONS.map((s) => s.id)
  assert.ok(ids.includes('one-shot') && ids.includes('furniture') && ids.includes('moving-allowance'))
})

test('no invented dollar amounts for furniture or moving grants', () => {
  const all = read('src/movingHelp.js') + read('src/components/MovingHelpPage.jsx')
  assert.doesNotMatch(all, /\$\d{2,}|guaranteed allowance|pays \$/)
  assert.match(all, /you may qualify/i)
})

test('page is routed and linked from Resources, Steps, and After you find', () => {
  assert.equal(MOVING_ROUTE, '/moving-help')
  assert.match(read('src/App.jsx'), /hash === '\/moving-help'/)
  assert.match(read('src/App.jsx'), /route\.name === 'moving' && <MovingHelpPage/)
  assert.match(read('src/components/ResourcesPage.jsx'), /#\/moving-help/)
  assert.match(read('src/components/StepsPage.jsx'), /#\/moving-help/)
  assert.match(read('src/components/AfterYouFindPage.jsx'), /#\/moving-help/)
  assert.match(read('src/components/MovingHelpPage.jsx'), /Open ACCESS HRA/)
})
