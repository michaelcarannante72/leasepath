// Google Tag Manager, gated by consent. Nothing here runs until the person taps Allow.
// Only a fixed set of page fields ever goes into dataLayer: no voucher type, income, form answers, or chat text.
// HASA views and Ruby's chat never send a page event.

export const GTM_ID = 'GTM-PX85GXS7'
export const CONSENT_KEY = 'leasepath.analytics'
export const PAGE_EVENT = 'lp_page_view'
export const ALLOWED_KEYS = ['event', 'page_location', 'page_path', 'page_title']

// Approved by Michael on 2026-10-20. Shown in the Privacy Notice (src/sitePages.js).
export const PRIVACY_DRAFT =
  'LeasePath uses Google Analytics through Google Tag Manager only if you tap Allow. It records which LeasePath pages are opened, never on HASA pages or in Ruby’s chat, and never your voucher, income, answers, or questions. You can change this choice at any time from the Analytics choice link at the bottom of the app.'

export function readConsent(storage = globalThis.localStorage) {
  try {
    const value = storage?.getItem(CONSENT_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

export function writeConsent(value, storage = globalThis.localStorage) {
  try {
    if (value === null) storage?.removeItem(CONSENT_KEY)
    else storage?.setItem(CONSENT_KEY, value === 'granted' ? 'granted' : 'denied')
  } catch {
    // The choice still applies for this visit when storage is blocked.
  }
}

/**
 * A view is sensitive (no page event) when:
 * - Ruby's chat sheet is open, on any route;
 * - the route is My voucher (#/plan), which shows the program panels, including HASA, and the income pre-screen;
 * - the route is Resources (#/resources), which lists city and community help (housing, food, health, legal);
 * - any route path that mentions HASA (for example a #/blog/... or #/info/... slug with "hasa").
 */
export function isSensitiveView({ hashPath = '', assistantOpen = false } = {}) {
  if (assistantOpen) return true
  const path = String(hashPath).split('?')[0].toLowerCase()
  if (path === '/plan' || path === '/resources') return true
  return /hasa/.test(path)
}

/** Page fields with no query string, no listing or account details: origin + the hash route only. */
export function sanitizedPage(hashPath, origin = 'https://leasepath.app') {
  const path = String(hashPath || '/').split('?')[0].replace(/[^a-z0-9/_-]/gi, '') || '/'
  return { page_location: `${origin}/#${path}`, page_path: `/#${path}`, page_title: 'LeasePath' }
}

/** The only way anything enters dataLayer. Drops every key outside ALLOWED_KEYS. */
export function safePush(win, data) {
  const clean = {}
  for (const key of ALLOWED_KEYS) if (typeof data?.[key] === 'string') clean[key] = data[key]
  win.dataLayer = win.dataLayer || []
  win.dataLayer.push(clean)
  return clean
}

/** Injects GTM once, and only when consent is granted. Returns true when the script is on the page. */
export function loadGtm(win, doc, consent) {
  if (consent !== 'granted') return false
  if (win.__lpGtmLoaded) return true
  win.dataLayer = win.dataLayer || []
  win.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
  const script = doc.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
  doc.head.appendChild(script)
  win.__lpGtmLoaded = true
  return true
}

/**
 * Called on every route or Ruby change. With consent, on a non-sensitive view: set the sanitized page fields,
 * load GTM if it is not loaded yet, then push one page event. A sensitive view does nothing, and GTM is not
 * loaded while the person is on one.
 */
export function trackView(win, doc, { hashPath, assistantOpen, consent }) {
  if (consent !== 'granted') return null
  if (isSensitiveView({ hashPath, assistantOpen })) return null
  const page = sanitizedPage(hashPath, win.location?.origin)
  if (!win.__lpGtmLoaded) {
    safePush(win, page)
    loadGtm(win, doc, consent)
  }
  return safePush(win, { event: PAGE_EVENT, ...page })
}
