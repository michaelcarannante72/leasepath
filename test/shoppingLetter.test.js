import assert from 'node:assert/strict'
import test from 'node:test'
import { dayNumber, formatDate, fromDayNumber, localToday } from '../src/dates.js'
import { LETTER_DAYS, shoppingLetterDetail, shoppingLetterHeadline, shoppingLetterMessage, shoppingLetterSource, shoppingLetterStatus } from '../src/shoppingLetter.js'

test('the timer length comes from the criteria row: 120 days', () => {
  assert.equal(LETTER_DAYS, 120)
})

test('countdown from the issue date: day 0, mid-way, last day, and expired', () => {
  const issued = '2026-06-20'
  const day0 = shoppingLetterStatus(issued, '2026-06-20')
  assert.equal(day0.state, 'active')
  assert.equal(day0.daysLeft, 120)
  assert.equal(day0.expiresOn, '2026-10-18')
  const mid = shoppingLetterStatus(issued, '2026-08-19')
  assert.equal(mid.daysLeft, 60)
  assert.equal(shoppingLetterStatus(issued, '2026-10-17').daysLeft, 1)
  const last = shoppingLetterStatus(issued, '2026-10-18')
  assert.equal(last.state, 'last-day')
  assert.equal(last.daysLeft, 0)
  const after = shoppingLetterStatus(issued, '2026-10-19')
  assert.equal(after.state, 'expired')
  assert.equal(after.daysAgo, 1)
  assert.equal(shoppingLetterStatus(issued, '2027-02-01').daysAgo, 106)
})

test('a letter issued today has 120 days, and a future date is flagged', () => {
  assert.equal(shoppingLetterStatus('2026-10-18', '2026-10-18').daysLeft, 120)
  const future = shoppingLetterStatus('2026-10-19', '2026-10-18')
  assert.equal(future.state, 'future')
  assert.match(shoppingLetterMessage(future), /in the future/)
})

test('month ends, leap years, and year ends do not shift the count', () => {
  assert.equal(shoppingLetterStatus('2026-12-01', '2026-12-01').expiresOn, '2027-03-31')
  assert.equal(shoppingLetterStatus('2027-11-02', '2027-11-02').expiresOn, '2028-03-01')
  assert.equal(shoppingLetterStatus('2028-01-01', '2028-01-01').expiresOn, '2028-04-30')
  assert.equal(shoppingLetterStatus('2027-12-31', '2028-01-30').daysLeft, 90)
  assert.equal(shoppingLetterStatus('2026-03-08', '2026-03-09').daysLeft, 119, 'a daylight-saving change is not a day')
  assert.equal(shoppingLetterStatus('2026-11-01', '2026-11-02').daysLeft, 119)
})

test('invalid or empty dates give an invalid state and never throw or count', () => {
  for (const value of ['', null, undefined, 'abc', '2026-02-30', '2026-13-01', '2026-6-1', '06/20/2026', 20260620, '2026-00-10', '0000-00-00']) {
    const status = shoppingLetterStatus(value, '2026-10-18')
    assert.equal(status.state, 'invalid', String(value))
    assert.equal(status.daysLeft, undefined)
    assert.match(shoppingLetterMessage(status), /issue date/)
  }
  assert.equal(shoppingLetterStatus('2026-06-20', 'nope').state, 'invalid')
})

test('messages are plural-aware', () => {
  assert.equal(shoppingLetterMessage(shoppingLetterStatus('2026-06-20', '2026-10-17')), '1 day left. The letter runs through October 18, 2026.')
  assert.match(shoppingLetterMessage(shoppingLetterStatus('2026-06-20', '2026-08-19')), /^60 days left/)
  assert.match(shoppingLetterMessage(shoppingLetterStatus('2026-06-20', '2026-10-18')), /last day/)
  assert.match(shoppingLetterMessage(shoppingLetterStatus('2026-06-20', '2026-10-19')), /ended 1 day ago/)
  assert.match(shoppingLetterMessage(shoppingLetterStatus('2026-06-20', '2026-10-25')), /ended 7 days ago/)
})

test('the timer is cited to the CityFHEPS shopping letter row', () => {
  const source = shoppingLetterSource()
  assert.equal(source.program, 'CityFHEPS')
  assert.equal(source.document, 'DSS-7r (E)')
  assert.equal(source.documentDate, '2026-01-23')
  assert.ok(source.url.endsWith('dss-7r-e.pdf'))
})

test('date helpers', () => {
  assert.equal(dayNumber('2026-02-29'), null)
  assert.equal(dayNumber('2028-02-29') - dayNumber('2028-02-28'), 1)
  assert.equal(fromDayNumber(dayNumber('2026-10-18') + 120), '2027-02-15')
  assert.equal(formatDate('2026-10-18'), 'October 18, 2026')
  assert.equal(formatDate('bad'), '')
  assert.equal(localToday(new Date(2026, 9, 18, 23, 59)), '2026-10-18')
  assert.equal(localToday(new Date(2026, 0, 5, 0, 1)), '2026-01-05')
})

test('the timer card heading and detail do not repeat each other', () => {
  const cases = [
    ['2026-06-20', '2026-08-19', '60 days left', 'The letter runs through October 18, 2026.'],
    ['2026-06-20', '2026-10-17', '1 day left', 'The letter runs through October 18, 2026.'],
    ['2026-06-20', '2026-10-18', 'Last day', 'It runs through October 18, 2026. Ask your worker today about a new letter.'],
    ['2026-06-20', '2026-10-19', 'Letter ended', 'It ended on October 18, 2026, 1 day ago. Ask your worker about a new one.'],
    ['2026-10-19', '2026-10-18', 'Date is ahead', 'That date is in the future. Check the issue date on your letter.'],
    ['nope', '2026-10-18', 'Check the date', 'Enter the issue date printed on your letter.'],
  ]
  for (const [issued, today, headline, detail] of cases) {
    const status = shoppingLetterStatus(issued, today)
    assert.equal(shoppingLetterHeadline(status), headline)
    assert.equal(shoppingLetterDetail(status), detail)
  }
})
