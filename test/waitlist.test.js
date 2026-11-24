import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { register } from 'node:module'
import test from 'node:test'

const stub = 'export class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env } }'
register(`data:text/javascript,${encodeURIComponent(`
  export async function resolve(specifier, context, next) {
    if (specifier === 'cloudflare:workers') return { url: 'data:text/javascript,${encodeURIComponent(stub)}', shortCircuit: true }
    return next(specifier, context)
  }
`)}`)

const { default: worker } = await import('../worker/index.js')
const { normalizeEmail } = await import('../server/waitlist.js')
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// A tiny in-memory stand-in for D1 that honors UNIQUE ... COLLATE NOCASE and INSERT OR IGNORE.
function fakeDb() {
  const rows = []
  return {
    rows,
    prepare(sql) {
      assert.match(sql, /INSERT OR IGNORE INTO waitlist \(email, lang, created_at\) VALUES \(\?, \?, \?\)/)
      return {
        bind(...args) {
          return {
            async run() {
              assert.equal(args.length, 3, 'only email, lang and timestamp are stored')
              const [email, lang, created_at] = args
              if (!rows.some((row) => row.email.toLowerCase() === email.toLowerCase())) rows.push({ email, lang, created_at })
              return { success: true }
            },
          }
        },
      }
    },
  }
}

const post = (env, body, headers = {}) =>
  worker.fetch(new Request('https://leasepath.test/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }), { SITE_PAUSED: '0', ...env })

test('valid signup is trimmed, lowercased and stored with only email, lang, timestamp', async () => {
  const db = fakeDb()
  const res = await post({ WAITLIST_DB: db }, { email: '  QA-Test@Example.COM ', lang: 'es', website: '' })
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { ok: true })
  assert.equal(db.rows.length, 1)
  assert.deepEqual(Object.keys(db.rows[0]).sort(), ['created_at', 'email', 'lang'])
  assert.equal(db.rows[0].email, 'qa-test@example.com')
  assert.equal(db.rows[0].lang, 'es')
  assert.match(db.rows[0].created_at, /^\d{4}-\d\d-\d\dT/)
})

test('unknown language is stored as en', async () => {
  const db = fakeDb()
  await post({ WAITLIST_DB: db }, { email: 'a@example.com', lang: 'zz' })
  assert.equal(db.rows[0].lang, 'en')
})

test('invalid emails get 400 and nothing is saved', async () => {
  const db = fakeDb()
  for (const email of ['', 'nope', 'a@b', 'a b@example.com', 'a@@example.com', `${'x'.repeat(250)}@example.com`, 42, null, ['a@example.com']]) {
    const res = await post({ WAITLIST_DB: db }, { email })
    assert.equal(res.status, 400, String(email))
  }
  assert.equal((await post({ WAITLIST_DB: db }, 'not json')).status, 400)
  assert.equal(db.rows.length, 0)
  assert.equal(normalizeEmail('A@B.co'), 'a@b.co')
})

test('honeypot: filled website returns ok and saves nothing', async () => {
  const db = fakeDb()
  const res = await post({ WAITLIST_DB: db }, { email: 'bot@example.com', website: 'http://spam.example' })
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { ok: true })
  assert.equal(db.rows.length, 0)
})

test('duplicate signup (any case) returns the same success answer and keeps one row', async () => {
  const db = fakeDb()
  const first = await post({ WAITLIST_DB: db }, { email: 'dup@example.com' })
  const second = await post({ WAITLIST_DB: db }, { email: 'DUP@example.com' })
  assert.equal(first.status, second.status)
  assert.deepEqual(await first.json(), await second.json())
  assert.equal(db.rows.length, 1)
})

test('missing D1 binding returns a clear 503; a D1 failure is also 503 and never echoes the email', async () => {
  const res = await post({}, { email: 'a@example.com' })
  assert.equal(res.status, 503)
  assert.equal((await res.json()).error, 'unavailable')
  const broken = { prepare: () => ({ bind: () => ({ run: async () => { throw new Error('boom a@example.com') } }) }) }
  const res2 = await post({ WAITLIST_DB: broken }, { email: 'a@example.com' })
  assert.equal(res2.status, 503)
  assert.doesNotMatch(await res2.text(), /example\.com/)
})

test('rate limit answers 429 and does not save', async () => {
  const db = fakeDb()
  const limiter = { limit: async () => ({ success: false }) }
  const res = await post({ WAITLIST_DB: db, WAITLIST_LIMITER: limiter }, { email: 'a@example.com' })
  assert.equal(res.status, 429)
  assert.equal(db.rows.length, 0)
})

test('GET is refused', async () => {
  const res = await worker.fetch(new Request('https://leasepath.test/api/waitlist'), { SITE_PAUSED: '0', WAITLIST_DB: fakeDb() })
  assert.equal(res.status, 405)
})

test('config: D1 binding with a real database id, migration stores only email, lang, created_at', () => {
  const config = read('wrangler.jsonc')
  assert.match(config, /"binding": "WAITLIST_DB"/)
  assert.match(config, /"database_name": "leasepath-waitlist"/)
  assert.doesNotMatch(config, /TODO\(deploy\)|00000000-0000-0000-0000-000000000000/)
  assert.match(config, /"database_id": "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"/)
  assert.match(config, /"name": "WAITLIST_LIMITER"[^}]*"limit": 5, "period": 60/)
  const sql = read('migrations/0001_waitlist.sql')
  assert.match(sql, /email TEXT UNIQUE NOT NULL COLLATE NOCASE/)
  assert.match(sql, /lang TEXT/)
  assert.match(sql, /created_at TEXT NOT NULL/)
  assert.doesNotMatch(sql, /\bip\b|user_agent|voucher/i)
})

test('page: real form posts to the API; mailto is only the fallback; no analytics; Spanish strings exist', () => {
  const src = read('src/components/LeasebotPage.jsx')
  assert.match(src, /fetch\('\/api\/waitlist'/)
  assert.match(src, /name="website"/)
  assert.doesNotMatch(src, /window\.location\.href\s*=\s*waitlistMailto/)
  const mailtoUses = src.match(/waitlistMailto\(/g) || []
  assert.equal(mailtoUses.length, 2, 'defined once, used once as the fallback link')
  assert.match(src, /unavailable \? \(/)
  assert.match(src, /aria-live="polite"/)
  assert.doesNotMatch(src, /analytics|trackView|gtag|dataLayer/)
  assert.doesNotMatch(src, /do not store it|This opens an email/)
  const es = read('src/i18nUi.es.js')
  for (const key of ["You're on the list. We'll email you when Leasebot is ready.", "We'll only use your email to tell you when Leasebot is ready.", 'Email us instead', 'The waitlist is not working right now.', 'Too many tries. Wait a minute and try again.']) {
    assert.ok(es.includes(`"${key}":`), key)
  }
  assert.match(es, /"Get early access": "Recibir acceso anticipado"/)
  assert.doesNotMatch(src + es, /\b(guaranteed|handles everything)\b/i)
})
