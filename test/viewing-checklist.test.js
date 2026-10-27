import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { CHECKLIST } from '../src/data/viewingChecklist.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

test('checklist has ask, inspect, and red-flag items', () => {
  assert.ok(CHECKLIST.ask.length >= 5)
  assert.ok(CHECKLIST.inspect.length >= 6)
  assert.ok(CHECKLIST.redFlags.length >= 4)
  assert.match(CHECKLIST.ask.join(' '), /voucher|shopping letter/i)
})

test('page wires print and related tools', () => {
  const page = read('src/components/ViewingChecklistPage.jsx')
  assert.match(page, /window\.print/)
  assert.match(page, /you may qualify/i)
  assert.match(read('src/App.jsx'), /ViewingChecklistPage/)
  assert.match(read('worker/index.js'), /'viewing-checklist'/)
})
