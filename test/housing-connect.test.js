import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  AMI_TIERS,
  BOROUGH_CODES,
  applyUrl,
  amiTiersFromRow,
  addressesQueryUrl,
  filterActiveRentals,
  filterByBorough,
  formatDeadline,
  isFutureEnd,
  loadActiveLotteries,
  lotteriesQueryUrl,
  normalizeLottery,
  unitSizesFromRow,
} from '../src/data/housingConnect.js'

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')

const sample = {
  lottery_id: '7607',
  lottery_name: 'One River Park 355 Exterior Street',
  lottery_status: 'Active',
  development_type: 'Rental',
  lottery_end_date: '2026-11-06T00:00:00.000',
  unit_count: '227',
  unit_distribution_studio: '29',
  unit_distribution_1bed: '154',
  unit_distribution_2bed: '44',
  applied_income_ami_low: '76',
  applied_income_ami_middle: '151',
  borough: 'BX',
}

test('AMI tiers use official names and unit counts, never dollar figures', () => {
  const tiers = amiTiersFromRow(sample)
  assert.deepEqual(tiers, [
    { label: 'Low Income', units: 76 },
    { label: 'Middle Income', units: 151 },
  ])
  for (const tier of AMI_TIERS) {
    assert.doesNotMatch(tier.label, /\$|dollar|AMI %|percent/i)
  }
  const page = read('src/components/HousingConnectPage.jsx')
  assert.doesNotMatch(page, /\$\d|max rent|income limit \$/i)
  assert.match(page, /AMI tier/)
})

test('filter keeps rental lotteries with a future end date only', () => {
  const now = new Date('2026-10-27T12:00:00.000Z')
  const rows = [
    sample,
    { ...sample, lottery_id: '1', development_type: 'Owner', lottery_end_date: '2027-01-01T00:00:00.000' },
    { ...sample, lottery_id: '2', lottery_end_date: '2026-10-01T00:00:00.000' },
    { ...sample, lottery_id: '3', lottery_end_date: '2026-12-01T00:00:00.000' },
  ]
  const active = filterActiveRentals(rows, now)
  assert.deepEqual(active.map((r) => r.lottery_id).sort(), ['3', '7607'])
  assert.equal(isFutureEnd('2026-10-26T00:00:00.000', now), false)
  assert.equal(isFutureEnd('2026-11-06T00:00:00.000', now), true)
})

test('normalizeLottery maps borough, AMI, sizes, apply URL, and addresses', () => {
  const lottery = normalizeLottery(sample, [
    {
      lottery_id: '7607',
      house_number: '355',
      street_name: 'Exterior St',
      address_zipcode: '10451',
    },
  ])
  assert.equal(lottery.borough, 'Bronx')
  assert.equal(lottery.applyUrl, 'https://housingconnect.nyc.gov/PublicWeb/details/7607')
  assert.equal(applyUrl('7607'), lottery.applyUrl)
  assert.deepEqual(lottery.addresses, ['355 Exterior St, 10451'])
  assert.ok(lottery.unitSizes.some((s) => s.label === 'Studio' && s.units === 29))
  assert.match(formatDeadline(sample.lottery_end_date), /November/)
})

test('borough filter and query builders', () => {
  const list = [
    normalizeLottery(sample),
    normalizeLottery({ ...sample, lottery_id: '9', borough: 'BK' }),
  ]
  assert.equal(filterByBorough(list, 'All').length, 2)
  assert.equal(filterByBorough(list, 'BX').length, 1)
  assert.equal(filterByBorough(list, 'BX')[0].id, '7607')
  assert.deepEqual(BOROUGH_CODES.map((b) => b.code), ['BX', 'BK', 'MN', 'QN', 'SI'])
  const url = lotteriesQueryUrl(new Date('2026-10-27T00:00:00.000Z'))
  assert.match(url, /vy5i-a666\.json/)
  assert.match(url, /development_type/)
  assert.match(url, /lottery_end_date/)
  const addr = addressesQueryUrl(['7607', "7'07"])
  assert.match(addr, /nibs-na6y\.json/)
  assert.match(addr, /7607/)
  assert.equal(addressesQueryUrl([]), null)
})

test('loadActiveLotteries joins addresses through the injected fetcher', async () => {
  const calls = []
  const fetcher = async (url) => {
    calls.push(String(url))
    if (String(url).includes('vy5i-a666')) {
      return {
        ok: true,
        json: async () => [sample, { ...sample, lottery_id: 'old', lottery_end_date: '2020-01-01T00:00:00.000' }],
      }
    }
    return {
      ok: true,
      json: async () => [
        { lottery_id: '7607', house_number: '355', street_name: 'Exterior St', address_zipcode: '10451' },
      ],
    }
  }
  const list = await loadActiveLotteries({ fetcher, now: new Date('2026-10-27T12:00:00.000Z') })
  assert.equal(list.length, 1)
  assert.equal(list[0].id, '7607')
  assert.deepEqual(list[0].addresses, ['355 Exterior St, 10451'])
  assert.equal(calls.length, 2)
})

test('page voice: free apply scam line, you may qualify, Resources link, no medical/HIV', () => {
  const page = read('src/components/HousingConnectPage.jsx')
  assert.match(page, /Applying is always free\. Anyone who asks for a fee is a scam\./)
  assert.match(page, /You may qualify/)
  assert.match(page, /#\/resources/)
  assert.doesNotMatch(page, /\bHIV\b|diagnosis|medical history/i)
  const resources = read('src/components/ResourcesPage.jsx')
  assert.match(resources, /href="#\/housing-connect"/)
  const app = read('src/App.jsx')
  assert.match(app, /housing-connect/)
  assert.match(app, /HousingConnectPage/)
})

test('unitSizesFromRow skips empty sizes', () => {
  assert.deepEqual(unitSizesFromRow({ unit_distribution_1bed: '2' }), [{ label: '1-bedroom', units: 2 }])
})
