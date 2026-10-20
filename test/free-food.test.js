import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { FREE_FOOD, FREE_FOOD_CAUTION, FREE_FOOD_LABEL, ADDED_ON, OTHER_HELP, OTHER_HELP_TITLE, SOURCE_CREDIT, HEALTH, HEALTH_TITLE } from '../src/freeFood.js'
import { trackView } from '../src/analytics.js'

test('ten volunteer entries with schedule, place, and offer, and the shared cautions', () => {
  assert.equal(FREE_FOOD.length, 10)
  for (const item of FREE_FOOD) {
    for (const key of ['name', 'group', 'when', 'where', 'offers']) assert.ok(item[key], `${item.name} ${key}`)
    const rest = { ...item }
    delete rest.link
    assert.doesNotMatch(JSON.stringify(rest), /\.\.\.|…|https?:\/\//)
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

test('Young Black Queens links to its Instagram, and only listed links appear', () => {
  const by = Object.fromEntries(FREE_FOOD.map((item) => [item.name, item]))
  assert.equal(by['Young Black Queens NYC'].link, 'https://www.instagram.com/ybq.nyc/')
  assert.deepEqual(FREE_FOOD.filter((item) => item.link).map((item) => item.name).sort(),
    ["Marsha's Closet", 'Mercadito Solidario Project', 'Young Black Queens NYC'])
  assert.equal(by["Marsha's Closet"].link, 'https://www.instagram.com/claimourspacenow/')
  assert.equal(by["Marsha's Closet"].email, 'admin@claimourspacenow.org')
  const m = by['Mercadito Solidario Project']
  assert.equal(m.group, 'Colectivo Intercultural TRANSgrediendo')
  assert.equal(m.when, 'Wednesdays, 3 to 6pm')
  assert.match(m.where, /3763 83rd St, Suite 1B, Jackson Heights.*11372/)
  assert.equal(m.phone, '(347) 738-6989')
  assert.equal(m.link, 'https://www.ourvoicesarefree.org/calendar')
})

test('Other community help has the Bike Plant card and no PartySafe Medics', () => {
  assert.equal(OTHER_HELP_TITLE, 'Other community help')
  assert.equal(OTHER_HELP.length, 1)
  const bike = OTHER_HELP[0]
  assert.equal(bike.name, 'Bike Plant')
  assert.match(bike.offers, /sliding scale/)
  assert.match(bike.where, /Brooklyn/)
  assert.match(bike.how, /bikeplantnyc@gmail\.com/)
  assert.match(bike.how, /height/)
  assert.match(bike.how, /phone number/)
  assert.match(bike.how, /business hours/)
  assert.equal(bike.phone, '(347) 240-2466')
  assert.equal(bike.link, 'https://www.bikeplant.net/repair-fund')
  assert.doesNotMatch(JSON.stringify(bike), /\.\.\.|…/)
  const page = readFileSync(new URL('../src/components/ResourcesPage.jsx', import.meta.url), 'utf8')
  const data = readFileSync(new URL('../src/freeFood.js', import.meta.url), 'utf8')
  assert.doesNotMatch(page + data, /PartySafe/i)
  assert.match(page, /\{OTHER_HELP_TITLE\}<\/h3>\s*<p className="free-food-label">\{FREE_FOOD_LABEL\}/)
  assert.match(page, /Added \{ADDED_ON\}\./)
})

test('source credit links to Mutual Aid NYC resources', () => {
  assert.equal(SOURCE_CREDIT.before + SOURCE_CREDIT.text + ' (' + SOURCE_CREDIT.href + ')' + SOURCE_CREDIT.after,
    'Listings gathered from Mutual Aid NYC resources (https://resources.mutualaid.nyc), rewritten by LeasePath.')
  const page = readFileSync(new URL('../src/components/ResourcesPage.jsx', import.meta.url), 'utf8')
  assert.match(page, /href=\{SOURCE_CREDIT\.href\}/)
})

test('Health subsection: COIN and Abortion Finder, facts only', () => {
  assert.equal(HEALTH_TITLE, 'Health')
  const by = Object.fromEntries(HEALTH.map((item) => [item.name, item]))
  const coin = by['COIN at Callen-Lorde']
  assert.match(coin.offers, /free health care program for sex workers/)
  for (const word of ['primary care', 'sexual health', 'HIV treatment and prevention', 'transgender health', 'GYN care']) assert.match(coin.offers, new RegExp(word))
  assert.match(coin.how, /212-271-8134/)
  assert.equal(coin.link, 'https://callen-lorde.org/coin/')
  const af = by['Abortion Finder']
  assert.match(af.offers, /national directory/)
  assert.match(af.how, /does not make referrals or give care itself/)
  assert.equal(af.link, 'https://www.abortionfinder.org/')
  for (const item of HEALTH) assert.doesNotMatch(JSON.stringify(item), /\.\.\.|…/)
})

test('every outside link on the section opens in a new tab with noopener noreferrer', () => {
  const page = readFileSync(new URL('../src/components/ResourcesPage.jsx', import.meta.url), 'utf8')
  const start = page.indexOf('<section className="resource-group free-food"')
  const end = page.indexOf('</section>', start)
  const section = page.slice(start, end)
  const blank = section.match(/<a [^>]*target="_blank"[^>]*>/g)
  assert.ok(blank.length >= 4)
  for (const tag of blank) assert.match(tag, /rel="noopener noreferrer"/)
})

test('Health links send no dataLayer events: no click handlers, and Resources is never tracked', () => {
  const page = readFileSync(new URL('../src/components/ResourcesPage.jsx', import.meta.url), 'utf8')
  const start = page.indexOf('<h3 id="health-title">')
  const health = page.slice(start, page.indexOf('</ul>', start))
  assert.ok(start > 0)
  assert.doesNotMatch(health, /onClick|onMouseDown|onAuxClick|dataLayer|safePush|trackView|gtag/)
  assert.doesNotMatch(page, /analytics|dataLayer/)
  const win = { location: { origin: 'https://leasepath.app' } }
  const doc = { createElement: () => ({}), head: { appendChild: () => {} } }
  assert.equal(trackView(win, doc, { hashPath: '/resources', assistantOpen: false, consent: 'granted' }), null)
  assert.equal(win.dataLayer, undefined)
})
