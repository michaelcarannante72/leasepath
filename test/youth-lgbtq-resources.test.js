import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { RESOURCES, SOURCES } from '../src/data/youthLgbtqResources.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

test('every resource cites DYCD or ACS and verified phones where listed', () => {
  assert.ok(RESOURCES.length >= 5)
  for (const item of RESOURCES) {
    assert.ok(SOURCES[item.sourceId])
    assert.match(item.href, /nyc\.gov/)
    assert.match(item.body, /you may qualify|ACS publishes|DYCD/i)
  }
  const phones = RESOURCES.flatMap((r) => (r.phones || []).map((p) => p.number))
  for (const need of ['212-206-0574', '212-613-0300', '917-507-1562', '212-676-2818']) {
    assert.ok(phones.includes(need), need)
  }
})

test('App wires /youth', () => {
  assert.match(read('src/App.jsx'), /YouthLgbtqResourcesPage/)
  assert.match(read('src/components/ResourcesPage.jsx'), /#\/youth/)
  assert.match(read('worker/index.js'), /'youth'/)
})
