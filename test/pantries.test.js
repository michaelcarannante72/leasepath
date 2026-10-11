import assert from 'node:assert/strict'
import test from 'node:test'
import { handleApi } from '../server/api.js'
import { normalizePantry } from '../server/pantries.js'
import {
  choosePantries,
  formatClock,
  hoursFromRecord,
  newYorkDate,
  nextOpening,
  pantryName,
  parseClock,
  whenLabel,
} from '../src/pantrySchedule.js'

const thursdayMorning = new Date('2026-10-08T15:00:00.000Z')

test('clock text becomes minutes, including noon and midnight', () => {
  assert.equal(parseClock('9:00 AM'), 9 * 60)
  assert.equal(parseClock('09:00 AM'), 9 * 60)
  assert.equal(parseClock('12:00 PM'), 12 * 60)
  assert.equal(parseClock('12:00 AM'), 0)
  assert.equal(parseClock('1:30 PM'), 13 * 60 + 30)
  assert.equal(parseClock('closed'), null)
  assert.equal(formatClock(9 * 60), '9:00 AM')
  assert.equal(formatClock(13 * 60 + 30), '1:30 PM')
})

test('a 9:00 AM New York time in October is 13:00 UTC', () => {
  assert.equal(newYorkDate(2026, 10, 8, 9 * 60).toISOString(), '2026-10-08T13:00:00.000Z')
})

test('closed days are ignored and a pantry name is readable', () => {
  const hours = hoursFromRecord({
    fp_mon: 'closed',
    fp_mon_open1: '9:00 AM',
    fp_mon_close1: '11:00 AM',
    fp_fri: 'open',
    fp_fri_open1: '10:00 AM',
    fp_fri_close1: '12:30 PM',
    fp_fri_open2: '',
    fp_fri_close2: '',
  })
  assert.deepEqual(hours, { fri: [[10 * 60, 12 * 60 + 30]] })
  assert.equal(pantryName('CHURCH OF ST. NICHOLAS OF TOLENTINE'), 'Church of St. Nicholas of Tolentine')
  assert.equal(pantryName('AIDS CENTER OF QUEENS COUNTY'), 'AIDS Center of Queens County')
  assert.equal(pantryName('Riverside Church Food Pantry (fp)'), 'Riverside Church Food Pantry')
})

test('the nearest pantry and the next distribution can be different places', () => {
  const origin = { lat: 40.86, lon: -73.9 }
  const nearest = {
    id: 'near',
    name: 'Closest pantry',
    lat: 40.86,
    lon: -73.9,
    hours: { fri: [[10 * 60, 12 * 60]] },
  }
  const sooner = {
    id: 'soon',
    name: 'Sooner pantry',
    lat: 40.862,
    lon: -73.89,
    hours: { thu: [[14 * 60, 16 * 60]] },
  }
  const choice = choosePantries(origin, [nearest, sooner], thursdayMorning)
  assert.equal(choice.nearest.pantry.id, 'near')
  assert.equal(choice.next.pantry.id, 'soon')
  assert.equal(whenLabel(choice.nearest.opening, thursdayMorning), 'Opens tomorrow at 10:00 AM')
  assert.equal(whenLabel(choice.next.opening, thursdayMorning), 'Opens today at 2:00 PM')
  assert.match(choice.nearest.direction, /north|east|south|west/)
})

test('a pantry that is open now is described that way', () => {
  const opening = nextOpening({ thu: [[10 * 60, 12 * 60]] }, thursdayMorning)
  assert.equal(opening.openNow, true)
  assert.equal(whenLabel(opening, thursdayMorning), 'Open now, until 12:00 PM')
})

test('the pantry list does not require a sign-in', async () => {
  const record = normalizePantry({
    FID: 7,
    program: 'BREAD OF LIFE FOOD PANTRY',
    distadd: '1104 Elder Ave, Bronx, New York, 10472',
    org_phone: '(347) 235-3723',
    dist_location_info: '1ST FLOOR (BASEMENT LEVEL)',
    lat: 40.82,
    lon: -73.87,
    fp_tue: 'open',
    fp_tue_open1: '09:00 AM',
    fp_tue_close1: '11:00 AM',
  })
  const result = await handleApi({
    method: 'GET',
    pathname: '/api/pantries',
    loadPantryList: async () => ({
      source: 'Food Help NYC',
      sourceUrl: 'https://foodhelp.nyc.gov/',
      fetchedAt: '2026-10-08T15:00:00.000Z',
      pantries: [record],
    }),
  })
  assert.equal(result.status, 200)
  assert.equal(result.cookies.length, 0)
  assert.equal(result.json.pantries[0].name, 'Bread of Life Food Pantry')
  assert.equal(result.json.pantries[0].placeNote, '1st Floor (Basement Level)')
  assert.deepEqual(result.json.pantries[0].hours.tue, [[9 * 60, 11 * 60]])
  const missing = await handleApi({
    method: 'GET',
    pathname: '/api/pantries',
    loadPantryList: async () => {
      throw new Error('down')
    },
  })
  assert.equal(missing.status, 503)
  assert.equal(missing.json.error, 'pantry_source')
})
