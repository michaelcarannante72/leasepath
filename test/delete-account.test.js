import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createMemoryAccounts } from '../server/accounts.js'
import { USAGE_FORGET_DAYS, accountUsageKeys, handleApi } from '../server/api.js'
import { createMemoryUsage } from '../server/usage.js'
import { CONFIRM_WORD, clearDeviceData, confirmMatches } from '../src/deviceData.js'

const now = new Date('2026-10-19T15:00:00.000Z')
const origin = 'http://localhost:5183'
const NONCE = 'test-nonce-value-0123456789abcdef0123456789'
const jar = (result) => (result.cookies || []).map((c) => c.split(';')[0]).join('; ')

function call(accounts, usage, extra) {
  return handleApi({ origin, requestOrigin: origin, secret: 'test-secret', googleClientId: 'client-id', usage, accounts, now, body: {}, ...extra })
}

test('DELETE /api/account erases voucher type, housing situation, amount, household and the account counters', async () => {
  const accounts = createMemoryAccounts()
  const usage = createMemoryUsage()
  const signed = await call(accounts, usage, {
    method: 'POST', pathname: '/api/auth/google', body: { credential: 'x' }, cookieHeader: `lp_nonce=${NONCE}`,
    verifyToken: async () => ({ sub: 'sub123', email: 'ada@example.com', name: 'Ada' }), loadCerts: async () => [],
  })
  const cookieHeader = jar(signed)
  const place = { program: 'HASA', situation: 'HASA SRO or supportive housing', letterRent: '$2,100', household: '2', utilities: 'All included', neighborhood: 'Harlem', savedIds: [], steps: [1] }
  const saved = await call(accounts, usage, { method: 'POST', pathname: '/api/account', body: { place }, cookieHeader })
  assert.equal(saved.json.place.program, 'HASA')
  assert.equal(saved.json.place.situation, 'HASA SRO or supportive housing')
  for (const key of accountUsageKeys('sub123', now).slice(0, 3)) usage.seed(key, 5)

  const deleted = await call(accounts, usage, { method: 'DELETE', pathname: '/api/account', cookieHeader })
  assert.equal(deleted.status, 200)
  assert.equal(deleted.json.signedIn, false)
  assert.ok(deleted.cookies.some((c) => /^lp_session=;.*Max-Age=0/.test(c)), 'session cookie cleared')

  // Nothing of the record is left: not the email, program, situation, amount, or household.
  assert.equal(await accounts.read('sub123'), null)
  const snapshot = usage.snapshot()
  assert.equal(Object.keys(snapshot).filter((k) => k.includes('sub123')).length, 0, 'no counters named after the account')
  assert.equal(accountUsageKeys('sub123', now).length, USAGE_FORGET_DAYS)

  // A signed-out request after deletion gets nothing back.
  const after = await call(accounts, usage, { method: 'GET', pathname: '/api/account', cookieHeader: '' })
  assert.equal(after.status, 401)
})

test('device clear removes every leasepath key, including voucher amount, household, income and voucher type', async () => {
  const fake = () => {
    const map = new Map()
    return { map, get length() { return map.size }, key: (i) => [...map.keys()][i] ?? null, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) }
  }
  const local = fake()
  local.setItem('leasepath.plan', JSON.stringify({ program: 'HASA', household: '2', letterRent: '$2,100', utilities: 'All' }))
  local.setItem('leasepath.checks', JSON.stringify({ incomeAmount: '1800', incomePeriod: 'month' }))
  for (const k of ['leasepath.saved', 'leasepath.steps', 'leasepath.onboarded', 'leasepath.intent', 'leasepath.neighborhood', 'leasepath.cookies']) local.setItem(k, '1')
  local.setItem('other-site', 'keep')
  const session = fake()
  session.setItem('leasepath.flag', '1')
  const deletedDbs = []
  const idb = { databases: async () => [{ name: 'leasepath-cache' }, { name: 'other' }], deleteDatabase: (n) => deletedDbs.push(n) }

  const removed = await clearDeviceData({ storages: [local, session], idb })
  assert.equal([...local.map.keys()].join(), 'other-site')
  assert.equal(session.map.size, 0)
  assert.ok(removed.includes('leasepath.plan') && removed.includes('leasepath.checks'))
  assert.deepEqual(deletedDbs, ['leasepath-cache'])
})

