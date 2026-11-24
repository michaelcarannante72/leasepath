// The voucher program and housing situation (HASA implies HIV status) stay in the browser. Never on a server.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { decideAccount, placeHasContent, sanitizePlace } from '../server/accounts.js'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('the client never puts program or situation in an /api/account body (claim, save, or sign-out save)', () => {
  const app = read('src/App.jsx')
  const bodies = [...app.matchAll(/fetch\('\/api\/account', \{[\s\S]*?\n\s*\}\)/g)].map((m) => m[0])
  assert.ok(bodies.length >= 3)
  for (const body of bodies) assert.doesNotMatch(body, /program|situation/, body.slice(0, 80))
  const place = app.slice(app.indexOf('const place = {'), app.indexOf("fetch('/api/account'", app.indexOf('const place = {')))
  assert.doesNotMatch(place, /program|situation/)
  // Loading an account never overwrites the phone's own program or situation.
  const write = app.slice(app.indexOf('const writeAccountPlace'), app.indexOf('const stageRef'))
  assert.doesNotMatch(write, /place\.program|place\.situation/)
  assert.match(write, /\.\.\.current,/)
})

test('server sanitizePlace drops program and situation, and keeps the rest', () => {
  const clean = sanitizePlace({ program: 'HASA', situation: 'HASA SRO or supportive housing', neighborhood: 'Harlem', letterRent: '$2,100', household: '2', utilities: 'All utilities are included', receiving: 'has', savedIds: ['a-1'], steps: [1] })
  assert.equal('program' in clean, false)
  assert.equal('situation' in clean, false)
  assert.deepEqual(clean, { neighborhood: 'Harlem', letterRent: '2100', utilities: 'All utilities are included', household: '2', receiving: 'has', savedIds: ['a-1'], steps: [1] })
  assert.equal(placeHasContent({ program: 'HASA', situation: 'Renting now' }), false)
})

test('an old record that has a program is stripped on the next claim and overwritten without it on the next save', () => {
  const old = { email: 'a@b.co', place: { program: 'HASA', situation: 'Renting now', neighborhood: 'Harlem', letterRent: '2100', savedIds: [], steps: [] }, secret: '', updatedAt: 'x' }
  const claim = decideAccount(old, { place: {}, now: 'y' }, 'claim')
  assert.equal(claim.record.place.program, undefined)
  assert.equal(claim.record.place.situation, undefined)
  assert.equal(claim.record.place.neighborhood, 'Harlem')
  const save = decideAccount(old, { place: { ...old.place, letterRent: '2200' }, now: 'y' }, 'save')
  assert.equal(JSON.stringify(save.record).includes('HASA'), false)
  assert.equal(save.record.place.letterRent, '2200')
})

test('every server read of an account place goes through sanitizePlace', () => {
  assert.match(read('server/api.js'), /place: sanitizePlace\(current\?\.place\)/)
  assert.match(read('server/api.js'), /place: sanitizePlace\(decision\.record\.place\)/)
  assert.match(read('worker/accountBook.js'), /sanitizePlace\(JSON\.parse\(rows\[0\]\.place\)\)/)
})

test('sign-out and Delete clear the phone copies; the privacy notice says program and situation stay on the phone', () => {
  const app = read('src/App.jsx')
  assert.match(app, /await clearDeviceData\(\)\n\s+setPlan\(emptyPlan\(\)\)/)
  assert.match(read('src/sitePages.js'), /Your voucher program and where you are staying stay on your phone only and are never saved on LeasePath’s servers\./)
  assert.doesNotMatch(read('src/sitePages.js'), /account can (also )?hold the program/)
})

test('the one-time scrub script exists, defaults to dry run, needs --remote, and prints counts only', () => {
  const script = read('scripts/scrub-account-programs.mjs')
  assert.match(script, /--remote/)
  assert.match(script, /dry.?run/i)
  assert.doesNotMatch(script, /console\.log\([^)]*\b(key|email)\b/)
})
