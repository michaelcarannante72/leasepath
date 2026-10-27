import { useEffect, useState } from 'react'
import { writeConsent } from '../analytics.js'
import { OPEN_ANALYTICS_CHOICE } from './AnalyticsConsent.jsx'
import { useLanguage } from './LanguageProvider.jsx'
import { COOKIE_CHOICE_KEY, consentSettled } from '../consent.js'

/**
 * One bottom bar for the cookie notice and the analytics choice (they used to stack as two cards).
 * Either answer also acknowledges the cookie notice. The footer "Analytics choice" link reopens it.
 */
export function ConsentBar({ onChange, onSettled }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(() => !consentSettled())
  useEffect(() => {
    const reopen = () => setOpen(true)
    window.addEventListener(OPEN_ANALYTICS_CHOICE, reopen)
    return () => window.removeEventListener(OPEN_ANALYTICS_CHOICE, reopen)
  }, [])
  if (!open) return null
  const choose = (value) => {
    try {
      localStorage.setItem(COOKIE_CHOICE_KEY, 'ok')
    } catch {
      // The bar can still close when this browser blocks storage.
    }
    writeConsent(value)
    onChange?.(value)
    setOpen(false)
    onSettled?.()
  }
  return (
    <aside className="cookie-prompt consent-bar" aria-labelledby="consent-title">
      <div className="consent-copy">
        <h2 id="consent-title">{t('consent.title')}</h2>
        <p>{t('consent.body')}</p>
        <p className="consent-links">
          <a href="/privacy">{t('consent.privacy')}</a> · <a href="#/info/cookies">{t('consent.details')}</a>
        </p>
      </div>
      <div className="cookie-actions consent-actions">
        <button type="button" className="button button-quiet" onClick={() => choose('denied')}>{t('consent.deny')}</button>
        <button type="button" className="button" onClick={() => choose('granted')}>{t('consent.allow')}</button>
      </div>
    </aside>
  )
}