test('the dialog needs DELETE typed, and the flow is wired from My voucher and the header', () => {
  assert.equal(CONFIRM_WORD, 'DELETE')
  assert.equal(confirmMatches('DELETE'), true)
  assert.equal(confirmMatches(' DELETE '), true)
  for (const bad of ['', 'delete', 'DELET', 'yes']) assert.equal(confirmMatches(bad), false)
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const plan = readFileSync(new URL('../src/components/PlanPage.jsx', import.meta.url), 'utf8')
  const dialog = readFileSync(new URL('../src/components/DeleteAccountDialog.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(app, /window\.confirm\('Delete the LeasePath account/)
  assert.match(app, /onDeleteAccount=\{openDelete\}/)
  assert.match(plan, /className="button delete-open" onClick=\{onDeleteAccount\}/)
  assert.match(dialog, /role="alertdialog"/)
  assert.match(dialog, /disabled=\{!ready\}/)
  // Server first; the device is cleared only after the server succeeds, then state resets to signed out.
  const flow = app.slice(app.indexOf('const deleteAccount = useCallback'), app.indexOf('const finishDelete'))
  assert.ok(flow.indexOf("method: 'DELETE'") < flow.indexOf('clearDeviceData()'))
  assert.match(flow, /if \(!response\.ok\) return \{ ok: false/)
  assert.match(flow, /setPlan\(emptyPlan\(\)\)[^]*setChecks\(emptyChecks\(\)\)/)
})

test('voucher sharing with Ruby is off by default, one tap to turn on, saved per device, and sends no plan when off', () => {
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const sheet = readFileSync(new URL('../src/components/AssistantSheet.jsx', import.meta.url), 'utf8')
  assert.match(app, /const SHARE_KEY = 'leasepath\.shareWithRuby'/)
  assert.match(app, /useState\(\(\) => readItem\(SHARE_KEY\) === 'on'\)/)
  assert.doesNotMatch(app, /useState\(true\)\n?.*includePlan|\[includePlan, setIncludePlan\] = useState\(true\)/)
  assert.match(app, /plan: includePlan\s*\?\s*\{[^]*?\}\s*: undefined,/)
  assert.match(sheet, /Share my voucher details with Ruby/)
  assert.match(sheet, /role="switch"/)
  assert.match(sheet, /Off: nothing about your voucher leaves this phone\./)
})

test('Inter is self-hosted, so no page load contacts Google Fonts', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
  assert.doesNotMatch(html + css, /fonts\.(googleapis|gstatic)\.com/)
  assert.match(css, /src: url\('\/fonts\/inter-latin\.woff2'\) format\('woff2'\)/)
  assert.match(html, /<link rel="preload" href="\/fonts\/inter-latin\.woff2" as="font" type="font\/woff2" crossorigin \/>/)
  for (const f of ['inter-latin.woff2', 'inter-latin-ext.woff2']) {
    assert.equal(readFileSync(new URL(`../public/fonts/${f}`, import.meta.url)).subarray(0, 4).toString(), 'wOF2')
  }
})

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

test('after deletion, every existing session on every device is refused and cannot recreate the account', async () => {
  const accounts = createMemoryAccounts()
  const usage = createMemoryUsage()
  const google = (sub) => call(accounts, usage, {
    method: 'POST', pathname: '/api/auth/google', body: { credential: 'x' }, cookieHeader: `lp_nonce=${NONCE}`,
    verifyToken: async () => ({ sub, email: 'ada@example.com', name: 'Ada' }), loadCerts: async () => [],
  })
  const phone = jar(await google('sub9'))
  await pause(2)
  const laptop = jar(await google('sub9'))
  const place = { program: 'HASA', situation: 'HASA SRO or supportive housing', letterRent: '$2,100', household: '2' }
  assert.equal((await call(accounts, usage, { method: 'POST', pathname: '/api/account', body: { place }, cookieHeader: laptop })).status, 200)

  await pause(2)
  const gone = await call(accounts, usage, { method: 'DELETE', pathname: '/api/account', cookieHeader: phone })
  assert.equal(gone.status, 200)
  assert.equal(accounts.read('sub9'), null)
  assert.ok(accounts.status('sub9').deletedAt > 0, 'tombstone left, with a time only')

  // The laptop's older session: refused on read, on save, and on claim. Its cookie is cleared. Nothing is recreated.
  for (const [method, body] of [['GET', {}], ['PUT', { place }], ['POST', { place }]]) {
    const result = await call(accounts, usage, { method, pathname: '/api/account', body, cookieHeader: laptop })
    assert.equal(result.status, 401, `${method} with a pre-deletion session`)
    assert.ok(result.cookies.some((c) => /^lp_session=;.*Max-Age=0/.test(c)), 'revoked session cookie cleared')
  }
  assert.equal(accounts.read('sub9'), null, 'old sessions cannot write the account back')
  const view = await call(accounts, usage, { method: 'GET', pathname: '/api/guide', cookieHeader: laptop })
  assert.equal(view.json.signedIn, false)

  // Only an explicit new sign-in creates a new, empty account.
  await pause(2)
  const fresh = jar(await google('sub9'))
  const created = await call(accounts, usage, { method: 'POST', pathname: '/api/account', body: { place: { program: 'CityFHEPS' } }, cookieHeader: fresh })
  assert.equal(created.status, 200)
  assert.equal(created.json.place.program, 'CityFHEPS')
  assert.notEqual(created.json.place.situation, 'HASA SRO or supportive housing')
})

test('legacy sessions without iat are judged by their expiry, and the Durable Object keeps a tombstone', async () => {
  const { sessionRevoked } = await import('../server/accounts.js')
  assert.equal(sessionRevoked({ deletedAt: 0 }, 5), false)
  assert.equal(sessionRevoked({ deletedAt: 10 }, 10), true)
  assert.equal(sessionRevoked({ deletedAt: 10 }, 11), false)
  assert.equal(sessionRevoked(null, 1), false)
  const book = readFileSync(new URL('../worker/accountBook.js', import.meta.url), 'utf8')
  assert.match(book, /CREATE TABLE IF NOT EXISTS tombstone/)
  assert.match(book, /DELETE FROM account WHERE id = 1[^]*INSERT INTO tombstone/)
  const auth = readFileSync(new URL('../server/auth.js', import.meta.url), 'utf8')
  assert.match(auth, /Number\(session\.iat\) \|\| \(Number\(session\.exp\) \|\| 0\) - SESSION_SECONDS \* 1000/)
})

test('Google sign-in keeps only the account id and email, never the name', () => {
  const auth = readFileSync(new URL('../server/auth.js', import.meta.url), 'utf8')
  const api = readFileSync(new URL('../server/api.js', import.meta.url), 'utf8')
  assert.match(auth, /return \{ sub: String\(payload\.sub\), email: String\(payload\.email\) \}/)
  assert.doesNotMatch(auth, /payload\.name|session\.name|profile\.name/)
  assert.doesNotMatch(api, /name: ''/)
})

test('signing in again restores the account details onto an empty phone (claim does not overwrite with blanks)', async () => {
  const accounts = createMemoryAccounts()
  const usage = createMemoryUsage()
  const google = () => call(accounts, usage, {
    method: 'POST', pathname: '/api/auth/google', body: { credential: 'x' }, cookieHeader: `lp_nonce=${NONCE}`,
    verifyToken: async () => ({ sub: 'sub7', email: 'ada@example.com' }), loadCerts: async () => [],
  })
  const first = jar(await google())
  const place = { program: 'HASA', letterRent: '$2,100', household: '2', utilities: 'All included', neighborhood: 'Harlem', situation: 'HASA SRO or supportive housing', savedIds: ['crown-heights-1br'], steps: [0, 2] }
  await call(accounts, usage, { method: 'POST', pathname: '/api/account', body: { place }, cookieHeader: first })
  await call(accounts, usage, { method: 'PUT', pathname: '/api/account', body: { place: { ...place, letterRent: '$2,200' } }, cookieHeader: first })
  const out = await call(accounts, usage, { method: 'POST', pathname: '/api/auth/logout', cookieHeader: first })
  assert.equal(out.json.signedIn, false)

  // The phone is now empty. The next sign-in claims with blanks and gets the saved account back instead.
  const again = jar(await google())
  const empty = { program: '', letterRent: '', household: '', utilities: '', neighborhood: '', situation: '', savedIds: [], steps: [] }
  const restored = await call(accounts, usage, { method: 'POST', pathname: '/api/account', body: { place: empty }, cookieHeader: again })
  assert.equal(restored.status, 200)
  assert.equal(restored.json.adopted, false)
  assert.equal(restored.json.place.program, 'HASA')
  assert.equal(restored.json.place.letterRent, '2200')
  assert.equal(restored.json.place.household, '2')
  assert.deepEqual(restored.json.place.savedIds, ['crown-heights-1br'])
  // And the app writes it back onto the phone when the account was not adopted.
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  assert.match(app, /if \(data\.adopted === false\) writeAccountPlace\(data\.place\)/)
})

test('signed-in sign-out saves first, then clears every leasepath key on the phone, and warns if the save failed', () => {
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const flow = app.slice(app.indexOf('const signOut = useCallback'), app.indexOf('const openResources'))
  assert.match(flow, /Signing out clears your voucher details from this phone\. Income you typed won't be saved\./)
  const put = flow.indexOf("method: 'PUT'")
  const logout = flow.indexOf("'/api/auth/logout'")
  const clear = flow.indexOf('await clearDeviceData()')
  assert.ok(put > 0 && put < logout && logout < clear, 'save, then sign out, then clear')
  assert.match(flow, /savedToAccount = response\.ok/)
  assert.match(flow, /if \(!savedToAccount\) \{\s*window\.alert\(/)
  // If the sign-out call itself fails, nothing is cleared.
  assert.match(flow, /could not sign you out\. Try again\.'\)\s*return/)
  // Guests have no sign-out, so their phone data is never cleared by it.
  const header = readFileSync(new URL('../src/components/Header.jsx', import.meta.url), 'utf8')
  assert.match(header, /session\?\.signedIn \? \([^]*onClick=\{onSignOut\}/)
})
