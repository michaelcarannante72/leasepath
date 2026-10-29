import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  adminListing,
  approveListing,
  listApproved,
  listPending,
  listRemoved,
  loadListingForEdit,
  MAX_PHOTOS_TOTAL_BYTES,
  parseListingSubmission,
  parsePhotos,
  removeListing,
  removeListingForToken,
  saveListingEdit,
  storePendingListing,
} from '../server/listings.js'
import { handleApi } from '../server/api.js'

const root = new URL('..', import.meta.url).pathname
const read = (p) => readFileSync(join(root, p), 'utf8')

function memoryKv() {
  const map = new Map()
  return {
    async get(key, type) {
      const value = map.get(key)
      if (value === undefined) return null
      if (type === 'json') return JSON.parse(typeof value === 'string' ? value : value)
      return value
    },
    async put(key, value) { map.set(key, typeof value === 'string' ? value : value) },
    async delete(key) { map.delete(key) },
    _map: map,
  }
}

const base = {
  address: '77 Grand St',
  borough: 'Brooklyn',
  propertyType: 'Townhouse',
  bedrooms: '2',
  bathrooms: '1',
  rent: '2400',
  availableDate: '2026-11-15',
  contactName: 'Dana Landlord',
  contactPhone: '718-555-0142',
  attestation: true,
}

// A 1x1 JPEG, enough to pass the magic-number check without shipping a fixture file.
const JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q=='

test('phone-only submission is accepted; email is optional when a phone reaches 10 digits', () => {
  const phoneOnly = parseListingSubmission({ ...base, contactEmail: '' })
  assert.equal(phoneOnly.ok, true)
  assert.equal(phoneOnly.listing.contactEmail, '')
  assert.equal(parseListingSubmission({ ...base, contactPhone: '555-0100' }).ok, false, 'short phone and no email')
  assert.equal(parseListingSubmission({ ...base, contactPhone: '555-0100', contactEmail: 'a@b.co' }).ok, true, 'email alone is enough')
  assert.equal(parseListingSubmission({ ...base, contactPhone: '', contactEmail: '' }).ok, false, 'neither')
  assert.equal(parseListingSubmission({ ...base, contactEmail: 'not-an-email' }).ok, false, 'malformed email still rejected')
})

test('description is clamped to 1000 characters and pets / available date are validated', () => {
  const long = 'x'.repeat(1500)
  const parsed = parseListingSubmission({ ...base, description: long, pets: 'Dogs OK', availableDate: '2026-11-01' })
  assert.equal(parsed.ok, true)
  assert.equal(parsed.listing.description.length, 1000)
  assert.equal(parsed.listing.pets, 'Dogs OK')
  assert.equal(parsed.listing.availableDate, '2026-11-01')
  assert.equal(parseListingSubmission({ ...base, dogs: 'Giraffes OK' }).ok, false)
  assert.equal(parseListingSubmission({ ...base, dogs: '' }).ok, true, 'dog policy optional')
  assert.equal(parseListingSubmission({ ...base, pets: 'No pets' }).ok, true, 'legacy pets value still accepted')
  assert.equal(parseListingSubmission({ ...base, availableDate: '2026-02-30' }).ok, false, 'not a real day')
  assert.equal(parseListingSubmission({ ...base, availableDate: '1899-01-01' }).ok, false, 'implausible year')
  assert.equal(parseListingSubmission({ ...base, availableDate: 'soon' }).ok, false)
  assert.equal(parseListingSubmission({ ...base, availableDate: '' }).ok, false, 'date is required now')
})

test('photos: over-limit count, over-budget total, and non-images are all refused', () => {
  assert.equal(parsePhotos({ photos: [JPEG, JPEG, JPEG, JPEG, JPEG] }).ok, false, 'five photos')
  assert.equal(parsePhotos({ photos: [JPEG, JPEG, JPEG, JPEG] }).ok, true, 'four photos')
  assert.equal(parsePhotos({ photos: ['data:text/plain;base64,aGk='] }).ok, false, 'wrong type')
  assert.equal(parsePhotos({ photos: ['data:image/png;base64,aGk='] }).ok, false, 'png magic bytes do not match')
  assert.equal(parsePhotos({ photos: [] }).ok, true, 'photos optional')
  // A body that claims a big total gets the 413-shaped answer from the API, checked below.
  assert.ok(MAX_PHOTOS_TOTAL_BYTES === 2 * 1024 * 1024)
})

