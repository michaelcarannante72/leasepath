import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')
const intro = read('src/components/RubyIntro.jsx')
const app = read('src/App.jsx')
const css = read('src/index.css')
const dock = read('src/components/Dock.jsx')

test('Ruby intro: dialog semantics, Esc/backdrop dismiss, Talk and Maybe later, focus trap', () => {
  const i18n = read('src/i18n.js')
  assert.match(intro, /role="dialog"/)
  assert.match(intro, /aria-modal="true"/)
  assert.match(intro, /aria-labelledby=/)
  assert.match(intro, /aria-describedby=/)
  assert.match(intro, /t\(["']ruby\.intro\.talk["']\)/)
  assert.match(intro, /t\(["']ruby\.intro\.later["']\)/)
  assert.match(i18n, /'ruby\.intro\.talk': 'Talk to Ruby'/)
  assert.match(i18n, /'ruby\.intro\.later': 'Maybe later'/)
  assert.match(intro, /event\.key === 'Escape'/)
  assert.match(intro, /event\.target === event\.currentTarget/)
  assert.match(intro, /FOCUSABLE/)
  assert.match(i18n, /Resource Navigator/)
  assert.match(i18n, /voucher specialist/)
  assert.match(i18n, /shelter, SRO, HRA bureaucracy/)
  assert.match(i18n, /Dominican woman in her 40s/)
})

test('Ruby intro shows once via localStorage and re-opens from the dock when chat is empty', () => {
  assert.match(app, /RUBY_INTRO_KEY = 'leasepath\.rubyIntroSeen'/)
  assert.match(app, /readItem\(RUBY_INTRO_KEY\) !== '1'/)
  assert.match(app, /writeItem\(RUBY_INTRO_KEY, '1'\)/)
  assert.match(app, /chatEmpty/)
  assert.match(app, /openRubyIntro/)
  assert.match(app, /talkToRuby/)
  // Consent comes first as one bar; the intro waits for it, and never covers the landlord form.
  assert.match(app, /const rubyIntroShown = rubyIntroOpen && consentDone && !landlordRoute/)
  assert.match(app, /const landlordRoute = route\.name === 'list-unit' \|\| route\.name === 'listings-admin'/)
  assert.match(app, /<RubyIntro open=\{rubyIntroShown\}/)
  assert.match(app, /<ConsentBar [^>]*onSettled=\{\(\) => setConsentDone\(true\)\}/)
  assert.match(read('src/i18n.js'), /Welcome to LeasePath\. Let's get you into an apartment\./)
  assert.match(app, /welcomeMessage\(|ruby\.welcome/)
})

test('Ruby intro animation respects prefers-reduced-motion; theme stays scoped', () => {
  assert.match(intro, /className="ruby-intro ruby-theme"/)
  assert.match(css, /\.ruby-intro \{/)
  assert.match(css, /@keyframes ruby-intro-in/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\n {2}\.ruby-intro \{ animation: none; \}/)
  assert.match(css, /\.dock-center\.ruby-dock \{\n {2}transform: translateY\(-12px\);/)
  assert.match(dock, /ruby-dock/)
})
