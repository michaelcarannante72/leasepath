import { tx } from '../i18nAuto.js'
import { useEffect, useRef } from 'react'

/**
 * One place a form error shows up. It sits right above the submit button (sticky, so it stays on screen),
 * and when a message appears it is scrolled into view and focused, so a phone user pressing Submit sees
 * why nothing happened instead of a button that looks dead.
 */
export function FormError({ message }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!message || !ref.current) return
    const node = ref.current
    node.focus({ preventScroll: true })
    if (typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [message])

  if (!message) return null
  return (
    <div className="form-error form-error-sticky" role="alert" tabIndex={-1} ref={ref}>
      <strong>{tx("That did not save yet")}</strong>
      <span>{message}</span>
    </div>
  )
}

/** A quiet line under the button: the form is working on something. */
export function FormStatus({ message }) {
  return (
    <p className="fine list-unit-status" aria-live="polite" role="status">
      {message}
    </p>
  )
}
