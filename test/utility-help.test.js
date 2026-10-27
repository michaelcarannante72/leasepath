import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { HEAP, SECTIONS, SOURCES } from '../src/data/utilityHelp.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

test('HEAP cites official NY State and OTDA pages with verified NYC phones', () => {
  assert.match(SOURCES.nyHeapApply.href, /ny\.gov/)
  assert.match(SOURCES.otdaHeap.href, /otda\.ny\.gov/)
  assert.equal(HEAP.nycEmergencyPhone, '718-557-1399')
  assert.equal(HEAP.otdaHotline, '1-800-342-3009')
  assert.match(HEAP.blurb, /you may qualify/i)
})

test('sections cover HEAP, amounts note, HRA, HPD', () => {
  assert.deepEqual(SECTIONS.map((s) => s.id), ['heap', 'amounts', 'hra', 'hpd'])
})

test('App wires /utility-help', () => {
  assert.match(read('src/App.jsx'), /UtilityHelpPage/)
  assert.match(read('src/components/ResourcesPage.jsx'), /#\/utility-help/)
  assert.match(read('worker/index.js'), /'utility-help'/)
})