test('public card omits mailto/tel data the unit does not have and never carries the edit hash', async () => {
  const kv = memoryKv()
  const created = await storePendingListing(kv, parseListingSubmission({ ...base, contactEmail: '' }).listing, { id: 'u10' })
  assert.ok(created.editToken)
  assert.equal(JSON.stringify(adminListing(await kv.get('pending:u10', 'json'))).includes('editTokenHash'), false)
  await approveListing(kv, 'u10')
  const [card] = await listApproved(kv)
  assert.equal(card.contactEmail, '')
  assert.equal(card.contactPhone, '718-555-0142')
  const raw = JSON.stringify(card)
  assert.equal(/editToken|editTokenHash/.test(raw), false, 'no token in the public listing')
})

test('API returns the edit token once, and no endpoint exposes it afterwards', async () => {
  const kv = memoryKv()
  const origin = 'https://leasepath.test'
  const created = await handleApi({
    method: 'POST', pathname: '/api/listings', body: { ...base, photos: [JPEG] }, origin, requestOrigin: origin, listingsKv: kv,
  })
  assert.equal(created.status, 201)
  const token = created.json.editToken
  assert.equal(typeof token, 'string')
  assert.ok(token.length >= 40, 'long random token')

  const admin = 'a'.repeat(32)
  const pending = await handleApi({ method: 'GET', pathname: '/api/listings/pending', listingsKv: kv, listingsAdminToken: admin, authorization: `Bearer ${admin}` })
  assert.equal(pending.status, 200)
  assert.equal(JSON.stringify(pending.json).includes(token), false, 'token never in the admin queue')
  const approved = await handleApi({ method: 'GET', pathname: '/api/listings/approved', listingsKv: kv })
  assert.equal(JSON.stringify(approved.json).includes(token), false)
})

test('edit: a valid token loads the same form prefill, an invalid or missing one is refused alike', async () => {
  const kv = memoryKv()
  const stored = await storePendingListing(kv, parseListingSubmission(base).listing, { id: 'u11' })
  const loaded = await handleApi({
    method: 'POST', pathname: '/api/listings/edit', body: { token: stored.editToken },
    origin: 'https://leasepath.test', requestOrigin: 'https://leasepath.test', listingsKv: kv,
  })
  assert.equal(loaded.status, 200)
  assert.equal(loaded.json.listing.address, '77 Grand St')
  assert.equal(loaded.json.listing.editToken, undefined)

  const wrong = await handleApi({
    method: 'POST', pathname: '/api/listings/edit', body: { token: 'nope' },
    origin: 'https://leasepath.test', requestOrigin: 'https://leasepath.test', listingsKv: kv,
  })
  const missing = await handleApi({
    method: 'POST', pathname: '/api/listings/edit', body: {},
    origin: 'https://leasepath.test', requestOrigin: 'https://leasepath.test', listingsKv: kv,
  })
  assert.equal(wrong.status, 404)
  assert.deepEqual(wrong.json, missing.json, 'wrong and missing look identical')
})

test('edit: a rent change sends an approved unit back to review, same id, no duplicate', async () => {
  const kv = memoryKv()
  const stored = await storePendingListing(kv, parseListingSubmission(base).listing, {
    id: 'u12', photos: [{ type: 'image/jpeg', bytes: Buffer.from([0xff, 0xd8, 0xff, 1, 2, 3]), width: 1, height: 1 }],
  })
  await approveListing(kv, 'u12')
  assert.equal((await listApproved(kv)).length, 1)

  const saved = await saveListingEdit(kv, stored.editToken, { ...base, rent: '2600' })
  assert.equal(saved.ok, true)
  assert.equal(saved.status, 'pending')
  assert.equal(saved.listing.id, 'u12')
  assert.equal(saved.needsReview, true)
  assert.equal((await listApproved(kv)).length, 0, 'no longer public')
  const pending = await listPending(kv)
  assert.equal(pending.length, 1, 'exactly one record, not a duplicate')
  assert.equal(pending[0].rent, 2600)
})

