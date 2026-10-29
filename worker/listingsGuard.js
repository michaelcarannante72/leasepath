/**
 * Rate limit + Turnstile for landlord listing routes. Reuses the Turnstile helpers from chatGuard.
 *
 * Posture (v2): the per-IP rate limit is the abuse control of record for a submission. Turnstile is
 * verified whenever the browser manages to produce a token, and a token minted for another widget is
 * rejected, but a missing token does not throw the submission away — an in-app browser or an ad blocker
 * that breaks the challenge would otherwise lose everything the landlord typed.
 */
import { checkRateLimit, networkKey, verifyTurnstile } from './chatGuard.js'
import { LISTING_CHALLENGE, LISTING_RATE_LIMITED } from '../server/listings.js'

export { networkKey }

/** The action the listing form asks Turnstile for. The chat keeps 'ruby_chat'. */
export const LISTING_TURNSTILE_ACTION = 'landlord_listing'

/**
 * Guard POST /api/listings and the edit routes.
 * Returns { ok: true } or { ok: false, status, json }.
 */
export async function guardListingSubmit({ env, ip, token, fetchImpl = fetch }) {
  if (!(await checkRateLimit(env.LISTINGS_LIMITER, ip))) {
    return { ok: false, status: 429, json: LISTING_RATE_LIMITED }
  }
  const turnstileSecret = env.TURNSTILE_SECRET || ''
  // No secret configured, or no token from the browser: the rate limit above already passed.
  if (!turnstileSecret || !token) return { ok: true }
  // A token was offered, so it has to be genuine and minted for this form.
  if (await verifyTurnstile(turnstileSecret, token, ip, fetchImpl, LISTING_TURNSTILE_ACTION)) return { ok: true }
  return { ok: false, status: 403, json: LISTING_CHALLENGE }
}
