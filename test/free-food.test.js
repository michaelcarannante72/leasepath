import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  FREE_FOOD, FREE_FOOD_CAUTION, FREE_FOOD_LABEL, ADDED_ON, OTHER_HELP, OTHER_HELP_TITLE, SOURCE_CREDIT,
  HEALTH, HEALTH_TITLE, HOUSING, HOUSING_TITLE, OLDER, OLDER_TITLE, COMMUNITY_SECTIONS,
} from '../src/freeFood.js'
import { trackView } from '../src/analytics.js'

const page = readFileSync(new URL('../src/components/ResourcesPage.jsx', import.meta.url), 'utf8')
const all = COMMUNITY_SECTIONS.flatMap((section) => section.items)
const byName = Object.fromEntries(all.map((item) => [item.name, item]))

test('ten volunteer food entries with schedule, place, and offer, and the shared cautions', () => {
  assert.equal(FREE_FOOD.length, 10)
  for (const item of FREE_FOOD) {
    for (const key of ['name', 'group', 'when', 'where', 'offers']) assert.ok(item[key], `${item.name} ${key}`)
    const rest = { ...item }
    delete rest.link
    assert.doesNotMatch(JSON.stringify(rest), /https?:\/\//)
  }
  assert.equal(FREE_FOOD_CAUTION, 'Times can change, check with the group before you go.')
  assert.equal(FREE_FOOD_LABEL, 'Run by volunteers, not a government agency. Check their page before you go.')
  assert.equal(ADDED_ON, 'Oct 20, 2026')
  assert.match(page, /\{FREE_FOOD_CAUTION\} Added \{ADDED_ON\}\./)
  assert.doesNotMatch(page, /Last checked/)
})

test('every card has no ellipsis, and every card shows Added Oct 20, 2026', () => {
  for (const item of all) assert.doesNotMatch(JSON.stringify(item), /\.\.\.|…/, item.name)
  assert.match(page, /<>Added \{ADDED_ON\}\.<\/>/)
})

test('sections in order with the jump list, volunteer label only on volunteer sections', () => {
  assert.deepEqual(COMMUNITY_SECTIONS.map((s) => s.jump),
    ['Food and clothing', 'Housing and drop-in', 'Getting around', 'Health and support', 'Older New Yorkers'])
  assert.deepEqual(COMMUNITY_SECTIONS.map((s) => s.title),
    ['Free food and clothing', 'Housing and drop-in help', 'Getting around', 'Health and support', 'Older New Yorkers'])
  assert.deepEqual(COMMUNITY_SECTIONS.filter((s) => s.label).map((s) => s.id), ['free-food-title', 'other-help-title'])
  assert.equal(new Set(COMMUNITY_SECTIONS.map((s) => s.id)).size, 5)
  assert.match(page, /className="community-jump"/)
  assert.match(page, /\{section\.label && <p className="free-food-label">\{FREE_FOOD_LABEL\}<\/p>\}/)
})

test('food facts: Adelphi, Community Solidarity, Bushwick, Marsha, Mercadito, YBQ', () => {
  assert.match(byName['Adelphi Free Store'].where, /Clinton Hill\/Fort Greene/)
  assert.doesNotMatch(byName['Adelphi Free Store'].where, /Greenpoint/)
  assert.equal(byName['Community Solidarity'].where, 'Bed-Stuy, Brooklyn')
  assert.match(byName['Bushwick Free Store'].note, /@bushwickfreestore/)
  assert.equal(byName["Marsha's Closet"].group, 'Claim Our Space NOW')
  assert.equal(byName["Marsha's Closet"].link, 'https://www.instagram.com/claimourspacenow/')
  assert.equal(byName["Marsha's Closet"].email, 'admin@claimourspacenow.org')
  const m = byName['Mercadito Solidario Project']
  assert.equal(m.when, 'Wednesdays, 3 to 6pm')
  assert.match(m.where, /3763 83rd St, Suite 1B, Jackson Heights.*11372/)
  assert.equal(m.phone, '(347) 738-6989')
  assert.equal(m.link, 'https://www.ourvoicesarefree.org/calendar')
  assert.equal(byName['Young Black Queens NYC'].link, 'https://www.instagram.com/ybq.nyc/')
})

test('Getting around: Bike Plant without the old email and height steps', () => {
  assert.equal(OTHER_HELP_TITLE, 'Getting around')
  assert.equal(OTHER_HELP.length, 1)
  const bike = OTHER_HELP[0]
  assert.match(bike.offers, /bikes and bike repairs on a sliding scale/i)
  assert.equal(bike.where, 'Brooklyn')
  assert.equal(bike.how, 'See their page for how to get on the bike list.')
  assert.doesNotMatch(JSON.stringify(bike), /gmail|height|business hours/)
  assert.equal(bike.phone, '(347) 240-2466')
  assert.equal(bike.link, 'https://www.bikeplant.net/repair-fund')
})

test('Housing and drop-in help: Ali Forney Center, no age range', () => {
  assert.equal(HOUSING_TITLE, 'Housing and drop-in help')
  const af = HOUSING[0]
  assert.match(af.offers, /24-hour drop-in center for homeless LGBTQ\+ youth, with free medical and mental health care/)
  assert.match(af.where, /307 West 38th Street, 3rd floor, New York, NY 10018/)
  assert.equal(af.when, 'New intakes Monday to Friday 8am to 8pm, Saturday and Sunday 10am to 6pm. Closed Wednesday 2 to 4pm.')
  assert.equal(af.phone, '212-206-0574 ext. 100')
  assert.equal(af.who, 'See their site for who qualifies.')
  assert.equal(af.link, 'https://www.aliforneycenter.org/')
  assert.doesNotMatch(JSON.stringify(af), /\bages?\b|years old|\b\d{2}\s*(to|-)\s*\d{2}\b/i)
})

test('Health and support: COIN, Abortion Finder, PartySafe, Identity House, ANAD', () => {
  assert.equal(HEALTH_TITLE, 'Health and support')
  assert.equal(HEALTH.length, 5)
  const coin = byName['COIN at Callen-Lorde']
  for (const word of ['sex workers', 'primary care', 'sexual health', 'HIV treatment and prevention', 'transgender health', 'GYN care']) assert.match(coin.offers, new RegExp(word))
  assert.match(coin.how, /212-271-8134/)
  assert.equal(coin.link, 'https://callen-lorde.org/coin/')
  assert.match(byName['Abortion Finder'].how, /does not make referrals or give care itself/)
  assert.equal(byName['Abortion Finder'].link, 'https://www.abortionfinder.org/')
  const ps = byName['PartySafe Medics']
  assert.equal(ps.lead, 'Paid service, sliding-scale rates. You hire them to staff events; not a free clinic.')
  for (const word of ['Harm-reduction medics for events', 'naloxone', 'drug testing strips', 'oxygen', 'first aid', 'overdose']) assert.match(ps.offers, new RegExp(word))
  assert.match(ps.how, /Signal/)
  assert.match(ps.how, /WhatsApp/)
  assert.match(ps.how, /@partysafemedics/)
  assert.equal(ps.email, 'partysafemedics@gmail.com')
  assert.equal(ps.link, 'https://www.partysafemedics.nyc/')
  assert.ok(page.indexOf('item.lead') < page.indexOf('<dl>', page.indexOf('function CommunityCard')))
  const ih = byName['Identity House']
  assert.match(ih.when, /Wednesdays 7 to 9pm and Saturdays 6 to 8pm/)
  assert.match(ih.when, /Sunday evenings/)
  assert.equal(ih.cost, 'Free, or a $25 donation per session if you can afford it.')
  assert.equal(ih.email, 'info@identityhouse.org')
  assert.deepEqual(ih.links.map((l) => l.href), ['https://identityhouse.org/walk-in-center/', 'https://identityhouse.org/groups/'])
  const anad = byName['ANAD Communities of Healing']
  assert.equal(anad.scope, 'National, online only.')
  assert.match(anad.offers, /Free weekly virtual support groups for anyone with an eating disorder, led by people who have recovered/)
  assert.equal(anad.email, 'coh@anad.org')
  assert.equal(anad.link, 'https://anad.org/get-help/about-our-support-groups/')
})

test('Older New Yorkers: R.A.I.N. leads with who qualifies, Connect2Affect is national online', () => {
  assert.equal(OLDER_TITLE, 'Older New Yorkers')
  assert.equal(OLDER.length, 2)
  const rain = byName['R.A.I.N. Case Management Program']
  assert.equal(rain.lead, 'For homebound seniors 60+ living in Bronx Community Districts 7, 8, 11 or 12.')
  assert.match(rain.offers, /transportation, housekeeping, home care, home-delivered meals, and help with entitlements and benefits/)
  assert.equal(rain.phone, '718-892-5520')
  assert.equal(rain.email, 'Info@RainInc.org')
  assert.equal(rain.link, 'https://www.raininc.org/case-management/')
  const aarp = byName['AARP Connect2Affect']
  assert.equal(aarp.scope, 'National, online only.')
  assert.match(aarp.offers, /three-minute online check/)
  assert.equal(aarp.who, 'Adults 65+')
  assert.equal(aarp.link, 'https://connect2affect.org/')
})

test('source credit links to Mutual Aid NYC resources', () => {
  assert.equal(SOURCE_CREDIT.before + SOURCE_CREDIT.text + ' (' + SOURCE_CREDIT.href + ')' + SOURCE_CREDIT.after,
    'Listings gathered from Mutual Aid NYC resources (https://resources.mutualaid.nyc), rewritten by LeasePath.')
  assert.match(page, /href=\{SOURCE_CREDIT\.href\}/)
})

test('every outside link opens in a new tab with noopener noreferrer', () => {
  const start = page.indexOf('function CommunityCard')
  const community = page.slice(start, page.indexOf('function CityCard'))
  const blank = community.match(/<a [^>]*target="_blank"[^>]*>/g)
  assert.equal(blank.length, 1)
  for (const tag of blank) assert.match(tag, /rel="noopener noreferrer"/)
  assert.match(page, /SOURCE_CREDIT\.href[^>]*target="_blank"[^>]*rel="noopener noreferrer"|SOURCE_CREDIT\.href[^>]*rel="noopener noreferrer"[^>]*target="_blank"/)
  const city = page.slice(page.indexOf('function CityCard'), page.indexOf('function Collapsible'))
  for (const tag of city.match(/<a [^>]*target="_blank"[^>]*>/g) || []) assert.match(tag, /rel="noopener noreferrer"/)
  for (const item of all) for (const href of [item.link, ...(item.links || []).map((l) => l.href)].filter(Boolean)) assert.match(href, /^https:\/\//)
})

test('Health and support links send no dataLayer events: no tracking code, and Resources is never tracked', () => {
  const card = page.slice(page.indexOf('function CommunityCard'), page.indexOf('function CityCard'))
  assert.doesNotMatch(card, /onClick|onMouseDown|onAuxClick|dataLayer|safePush|trackView|gtag/)
  assert.doesNotMatch(page, /analytics|dataLayer|gtag/)
  const win = { location: { origin: 'https://leasepath.app' } }
  const doc = { createElement: () => ({}), head: { appendChild: () => {} } }
  assert.equal(trackView(win, doc, { hashPath: '/resources', assistantOpen: false, consent: 'granted' }), null)
  assert.equal(win.dataLayer, undefined)
})
