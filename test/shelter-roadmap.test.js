import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { ROADMAP_STEPS } from '../src/data/shelterRoadmap.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

test('roadmap covers shelter through move-in with in-app links', () => {
  assert.equal(ROADMAP_STEPS.length, 6)
  assert.equal(ROADMAP_STEPS[0].id, 'shelter')
  assert.equal(ROADMAP_STEPS.at(-1).id, 'lease')
  const hrefs = ROADMAP_STEPS.flatMap((s) => s.links.map((l) => l.href))
  for (const need of ['#/steps', '#/plan', '#/', '#/after-you-find', '#/inspection-prep', '#/scam-alerts', '#/moving-help']) {
    assert.ok(hrefs.includes(need), need)
  }
  assert.match(ROADMAP_STEPS.map((s) => s.body).join(' '), /you may qualify/i)
})

test('App and Resources wire /roadmap', () => {
  assert.match(read('src/App.jsx'), /ShelterRoadmapPage/)
  assert.match(read('src/components/ResourcesPage.jsx'), /#\/roadmap/)
  assert.match(read('worker/index.js'), /'roadmap'/)
})
