import { FREE_COACH_QUESTIONS } from '../src/coachLimit.js'

export const ANON_FREE = FREE_COACH_QUESTIONS

function freeQuestionsUsedMessage() {
  const noun = ANON_FREE === 1 ? 'question is' : 'questions are'
  return `${ANON_FREE} free ${noun} used on this browser. Sign in with Google to ask more. Search and the resource list stay open.`
}
export const ANON_IP_DAILY = 24
export const ACCOUNT_DAILY = 20
export const GLOBAL_DAILY = 400

const GUEST_SECONDS = 60 * 60 * 24 * 180
const SESSION_SECONDS = 60 * 60 * 24 * 14

const encoder = new TextEncoder()

function bytesToB64url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function b64urlToBytes(value) {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false
  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
  return mismatch === 0
}

function safeId(value) {
  const clean = String(value || '').replace(/[^A-Za-z0-9_-]/g, '')
  return clean.slice(0, 80) || 'unknown'
}

export function readCookie(header, name) {
  for (const part of String(header || '').split(';')) {
    const trimmed = part.trim()
    const split = trimmed.indexOf('=')
    if (split === -1) continue
    if (trimmed.slice(0, split) === name) return trimmed.slice(split + 1)
  }
  return ''
}

export function serializeCookie(name, value, { maxAge, secure }) {
  const parts = [`${name}=${value}`, 'HttpOnly', 'Path=/', 'SameSite=Lax', `Max-Age=${maxAge}`]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

async function hmac(secret, payload) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return bytesToB64url(new Uint8Array(signature))
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function signToken(data, secret) {
  const payload = bytesToB64url(encoder.encode(JSON.stringify(data)))
  return `${payload}.${await hmac(secret, payload)}`
}

async function readToken(token, secret) {
  if (!token || !secret) return null
  const split = token.lastIndexOf('.')
  if (split <= 0) return null
  const payload = token.slice(0, split)
  const signature = token.slice(split + 1)
  const expected = await hmac(secret, payload)
  if (!safeEqual(signature, expected)) return null
  try {
    const data = JSON.parse(new TextDecoder().decode(b64urlToBytes(payload)))
    if (!data || typeof data.exp !== 'number' || data.exp < Date.now()) return null
    return data
  } catch {
    return null
  }
}

let certCache = { keys: null, expires: 0 }

export async function googleCerts(fetchImpl = fetch) {
  if (certCache.keys && Date.now() < certCache.expires) return certCache.keys
  const response = await fetchImpl('https://www.googleapis.com/oauth2/v3/certs')
  if (!response.ok) throw new Error('certs')
  const body = await response.json()
  const match = String(response.headers.get('cache-control') || '').match(/max-age=(\d+)/)
  const maxAge = match ? Number(match[1]) * 1000 : 60 * 60 * 1000
  certCache = { keys: body.keys || [], expires: Date.now() + maxAge }
  return certCache.keys
}

export function clearGoogleCertCache() {
  certCache = { keys: null, expires: 0 }
}

export async function verifyGoogleIdToken(token, { clientId, certs }) {
  const parts = String(token || '').split('.')
  if (parts.length !== 3) throw new Error('malformed')
  const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[0])))
  const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1])))
  if (header.alg !== 'RS256') throw new Error('alg')
  if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') throw new Error('iss')
  if (!clientId || payload.aud !== clientId) throw new Error('aud')
  if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now() - 60_000) throw new Error('exp')
  if (payload.email_verified !== true && payload.email_verified !== 'true') throw new Error('email')
  if (!payload.sub || !payload.email) throw new Error('subject')
  const keys = Array.isArray(certs?.keys) ? certs.keys : certs
  const jwk = (keys || []).find((key) => key.kid === header.kid)
  if (!jwk) throw new Error('kid')
  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256' },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    b64urlToBytes(parts[2]),
    encoder.encode(`${parts[0]}.${parts[1]}`),
  )
  if (!valid) throw new Error('sig')
  return { sub: String(payload.sub), email: String(payload.email), name: payload.name ? String(payload.name) : '' }
}

function publicView(auth) {
  return {
    signedIn: auth.signedIn,
    email: auth.email,
    anonymousRemaining: auth.anonymousRemaining,
    accountRemaining: auth.accountRemaining,
    googleClientId: auth.googleClientId,
    secretReady: auth.secretReady,
    authReady: auth.secretReady && Boolean(auth.googleClientId),
  }
}

