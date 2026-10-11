import { useEffect, useRef, useState } from 'react'
import { FREE_COACH_QUESTIONS } from '../coachLimit.js'
import { Icon } from './Icon.jsx'
import { loadGoogleSignIn } from '../googleSignIn.js'

function finePrint(configured, access) {
  if (configured === false) return 'No API key on this server yet. Search and resources still work.'
  if (access?.signedIn) {
    return Number.isInteger(access.accountRemaining)
      ? `${access.accountRemaining} coach questions left today on this account. Leave out case numbers and medical details.`
      : 'Leave out case numbers and medical details.'
  }
  if (Number.isInteger(access?.anonymousRemaining)) {
    const left = access.anonymousRemaining
    const noun = left === 1 ? 'question' : 'questions'
    return `${left} free ${noun} left on this browser, then a Google account. Leave out case numbers and medical details.`
  }
  return `${FREE_COACH_QUESTIONS} questions are free on this browser, then a Google account. Leave out case numbers and medical details.`
}

const SUGGESTIONS = [
  'How do I qualify for a voucher?',
  'What should I ask a broker?',
  'What food help can I get?',
  'A landlord refused my voucher. What now?',
]

export function AssistantSheet({
  messages,
  pending,
  input,
  includePlan,
  configured,
  access,
  onInput,
  onIncludePlan,
  onSend,
  onClose,
  onGoogleCredential,
  onSignOut,
  onOpenResources,
}) {
  const closeButton = useRef(null)
  const thread = useRef(null)
  const googleButton = useRef(null)
  const [googleError, setGoogleError] = useState('')

  const locked = Boolean(access && !access.signedIn && access.anonymousRemaining <= 0)
  const paused = Boolean(access?.loaded && access.secretReady === false)

  useEffect(() => {
    closeButton.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const node = thread.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages, pending, locked])

  useEffect(() => {
    const node = googleButton.current
    if (!locked || !access?.googleClientId || !node) return undefined
    let cancel = false
    setGoogleError('')
    loadGoogleSignIn()
      .then(() => {
        if (cancel || !googleButton.current || !window.google?.accounts?.id) return
        googleButton.current.replaceChildren()
        window.google.accounts.id.initialize({
          client_id: access.googleClientId,
          callback: (response) => onGoogleCredential(response?.credential || ''),
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
        })
        window.google.accounts.id.renderButton(googleButton.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 280,
        })
      })
      .catch(() => {
        if (!cancel) setGoogleError('Google’s sign-in button did not load. Check your connection and try again.')
      })
    return () => {
      cancel = true
    }
  }, [locked, access?.googleClientId, onGoogleCredential])

  return (
    <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="assistant-title">
        <header className="sheet-head">
          <div>
            <p className="eyebrow">Coach</p>
            <h2 id="assistant-title">Short answers on vouchers</h2>
          </div>
          <button ref={closeButton} type="button" className="icon-button" aria-label="Close assistant" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="thread" ref={thread} aria-live="polite">
          {messages.map((message, index) => (
            <p key={`${message.role}-${index}`} className={`bubble bubble-${message.role}`}>{message.content}</p>
          ))}
          {pending && <p className="bubble bubble-assistant pending">Checking that…</p>}
        </div>
        {paused ? (
          <div className="gate">
            <h3>The coach is paused</h3>
            <p>Questions stay off until accounts are set up. Search and resources stay open.</p>
            <button type="button" className="button button-quiet" onClick={onOpenResources}>See resources</button>
          </div>
        ) : locked ? (
          <div className="gate">
            <h3>Sign in to ask another question</h3>
            <p>{FREE_COACH_QUESTIONS} questions are free on this browser. Sign in with Google to ask more. Search and resources stay open.</p>
            {access.googleClientId ? <div className="google-button" ref={googleButton} /> : (
              <p>This server does not have a Google client id yet, so the button cannot load.</p>
            )}
            {googleError && <p className="fine">{googleError}</p>}
            {access.signInError && <p className="fine">{access.signInError}</p>}
            <button type="button" className="button button-quiet" onClick={onOpenResources} disabled={access.signingIn}>See resources</button>
          </div>
        ) : (
          <>
            <div className="suggestions">
              {SUGGESTIONS.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => onSend(suggestion)} disabled={pending}>
                  {suggestion}
                </button>
              ))}
            </div>
            <form
              className="composer"
              onSubmit={(event) => {
                event.preventDefault()
                onSend(input)
              }}
            >
              {access?.signedIn && (
                <p className="session-line">
                  <span>Signed in as {access.email}</span>
                  <button type="button" className="text-button" onClick={onSignOut}>Sign out</button>
                </p>
              )}
              <label className="check-line">
                <input type="checkbox" checked={includePlan} onChange={(event) => onIncludePlan(event.target.checked)} />
                Include the amount on my letter
              </label>
              <div className="composer-row">
                <textarea
                  value={input}
                  onChange={(event) => onInput(event.target.value)}
                  placeholder="Ask about a voucher"
                  rows={3}
                  aria-label="Question for the LeasePath assistant"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      onSend(input)
                    }
                  }}
                />
                <button type="submit" className="button" disabled={pending || !input.trim()}>Send</button>
              </div>
              <p className="fine">{finePrint(configured, access)}</p>
            </form>
          </>
        )}
      </section>
    </div>
  )
}
