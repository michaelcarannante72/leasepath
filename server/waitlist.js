/**
 * Leasebot waitlist: POST /api/waitlist { email, lang, website }.
 * Stores ONLY email, language and a timestamp in D1. Never logs or forwards the address.
 * `website` is a hidden honeypot: if it is filled, answer ok and save nothing.
 */
export const WAITLIST_OK = { ok: true }
export const MAX_EMAIL_LENGTH = 254

export function normalizeEmail(value) {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  if (!email || email.length > MAX_EMAIL_LENGTH) return null
  if (!/^[^\s@,;<>()]+@[^\s@,;<>()]+\.[^\s@,;<>()]{2,}$/.test(email)) return null
  const [local, domain] = email.split('@')
  if (local.length > 64 || domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) return null
  return email
}

export function normalizeLang(value) {
  return value === 'es' ? 'es' : 'en'
}

/** Returns { status, json }. `db` is the D1 binding (may be missing). */
export async function handleWaitlist({ method, body, db, now = () => new Date().toISOString() }) {
  if (method !== 'POST') return { status: 405, json: { error: 'method_not_allowed' } }
  if (!db?.prepare) {
    return { status: 503, json: { error: 'unavailable', message: 'The waitlist is not available right now.' } }
  }
  const data = body && typeof body === 'object' ? body : {}
  // Honeypot: bots fill every field. Pretend it worked, save nothing.
  if (typeof data.website === 'string' && data.website.trim() !== '') return { status: 200, json: WAITLIST_OK }
  const email = normalizeEmail(data.email)
  if (!email) return { status: 400, json: { error: 'invalid_email', message: 'Enter a valid email address.' } }
  try {
    // INSERT OR IGNORE: a repeat signup returns the same answer as a new one.
    await db
      .prepare('INSERT OR IGNORE INTO waitlist (email, lang, created_at) VALUES (?, ?, ?)')
      .bind(email, normalizeLang(data.lang), now())
      .run()
  } catch {
    return { status: 503, json: { error: 'unavailable', message: 'The waitlist is not available right now.' } }
  }
  return { status: 200, json: WAITLIST_OK }
}
