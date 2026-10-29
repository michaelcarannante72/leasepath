// Cloudflare Turnstile. Ruby's chat and the landlord listing form each ask for their own action, so a
// token minted for one cannot be replayed on the other; the Worker checks the action it gets back.
export const TURNSTILE_SITE_KEY = '0x4AAAAAAFjVfMwzZWi4LBAW'
export const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/** The action Ruby's chat has always used. The listing form passes 'landlord_listing'. */
export const CHAT_ACTION = 'ruby_chat'

let loading = null

export function loadTurnstile(win = window, doc = document) {
  if (win.turnstile) return Promise.resolve(win.turnstile)
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const script = doc.createElement('script')
    script.src = TURNSTILE_SCRIPT
    script.async = true
    script.onload = () => (win.turnstile ? resolve(win.turnstile) : reject(new Error('turnstile')))
    script.onerror = () => {
      loading = null
      script.remove()
      reject(new Error('turnstile'))
    }
    doc.head.appendChild(script)
  })
  return loading
}

function withTimeout(promise, ms, message) {
  let timer
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms)
    }),
  ]).finally(() => clearTimeout(timer))
}

/**
 * Runs the managed check and resolves to a token.
 * `action` is the string Cloudflare records and reports back on siteverify; `timeoutMs` bounds both
 * loading the script and waiting for the widget, so a blocked challenge fails in seconds rather than
 * leaving a form frozen. Callers that can proceed without a token should catch and continue.
 */
export async function getTurnstileToken({ timeoutMs = 60_000, action = CHAT_ACTION } = {}) {
  const turnstile = await withTimeout(loadTurnstile(), Math.min(timeoutMs, 8_000), 'turnstile load timeout')
  const holder = document.createElement('div')
  holder.className = 'turnstile-holder'
  holder.setAttribute('aria-live', 'polite')
  document.body.appendChild(holder)
  let widgetId
  try {
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('turnstile timeout')), timeoutMs)
      widgetId = turnstile.render(holder, {
        sitekey: TURNSTILE_SITE_KEY,
        action,
        appearance: 'interaction-only',
        callback: (token) => { clearTimeout(timer); resolve(token) },
        'error-callback': () => { clearTimeout(timer); reject(new Error('turnstile')) },
        'expired-callback': () => { clearTimeout(timer); reject(new Error('turnstile expired')) },
      })
    })
  } finally {
    try { if (widgetId !== undefined) turnstile.remove(widgetId) } catch { /* already gone */ }
    holder.remove()
  }
}

/** Best effort: resolves to '' instead of throwing, for forms that must not lose what was typed. */
export async function getTurnstileTokenOrEmpty(options = {}) {
  try {
    return (await getTurnstileToken(options)) || ''
  } catch {
    return ''
  }
}
