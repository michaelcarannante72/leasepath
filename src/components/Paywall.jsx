import { useEffect, useRef } from 'react'
import { FREE_COACH_QUESTIONS } from '../coachLimit.js'
import { PREMIUM_FEATURES } from '../premium.js'
import { Icon } from './Icon.jsx'

export function Paywall({ feature, onClose }) {
  const closeButton = useRef(null)
  const item = PREMIUM_FEATURES[feature] || PREMIUM_FEATURES.drafts

  useEffect(() => {
    closeButton.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-backdrop modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="setup-modal" role="dialog" aria-modal="true" aria-labelledby="paywall-title">
        <button ref={closeButton} type="button" className="icon-button modal-close" aria-label="Close" onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
        <p className="eyebrow">Paid</p>
        <h2 id="paywall-title">{item.title}</h2>
        <p className="setup-intro">{item.detail}</p>
        <p className="setup-intro">Search, resources, the pantry finder, the steps, and the letter comparison stay free. {FREE_COACH_QUESTIONS} coach questions are free on this browser, then a Google account. This screen does not take payment.</p>
        <button type="button" className="button" onClick={onClose}>Back to the listing</button>
      </section>
    </div>
  )
}
