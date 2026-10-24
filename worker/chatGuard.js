// Guards in front of Ruby's chat (POST /api/guide): a per-IP rate limit and a Turnstile human check.
// Nothing here logs or stores the question, the IP, or any form field.
import { TURNSTILE_ORIGIN } from './security.js'

export const HUMAN_COOKIE = 'lp_human'
export const HUMAN_SECONDS = 30 * 60
export const TURNSTILE_VERIFY_URL = `${TURNSTILE_ORIGIN}/turnstile/v0/siteverify`

export const RATE_LIMITED = {
  error: 'rate_limit',
  message: 'Ruby is getting a lot of questions from your network right now. Wait a minute and try again. Search and resources still work.',
}
export const CHALLENGE_REQUIRED = {
  error: 'challenge_required',
  message: 'LeasePath needs a quick check that you are a person before Ruby answers. Try sending again.',
}

/** Workers Rate Limiting binding. Fails open if the binding errors, so an outage never blocks people. */
export async function checkRateLimit(limiter, ip) {
  if (!limiter?.limit) return true
  try {
    const { success } = await limiter.limit({ key: `guide:${ip || 'unknown'}` })
    return Boolean(success)
  } catch {
    return true
  }
}

const encoder = new TextEncoder()
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(`human:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64url(await crypto.subtle.sign('HMAC', key, encoder.encode(data)))
}

/** A short-lived signed pass: "<expiresEpochSeconds>.<hmac>". No IP or identity inside. */
export async function issueHumanPass(secret, nowMs = Date.now()) {
  const exp = String(Math.floor(nowMs / 1000) + HUMAN_SECONDS)
  return `${exp}.${await hmac(secret, exp)}`
}

export async function verifyHumanPass(secret, value, nowMs = Date.now()) {
  if (!secret || typeof value !== 'string') return false
  const [exp, sig, extra] = value.split('.')
  if (extra !== undefined || !/^\d{10}$/.test(exp || '') || !sig) return false
  if (Number(exp) * 1000 <= nowMs) return false
  const expected = await hmac(secret, exp)
  if (expected.length !== sig.length) return false
  let diff = 0
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  return diff === 0
}

export function readCookieValue(header, name) {
  for (const part of String(header || '').split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return ''
}

export function humanCookie(value, secure) {
  return [`${HUMAN_COOKIE}=${value}`, 'HttpOnly', 'Path=/api/guide', 'SameSite=Strict', `Max-Age=${HUMAN_SECONDS}`, ...(secure ? ['Secure'] : [])].join('; ')
}

export async function verifyTurnstile(secret, token, ip, fetchImpl = fetch) {
  if (typeof token !== 'string' || !token || token.length > 2048) return false
  try {
    const form = new FormData()
    form.append('secret', secret)
    form.append('response', token)
    if (ip) form.append('remoteip', ip)
    const response = await fetchImpl(TURNSTILE_VERIFY_URL, { method: 'POST', body: form })
    const data = await response.json().catch(() => ({}))
    return data?.success === true
  } catch {
    return false
  }
}

/**
 * Returns { ok: true, cookie? } when the chat request may go on, or { ok: false, status, json }.
 * Turnstile is enforced only when TURNSTILE_SECRET and the signing secret are both set.
 */
export async function guardChat({ env, ip, cookieHeader, token, secure, nowMs = Date.now(), fetchImpl = fetch }) {
  if (!(await checkRateLimit(env.CHAT_LIMITER, ip))) return { ok: false, status: 429, json: RATE_LIMITED }
  const turnstileSecret = env.TURNSTILE_SECRET || ''
  const signing = env.LEASEPATH_AUTH_SECRET || ''
  if (!turnstileSecret || !signing) return { ok: true }
  if (await verifyHumanPass(signing, readCookieValue(cookieHeader, HUMAN_COOKIE), nowMs)) return { ok: true }
  if (token && (await verifyTurnstile(turnstileSecret, token, ip, fetchImpl))) {
    return { ok: true, cookie: humanCookie(await issueHumanPass(signing, nowMs), secure) }
  }
  return { ok: false, status: 403, json: CHALLENGE_REQUIRED }
}
