import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import {
  clearEntries,
  readEntries,
  toIcs,
  upsertEntry,
  writeEntries,
} from '../src/data/waitlistTracker.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

function mem() {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  }
}

test('entries persist only in provided storage and clear fully', () => {
  const s = mem()
  writeEntries([{ id: '1', title: 'Test lottery', kind: 'lottery', status: 'Applied', remindOn: '2026-11-01', notes: '' }], s)
  assert.equal(readEntries(s).length, 1)
  clearEntries(s)
  assert.equal(readEntries(s).length, 0)
})

test('ics export is a valid all-day VEVENT', () => {
  const ics = toIcs({ id: 'abc', title: 'HC lottery', kind: 'lottery', status: 'waiting', remindOn: '2026-12-15', notes: 'log 99' })
  assert.match(ics, /BEGIN:VCALENDAR/)
  assert.match(ics, /DTSTART;VALUE=DATE:20261215/)
  assert.match(ics, /SUMMARY:HC lottery/)
})

test('upsert replaces by id', () => {
  let list = []
  list = upsertEntry(list, { id: 'a', title: 'One' })
  list = upsertEntry(list, { id: 'a', title: 'Two' })
  assert.equal(list.length, 1)
  assert.equal(list[0].title, 'Two')
})

test('App wires /waitlist with delete-all UI', () => {
  assert.match(read('src/App.jsx'), /WaitlistTrackerPage/)
  assert.match(read('src/components/WaitlistTrackerPage.jsx'), /Delete all/)
  assert.match(read('src/components/WaitlistTrackerPage.jsx'), /you may qualify/i)
  assert.match(read('worker/index.js'), /'waitlist'/)
})
