/**
 * On-device voice for Ruby via the browser Web Speech API.
 * Speech recognition and synthesis run in the browser. Audio is never uploaded,
 * recorded to disk, or sent to LeasePath servers. Prefer SpeechRecognition /
 * webkitSpeechRecognition when present; otherwise callers show a typed fallback.
 */

export const VOICE_PREF_KEY = 'leasepath.rubyVoice.speakReplies'

/** Detect what this browser can do. Safe to call on the server (returns all false). */
export function speechSupport(win = typeof globalThis !== 'undefined' ? globalThis : undefined) {
  const w = win || {}
  const Recognition = w.SpeechRecognition || w.webkitSpeechRecognition || null
  const synthesis = Boolean(w.speechSynthesis && typeof w.SpeechSynthesisUtterance === 'function')
  return {
    recognition: Boolean(Recognition),
    synthesis,
    any: Boolean(Recognition) || synthesis,
    Recognition,
  }
}

export function readSpeakReplies(storage) {
  try {
    const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null)
    return store?.getItem(VOICE_PREF_KEY) === 'on'
  } catch {
    return false
  }
}

export function writeSpeakReplies(on, storage) {
  try {
    const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null)
    if (!store) return
    store.setItem(VOICE_PREF_KEY, on ? 'on' : 'off')
  } catch {
    // Private mode or blocked storage: preference stays in memory only.
  }
}

/**
 * Start a one-shot recognition session. Returns { stop } or null if unsupported.
 * Transcripts stay in the page; nothing is POSTed.
 */
export function startListening({
  win = typeof globalThis !== 'undefined' ? globalThis : undefined,
  lang = 'en-US',
  onPartial,
  onFinal,
  onError,
  onEnd,
} = {}) {
  const { Recognition } = speechSupport(win)
  if (!Recognition) return null
  let recognition
  try {
    recognition = new Recognition()
  } catch (error) {
    onError?.(error)
    return null
  }
  recognition.lang = lang
  recognition.interimResults = true
  recognition.continuous = false
  recognition.maxAlternatives = 1

  recognition.onresult = (event) => {
    let interim = ''
    let finalText = ''
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i]
      const piece = result?.[0]?.transcript || ''
      if (result.isFinal) finalText += piece
      else interim += piece
    }
    if (interim) onPartial?.(interim)
    if (finalText) onFinal?.(finalText.trim())
  }
  recognition.onerror = (event) => {
    // "aborted" / "no-speech" are normal end states, not hard failures.
    const code = event?.error || 'error'
    if (code !== 'aborted' && code !== 'no-speech') onError?.(code)
  }
  recognition.onend = () => onEnd?.()

  try {
    recognition.start()
  } catch (error) {
    onError?.(error)
    return null
  }

  return {
    stop() {
      try {
        recognition.stop()
      } catch {
        // Already stopped.
      }
    },
  }
}

/** Speak text with the browser synthesizer. Returns a cancel function. */
export function speak(text, {
  win = typeof globalThis !== 'undefined' ? globalThis : undefined,
  lang = 'en-US',
  rate = 1,
  onEnd,
  onError,
} = {}) {
  const w = win || {}
  if (!w.speechSynthesis || typeof w.SpeechSynthesisUtterance !== 'function') {
    onError?.('unsupported')
    return () => {}
  }
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim()
  if (!cleaned) {
    onEnd?.()
    return () => {}
  }
  try {
    w.speechSynthesis.cancel()
  } catch {
    // ignore
  }
  const utter = new w.SpeechSynthesisUtterance(cleaned)
  utter.lang = lang
  utter.rate = rate
  utter.onend = () => onEnd?.()
  utter.onerror = () => onError?.('speak-failed')
  w.speechSynthesis.speak(utter)
  return () => {
    try {
      w.speechSynthesis.cancel()
    } catch {
      // ignore
    }
  }
}

export function stopSpeaking(win = typeof globalThis !== 'undefined' ? globalThis : undefined) {
  try {
    win?.speechSynthesis?.cancel()
  } catch {
    // ignore
  }
}

export const UNSUPPORTED_HINT =
  'Voice is not available in this browser. Type your question instead. When voice works, it stays on this device — nothing is uploaded.'

export const LISTENING_LABEL = 'Listening… tap to stop'
export const MIC_LABEL = 'Talk to Ruby'
export const MIC_STOP_LABEL = 'Stop listening'