test('edit: a contact-only change keeps an approved unit approved', async () => {
  const kv = memoryKv()
  const stored = await storePendingListing(kv, parseListingSubmission(base).listing, {
    id: 'u13', photos: [{ type: 'image/jpeg', bytes: Buffer.from([0xff, 0xd8, 0xff, 1, 2, 3]), width: 1, height: 1 }],
  })
  await approveListing(kv, 'u13')
  const saved = await saveListingEdit(kv, stored.editToken, { ...base, contactPhone: '917-555-0199', contactEmail: 'new@example.com' })
  assert.equal(saved.ok, true)
  assert.equal(saved.status, 'approved')
  assert.equal(saved.needsReview, false)
  const [card] = await listApproved(kv)
  assert.equal(card.contactPhone, '917-555-0199')
  assert.equal(card.contactEmail, 'new@example.com')
})

test('edit: description, pets, date and photos all count as reviewed content', async () => {
  const kv = memoryKv()
  const stored = await storePendingListing(kv, parseListingSubmission(base).listing, {
    id: 'u14', photos: [{ type: 'image/jpeg', bytes: Buffer.from([0xff, 0xd8, 0xff, 1, 2, 3]), width: 1, height: 1 }],
  })
  await approveListing(kv, 'u14')
  for (const patch of [{ description: 'Sunny two-bed near the L.' }, { pets: 'Cats OK' }, { availableDate: '2026-12-01' }, { photos: [JPEG] }]) {
    const saved = await saveListingEdit(kv, stored.editToken, { ...base, ...patch })
    assert.equal(saved.ok, true, JSON.stringify(patch))
    assert.equal(saved.status, 'pending', `${Object.keys(patch)[0]} needs review`)
    await approveListing(kv, 'u14')
  }
})

test('edit: adding a photo to an otherwise unchanged approved unit still needs review', async () => {
  const kv = memoryKv()
  const stored = await storePendingListing(kv, parseListingSubmission(base).listing, {
    id: 'u20', photos: [{ type: 'image/jpeg', bytes: Buffer.from([0xff, 0xd8, 0xff, 1, 2, 3]), width: 1, height: 1 }],
  })
  await approveListing(kv, 'u20')
  // Nothing typed changed; only a new photo arrives.
  const saved = await saveListingEdit(kv, stored.editToken, { ...base, photos: [JPEG] })
  assert.equal(saved.ok, true)
  assert.equal(saved.needsReview, true)
  assert.equal(saved.status, 'pending')
  assert.equal(saved.listing.photos.length, 2, 'the kept photo plus the new one')
})

test('edit: keeping every photo and changing only the contact details stays approved', async () => {
  const kv = memoryKv()
  const stored = await storePendingListing(kv, parseListingSubmission(base).listing, {
    id: 'u21',
    photos: [{ type: 'image/jpeg', bytes: Buffer.from([0xff, 0xd8, 0xff, 1]), width: 1, height: 1 }],
  })
  await approveListing(kv, 'u21')
  const saved = await saveListingEdit(kv, stored.editToken, { ...base, contactPhone: '917-555-0111', keepPhotos: [1] })
  assert.equal(saved.ok, true)
  assert.equal(saved.status, 'approved')
  assert.equal(saved.listing.photos.length, 1, 'the one photo was kept, not duplicated')
})

test('takedown: status becomes removed, it leaves the public list, and the record is kept', async () => {
  const kv = memoryKv()
  const stored = await storePendingListing(kv, parseListingSubmission(base).listing, { id: 'u15' })
  await approveListing(kv, 'u15')
  const removed = await removeListingForToken(kv, stored.editToken)
  assert.equal(removed.status, 'removed')
  assert.equal((await listApproved(kv)).length, 0)
  assert.equal((await listPending(kv)).length, 0)
  const kept = await listRemoved(kv)
  assert.equal(kept.length, 1)
  assert.equal(kept[0].id, 'u15')
  assert.ok(kv._map.has('removed:u15'), 'the record is archived, never hard-deleted')
  assert.equal((await loadListingForEdit(kv, stored.editToken)).ok, false, 'a removed unit has no edit page')
  // A removed unit cannot be edited back into existence.
  const after = await saveListingEdit(kv, stored.editToken, base)
  assert.equal(after.ok, false)
  assert.equal(await removeListingForToken(kv, 'wrong'), null)
})

