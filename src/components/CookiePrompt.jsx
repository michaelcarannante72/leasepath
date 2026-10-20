import { useState } from 'react'

const CHOICE_KEY = 'leasepath.cookies'

export function CookiePrompt() {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(CHOICE_KEY) !== 'ok'
    } catch {
      return true
    }
  })
  if (!open) return null

  const accept = () => {
    try {
      localStorage.setItem(CHOICE_KEY, 'ok')
    } catch {
      // The prompt can still close when this browser blocks storage.
    }
    setOpen(false)
  }

  return (
    <aside className="cookie-prompt" aria-labelledby="cookie-title">
      <div>
        <h2 id="cookie-title">Cookies on this phone</h2>
        <p>LeasePath uses cookies to keep you signed in, to protect Google sign-in, and to count free questions to Ruby. They are not used to sell information. OK only hides this reminder.</p>
      </div>
      <div className="cookie-actions">
        <a href="/privacy">Privacy notice</a>
        <a href="#/info/cookies">Cookie details</a>
        <button type="button" className="button" onClick={accept}>OK</button>
      </div>
    </aside>
  )
}
