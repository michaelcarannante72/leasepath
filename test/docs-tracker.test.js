import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  PRIVACY_NOTE,
  SHOPPING_LETTER_DAYS_BY_PROGRAM,
  buildDeadlineIcs,
  checklistProgress,
  clearDocs,
  docsForProgram,
  emptyState,
  loadDocs,
  parseDateInput,
  saveDocs,
  suggestLetterExpiry,
} from '../src/docsTracker.js'

function memoryStorage(seed = {}) {
  const map = new Map(Object.entries(seed))
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)) },
    removeItem: (k) => { map.delete(k) },
  }
}

describe('docs deadline tracker', () => {
  it('tailors the checklist by voucher program and keeps a generic fallback', () => {
    const city = docsForProgram('CityFHEPS')
    assert.ok(city.some((d) => /shopping letter/i.test(d.label)))
    assert.ok(city.some((d) => /Social Security/i.test(d.label)))
    assert.ok(city.some((d) => /Photo ID/i.test(d.label)))
    const section = docsForProgram('Section 8')
    assert.ok(section.some((d) => /RFTA|Request for Tenancy/i.test(d.label)))
    const generic = docsForProgram('')
    assert.ok(generic.length >= 5)
    assert.equal(SHOPPING_LETTER_DAYS_BY_PROGRAM.CityFHEPS, 120)
  })

  it('persists checklist and deadlines only through the provided storage', () => {
    const store = memoryStorage()
    const base = emptyState('CityFHEPS')
    base.checked = { 'photo-id': true }
    base.deadlines.letterIssued = '2026-10-01'
    base.deadlines.letterExpires = suggestLetterExpiry('CityFHEPS', '2026-10-01')
    const { ok, state } = saveDocs(base, store)
    assert.equal(ok, true)
    assert.equal(state.deadlines.letterExpires, '2027-01-29')
    const loaded = loadDocs(store)
    assert.equal(loaded.program, 'CityFHEPS')
    assert.equal(loaded.checked['photo-id'], true)
    const { done, total } = checklistProgress(loaded)
    assert.equal(done, 1)
    assert.ok(total > 1)
    assert.equal(clearDocs(store), true)
    assert.equal(loadDocs(store).program, '')
  })

  it('builds an .ics calendar for filled deadlines and skips empty ones', () => {
    const state = emptyState('FHEPS')
    state.deadlines.inspection = '2026-11-15'
    state.deadlines.leaseSigning = '2026-11-20'
    const ics = buildDeadlineIcs(state, new Date('2026-10-27T15:00:00Z'))
    assert.match(ics, /BEGIN:VCALENDAR/)
    assert.match(ics, /SUMMARY:LeasePath: apartment inspection/)
    assert.match(ics, /SUMMARY:LeasePath: lease signing/)
    assert.doesNotMatch(ics, /shopping letter expires/)
    assert.match(ics, /DTSTART;VALUE=DATE:20261115/)
    assert.equal(buildDeadlineIcs(emptyState()), null)
    assert.equal(parseDateInput('nope'), null)
    assert.ok(parseDateInput('2026-10-27'))
  })

  it('keeps a clear on-device privacy note and never ships medical or HIV fields', () => {
    assert.match(PRIVACY_NOTE, /Stays on your phone/i)
    const page = readFileSync(new URL('../src/components/DocsDeadlinePage.jsx', import.meta.url), 'utf8')
    const mod = readFileSync(new URL('../src/docsTracker.js', import.meta.url), 'utf8')
    for (const src of [page, mod]) {
      assert.doesNotMatch(src, /\bHIV\b|\bAIDS\b|diagnosis|medical history|viral/i)
      assert.doesNotMatch(src, /fetch\(|XMLHttpRequest|sendBeacon|gtag|analytics/i)
    }
    assert.match(page, /Delete all on this phone/)
    assert.match(page, /Export calendar \(\.ics\)/)
    assert.match(page, /Stays on your phone|PRIVACY_NOTE/)
    assert.match(page, /you may qualify/i)
  })

  it('is routed from the app, Steps, Resources, and the Worker share list', () => {
    const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
    const steps = readFileSync(new URL('../src/components/StepsPage.jsx', import.meta.url), 'utf8')
    const resources = readFileSync(new URL('../src/components/ResourcesPage.jsx', import.meta.url), 'utf8')
    const worker = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8')
    const wrangler = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')
    assert.match(app, /docs-tracker/)
    assert.match(app, /DocsDeadlinePage/)
    assert.match(steps, /#\/docs-tracker/)
    assert.match(resources, /#\/docs-tracker/)
    assert.match(worker, /docs-tracker/)
    assert.match(wrangler, /\/docs-tracker/)
  })
})
