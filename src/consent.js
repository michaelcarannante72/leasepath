import { readConsent } from './analytics.js'

export const COOKIE_CHOICE_KEY = 'leasepath.cookies'

function cookieAcked() {
  try {
    return localStorage.getItem(COOKIE_CHOICE_KEY) === 'ok'
  } catch {
    return false
  }
}

/** True once both the cookie notice and the analytics choice are settled. Ruby's intro waits for this. */
export function consentSettled() {
  return cookieAcked() && readConsent() !== null
}

