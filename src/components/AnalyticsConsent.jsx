import { tx } from '../i18nAuto.js'
import { useEffect, useState } from 'react'
import { readConsent, writeConsent } from '../analytics.js'

export const OPEN_ANALYTICS_CHOICE = 'leasepath:analytics-choice'

/** Plain Allow / No thanks banner. Shown until a choice is stored; the footer link opens it again. */
export function AnalyticsConsent({ onChange }) {
  const [open, setOpen] = useState(() => readConsent() === null)
  useEffect(() => {
    const reopen = () => setOpen(true)
    window.addEventListener(OPEN_ANALYTICS_CHOICE, reopen)
    return () => window.removeEventListener(OPEN_ANALYTICS_CHOICE, reopen)
  }, [])
  if (!open) return null
  const choose = (value) => {
    writeConsent(value)
    onChange(value)
    setOpen(false)
  }
  return (
    <aside className="cookie-prompt analytics-consent" aria-labelledby="analytics-title">
      <div>
        <h2 id="analytics-title">{tx("Help improve LeasePath?")}</h2>
        <p>{tx("Allow Google Analytics to count which pages are opened. It never runs on HASA pages or in Ruby’s chat, and never sees your voucher, income, or questions.")}</p>
      </div>
      <div className="cookie-actions">
        <button type="button" className="button button-quiet" onClick={() => choose('denied')}>{tx("No thanks")}</button>
        <button type="button" className="button" onClick={() => choose('granted')}>{tx("Allow")}</button>
      </div>
    </aside>
  )
}
