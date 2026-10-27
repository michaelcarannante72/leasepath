import { useEffect, useRef, useState } from 'react'
import { FREE_COACH_QUESTIONS } from '../coachLimit.js'
import {
  LISTENING_LABEL,
  MIC_LABEL,
  MIC_STOP_LABEL,
  UNSUPPORTED_HINT,
  readSpeakReplies,
  speechSupport,
  speak,
  startListening,
  stopSpeaking,
  writeSpeakReplies,
} from '../rubyVoice.js'
import { GoogleSignInButton } from './GoogleSignInButton.jsx'
import { Icon } from './Icon.jsx'

function finePrint(configured, access) {
  if (configured === false) return 'No API key on this server yet. Search and resources still work.'
  if (access?.signedIn) {
    return Number.isInteger(access.accountRemaining)
      ? `${access.accountRemaining} questions for Ruby left today on this account. Leave out case numbers and medical details.`
      : 'Leave out case numbers and medical details.'
  }
  if (Number.isInteger(access?.anonymousRemaining)) {
    const left = access.anonymousRemaining
    const noun = left === 1 ? 'question' : 'questions'
    return `${left} free ${noun} left on this browser, then a Google account. Leave out case numbers and medical details.`
  }
  return `${FREE_COACH_QUESTIONS} questions are free on this browser, then a Google account. Leave out case numbers and medical details.`
}

