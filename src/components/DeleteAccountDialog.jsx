import { tx } from '../i18nAuto.js'
import { useEffect, useRef, useState } from 'react'
import { CONFIRM_WORD, confirmMatches } from '../deviceData.js'

export function DeleteAccountDialog({ open, signedIn, onCancel, onConfirm, onDone }) {
  const [text, setText] = useState('')
  const [state, setState] = useState('ask')
  const [error, setError] = useState('')
  const input = useRef(null)

  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])

  if (!open) return null
  const ready = confirmMatches(text) && state !== 'working'

  const submit = async (event) => {
    event.preventDefault()
    if (!ready) return
    setState('working')
    setError('')
    const result = await onConfirm()
    if (result?.ok) setState('done')
    else {
      setState('ask')
      setError(result?.message || 'Your account could not be deleted, so your saved details on this phone were kept. Try again.')
    }
  }

  return (
    <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && state !== 'working') onCancel() }}>
      <section className="sheet delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-what">
        {state === 'done' ? (
          <>
            <h2 id="delete-title">{tx("Your data is deleted")}</h2>
            <p id="delete-what">{tx("You are signed out. LeasePath data on this phone is cleared. Your case with HRA, HASA, NYCHA, or HPD is not affected.")}</p>
            <button type="button" className="button" onClick={onDone}>{tx("Done")}</button>
          </>
        ) : (
          <form onSubmit={submit}>
            <h2 id="delete-title">{signedIn ? 'Delete my account' : 'Delete my data on this phone'}</h2>
            <div id="delete-what">
              <p>{tx("This erases, for good:")}</p>
              <ul>
                {signedIn && <li>{tx("Your LeasePath account: email, password, and everything saved to it")}</li>}
                <li>{tx("Your voucher program, voucher amount, household size, and utilities")}</li>
                <li>{tx("Income you typed in the pre-screen")}</li>
                <li>{tx("Saved apartments, checked steps, and settings on this phone")}</li>
              </ul>
              <p>{tx("It does not close or change your case with HRA, HASA, NYCHA, or HPD.")}</p>
            </div>
            <label className="delete-confirm">
              <span>{tx("Type")} <strong>{CONFIRM_WORD}</strong> {tx("to confirm")}</span>
              <input
                ref={input}
                value={text}
                onChange={(event) => setText(event.target.value)}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck="false"
                aria-label={`Type ${CONFIRM_WORD} to confirm`}
              />
            </label>
            {error && <p className="delete-error" role="status">{error}</p>}
            <div className="delete-actions">
              <button type="button" className="button button-quiet" onClick={onCancel} disabled={state === 'working'}>{tx("Cancel")}</button>
              <button type="submit" className="button delete-go" disabled={!ready}>
                {state === 'working' ? 'Deleting…' : 'Delete for good'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
