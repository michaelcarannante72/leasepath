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

/** IPv6 clients can rotate through a whole /64, so they are limited per /64. IPv4 is limited per address. */
export function networkKey(ip) {
  const value = String(ip || '').trim().toLowerCase()
  if (!value.includes(':')) return value || 'unknown'
  const [head, tail = ''] = value.split('::')
  const left = head ? head.split(':') : []
  const right = tail ? tail.split(':') : []
  const groups = value.includes('::') ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right] : left
  return `${groups.slice(0, 4).map((g) => (g || '0').replace(/^0+(?=.)/, '')).join(':')}::/64`
}

/** Workers Rate Limiting binding. Fails open if the binding errors, so an outage never blocks people. */
export async function checkRateLimit(limiter, ip) {
  if (!limiter?.limit) return true
  try {
    const { success } = await limiter.limit({ key: `guide:${networkKey(ip)}` })
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

/**
 * Siteverify, with the action check Turnstile recommends. A token minted for one widget cannot be
 * replayed on another route: the action the browser asked for has to match the action the route expects.
 * Pass expectedAction = '' only where any action is acceptable.
 */
export async function verifyTurnstile(secret, token, ip, fetchImpl = fetch, expectedAction = '') {
  if (typeof token !== 'string' || !token || token.length > 2048) return false
  try {
    const form = new FormData()
    form.append('secret', secret)
    form.append('response', token)
    if (ip) form.append('remoteip', ip)
    const response = await fetchImpl(TURNSTILE_VERIFY_URL, { method: 'POST', body: form })
    const data = await response.json().catch(() => ({}))
    if (data?.success !== true) return false
    if (!expectedAction) return true
    return typeof data.action === 'string' && data.action === expectedAction
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
  // Ruby's widget still declares action 'ruby_chat'; anything else is not a chat token.
  if (token && (await verifyTurnstile(turnstileSecret, token, ip, fetchImpl, 'ruby_chat'))) {
    return { ok: true, cookie: humanCookie(await issueHumanPass(signing, nowMs), secure) }
  }
  return { ok: false, status: 403, json: CHALLENGE_REQUIRED }
}
