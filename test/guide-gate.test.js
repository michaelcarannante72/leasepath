import assert from 'node:assert/strict'
import test from 'node:test'
import { ACCOUNT_DAILY, ANON_FREE, clearGoogleCertCache, verifyGoogleIdToken } from '../server/auth.js'
import { handleApi } from '../server/api.js'
import { prepareGuide } from '../server/guide.js'
import { HRA_KNOWLEDGE } from '../server/hraKnowledge.js'
import { createMemoryUsage } from '../server/usage.js'
import { RESOURCES } from '../src/data.js'

const now = new Date('2026-10-08T15:00:00.000Z')
const origin = 'http://localhost:5183'

function cookieJar(result) {
  return (result.cookies || []).map((cookie) => cookie.split(';')[0]).join('; ')
}

function guideCall({ usage, secret = 'test-secret', cookieHeader = '', callModel, key = 'test-key', ip = '203.0.113.10' }) {
  return handleApi({
    method: 'POST',
    pathname: '/api/guide',
    body: { messages: [{ role: 'user', content: 'What food help is open with a HASA voucher?' }] },
    cookieHeader,
    origin,
    requestOrigin: origin,
    ip,
    key,
    secret,
    googleClientId: 'client-id',
    usage,
    secure: false,
    now,
    callModel,
  })
}

test('free assistant questions stop at the browser allowance, and the next one does not call the model', async () => {
  const usage = createMemoryUsage()
  let calls = 0
  const callModel = async () => {
    calls += 1
    return { output_text: 'Noted.' }
  }
  let cookies = ''
  let last
  for (let index = 0; index < ANON_FREE; index += 1) {
    last = await guideCall({ usage, callModel, cookieHeader: cookies })
    assert.equal(last.status, 200)
    assert.equal(last.json.anonymousRemaining, ANON_FREE - index - 1)
    assert.equal(last.json.reply, 'Noted.')
    cookies = cookieJar(last)
  }
  const blocked = await guideCall({ usage, callModel, cookieHeader: cookies })
  assert.equal(blocked.status, 401)
  assert.equal(blocked.json.error, 'sign_in_required')
  assert.match(blocked.json.message, new RegExp(`${ANON_FREE} free`))
  assert.equal(calls, ANON_FREE)
})

test('a missing sign-in secret never calls the model', async () => {
  let calls = 0
  const result = await guideCall({
    usage: createMemoryUsage(),
    secret: '',
    callModel: async () => {
      calls += 1
      return { output_text: 'Noted.' }
    },
  })
  assert.equal(result.status, 503)
  assert.equal(result.json.error, 'auth_not_configured')
  assert.equal(calls, 0)
})

test('a cross-site post is refused before the model', async () => {
  let calls = 0
  const result = await handleApi({
    method: 'POST',
    pathname: '/api/guide',
    body: { messages: [{ role: 'user', content: 'Hello' }] },
    origin: 'https://evil.example',
    requestOrigin: origin,
    key: 'test-key',
    secret: 'test-secret',
    usage: createMemoryUsage(),
    now,
    callModel: async () => {
      calls += 1
      return { output_text: 'Noted.' }
    },
  })
  assert.equal(result.status, 403)
  assert.equal(calls, 0)
})

test('a rejected model key does not use up a free question', async () => {
  const usage = createMemoryUsage()
  const fail = async () => {
    const error = new Error('bad key')
    error.status = 401
    throw error
  }
  const failed = await guideCall({ usage, callModel: fail })
  assert.equal(failed.status, 401)
  assert.equal(failed.json.error, 'bad_key')
  let calls = 0
  const retried = await guideCall({
    usage,
    cookieHeader: cookieJar(failed),
    callModel: async () => {
      calls += 1
      return { output_text: 'Noted.' }
    },
  })
  assert.equal(retried.status, 200)
  assert.equal(retried.json.anonymousRemaining, ANON_FREE - 1)
  assert.equal(calls, 1)
})

test('a signed-in account stops at the daily cap', async () => {
  const usage = createMemoryUsage()
  usage.seed(`acct:2026-10-08:abc`, ACCOUNT_DAILY)
  const signed = await handleApi({
    method: 'POST',
    pathname: '/api/auth/google',
    body: { credential: 'stub-token' },
    origin,
    requestOrigin: origin,
    secret: 'test-secret',
    googleClientId: 'client-id',
    usage,
    now,
    verifyToken: async () => ({ sub: 'abc', email: 'ada@example.com', name: 'Ada' }),
    loadCerts: async () => [],
  })
  assert.equal(signed.status, 200)
  assert.equal(signed.json.signedIn, true)
  assert.equal(signed.json.email, 'ada@example.com')
  let calls = 0
  const limited = await guideCall({
    usage,
    cookieHeader: cookieJar(signed),
    callModel: async () => {
      calls += 1
      return { output_text: 'Noted.' }
    },
  })
  assert.equal(limited.status, 429)
  assert.equal(limited.json.error, 'daily_limit')
  assert.equal(calls, 0)
})

test('the policy pack is what the model sees, and resources stay public', () => {
  assert.match(HRA_KNOWLEDGE, /food box/i)
  assert.match(HRA_KNOWLEDGE, /HASA/)
  assert.match(HRA_KNOWLEDGE, /\$2,734/)
  assert.match(HRA_KNOWLEDGE, /Do not invent/)
  const prepared = prepareGuide({ messages: [{ role: 'user', content: 'What is a food box?' }] })
  assert.match(prepared.input[0].content, /food box/i)
  assert.equal(prepared.input[0].content.includes('case number:'), false)
  const food = RESOURCES.find((item) => item.title === 'Food boxes and home meals')
  assert.ok(food)
  assert.match(food.detail, /833-766-6769/)
  assert.equal(RESOURCES.some((item) => item.signIn), false)
  assert.equal(new Set(RESOURCES.map((item) => item.group)).has('Food'), true)
})

test('a Google ID token must match the client id and the signature', async () => {
  clearGoogleCertCache()
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey)
  jwk.kid = 'test-key'
  const encode = (value) => {
    const bytes = new TextEncoder().encode(JSON.stringify(value))
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
  }
  const header = encode({ alg: 'RS256', typ: 'JWT', kid: 'test-key' })
  const payload = encode({
    iss: 'https://accounts.google.com',
    aud: 'client-id',
    exp: Math.floor(Date.now() / 1000) + 3600,
    email: 'ada@example.com',
    email_verified: true,
    sub: 'abc',
    name: 'Ada',
  })
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    pair.privateKey,
    new TextEncoder().encode(`${header}.${payload}`),
  )
  let encoded = ''
  for (const byte of new Uint8Array(signature)) encoded += String.fromCharCode(byte)
  const token = `${header}.${payload}.${btoa(encoded).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')}`
  const profile = await verifyGoogleIdToken(token, { clientId: 'client-id', certs: [jwk] })
  assert.equal(profile.email, 'ada@example.com')
  await assert.rejects(verifyGoogleIdToken(token, { clientId: 'other', certs: [jwk] }))
  await assert.rejects(verifyGoogleIdToken(`${token}x`, { clientId: 'client-id', certs: [jwk] }))
})
