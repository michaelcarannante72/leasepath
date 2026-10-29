import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { register } from 'node:module'
import test from 'node:test'
import { prepareGuide, MAX_MESSAGE_CHARS, MAX_CONVERSATION_TOKENS, estimateTokens } from '../server/guide.js'
import { networkKey, checkRateLimit, guardChat, issueHumanPass, verifyHumanPass, HUMAN_COOKIE } from '../worker/chatGuard.js'
import { CSP, SECURITY_HEADERS, headersFile } from '../worker/security.js'

const stub = 'export class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env } }'
register(`data:text/javascript,${encodeURIComponent(`
  export async function resolve(specifier, context, next) {
    if (specifier === 'cloudflare:workers') return { url: 'data:text/javascript,${encodeURIComponent(stub)}', shortCircuit: true }
    return next(specifier, context)
  }
`)}`)
const { default: worker } = await import('../worker/index.js')
const base = 'https://leasepath.test'

function limiter(max) {
  const seen = new Map()
  return { keys: seen, limit: async ({ key }) => { seen.set(key, (seen.get(key) || 0) + 1); return { success: seen.get(key) <= max } } }
}

test('rate limiter keys by IP and fails open when the binding errors', async () => {
  const l = limiter(2)
  assert.equal(await checkRateLimit(l, '1.1.1.1'), true)
  assert.equal(await checkRateLimit(l, '1.1.1.1'), true)
  assert.equal(await checkRateLimit(l, '1.1.1.1'), false)
  assert.equal(await checkRateLimit(l, '2.2.2.2'), true)
  assert.equal(await checkRateLimit({ limit: async () => { throw new Error('down') } }, '1.1.1.1'), true)
  assert.equal(await checkRateLimit(undefined, '1.1.1.1'), true)
})

test('Worker returns a friendly 429 after a burst of chat posts from one IP', async () => {
  const env = { CHAT_LIMITER: limiter(3), LEASEPATH_AUTH_SECRET: 's' }
  const statuses = []
  for (let i = 0; i < 5; i++) {
    const r = await worker.fetch(new Request(`${base}/api/guide`, { method: 'POST', body: '{}', headers: { origin: base, 'cf-connecting-ip': '9.9.9.9' } }), env)
    statuses.push(r.status)
    if (r.status === 429) {
      const data = await r.json()
      assert.equal(data.error, 'rate_limit')
      assert.match(data.message, /Wait a minute/)
      assert.ok(r.headers.get('content-security-policy'))
    }
  }
  assert.deepEqual(statuses.slice(3), [429, 429])
  assert.ok(statuses.slice(0, 3).every((s) => s !== 429))
})

test('human pass is signed, expires, and rejects tampering', async () => {
  const now = Date.UTC(2026, 9, 23)
  const pass = await issueHumanPass('k', now)
  assert.equal(await verifyHumanPass('k', pass, now + 1000), true)
  assert.equal(await verifyHumanPass('other', pass, now), false)
  assert.equal(await verifyHumanPass('k', pass, now + 31 * 60 * 1000), false)
  const [exp, sig] = pass.split('.')
  assert.equal(await verifyHumanPass('k', `${Number(exp) + 999}.${sig}`, now), false)
  assert.equal(await verifyHumanPass('k', 'junk', now), false)
})

test('Turnstile: challenge without pass, verify token once, then cookie skips the check', async () => {
  const env = { TURNSTILE_SECRET: 'ts', LEASEPATH_AUTH_SECRET: 'auth' }
  let calls = 0
  const fetchImpl = async (url, init) => {
    calls++
    assert.match(String(url), /challenges\.cloudflare\.com\/turnstile\/v0\/siteverify/)
    // Siteverify reports the action it recorded; the chat route only accepts its own.
    return new Response(JSON.stringify({ success: init.body.get('response') === 'good', action: 'ruby_chat' }))
  }
  const none = await guardChat({ env, ip: '1.2.3.4', cookieHeader: '', token: '', fetchImpl })
  assert.equal(none.status, 403)
  assert.equal(none.json.error, 'challenge_required')
  assert.equal((await guardChat({ env, ip: '1.2.3.4', cookieHeader: '', token: 'bad', fetchImpl })).ok, false)
  const ok = await guardChat({ env, ip: '1.2.3.4', cookieHeader: '', token: 'good', secure: true, fetchImpl })
  assert.equal(ok.ok, true)
  assert.match(ok.cookie, new RegExp(`^${HUMAN_COOKIE}=`))
  assert.match(ok.cookie, /HttpOnly/)
  assert.match(ok.cookie, /Secure/)
  const before = calls
  const again = await guardChat({ env, ip: '1.2.3.4', cookieHeader: ok.cookie.split(';')[0], token: '', fetchImpl })
  assert.equal(again.ok, true)
  assert.equal(calls, before)
})

