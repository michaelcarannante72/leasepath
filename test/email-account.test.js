import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createMemoryAccounts, emptyPlace } from '../server/accounts.js'
import { handleApi } from '../server/api.js'
import { policyHtml, policySlug } from '../server/policyPages.js'
import { createMemoryUsage } from '../server/usage.js'

const now = new Date('2026-10-15T15:00:00.000Z')
const origin = 'http://localhost:5183'
const password = 'correct-horse'

function cookieJar(result) {
  return (result.cookies || []).map((cookie) => cookie.split(';')[0]).join('; ')
}

function emailAuth(accounts, body, usage = createMemoryUsage()) {
  return handleApi({
    method: 'POST',
    pathname: '/api/auth/email',
    body,
    origin,
    requestOrigin: origin,
    secret: 'test-secret',
    googleClientId: 'client-id',
    usage,
    accounts,
    now,
    ip: '127.0.0.1',
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
  letterRent: '2100',
  utilities: 'All utilities are included',
  household: '2',
  receiving: 'has',
  situation: 'Renting now',
  savedIds: ['crown-heights-1br'],
  steps: [0, 1],
}

test('an email account keeps the letter, and a later empty phone does not replace it', async () => {
  const accounts = createMemoryAccounts()
  const created = await emailAuth(accounts, { email: 'Ada@Example.com', password, mode: 'create' })
  assert.equal(created.status, 200)
  assert.equal(created.json.created, true)
  assert.equal(created.json.signedIn, true)
  assert.equal(created.json.email, 'ada@example.com')
  assert.equal(JSON.stringify(created.json).includes(password), false)
  assert.equal(JSON.stringify(created.json).includes('PBKDF2'), false)

  const cookie = cookieJar(created)
  const claimed = await accountCall(accounts, { method: 'POST', cookieHeader: cookie, place: localPlace })
  assert.equal(claimed.status, 200)
  assert.equal(claimed.json.adopted, true)
  assert.equal(claimed.json.place.neighborhood, 'Crown Heights')

  const again = await emailAuth(accounts, { email: 'ada@example.com', password, mode: 'sign-in' })
  assert.equal(again.status, 200)
  assert.equal(again.json.created, false)
  const second = await accountCall(accounts, {
    method: 'POST',
    cookieHeader: cookieJar(again),
    place: emptyPlace(),
  })
  assert.equal(second.json.adopted, false)
  assert.equal(second.json.place.neighborhood, 'Crown Heights')
  assert.equal(second.json.place.letterRent, '2100')

  const loaded = await accountCall(accounts, { method: 'GET', cookieHeader: cookieJar(again) })
  assert.equal(JSON.stringify(loaded.json).includes(password), false)
  assert.equal(JSON.stringify(loaded.json).includes('PBKDF2'), false)
  assert.equal(loaded.json.secret, undefined)
})

test('email sign-up rejects a short password, a duplicate, and a wrong password', async () => {
  const accounts = createMemoryAccounts()
  const short = await emailAuth(accounts, { email: 'ada@example.com', password: 'short', mode: 'create' })
  assert.equal(short.status, 400)

  await emailAuth(accounts, { email: 'ada@example.com', password, mode: 'create' })
  const duplicate = await emailAuth(accounts, { email: 'ada@example.com', password: 'another-password', mode: 'create' })
  assert.equal(duplicate.status, 409)

  const wrong = await emailAuth(accounts, { email: 'ada@example.com', password: 'wrong-password', mode: 'sign-in' })
  assert.equal(wrong.status, 401)
  const missing = await emailAuth(accounts, { email: 'nobody@example.com', password, mode: 'sign-in' })
  assert.equal(missing.status, 401)
  assert.equal(missing.json.message, wrong.json.message)
})

test('deleting the account removes the server record and leaves sign-in closed', async () => {
  const accounts = createMemoryAccounts()
  const created = await emailAuth(accounts, { email: 'ada@example.com', password, mode: 'create' })
  const removed = await accountCall(accounts, { method: 'DELETE', cookieHeader: cookieJar(created) })
  assert.equal(removed.status, 200)
  assert.equal(removed.json.signedIn, false)
  const later = await emailAuth(accounts, { email: 'ada@example.com', password, mode: 'sign-in' })
  assert.equal(later.status, 401)
})

test('the public privacy and terms pages are the same notice, with no script', () => {
  assert.equal(policySlug('/privacy/'), 'privacy')
  assert.equal(policySlug('/terms'), 'terms')
  const privacy = policyHtml('privacy')
  const terms = policyHtml('terms')
  assert.match(privacy, /Privacy Notice/)
  assert.match(privacy, /openid, email, and profile/)
  assert.match(privacy, /not used to sell information|does not sell/)
  assert.equal(privacy.includes('<script'), false)
  assert.match(terms, /Terms of Service/)
  assert.match(terms, /email and a password/)
  assert.match(terms, /source-of-income discrimination/)
  assert.match(terms, /does not decide whether you qualify/)
  assert.match(terms, /do not require arbitration/)
  assert.equal(terms.includes('<script'), false)
})

test('the Google button does not ask for extra scopes', () => {
  const source = readFileSync(new URL('../src/components/GoogleSignInButton.jsx', import.meta.url), 'utf8')
  assert.equal(source.includes('scope'), false)
})
