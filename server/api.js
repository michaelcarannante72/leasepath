import { openAuth, verifyGoogleIdToken, googleCerts } from './auth.js'
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

  if (pathname !== '/api/guide' && pathname !== '/api/auth/google' && pathname !== '/api/auth/logout') {
    return { status: 404, json: { error: 'not_found' }, cookies: [] }
  }

  if (method === 'OPTIONS') return { status: 204, json: {}, cookies: [] }

  if (method === 'POST' && (!origin || origin !== requestOrigin)) {
    return {
      status: 403,
      json: { error: 'origin', message: 'That request did not come from LeasePath.' },
      cookies: [],
    }
  }

  const auth = await openAuth({ cookieHeader, ip, secret, googleClientId, usage, secure, now })

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
    try {
      const certs = await loadCerts()
      const profile = await verifyToken(credential, { clientId: googleClientId, certs })
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
  if (result.json?.error === 'bad_key' && decision.refund) {
    try {
      await decision.refund()
    } catch {
      // The question was refused by the model host. Losing the refund still fails closed.
    }
  }
  return withAccess(result.status, {
    ...result.json,
    anonymousRemaining: decision.anonymousRemaining,
    accountRemaining: decision.accountRemaining,
  }, auth)
}