test('Turnstile is skipped when the secret is not configured', async () => {
  assert.equal((await guardChat({ env: { LEASEPATH_AUTH_SECRET: 'a' }, ip: '', cookieHeader: '', token: '' })).ok, true)
})

test('a question over the length limit gets a friendly 413', () => {
  const r = prepareGuide({ messages: [{ role: 'user', content: 'a'.repeat(MAX_MESSAGE_CHARS + 1) }] })
  assert.equal(r.error.status, 413)
  assert.match(r.error.json.message, /too long/)
  assert.ok(!prepareGuide({ messages: [{ role: 'user', content: 'a'.repeat(MAX_MESSAGE_CHARS) }] }).error)
})

test('conversation sent to xAI is capped; oldest turns go first and the question stays', () => {
  const messages = []
  for (let i = 0; i < 7; i++) messages.push({ role: i % 2 ? 'assistant' : 'user', content: String.fromCharCode(97 + i).repeat(1990) })
  messages.push({ role: 'user', content: 'final question' })
  const { input } = prepareGuide({ messages })
  const conv = input.slice(1).reduce((sum, item) => sum + estimateTokens(item.content), 0)
  assert.ok(conv <= MAX_CONVERSATION_TOKENS)
  assert.equal(input[0].role, 'system')
  assert.match(input.at(-1).content, /final question/)
  assert.ok(input.length < messages.length + 1)
})

test('xAI request caps output tokens', () => {
  assert.match(readFileSync(new URL('../server/guide.js', import.meta.url), 'utf8'), /max_output_tokens: MAX_OUTPUT_TOKENS/)
})

test('security headers: CSP covers what the app loads and blocks framing', () => {
  for (const host of ['https://www.googletagmanager.com', 'https://*.google-analytics.com', 'https://challenges.cloudflare.com', 'https://geosearch.planninglabs.nyc', 'https://data.cityofnewyork.us', 'https://accounts.google.com/gsi/client']) {
    assert.ok(CSP.includes(host), host)
  }
  assert.match(CSP, /frame-ancestors 'none'/)
  assert.match(CSP, /object-src 'none'/)
  assert.doesNotMatch(CSP, /unsafe-eval/)
  assert.match(SECURITY_HEADERS['strict-transport-security'], /max-age=31536000/)
  assert.equal(SECURITY_HEADERS['x-frame-options'], 'DENY')
  assert.equal(SECURITY_HEADERS['referrer-policy'], 'strict-origin-when-cross-origin')
  assert.match(SECURITY_HEADERS['permissions-policy'], /camera=\(\)/)
  assert.match(SECURITY_HEADERS['permissions-policy'], /microphone=\(self\)/)
})

test('public/_headers matches worker/security.js', () => {
  assert.equal(readFileSync(new URL('../public/_headers', import.meta.url), 'utf8'), headersFile())
})

test('every Worker response carries the full header set', async () => {
  for (const path of ['/privacy', '/api/guide', '/api/nope', '/after-you-find']) {
    const r = await worker.fetch(new Request(`${base}${path}`), { LEASEPATH_AUTH_SECRET: 's' })
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) assert.equal(r.headers.get(name), value, `${path} ${name}`)
  }
})

test('Worker and server code never log request bodies or chat text', () => {
  for (const file of ['worker/index.js', 'worker/chatGuard.js', 'server/guide.js', 'server/api.js']) {
    const src = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
    for (const line of src.split('\n').filter((l) => /console\./.test(l))) {
      assert.doesNotMatch(line, /body|content|message\b(?!:)|input|email|ip\b|\.message/, `${file}: ${line.trim()}`)
    }
  }
})

test('the client strips no PII into analytics: only allowed keys and no query strings', async () => {
  const { safePush, sanitizedPage } = await import('../src/analytics.js')
  const win = {}
  const pushed = safePush(win, { event: 'x', email: 'a@b.c', page_path: '/#/a' })
  assert.deepEqual(Object.keys(pushed).sort(), ['event', 'page_path'])
  assert.equal(sanitizedPage('/search?income=50000&email=a@b.c').page_path, '/#/search')
})

test('IPv6 addresses are limited per /64, IPv4 per address', () => {
  assert.equal(networkKey('2a09:bac1:76a0:518::160:11c'), '2a09:bac1:76a0:518::/64')
  assert.equal(networkKey('2a09:bac1:76a0:518::23d:61'), '2a09:bac1:76a0:518::/64')
  assert.equal(networkKey('2001:db8::1'), '2001:db8:0:0::/64')
  assert.equal(networkKey('203.0.113.7'), '203.0.113.7')
  assert.equal(networkKey(''), 'unknown')
})
