import { useEffect, useId, useRef } from 'react'
import { Icon } from './Icon.jsx'

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

/**
 * First-visit introduction to Ruby. Shown once (localStorage flag set by the parent),
 * dismissible with Esc / backdrop / Maybe later, and re-openable when chat is empty.
 */
export function RubyIntro({ open, onTalk, onLater }) {
  const titleId = useId()
  const descId = useId()
  const dialogRef = useRef(null)
  const primaryRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    previouslyFocused.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const node = dialogRef.current
    const focusFirst = () => primaryRef.current?.focus()
    const frame = requestAnimationFrame(focusFirst)

    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onLater()
        return
      }
      if (event.key !== 'Tab' || !node) return
      const list = [...node.querySelectorAll(FOCUSABLE)].filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)
      if (list.length === 0) return
      const first = list[0]
      const last = list[list.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      const restore = previouslyFocused.current
      if (restore && typeof restore.focus === 'function') restore.focus()
    }
  }, [open, onLater])

  if (!open) return null

  return (
    <div
      className="sheet-backdrop modal-backdrop ruby-intro-backdrop"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onLater() }}
    >
      <section
        ref={dialogRef}
        className="ruby-intro ruby-theme"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <div className="ruby-intro-sparkle" aria-hidden="true" />
        <div className="ruby-intro-avatar" aria-hidden="true">
          <Icon name="spark" size={36} />
        </div>
        <p className="eyebrow">Resource Navigator</p>
        <h2 id={titleId}>Meet Ruby</h2>
        <p id={descId} className="ruby-intro-body">
          Ruby is LeasePath’s Resource Navigator and voucher specialist. She helps voucher holders through the NYC rental search — shelter, SRO, HRA bureaucracy, documents for a landlord, broker, or caseworker, and deadlines.
        </p>
        <p className="ruby-intro-persona">
          A spunky, straightforward Dominican woman in her 40s who takes no BS. Short answers. No runaround.
        </p>
        <div className="ruby-intro-actions">
          <button ref={primaryRef} type="button" className="button ruby-send" onClick={onTalk}>Talk to Ruby</button>
          <button type="button" className="button button-quiet" onClick={onLater}>Maybe later</button>
        </div>
      </section>
    </div>
  )
}
