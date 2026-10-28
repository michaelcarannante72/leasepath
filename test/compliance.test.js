import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import test from 'node:test'
import { SITE_PAGES } from '../src/sitePages.js'
import { policyHtml } from '../server/policyPages.js'
import { AGE_CONFIRM_KEY, readAgeConfirmed, setAgeConfirmed } from '../src/ageGate.js'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('sign-up asks for an 18+ confirmation and keeps the answer on this device', () => {
  const dialog = read('src/components/AccountDialog.jsx')
  // One checkbox component, used on the Google path and on the email create path.
  assert.match(dialog, /<AgeConfirm id="age-confirm-google"/)
  assert.match(dialog, /<AgeConfirm id="age-confirm-email"/)
  // The email form cannot submit, and the button cannot be pressed, before the box is ticked.
  assert.match(dialog, /const createBlocked = emailMode === 'create' && !adultConfirmed/)
  assert.match(dialog, /if \(createBlocked\) return/)
  assert.match(dialog, /disabled=\{signingIn \|\| createBlocked\}/)
  // The Google button only renders once the box is ticked.
  assert.match(dialog, /\{adultConfirmed \? \(\s*<GoogleSignInButton/)

  const gate = read('src/ageGate.js')
  assert.match(gate, /export const AGE_CONFIRM_KEY = 'leasepath\.age18'/)
  assert.doesNotMatch(gate, /fetch\(|XMLHttpRequest|sendBeacon/, 'the answer never leaves the device')
  // Nothing medical and no date of birth is collected at sign-up.
  assert.doesNotMatch(gate, /diagnosis|medical history|dateOfBirth|date_of_birth/i)
  assert.doesNotMatch(dialog, /type="date"|dateOfBirth|date_of_birth/i)
})

test('the Ruby sign-in gate also requires the 18+ confirmation', () => {
  const sheet = read('src/components/AssistantSheet.jsx')
  assert.match(sheet, /<AgeConfirm id="age-confirm-ruby"/)
  assert.match(sheet, /\{adultConfirmed \? \(\s*<GoogleSignInButton/)
})

test('App re-checks the confirmation before either sign-up call reaches the server', () => {
  const app = read('src/App.jsx')
  const google = app.slice(app.indexOf('const signIn = useCallback'), app.indexOf('const signUpWithEmail = useCallback'))
  assert.match(google, /if \(!readAgeConfirmed\(\)\)/)
  assert.match(google, /return/)
  const email = app.slice(app.indexOf('const signUpWithEmail = useCallback'))
  assert.match(email, /if \(mode === 'create' && !readAgeConfirmed\(\)\)/)
  // The server contract is unchanged: no age field is posted with the credential or the email.
  assert.doesNotMatch(google, /JSON\.stringify\(\{[^}]*age/)
  assert.doesNotMatch(email.slice(0, email.indexOf('fetch(')), /age18|dob|birth/i)
})

test('ageGate reads and writes the device key and tolerates blocked storage', () => {
  const store = new Map()
  const fake = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) }
  setAgeConfirmed(true, fake)
  assert.equal(store.get(AGE_CONFIRM_KEY), 'yes')
  assert.equal(readAgeConfirmed(fake), true)
  const blocked = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } }
  assert.doesNotThrow(() => setAgeConfirmed(true, blocked))
  assert.doesNotThrow(() => readAgeConfirmed(blocked))
})

test('the terms page names a DMCA agent with placeholders and every takedown element', () => {
  const terms = SITE_PAGES.find((page) => page.slug === 'terms').body
  assert.match(terms, /Digital Millennium Copyright Act/)
  assert.match(terms, /designated agent/)
  // Clearly marked placeholders, until Michael supplies the real details.
  assert.match(terms, /\[DMCA AGENT CONTACT REQUIRED\]/)
  assert.match(terms, /\[MAILING ADDRESS REQUIRED\]/)
  // The six elements of a valid notice.
  assert.match(terms, /signature of the copyright owner/)
  assert.match(terms, /identification of the copyrighted work/)
  assert.match(terms, /identification of the material claimed to be infringing/)
  assert.match(terms, /your name, mailing address, telephone number, and email address/)
  assert.match(terms, /good-faith belief/)
  assert.match(terms, /under penalty of perjury/)
  // The public page renders it without script.
  const html = policyHtml('terms')
  assert.match(html, /DMCA designated agent/)
  assert.equal(html.includes('<script'), false)
})

test('the footer links to the DMCA section, and the legal pages describe the age gate and no replay', () => {
  assert.match(read('src/components/Footer.jsx'), /href="\/terms">\{tx\("Copyright \/ DMCA"\)\}/)
  const privacy = SITE_PAGES.find((page) => page.slug === 'privacy').body
  assert.match(privacy, /confirm that you are 18 or older/)
  assert.match(privacy, /does not use session recording, session replay, or heatmap tools/)
  const terms = SITE_PAGES.find((page) => page.slug === 'terms').body
  assert.match(terms, /You must be 18 or older to create an account/)
})

test('no session replay or heatmap vendor is installed, and the GTM tag carries no replay config', () => {
  const pkg = JSON.parse(read('package.json'))
  const deps = JSON.stringify({ ...pkg.dependencies, ...pkg.devDependencies })
  for (const vendor of ['posthog', 'fullstory', 'hotjar', 'clarity', 'logrocket', 'rrweb', 'sessionstack', 'smartlook']) {
    assert.equal(deps.toLowerCase().includes(vendor), false, vendor)
  }
  const files = ['src/analytics.js', 'src/components/ConsentBar.jsx', 'src/components/AnalyticsConsent.jsx']
  for (const file of files) {
    const text = read(file)
    for (const vendor of ['posthog', 'fullstory', 'hotjar', 'clarity', 'logrocket', 'rrweb', 'sessionstack', 'smartlook']) {
      assert.equal(text.toLowerCase().includes(vendor), false, `${file}: ${vendor}`)
    }
  }
  // Analytics stays behind the default-off consent switch.
  assert.match(read('src/analytics.js'), /consent !== 'granted'\) return (false|null)/)
  assert.match(read('src/analytics.js'), /GTM_ID = 'GTM-PX85GXS7'/)
})

test('no font is loaded from a third-party host', () => {
  for (const file of ['index.html', 'src/index.css']) {
    const text = read(file)
    assert.equal(/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(text), false, file)
    assert.equal(/rel="?preconnect"?.{0,80}fonts/.test(text), false, file)
  }
  assert.ok(existsSync(new URL('../public/fonts/inter-latin.woff2', import.meta.url)))
})

test('no marketing mail is sent from this repo, so no unsubscribe footer is needed yet', () => {
  const pkg = JSON.parse(read('package.json'))
  const deps = JSON.stringify({ ...pkg.dependencies, ...pkg.devDependencies }).toLowerCase()
  for (const vendor of ['resend', 'sendgrid', 'mailchannels', 'nodemailer', 'aws-sdk']) {
    assert.equal(deps.includes(vendor), false, vendor)
  }
})