export async function openAuth({ cookieHeader, ip, secret, googleClientId = '', usage, secure = false, now = new Date() }) {
  const secretReady = Boolean(secret)
  const day = now.toISOString().slice(0, 10)
  const session = secretReady ? await readToken(readCookie(cookieHeader, 'lp_session'), secret) : null
  const signedIn = Boolean(session?.sub && session?.email)
  let guest = secretReady ? await readToken(readCookie(cookieHeader, 'lp_guest'), secret) : null
  if (!guest?.id) guest = { id: crypto.randomUUID() }

  const guestKey = `guest:${safeId(guest.id)}`
  const ipKey = `ip:${day}:${secretReady ? (await sha256(`${secret}:${ip || 'unknown'}`)).slice(0, 32) : 'none'}`
  const accountKey = signedIn ? `acct:${day}:${safeId(session.sub)}` : ''
  const globalKey = `global:${day}`

  let usageReady = Boolean(usage)
  let anonymousUsed = 0
  let accountRemaining = null
  let networkExhausted = false
  if (usage) {
    try {
      anonymousUsed = await usage.read(guestKey)
      if (signedIn) accountRemaining = Math.max(0, ACCOUNT_DAILY - (await usage.read(accountKey)))
      else networkExhausted = (await usage.read(ipKey)) >= ANON_IP_DAILY
    } catch {
      usageReady = false
    }
  }

  const guestToken = secretReady
    ? await signToken({ id: guest.id, exp: now.getTime() + GUEST_SECONDS * 1000 }, secret)
    : ''
  const baseCookies = guestToken ? [serializeCookie('lp_guest', guestToken, { maxAge: GUEST_SECONDS, secure })] : []

  async function consume(key, limit) {
    return usage.consume(key, limit)
  }

  async function release(key) {
    await usage.release(key)
  }

  return {
    secretReady,
    usageReady,
    googleClientId,
    signedIn,
    email: signedIn ? session.email : '',
    anonymousRemaining: signedIn ? null : networkExhausted ? 0 : Math.max(0, ANON_FREE - anonymousUsed),
    accountRemaining,
    cookies: baseCookies,
    view() {
      return publicView(this)
    },
    async sessionCookie() {
      if (!signedIn || !secretReady) return null
      const token = await signToken(
        { sub: session.sub, email: session.email, name: session.name || '', exp: now.getTime() + SESSION_SECONDS * 1000 },
        secret,
      )
      return serializeCookie('lp_session', token, { maxAge: SESSION_SECONDS, secure })
    },
    clearedSessionCookie() {
      return serializeCookie('lp_session', '', { maxAge: 0, secure })
    },
    async signIn(profile) {
      const token = await signToken(
        { sub: profile.sub, email: profile.email, name: profile.name || '', exp: Date.now() + SESSION_SECONDS * 1000 },
        secret,
      )
      const accountUsed = usageReady ? await usage.read(`acct:${day}:${safeId(profile.sub)}`) : 0
      return {
        cookies: [...baseCookies, serializeCookie('lp_session', token, { maxAge: SESSION_SECONDS, secure })],
        view: {
          signedIn: true,
          email: profile.email,
          anonymousRemaining: null,
          accountRemaining: Math.max(0, ACCOUNT_DAILY - accountUsed),
          googleClientId,
          secretReady: true,
          authReady: Boolean(googleClientId),
        },
      }
    },
    async consumeQuestion() {
      if (!secretReady) {
        return { ok: false, error: 'auth_not_configured', status: 503, message: 'The assistant is paused until sign-in is set up on the server. The resource list stays open.' }
      }
      if (!usageReady) {
        return { ok: false, error: 'usage', status: 503, message: 'The assistant could not check today\'s limit, so it did not send the question. The resource list stays open.' }
      }
      if (!signedIn && anonymousUsed >= ANON_FREE) {
        return { ok: false, error: 'sign_in_required', status: 401, message: freeQuestionsUsedMessage() }
      }

      if (!signedIn) {
        const guestResult = await consume(guestKey, ANON_FREE)
        if (!guestResult.ok) {
          return { ok: false, error: 'sign_in_required', status: 401, message: freeQuestionsUsedMessage() }
        }
        const ipResult = await consume(ipKey, ANON_IP_DAILY)
        if (!ipResult.ok) {
          await release(guestKey)
          return { ok: false, error: 'sign_in_required', status: 401, message: 'This network has used today\'s free assistant questions. Sign in with Google to ask more. The resource list stays open.' }
        }
        const globalResult = await consume(globalKey, GLOBAL_DAILY)
        if (!globalResult.ok) {
          await release(guestKey)
          await release(ipKey)
          return { ok: false, error: 'daily_limit', status: 429, message: 'The assistant has reached today\'s limit. It opens again tomorrow. The resource list stays open.', accountRemaining: null }
        }
        return {
          ok: true,
          anonymousRemaining: Math.max(0, ANON_FREE - guestResult.count),
          accountRemaining: null,
          async refund() {
            await release(guestKey)
            await release(ipKey)
            await release(globalKey)
          },
        }
      }

      const accountResult = await consume(accountKey, ACCOUNT_DAILY)
      if (!accountResult.ok) {
        return {
          ok: false,
          error: 'daily_limit',
          status: 429,
          accountRemaining: 0,
          message: `This Google account has used its ${ACCOUNT_DAILY} assistant questions for today. The count resets at midnight UTC. The resource list stays open.`,
        }
      }
      const globalResult = await consume(globalKey, GLOBAL_DAILY)
      if (!globalResult.ok) {
        await release(accountKey)
        return { ok: false, error: 'daily_limit', status: 429, accountRemaining, message: 'The assistant has reached today\'s limit. It opens again tomorrow. The resource list stays open.' }
      }
      return {
        ok: true,
        anonymousRemaining: null,
        accountRemaining: Math.max(0, ACCOUNT_DAILY - accountResult.count),
        async refund() {
          await release(accountKey)
          await release(globalKey)
        },
      }
    },
  }
}
