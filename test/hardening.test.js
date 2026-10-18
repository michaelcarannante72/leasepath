import assert from 'node:assert/strict'
import test from 'node:test'
import { ANON_FREE } from '../server/auth.js'
import { handleApi } from '../server/api.js'
import { createMemoryAccounts } from '../server/accounts.js'
import { prepareGuide } from '../server/guide.js'
import { createMemoryUsage } from '../server/usage.js'
import { sizeLabel } from '../src/fit.js'

const now = new Date('2026-10-18T15:00:00.000Z')
const origin = 'http://localhost:5183'
const jar = (result) => (result.cookies || []).map((cookie) => cookie.split(';')[0]).join('; ')

function guideCall({ usage, cookieHeader = '', callModel }) {
  return handleApi({
    method: 'POST',
    pathname: '/api/guide',
    body: { messages: [{ role: 'user', content: 'What is the food box?' }] },
    cookieHeader,
    origin,
    requestOrigin: origin,
    ip: '203.0.113.7',
    key: 'test-key',
    secret: 'test-secret',
    googleClientId: 'client-id',
    usage,
    now,
    callModel,
  })
}

test('hostile JSON never throws out of prepareGuide', () => {
  const hostile = { toString: 1, valueOf: 1 }
  const cases = [
    { messages: [{ role: 'user', content: hostile }] },
    { messages: [{ role: 'user', content: 'hi' }], listing: { neighborhood: 'Bronx', bedrooms: hostile, rent: hostile, borough: hostile, programs: [hostile] } },
    { messages: [{ role: 'user', content: 'hi' }], includePlan: true, plan: { program: hostile, household: hostile, letterRent: hostile, utilities: hostile } },
    { messages: 'nope' },
    null,
  ]
  for (const body of cases) assert.doesNotThrow(() => prepareGuide(body))
  const prepared = prepareGuide(cases[1])
  assert.match(prepared.input.at(-1).content, /Apartment in Bronx/)
  assert.equal(sizeLabel({ bedrooms: hostile }), 'Apartment')
  assert.equal(prepareGuide({ messages: [{ role: 'user', content: 'ssn 123-45-6789 and 123456789012' }] }).input.at(-1).content.includes('6789'), false)
})

test('a failed answer does not use up a question and reports the real count', async () => {
  for (const failure of [
    async () => { throw Object.assign(new Error('upstream down'), { status: 503 }) },
    async () => { throw new Error('timed out') },
    async () => ({ output_text: '   ' }),
  ]) {
    const usage = createMemoryUsage()
    const failed = await guideCall({ usage, callModel: failure })
    assert.ok(failed.status >= 400)
    assert.equal(failed.json.anonymousRemaining, ANON_FREE)
    const ok = await guideCall({ usage, cookieHeader: jar(failed), callModel: async () => ({ output_text: 'Noted.' }) })
    assert.equal(ok.status, 200)
    assert.equal(ok.json.anonymousRemaining, ANON_FREE - 1)
    assert.equal(usage.snapshot()[`global:2026-10-18`], 1)
  }
})

test('email sign-in attempts are counted under a keyed hash, not the raw IP address', async () => {
  const usage = createMemoryUsage()
  const result = await handleApi({
    method: 'POST',
    pathname: '/api/auth/email',
    body: { email: 'ada@example.com', password: 'a-long-password', mode: 'create' },
    origin,
    requestOrigin: origin,
    ip: '198.51.100.23',
    secret: 'test-secret',
    googleClientId: 'client-id',
    usage,
    accounts: createMemoryAccounts(),
    now,
  })
  assert.equal(result.status, 200)
  const keys = Object.keys(usage.snapshot()).filter((key) => key.startsWith('pw:'))
  assert.equal(keys.length, 1)
  assert.equal(keys[0].includes('198'), false)
  assert.match(keys[0], /^pw:2026-10-18:[0-9a-f]{32}$/)
})
