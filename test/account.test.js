import assert from 'node:assert/strict'
import test from 'node:test'
import { createMemoryAccounts } from '../server/accounts.js'
import { handleApi } from '../server/api.js'
import { createMemoryUsage } from '../server/usage.js'

const now = new Date('2026-10-15T15:00:00.000Z')
const origin = 'http://localhost:5183'
const NONCE = 'test-nonce-value-0123456789abcdef0123456789'

function cookieJar(result) {
  return (result.cookies || []).map((cookie) => cookie.split(';')[0]).join('; ')
}

function signIn(accounts, profile = { sub: 'abc', email: 'ada@example.com', name: 'Ada' }) {
  return handleApi({
    method: 'POST',
    pathname: '/api/auth/google',
    body: { credential: 'stub-token' },
    cookieHeader: `lp_nonce=${NONCE}`,
    origin,
    requestOrigin: origin,
    secret: 'test-secret',
    googleClientId: 'client-id',
    usage: createMemoryUsage(),
    accounts,
    now,
    verifyToken: async () => profile,
    loadCerts: async () => [],
  })
}

function accountCall(accounts, { method, cookieHeader, place }) {
  return handleApi({
    method,
    pathname: '/api/account',
    body: place ? { place } : {},
    cookieHeader,
    origin,
    requestOrigin: origin,
    secret: 'test-secret',
    googleClientId: 'client-id',
    usage: createMemoryUsage(),
    accounts,
    now,
  })
}

const localPlace = {
  program: 'HASA',
  neighborhood: 'Crown Heights',
  letterRent: '$2,100',
  utilities: 'All utilities are included',
  household: '2',
  receiving: 'has',
  situation: 'Renting now',
  savedIds: ['crown-heights-1br', '../etc/passwd'],
  steps: [0, 1, 99],
  ssn: '123-45-6789',
  caseNumber: 'HRA-1',
  diagnosis: 'hiv',
}

test('the first sign-up moves this phone onto the account and drops case details', async () => {
  const accounts = createMemoryAccounts()
  const signed = await signIn(accounts)
  const claimed = await accountCall(accounts, { method: 'POST', cookieHeader: cookieJar(signed), place: localPlace })
  assert.equal(claimed.status, 200)
  assert.equal(claimed.json.adopted, true)
  assert.equal(claimed.json.place.program, 'HASA')
  assert.equal(claimed.json.place.neighborhood, 'Crown Heights')
  assert.equal(claimed.json.place.letterRent, '2100')
  assert.deepEqual(claimed.json.place.savedIds, ['crown-heights-1br'])
  assert.deepEqual(claimed.json.place.steps, [0, 1])
  assert.equal(claimed.json.place.ssn, undefined)
  assert.equal(claimed.json.place.caseNumber, undefined)
  assert.equal(claimed.json.place.diagnosis, undefined)
  assert.equal(JSON.stringify(claimed.json).includes('123-45-6789'), false)
})

test('a second phone loads the account instead of replacing it', async () => {
  const accounts = createMemoryAccounts()
  const first = await signIn(accounts)
  await accountCall(accounts, { method: 'POST', cookieHeader: cookieJar(first), place: localPlace })
  const second = await signIn(accounts, { sub: 'abc', email: 'ada@example.com', name: 'Ada' })
  const claimed = await accountCall(accounts, {
    method: 'POST',
    cookieHeader: cookieJar(second),
    place: { program: 'Section 8', neighborhood: 'Harlem', letterRent: '900', savedIds: [], steps: [] },
  })
  assert.equal(claimed.json.adopted, false)
  assert.equal(claimed.json.place.program, 'HASA')
  assert.equal(claimed.json.place.neighborhood, 'Crown Heights')
  assert.equal(claimed.json.place.letterRent, '2100')
})

test('edits after sign-up save back, and a signed-out request does not', async () => {
  const accounts = createMemoryAccounts()
  const signed = await signIn(accounts)
  const cookies = cookieJar(signed)
  await accountCall(accounts, { method: 'POST', cookieHeader: cookies, place: localPlace })
  const saved = await accountCall(accounts, {
    method: 'PUT',
    cookieHeader: cookies,
    place: { ...localPlace, neighborhood: 'Bed-Stuy', savedIds: ['bed-stuy-1br'] },
  })
  assert.equal(saved.status, 200)
  assert.equal(saved.json.place.neighborhood, 'Bed-Stuy')
  assert.deepEqual(saved.json.place.savedIds, ['bed-stuy-1br'])
  const blocked = await accountCall(accounts, { method: 'GET', place: null })
  assert.equal(blocked.status, 401)
  assert.equal(blocked.json.place, undefined)
})
