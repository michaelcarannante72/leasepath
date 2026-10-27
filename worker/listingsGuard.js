/** Rate limit + Turnstile for landlord listing submissions. Reuses Turnstile helpers from chatGuard. */
import { checkRateLimit, networkKey, verifyTurnstile } from './chatGuard.js'
import { LISTING_CHALLENGE, LISTING_RATE_LIMITED } from '../server/listings.js'

export { networkKey }

/**
 * Guard POST /api/listings. Turnstile enforced when TURNSTILE_SECRET is set.
 * Returns { ok: true } or { ok: false, status, json }.
 */
export async function guardListingSubmit({ env, ip, token, fetchImpl = fetch }) {
  if (!(await checkRateLimit(env.LISTINGS_LIMITER, ip))) {
    return { ok: false, status: 429, json: LISTING_RATE_LIMITED }
  }
  const turnstileSecret = env.TURNSTILE_SECRET || ''
  if (!turnstileSecret) return { ok: true }
  if (token && (await verifyTurnstile(turnstileSecret, token, ip, fetchImpl))) return { ok: true }
  return { ok: false, status: 403, json: LISTING_CHALLENGE }
}
