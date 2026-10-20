import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { FREE_FOOD, FREE_FOOD_CAUTION, FREE_FOOD_LABEL, ADDED_ON } from '../src/freeFood.js'

test('nine volunteer entries with schedule, place, and offer, and the shared cautions', () => {
  assert.equal(FREE_FOOD.length, 9)
  for (const item of FREE_FOOD) {
    for (const key of ['name', 'group', 'when', 'where', 'offers']) assert.ok(item[key], `${item.name} ${key}`)
    assert.doesNotMatch(JSON.stringify(item), /\.\.\.|…|https?:\/\//)
  }
  assert.equal(FREE_FOOD_CAUTION, 'Times can change, check with the group before you go.')
  assert.equal(FREE_FOOD_LABEL, 'Run by volunteers, not a government agency. Check their page before you go.')
  assert.equal(ADDED_ON, 'Oct 20, 2026')
  const page = readFileSync(new URL('../src/components/ResourcesPage.jsx', import.meta.url), 'utf8')
  assert.match(page, /\{FREE_FOOD_CAUTION\} Added \{ADDED_ON\}\./)
  assert.doesNotMatch(page, /Last checked/)
  assert.match(page, /\{FREE_FOOD_LABEL\}/)
})

test('specific facts: Adelphi is Clinton Hill/Fort Greene, Community Solidarity is Bed-Stuy only, Bushwick lists its Instagram', () => {
  const by = Object.fromEntries(FREE_FOOD.map((item) => [item.name, item]))
  assert.match(by['Adelphi Free Store'].where, /Clinton Hill\/Fort Greene/)
  assert.doesNotMatch(by['Adelphi Free Store'].where, /Greenpoint/)
  assert.match(by['Community Solidarity'].where, /Bed-Stuy/)
  assert.doesNotMatch(JSON.stringify(by['Community Solidarity']), /Long Island|Farmingville|Wyandanch|Hempstead|Huntington/)
  assert.match(by['Bushwick Free Store'].note, /@bushwickfreestore/)
  assert.equal(by["Marsha's Closet"].group, 'Claim Our Space NOW')
})
