// Cloudflare Turnstile for Ruby's chat. Loaded only when the server asks for a check (403 challenge_required),
// then the Worker sets a short-lived signed cookie so later questions are not challenged.
export const TURNSTILE_SITE_KEY = '0x4AAAAAAFjVfMwzZWi4LBAW'
export const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

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

/** Runs the managed check. Usually invisible; shows a small box only if Cloudflare needs an interaction. */
export async function getTurnstileToken({ timeoutMs = 60_000 } = {}) {
  const turnstile = await loadTurnstile()
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
        action: 'ruby_chat',
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
