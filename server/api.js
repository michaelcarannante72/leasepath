import { accountKey, emailAccountKey, emptyPlace, normalizeEmail, sessionRevoked } from './accounts.js'
import { checkPassword, hashPassword, passwordAccepted } from './passwords.js'
import { openAuth, readCookie, validNonce, verifyGoogleIdToken, googleCerts } from './auth.js'
import { MODEL, prepareGuide, completeGuide } from './guide.js'
import { loadPantries } from './pantries.js'

function withAccess(status, body, auth, cookies = auth.cookies) {
  return {
    status,
    cookies,
    json: {
      ...body,
      ...auth.view(),
      ...(body.anonymousRemaining !== undefined ? { anonymousRemaining: body.anonymousRemaining } : {}),
      ...(body.accountRemaining !== undefined ? { accountRemaining: body.accountRemaining } : {}),
      ...(body.signedIn !== undefined ? { signedIn: body.signedIn } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
    },
  }
}

export async function handleApi({
  method,
  pathname,
  body,
  cookieHeader = '',
  origin = '',
  requestOrigin = '',
  ip = '',
  key = '',
  secret = '',
  googleClientId = '',
  usage,
  accounts = null,
  secure = false,
  now,
  callModel,
  verifyToken = verifyGoogleIdToken,
  loadCerts = googleCerts,
  loadPantryList = loadPantries,
}) {
  if (pathname === '/api/pantries') {
    if (method === 'OPTIONS') return { status: 204, json: {}, cookies: [] }
    if (method !== 'GET') return { status: 405, json: { error: 'method' }, cookies: [] }
    try {
      const list = await loadPantryList()
      return {
        status: 200,
        cookies: [],
        cacheControl: 'public, max-age=3600',
        json: list,
      }
    } catch {
      return {
        status: 503,
        cookies: [],
        json: {
          error: 'pantry_source',
          message: 'The Food Help NYC list did not load. The map link below still works.',
        },
      }
    }
  }

  if (
    pathname !== '/api/guide' &&
    pathname !== '/api/auth/google' &&
    pathname !== '/api/auth/email' &&
    pathname !== '/api/auth/logout' &&
    pathname !== '/api/account'
  ) {
    return { status: 404, json: { error: 'not_found' }, cookies: [] }
  }

  if (method === 'OPTIONS') return { status: 204, json: {}, cookies: [] }

  if ((method === 'POST' || method === 'PUT' || method === 'DELETE') && (!origin || origin !== requestOrigin)) {
    return {
      status: 403,
      json: { error: 'origin', message: 'That request did not come from LeasePath.' },
      cookies: [],
    }
  }

  let auth = await openAuth({ cookieHeader, ip, secret, googleClientId, usage, secure, now })

  // Every signed-in request: if the account was deleted after this session was issued, the session is dead on every
  // device. It is treated as signed out and its cookie is cleared, so it can neither read nor recreate the account.
  if (auth.signedIn && accounts?.status) {
    let status
    try {
      status = await accounts.status(accountKey(auth.sub))
    } catch {
      status = null
    }
    if (sessionRevoked(status, auth.issuedAt)) {
      const withoutSession = String(cookieHeader || '').split(';').filter((part) => part.trim().split('=')[0] !== 'lp_session').join(';')
      auth = await openAuth({ cookieHeader: withoutSession, ip, secret, googleClientId, usage, secure, now })
      auth.cookies.push(auth.clearedSessionCookie())
    }
  }

  if (pathname === '/api/account') {
    return handleAccount({ method, body, auth, accounts, usage, now })
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    return withAccess(200, { ok: true, signedIn: false, email: '', accountRemaining: null }, auth, [
      ...auth.cookies,
      auth.clearedSessionCookie(),
    ])
  }

  if (pathname === '/api/auth/google' && method === 'POST') {
    if (!auth.secretReady || !googleClientId) {
      return withAccess(503, {
        error: 'auth_not_configured',
        message: 'Google sign-in is not set up on this server yet. The resource list stays open.',
      }, auth)
    }
    const credential = String(body?.credential || '')
    if (!credential || credential.length > 8000) {
      return withAccess(400, { error: 'bad_request', message: 'Google did not send a sign-in. Try again.' }, auth)
    }
    const nonce = readCookie(cookieHeader, 'lp_nonce')
    if (!validNonce(nonce)) {
      return withAccess(401, { error: 'google', message: 'Google did not accept that sign-in. Try again.' }, auth)
    }
    try {
      const certs = await loadCerts()
      const profile = await verifyToken(credential, { clientId: googleClientId, certs, nonce })
      const signed = await auth.signIn(profile)
      return {
        status: 200,
        cookies: signed.cookies,
        json: { ok: true, ...signed.view },
      }
    } catch {
      return withAccess(401, { error: 'google', message: 'Google did not accept that sign-in. Try again.' }, auth)
    }
  }

  if (pathname === '/api/auth/email' && method === 'POST') {
    return handleEmailAccount({ body, auth, accounts, usage, ip, now, secret })
  }

  if (pathname !== '/api/guide') {
    return withAccess(405, { error: 'method' }, auth)
  }

  if (method === 'GET') {
    return withAccess(200, { configured: Boolean(key), model: MODEL }, auth)
  }

  if (method !== 'POST') return withAccess(405, { error: 'method' }, auth)

  const prepared = prepareGuide(body)
  if (prepared.error) return withAccess(prepared.error.status, prepared.error.json, auth)
  if (!key) {
    return withAccess(503, {
      error: 'missing_key',
      message:
        'The assistant needs an API key on the server. Add XAI_API_KEY to a .env file and restart, or set it with wrangler secret put XAI_API_KEY before deploy.',
    }, auth)
  }

  let decision
  try {
    decision = await auth.consumeQuestion()
  } catch {
    return withAccess(503, {
      error: 'usage',
      message: 'The assistant could not check today\'s limit, so it did not send the question. The resource list stays open.',
    }, auth)
  }
  if (!decision.ok) {
    return withAccess(decision.status, {
      error: decision.error,
      message: decision.message,
      anonymousRemaining: decision.error === 'sign_in_required' ? 0 : auth.anonymousRemaining,
      ...(decision.accountRemaining !== undefined ? { accountRemaining: decision.accountRemaining } : {}),
    }, auth)
  }

  const result = await completeGuide({ key, input: prepared.input, callModel })
  let refunded = 0
  if (result.status !== 200 && decision.refund) {
    // The person got no answer (rejected key, upstream error, timeout, empty reply), so the question is not used up.
    try {
      await decision.refund()
      refunded = 1
    } catch {
      // Losing the refund still fails closed.
    }
  }
  const back = (value) => (Number.isInteger(value) ? value + refunded : value)
  return withAccess(result.status, {
    ...result.json,
    anonymousRemaining: back(decision.anonymousRemaining),
    accountRemaining: back(decision.accountRemaining),
  }, auth)
}

async function hashedNetwork(secret, ip) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${secret}:${ip || 'unknown'}`))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

async function limitPasswordTries(usage, ip, now, secret) {
  if (!usage) return true
  try {
    const day = (now instanceof Date ? now : new Date()).toISOString().slice(0, 10)
    // The counter is stored under a keyed hash, so a raw IP address is never written to storage.
    const result = await usage.consume(`pw:${day}:${await hashedNetwork(secret, ip)}`, 20)
    return Boolean(result?.ok)
  } catch {
    return true
  }
}

async function handleEmailAccount({ body, auth, accounts, usage, ip, now, secret }) {
  if (!auth.secretReady) {
    return withAccess(503, {
      error: 'auth_not_configured',
      message: 'Sign-in is not set up on this server yet. Search stays open.',
    }, auth)
  }
  if (!accounts) {
    return withAccess(503, {
      error: 'accounts_not_ready',
      message: 'Accounts are not ready on this server yet. Your letter stays on this phone.',
    }, auth)
  }
  const email = normalizeEmail(body?.email)
  const password = body?.password
  if (!email || !passwordAccepted(password)) {
    return withAccess(400, {
      error: 'bad_request',
      message: 'Use an email address and a password of at least 8 characters.',
    }, auth)
  }
  if (!(await limitPasswordTries(usage, ip, now, secret))) {
    return withAccess(429, {
      error: 'rate_limit',
      message: 'Too many tries from this network. Wait and try again. Search stays open.',
    }, auth)
  }
  const key = await emailAccountKey(email)
  const when = (now instanceof Date ? now : new Date()).toISOString()
  try {
    if (body?.mode === 'create') {
      const secret = await hashPassword(password)
      const created = await accounts.register(key, { email, secret, now: when })
      if (!created?.ok) {
        return withAccess(409, {
          error: 'exists',
          message: 'That email already has an account. Sign in instead.',
        }, auth)
      }
      const signed = await auth.signIn({ sub: key, email, name: '' })
      return { status: 200, cookies: signed.cookies, json: { ok: true, created: true, ...signed.view } }
    }
    const current = await accounts.read(key)
    const matches = current?.secret ? await checkPassword(password, current.secret) : false
    if (!matches) {
      return withAccess(401, {
        error: 'password',
        message: 'That email and password did not match.',
      }, auth)
    }
    const signed = await auth.signIn({ sub: key, email: current.email || email, name: '' })
    return { status: 200, cookies: signed.cookies, json: { ok: true, created: false, ...signed.view } }
  } catch {
    return withAccess(503, {
      error: 'accounts_not_ready',
      message: 'Accounts are not ready on this server yet. Your letter stays on this phone.',
    }, auth)
  }
}

/** Daily question counters carry the account id in their name. Keep this window longer than any counter matters. */
export const USAGE_FORGET_DAYS = 31

export function accountUsageKeys(id, now) {
  const base = (now instanceof Date ? now : new Date()).getTime()
  return Array.from({ length: USAGE_FORGET_DAYS }, (_, i) => `acct:${new Date(base - i * 86_400_000).toISOString().slice(0, 10)}:${id}`)
}

async function handleAccount({ method, body, auth, accounts, usage, now }) {
  if (!auth.signedIn || !accountKey(auth.sub)) {
    return withAccess(401, {
      error: 'sign_in_required',
      message: 'Sign in to keep your letter on an account.',
    }, auth)
  }
  if (!accounts) {
    return withAccess(503, {
      error: 'accounts_not_ready',
      message: 'Accounts are not ready on this server yet. Your letter stays on this phone.',
    }, auth)
  }
  const when = (now instanceof Date ? now : new Date()).toISOString()
  try {
    if (method === 'DELETE') {
      // Erase the whole account row: email, password hash, program (e.g. HASA), housing situation,
      // letter amount, household size, utilities, saved ids, steps. Then the counters named after the account.
      await accounts.remove(accountKey(auth.sub))
      if (usage?.forget) {
        await Promise.all(accountUsageKeys(accountKey(auth.sub), now).map((key) => Promise.resolve(usage.forget(key)).catch(() => {})))
      }
      return withAccess(200, { ok: true, signedIn: false, email: '', accountRemaining: null }, auth, [
        ...auth.cookies,
        auth.clearedSessionCookie(),
      ])
    }
    if (method === 'GET') {
      const current = await accounts.read(accountKey(auth.sub))
      return withAccess(200, { ok: true, place: current?.place || emptyPlace() }, auth)
    }
    if (method !== 'POST' && method !== 'PUT') return withAccess(405, { error: 'method' }, auth)
    const place = body?.place
    if (!place || typeof place !== 'object' || Array.isArray(place)) {
      return withAccess(400, { error: 'bad_request', message: 'That account update could not be saved.' }, auth)
    }
    const input = { email: auth.email, place, now: when }
    const decision = method === 'POST'
      ? await accounts.claim(accountKey(auth.sub), input)
      : await accounts.save(accountKey(auth.sub), input)
    if (!decision?.record?.place) {
      return withAccess(503, {
        error: 'accounts_not_ready',
        message: 'Accounts are not ready on this server yet. Your letter stays on this phone.',
      }, auth)
    }
    return withAccess(200, {
      ok: true,
      adopted: method === 'POST' ? Boolean(decision.adopted) : undefined,
      place: decision.record.place,
    }, auth)
  } catch {
    return withAccess(503, {
      error: 'accounts_not_ready',
      message: 'Accounts are not ready on this server yet. Your letter stays on this phone.',
    }, auth)
  }
}
