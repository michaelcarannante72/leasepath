import { useEffect, useMemo, useState } from 'react'
import { VOUCHER_PROGRAMS } from '../fit.js'
import {
  PRIVACY_NOTE,
  SHOPPING_LETTER_DAYS_BY_PROGRAM,
  buildDeadlineIcs,
  checklistProgress,
  clearDocs,
  downloadIcs,
  loadDocs,
  requestLocalReminder,
  saveDocs,
  suggestLetterExpiry,
} from '../docsTracker.js'
import { Icon } from './Icon.jsx'

export function DocsDeadlinePage() {
  const [state, setState] = useState(() => loadDocs())
  const [status, setStatus] = useState('')
  const { docs, done, total } = useMemo(() => checklistProgress(state), [state])

  useEffect(() => {
    saveDocs(state)
  }, [state])

  const setProgram = (program) => {
    setState((current) => ({
      ...current,
      program,
      // Keep checks that still apply; drop unknown ids quietly.
      checked: current.checked,
      deadlines: {
        ...current.deadlines,
        letterExpires:
          current.deadlines.letterExpires ||
          suggestLetterExpiry(program, current.deadlines.letterIssued) ||
          current.deadlines.letterExpires,
      },
    }))
  }

  const toggleDoc = (id) => {
    setState((current) => ({
      ...current,
      checked: { ...current.checked, [id]: !current.checked[id] },
    }))
  }

  const setDeadline = (key, value) => {
    setState((current) => {
      const deadlines = { ...current.deadlines, [key]: value }
      if (key === 'letterIssued' && current.program) {
        const suggested = suggestLetterExpiry(current.program, value)
        if (suggested && (!current.deadlines.letterExpires || current.deadlines.letterExpires === suggestLetterExpiry(current.program, current.deadlines.letterIssued))) {
          deadlines.letterExpires = suggested
        } else if (suggested && !current.deadlines.letterExpires) {
          deadlines.letterExpires = suggested
        }
      }
      return { ...current, deadlines }
    })
  }

  const onExportIcs = () => {
    const ics = buildDeadlineIcs(state)
    if (!ics) {
      setStatus('Add at least one deadline date first.')
      return
    }
    downloadIcs(ics)
    setStatus('Calendar file downloaded. Open it to add reminders on this phone.')
  }

  const onRemind = async () => {
    const targets = [
      ['letterExpires', 'Shopping letter may expire today', 'Check your shopping letter date with your worker.'],
      ['inspection', 'Apartment inspection today', 'Walk the unit. Confirm with the landlord and your worker.'],
      ['leaseSigning', 'Lease signing today', 'Bring your documents. Confirm with your worker.'],
    ]
    let any = false
    for (const [key, title, body] of targets) {
      if (!state.deadlines[key]) continue
      const result = await requestLocalReminder(title, state.deadlines[key], body)
      if (result.ok) any = true
    }
    if (!any) {
      setStatus('Turn on notifications for this site, or export a calendar file instead. Reminders stay on this phone.')
      return
    }
    setStatus('Reminder set on this phone when the browser allows it. Export a calendar file for a lasting alert.')
  }

  const onDeleteAll = () => {
    const ok = typeof window === 'undefined' || window.confirm('Delete the checklist and all deadline dates on this phone? This cannot be undone.')
    if (!ok) return
    clearDocs()
    setState(loadDocs())
    setStatus('Cleared. Nothing left on this phone for this page.')
  }

  const letterDays = SHOPPING_LETTER_DAYS_BY_PROGRAM[state.program] || 0

  return (
    <div className="page docs-page">
      <p className="eyebrow">Steps</p>
      <h1>Documents and deadlines</h1>
      <p className="lede">
        Checklist for your shopping packet, plus dates for the letter, inspection, and lease signing.
        You may qualify for help from your worker — this page does not decide that.
      </p>
      <aside className="docs-privacy" role="note">
        <p>{PRIVACY_NOTE}</p>
      </aside>

      <section className="panel" aria-labelledby="docs-program">
        <h2 id="docs-program">Your voucher</h2>
        <label className="docs-field">
          <span>Program</span>
          <select
            value={state.program}
            onChange={(event) => setProgram(event.target.value)}
            aria-label="Voucher program"
          >
            <option value="">Pick a program</option>
            {VOUCHER_PROGRAMS.map((program) => (
              <option key={program} value={program}>{program}</option>
            ))}
          </select>
        </label>
        {letterDays > 0 && (
          <p className="fine">
            {state.program} shopping letters are often good for {letterDays} days from the issue date (confirm on your letter and with DSS/HRA or your worker).
          </p>
        )}
      </section>

      <section className="panel docs-checklist" aria-labelledby="docs-check">
        <h2 id="docs-check">Document checklist</h2>
        <p className="fine">{done} of {total} ready. Check items as you gather them — checks stay on this phone.</p>
        <ul className="docs-check-items">
          {docs.map((doc) => {
            const on = !!state.checked[doc.id]
            return (
              <li key={doc.id}>
                <label className={on ? 'docs-check is-on' : 'docs-check'}>
                  <input type="checkbox" checked={on} onChange={() => toggleDoc(doc.id)} />
                  <span className="docs-check-mark" aria-hidden="true">{on ? <Icon name="check" size={16} /> : null}</span>
                  <span>{doc.label}</span>
                </label>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="panel" aria-labelledby="docs-deadlines">
        <h2 id="docs-deadlines">Deadline tracker</h2>
        <div className="docs-deadline-grid">
          <label className="docs-field">
            <span>Shopping letter issue date</span>
            <input type="date" value={state.deadlines.letterIssued} onChange={(event) => setDeadline('letterIssued', event.target.value)} />
          </label>
          <label className="docs-field">
            <span>Shopping letter expires</span>
            <input type="date" value={state.deadlines.letterExpires} onChange={(event) => setDeadline('letterExpires', event.target.value)} />
          </label>
          <label className="docs-field">
            <span>Inspection / walkthrough</span>
            <input type="date" value={state.deadlines.inspection} onChange={(event) => setDeadline('inspection', event.target.value)} />
          </label>
          <label className="docs-field">
            <span>Lease signing</span>
            <input type="date" value={state.deadlines.leaseSigning} onChange={(event) => setDeadline('leaseSigning', event.target.value)} />
          </label>
        </div>
        <div className="docs-actions">
          <button type="button" className="button" onClick={onExportIcs}>Export calendar (.ics)</button>
          <button type="button" className="button button-quiet" onClick={onRemind}>Remind me on this phone</button>
        </div>
        <p className="fine">Calendar export works offline. Local notifications only fire while this browser still has the page’s timer — use .ics for a lasting reminder.</p>
      </section>

      <section className="panel" aria-labelledby="docs-notes">
        <h2 id="docs-notes">Notes for you</h2>
        <label className="docs-field">
          <span className="visually-hidden">Private notes</span>
          <textarea
            rows={3}
            value={state.notes}
            onChange={(event) => setState((current) => ({ ...current, notes: event.target.value.slice(0, 2000) }))}
            placeholder="Caseworker name, appointment times — stays on this phone"
          />
        </label>
      </section>

      <div className="docs-footer-actions">
        <button type="button" className="button button-quiet docs-delete" onClick={onDeleteAll}>Delete all on this phone</button>
        <a className="button button-quiet" href="#/steps">Back to Steps</a>
        <a className="button button-quiet" href="#/caseworker-pack">Caseworker pack</a>
      </div>
      {status ? <p className="docs-status" role="status">{status}</p> : null}
    </div>
  )
}