/** Quick replies to Ruby's opening question, shown until the person sends something. */
const LETTER_REPLIES = [
  { label: 'Yes', text: 'Yes, my caseworker gave me a shopping letter.' },
  { label: 'Not yet', text: 'Not yet. My caseworker has not given me a shopping letter.' },
]

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
  onOpenResources,
}) {
  const closeButton = useRef(null)
  const sheet = useRef(null)
  const thread = useRef(null)
  const listenHandle = useRef(null)
  const cancelSpeak = useRef(null)
  const spokenCount = useRef(0)
  const support = speechSupport(typeof window !== 'undefined' ? window : undefined)
  const [listening, setListening] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const [speakReplies, setSpeakReplies] = useState(() => readSpeakReplies())

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

  // Keep the composer above the iOS keyboard: size the sheet to the visible viewport.
  useEffect(() => {
    const viewport = typeof window !== 'undefined' ? window.visualViewport : null
    const node = sheet.current
    if (!viewport || !node) return undefined
    const fit = () => {
      node.style.setProperty('--ruby-vh', `${Math.round(viewport.height)}px`)
      node.style.setProperty('--ruby-top', `${Math.round(viewport.offsetTop)}px`)
    }
    fit()
    viewport.addEventListener('resize', fit)
    viewport.addEventListener('scroll', fit)
    return () => {
      viewport.removeEventListener('resize', fit)
      viewport.removeEventListener('scroll', fit)
    }
  }, [])

  useEffect(() => {
    const node = thread.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages, pending, locked])

  // Stop mic and speech when the sheet closes.
  useEffect(() => () => {
    listenHandle.current?.stop()
    listenHandle.current = null
    cancelSpeak.current?.()
    cancelSpeak.current = null
    stopSpeaking()
  }, [])

  // Read new assistant replies aloud when the person opted in. Welcome stays silent.
  useEffect(() => {
    if (!speakReplies || !support.synthesis || pending) return undefined
    const assistants = messages.filter((m) => m.role === 'assistant' && !m.local)
    if (assistants.length <= spokenCount.current) return undefined
    const latest = assistants[assistants.length - 1]
    spokenCount.current = assistants.length
    cancelSpeak.current?.()
    cancelSpeak.current = speak(latest.content)
    return undefined
  }, [messages, pending, speakReplies, support.synthesis])

  const setSpeakPref = (on) => {
    setSpeakReplies(on)
    writeSpeakReplies(on)
    if (!on) {
      cancelSpeak.current?.()
      cancelSpeak.current = null
      stopSpeaking()
    }
  }

  const stopMic = () => {
    listenHandle.current?.stop()
    listenHandle.current = null
    setListening(false)
  }

  const toggleMic = () => {
    setVoiceError('')
    if (!support.recognition) {
      setVoiceError(UNSUPPORTED_HINT)
      return
    }
    if (listening) {
      stopMic()
      return
    }
    stopSpeaking()
    const handle = startListening({
      onPartial: (text) => onInput(text),
      onFinal: (text) => {
        if (text) onInput(text)
      },
      onError: (code) => {
        setVoiceError(typeof code === 'string' ? `Mic: ${code}. You can still type.` : 'Mic failed. You can still type.')
        setListening(false)
        listenHandle.current = null
      },
      onEnd: () => {
        setListening(false)
        listenHandle.current = null
      },
    })
    if (!handle) {
      setVoiceError(UNSUPPORTED_HINT)
      return
    }
    listenHandle.current = handle
    setListening(true)
  }

  return (
    <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section ref={sheet} className="sheet ruby-theme" role="dialog" aria-modal="true" aria-labelledby="assistant-title">
        <header className="sheet-head">
          <div>
            <p className="eyebrow">Resource Navigator</p>
            <h2 id="assistant-title">Ask Ruby</h2>
            <p className="sheet-sub">Short, straight answers on vouchers. Ruby is an AI assistant. Not affiliated with HRA, NYCHA, or any government agency.</p>
          </div>
          <button ref={closeButton} type="button" className="icon-button" aria-label="Close Ruby" onClick={onClose}>
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
            <h3>Ruby is paused</h3>
            <p>Questions stay off until accounts are set up. Search and resources stay open.</p>
            <button type="button" className="button button-quiet" onClick={onOpenResources}>See resources</button>
          </div>
        ) : locked ? (
          <div className="gate">
            <h3>Sign in to ask another question</h3>
            <p>{FREE_COACH_QUESTIONS} questions are free on this browser. Sign in with Google to ask more. Search and resources stay open.</p>
            <GoogleSignInButton clientId={access.googleClientId} nonce={access.googleNonce} onCredential={onGoogleCredential} active={locked} />
            {access.signInError && <p className="fine">{access.signInError}</p>}
            <button type="button" className="button button-quiet" onClick={onOpenResources} disabled={access.signingIn}>See resources</button>
          </div>
        ) : (
          <>
            <div className="suggestions">
              {messages.length === 1 && LETTER_REPLIES.map((reply) => (
                <button key={reply.label} type="button" className="letter-reply" onClick={() => onSend(reply.text)} disabled={pending}>
                  {reply.label}
                </button>
              ))}
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
                stopMic()
                onSend(input)
              }}
            >
              {access?.signedIn && (
                <p className="session-line">Signed in as {access.email}</p>
              )}
              <label className="check-line">
                <input type="checkbox" role="switch" aria-checked={includePlan} checked={includePlan} onChange={(event) => onIncludePlan(event.target.checked)} />
                <span>
                  Share my voucher details with Ruby
                  <small className="share-detail">{includePlan ? 'On: program, household size, letter amount and utilities are sent with your questions.' : 'Off: nothing about your voucher leaves this phone.'}</small>
                </span>
              </label>
              {support.synthesis && (
                <label className="check-line">
                  <input type="checkbox" role="switch" aria-checked={speakReplies} checked={speakReplies} onChange={(event) => setSpeakPref(event.target.checked)} />
                  <span>
                    Read Ruby’s replies aloud
                    <small className="share-detail">Uses this phone’s speaker. Audio is not uploaded or stored.</small>
                  </span>
                </label>
              )}
              <div className="composer-row composer-row-voice">
                <textarea
                  value={input}
                  onChange={(event) => onInput(event.target.value)}
                  placeholder={listening ? LISTENING_LABEL : 'Ask Ruby about a voucher'}
                  rows={3}
                  maxLength={2000}
                  aria-label="Question for Ruby"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      stopMic()
                      onSend(input)
                    }
                  }}
                />
                <div className="composer-actions">
                  <button
                    type="button"
                    className={listening ? 'button ruby-mic is-listening' : 'button ruby-mic'}
                    aria-pressed={listening}
                    aria-label={support.recognition ? (listening ? MIC_STOP_LABEL : MIC_LABEL) : 'Voice not supported in this browser'}
                    title={support.recognition ? (listening ? MIC_STOP_LABEL : MIC_LABEL) : UNSUPPORTED_HINT}
                    onClick={toggleMic}
                    disabled={pending}
                  >
                    <Icon name="mic" size={18} />
                    <span className="ruby-mic-label">{listening ? 'Stop' : 'Mic'}</span>
                  </button>
                  <button type="submit" className="button ruby-send" disabled={pending || !input.trim()}>Send</button>
                </div>
              </div>
              {listening && <p className="voice-status" role="status">{LISTENING_LABEL}</p>}
              {voiceError && <p className="voice-fallback" role="status">{voiceError}</p>}
              {!support.recognition && !voiceError && (
                <p className="voice-fallback" role="status">{UNSUPPORTED_HINT}</p>
              )}
              <p className="fine">{finePrint(configured, access)} Voice stays on this device when available.</p>
            </form>
          </>
        )}
      </section>
    </div>
  )
}
