import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { HEAT_RULES, SECTIONS } from '../src/data/tenantRightsAfterMovein.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

test('heat season matches HPD published rules', () => {
  assert.match(HEAT_RULES.season, /October 1.*May 31/)
  assert.equal(HEAT_RULES.day.outsideBelow, 55)
  assert.equal(HEAT_RULES.day.insideAtLeast, 68)
  assert.equal(HEAT_RULES.night.insideAtLeast, 62)
  assert.equal(HEAT_RULES.hotWater.minF, 120)
  assert.match(HEAT_RULES.complaint.then, /311/)
})

test('sections cover repairs, heat, 311, housing court', () => {
  assert.deepEqual(SECTIONS.map((s) => s.id), ['repairs', 'heat', '311', 'court'])
  assert.match(SECTIONS.map((s) => s.body).join(' '), /you may qualify/i)
})

test('App wires /after-movein', () => {
  assert.match(read('src/App.jsx'), /TenantRightsAfterMoveinPage/)
  assert.match(read('src/components/ResourcesPage.jsx'), /#\/after-movein/)
  assert.match(read('worker/index.js'), /'after-movein'/)
})