test('takedown removes a pending unit from the review queue too', async () => {
  const kv = memoryKv()
  const stored = await storePendingListing(kv, parseListingSubmission(base).listing, { id: 'u16' })
  await handleApi({
    method: 'POST', pathname: '/api/listings/edit/remove', body: { token: stored.editToken },
    origin: 'https://leasepath.test', requestOrigin: 'https://leasepath.test', listingsKv: kv,
  })
  assert.equal((await listPending(kv)).length, 0)
  assert.equal((await listRemoved(kv)).length, 1)
})

test('removeListing is idempotent-safe: a second call returns null instead of duplicating', async () => {
  const kv = memoryKv()
  await storePendingListing(kv, parseListingSubmission(base).listing, { id: 'u17' })
  assert.equal((await removeListing(kv, 'u17')).status, 'removed')
  assert.equal(await removeListing(kv, 'u17'), null)
})

test('edit routes require a same-origin request', async () => {
  const kv = memoryKv()
  const stored = await storePendingListing(kv, parseListingSubmission(base).listing, { id: 'u18' })
  const denied = await handleApi({
    method: 'POST', pathname: '/api/listings/edit', body: { token: stored.editToken },
    origin: 'https://evil.test', requestOrigin: 'https://leasepath.test', listingsKv: kv,
  })
  assert.equal(denied.status, 403)
})

test('analytics never sees the edit route or its token', async () => {
  const { isSensitiveView, sanitizedPage, ALLOWED_KEYS } = await import('../src/analytics.js')
  assert.equal(isSensitiveView({ hashPath: '/edit-listing?t=abc123' }), true)
  assert.equal(isSensitiveView({ hashPath: '/edit-listing' }), true)
  const page = sanitizedPage('/edit-listing?t=abc123')
  assert.equal(JSON.stringify(page).includes('abc123'), false)
  assert.deepEqual(ALLOWED_KEYS, ['event', 'page_location', 'page_path', 'page_title'])
  const app = read('src/App.jsx')
  assert.match(app, /route\.name === 'edit-listing'/)
  assert.match(app, /\/edit-listing\?/)
})

