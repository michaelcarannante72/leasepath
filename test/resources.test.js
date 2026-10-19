import assert from 'node:assert/strict'
import test from 'node:test'
import { RESOURCES } from '../src/data.js'

test('the NYS DOL Coursera entry links the DOL page, states who qualifies, and says it is not affiliated', () => {
  const item = RESOURCES.find((entry) => entry.href === 'https://dol.ny.gov/online-learning-coursera')
  assert.ok(item)
  assert.equal(item.group, 'Jobs and training')
  assert.equal(item.action, 'See if you qualify')
  assert.match(item.detail, /^Free Coursera courses and certificates through NYS DOL/)
  assert.match(item.detail, /over 18 who are unemployed or underemployed/)
  assert.match(item.detail, /get New York unemployment benefits/)
  assert.match(item.detail, /NY\.GOV ID, and use the same email for Coursera/)
  assert.match(item.detail, /not affiliated with NYS DOL or Coursera/)
  assert.doesNotMatch(item.detail, /Coursera Plus/)
  assert.equal(RESOURCES.some((entry) => /coursera\.org/.test(entry.href)), false, 'never link coursera.org directly')
})

test('every resource has the fields the Resources page renders', () => {
  for (const entry of RESOURCES) {
    for (const key of ['group', 'title', 'detail', 'href', 'action']) assert.ok(entry[key], `${entry.title} ${key}`)
    assert.match(entry.href, /^(https:\/\/|tel:)/, entry.title)
  }
  assert.equal(new Set(RESOURCES.map((entry) => entry.title)).size, RESOURCES.length, 'titles are unique (they are React keys)')
})
