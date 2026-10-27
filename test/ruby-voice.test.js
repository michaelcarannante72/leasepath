import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  LISTENING_LABEL,
  MIC_LABEL,
  UNSUPPORTED_HINT,
  VOICE_PREF_KEY,
  readSpeakReplies,
  speak,
  speechSupport,
  startListening,
  stopSpeaking,
  writeSpeakReplies,
} from '../src/rubyVoice.js'
import { SECURITY_HEADERS, headersFile } from '../worker/security.js'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('speechSupport reports recognition and synthesis independently', () => {
  assert.deepEqual(speechSupport({}), { recognition: false, synthesis: false, any: false, Recognition: null })
  class FakeRec {}
  const withRec = speechSupport({ webkitSpeechRecognition: FakeRec })
  assert.equal(withRec.recognition, true)
  assert.equal(withRec.Recognition, FakeRec)
  assert.equal(withRec.synthesis, false)
  const withBoth = speechSupport({
    SpeechRecognition: FakeRec,
    speechSynthesis: { speak() {}, cancel() {} },
    SpeechSynthesisUtterance: function Utterance() {},
  })
  assert.equal(withBoth.any, true)
  assert.equal(withBoth.synthesis, true)
})

test('startListening returns null when unsupported and wires final transcripts when present', () => {
  assert.equal(startListening({ win: {} }), null)
  const calls = []
  class Rec {
    constructor() {
      this.interimResults = false
      this.continuous = false
      this.lang = ''
      this.maxAlternatives = 1
      this.onresult = null
      this.onerror = null
      this.onend = null
    }
    start() {
      calls.push('start')
      this.onresult?.({
        resultIndex: 0,
        results: [{ 0: { transcript: 'How do I qualify' }, isFinal: true, length: 1 }],
      })
      this.onend?.()
    }
    stop() { calls.push('stop') }
  }
  const finals = []
  const handle = startListening({
    win: { SpeechRecognition: Rec },
    onFinal: (t) => finals.push(t),
  })
  assert.ok(handle)
  assert.deepEqual(finals, ['How do I qualify'])
  handle.stop()
  assert.ok(calls.includes('stop'))
})

test('speak uses SpeechSynthesisUtterance and stopSpeaking cancels; no network APIs', () => {
  const spoken = []
  const cancelled = []
  function Utterance(text) {
    this.text = text
    this.lang = ''
    this.rate = 1
    this.onend = null
    this.onerror = null
  }
  const win = {
    SpeechSynthesisUtterance: Utterance,
    speechSynthesis: {
      cancel() { cancelled.push(1) },
      speak(u) { spoken.push(u.text); u.onend?.() },
    },
  }
  speak('  Hello   Ruby  ', { win })
  assert.deepEqual(spoken, ['Hello Ruby'])
  assert.ok(cancelled.length >= 1)
  stopSpeaking(win)
  assert.ok(cancelled.length >= 2)

  const src = read('src/rubyVoice.js') + read('src/components/AssistantSheet.jsx')
  assert.doesNotMatch(src, /MediaRecorder|getUserMedia|FormData|fetch\(|XMLHttpRequest|webkitURL\.createObjectURL/)
  assert.match(src, /never uploaded|not uploaded|stays on this device/i)
})

test('speak-replies preference stays on device under leasepath.rubyVoice.speakReplies', () => {
  const store = new Map()
  const storage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  }
  assert.equal(readSpeakReplies(storage), false)
  writeSpeakReplies(true, storage)
  assert.equal(store.get(VOICE_PREF_KEY), 'on')
  assert.equal(readSpeakReplies(storage), true)
  writeSpeakReplies(false, storage)
  assert.equal(store.get(VOICE_PREF_KEY), 'off')
})

test('AssistantSheet has a mic button, Resource Navigator label, and typed fallback', () => {
  const sheet = read('src/components/AssistantSheet.jsx')
  assert.match(sheet, /Resource Navigator/)
  assert.match(sheet, /Talk to Ruby|MIC_LABEL/)
  assert.match(sheet, /ruby-mic/)
  assert.match(sheet, /UNSUPPORTED_HINT/)
  assert.match(sheet, /Read Ruby/)
  assert.match(sheet, /Audio is not uploaded or stored/)
  assert.ok(sheet.includes(LISTENING_LABEL) || sheet.includes('LISTENING_LABEL'))
  assert.ok(MIC_LABEL)
  assert.match(UNSUPPORTED_HINT, /Type your question/)
  assert.match(read('src/components/Icon.jsx'), /mic:/)
})

test('Permissions-Policy allows same-origin mic for voice and keeps camera off; _headers stays in sync', () => {
  assert.match(SECURITY_HEADERS['permissions-policy'], /microphone=\(self\)/)
  assert.match(SECURITY_HEADERS['permissions-policy'], /camera=\(\)/)
  assert.equal(readFileSync(new URL('../public/_headers', import.meta.url), 'utf8'), headersFile())
})