test('Turnstile: the listing form asks for its own action and never blocks the submission', () => {
  const turnstile = read('src/turnstile.js')
  assert.match(turnstile, /export async function getTurnstileToken\(\{ timeoutMs = 60_000, action = CHAT_ACTION \}/)
  assert.match(turnstile, /export const CHAT_ACTION = 'ruby_chat'/)
  assert.match(turnstile, /getTurnstileTokenOrEmpty/)
  const page = read('src/components/ListUnitPage.jsx')
  assert.match(page, /action: 'landlord_listing'/, 'listing form asks for landlord_listing')
  assert.match(page, /timeoutMs: LISTING_CHALLENGE_TIMEOUT/)
  assert.match(page, /const LISTING_CHALLENGE_TIMEOUT = 5_000/, 'fails fast, not 60s')
  assert.match(page, /getTurnstileTokenOrEmpty/, 'a failed challenge yields an empty token instead of an error')
  assert.equal(/if \(!turnstileToken\)/.test(page), false, 'no branch discards the form when the token is missing')
  assert.match(page, /body: JSON\.stringify\(\{ \.\.\.body, turnstileToken \}\)/, 'the submission is POSTed regardless')
  const app = read('src/App.jsx')
  assert.match(app, /getTurnstileToken\(\{ action: CHAT_ACTION \}\)/, 'Ruby keeps her own action')
})

test('server posture: rate limit always applies, a missing token is accepted, a wrong one is not', async () => {
  const { guardListingSubmit } = await import('../worker/listingsGuard.js')
  const limited = { limit: async () => ({ success: false }) }
  const open = { limit: async () => ({ success: true }) }
  const env = { LISTINGS_LIMITER: limited, TURNSTILE_SECRET: 'ts' }
  const blocked = await guardListingSubmit({ env, ip: '1.2.3.4', token: 'good' })
  assert.equal(blocked.ok, false)
  assert.equal(blocked.status, 429, 'rate limit is checked first and always')

  const noToken = await guardListingSubmit({ env: { ...env, LISTINGS_LIMITER: open }, ip: '1.2.3.4', token: '' })
  assert.equal(noToken.ok, true, 'a broken challenge must not eat the submission')

  let seenAction = ''
  const fetchImpl = async (url, init) => {
    seenAction = String(init.body.get('response'))
    return new Response(JSON.stringify({ success: seenAction === 'good', action: seenAction === 'good' ? 'landlord_listing' : 'ruby_chat' }))
  }
  const good = await guardListingSubmit({ env: { ...env, LISTINGS_LIMITER: open }, ip: '1.2.3.4', token: 'good', fetchImpl })
  assert.equal(good.ok, true, 'a genuine token is verified and accepted')
  const wrongAction = await guardListingSubmit({ env: { ...env, LISTINGS_LIMITER: open }, ip: '1.2.3.4', token: 'bad', fetchImpl })
  assert.equal(wrongAction.ok, false, 'a chat token cannot be replayed on the listing route')
  assert.equal(wrongAction.status, 403)
})

test('Ruby chat protection is untouched: still requires a token when secrets are set', async () => {
  const { guardChat } = await import('../worker/chatGuard.js')
  const env = { CHAT_LIMITER: { limit: async () => ({ success: true }) }, TURNSTILE_SECRET: 'ts', LEASEPATH_AUTH_SECRET: 'auth' }
  const none = await guardChat({ env, ip: '1.2.3.4', cookieHeader: '', token: '', fetchImpl: async () => new Response('{}') })
  assert.equal(none.ok, false)
  assert.equal(none.status, 403)
})

test('an over-budget photo set gets a 413 before anything is stored', async () => {
  const kv = memoryKv()
  const photo = (seed) => `data:image/jpeg;base64,${Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff]),
    Buffer.alloc(700 * 1024, seed),
  ]).toString('base64')}`
  const response = await handleApi({
    method: 'POST',
    pathname: '/api/listings',
    body: { ...base, photos: [photo(1), photo(2), photo(3), photo(4)] },
    origin: 'https://leasepath.test',
    requestOrigin: 'https://leasepath.test',
    listingsKv: kv,
  })
  assert.equal(response.status, 413)
  assert.equal(response.json.error, 'photos_too_big')
  assert.equal((await listPending(kv)).length, 0)
})

test('a stored photo is served for an approved unit and hidden for a pending one', async () => {
  const kv = memoryKv()
  const stored = await storePendingListing(kv, parseListingSubmission(base).listing, { id: 'u19', photos: [{ type: 'image/jpeg', bytes: Buffer.from([0xff, 0xd8, 0xff, 1, 2, 3]), width: 1, height: 1 }] })
  assert.ok(stored.photos.length === 1)
  const pendingPhoto = await handleApi({ method: 'GET', pathname: '/api/listings/photo/u19/1', listingsKv: kv })
  assert.equal(pendingPhoto.status, 404, 'pending photos are not public')
  await approveListing(kv, 'u19')
  const publicPhoto = await handleApi({ method: 'GET', pathname: '/api/listings/photo/u19/1', listingsKv: kv })
  assert.equal(publicPhoto.status, 200)
  assert.equal(publicPhoto.raw.headers.get('content-type'), 'image/jpeg')
})

test('the form shows errors where the button is, and the edit page does too', () => {
  const formError = read('src/components/FormError.jsx')
  assert.match(formError, /scrollIntoView/)
  assert.match(formError, /\.focus\(/)
  assert.match(formError, /role="alert"/)
  const form = read('src/components/ListingForm.jsx')
  assert.match(form, /<FormError message=\{error \|\| stepError\} \/>/)
  assert.match(form, /const problem = listingProblem\(form\) \|\| photosProblem/, 'client-side check before the round trip')
  assert.match(form, /const problem = stepProblem\(form, step\)/, 'each step is checked before it advances')
  const edit = read('src/components/EditListingPage.jsx')
  assert.match(edit, /noValidate|ListingForm/, 'the edit page reuses the same form and error handling')
  const css = read('src/index.css')
  assert.match(css, /\.form-error-sticky[^}]*position: sticky/)
})

test('a failed challenge leaves the form filled in', () => {
  const form = read('src/components/ListingForm.jsx')
  // State lives in this component and nothing clears it on a failed submit.
  assert.equal(/setForm\(emptyListingForm\(\)\)/.test(form), false)
  const page = read('src/components/ListUnitPage.jsx')
  assert.match(page, /Your details are still here/)
})
