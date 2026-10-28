import assert from 'node:assert/strict'
import test from 'node:test'
import {
  adminAuthorized,
  approveListing,
  listApproved,
  listPending,
  parseListingSubmission,
  publicListing,
  rejectListing,
  storePendingListing,
  VOUCHER_TYPES,
} from '../server/listings.js'
import { handleApi } from '../server/api.js'
import { BOROUGHS, UNIT_SIZES } from '../src/data/listingForm.js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function memoryKv() {
  const map = new Map()
  return {
    async get(key, type) {
      const value = map.get(key)
      if (value === undefined) return null
      if (type === 'json') return JSON.parse(value)
      return value
    },
    async put(key, value) {
      map.set(key, typeof value === 'string' ? value : JSON.stringify(value))
    },
    async delete(key) {
      map.delete(key)
    },
    _map: map,
  }
}

const good = {
  address: '123 Test Ave',
  borough: 'Bronx',
  size: '1 bedroom',
  rent: '1800',
  voucherTypes: ['Section 8', 'CityFHEPS'],
  inspectionReady: true,
  contactName: 'Alex Broker',
  contactEmail: 'alex@example.com',
  contactPhone: '212-555-0100',
  attestation: true,
}

test('listing form options stay aligned', () => {
  assert.ok(VOUCHER_TYPES.includes('Section 8'))
  assert.ok(BOROUGHS.includes('Brooklyn'))
  assert.ok(UNIT_SIZES.includes('Studio'))
})

test('parseListingSubmission accepts a complete attestation and rejects missing fields', () => {
  const ok = parseListingSubmission(good)
  assert.equal(ok.ok, true)
  assert.equal(ok.listing.rent, 1800)
  assert.deepEqual(ok.listing.voucherTypes, ['Section 8', 'CityFHEPS'])
  assert.equal(parseListingSubmission({ ...good, attestation: false }).ok, false)
  assert.equal(parseListingSubmission({ ...good, borough: 'Yonkers' }).ok, false)
  assert.equal(parseListingSubmission({ ...good, contactEmail: 'nope' }).ok, false)
  assert.equal(parseListingSubmission({ ...good, rent: '50' }).ok, false)
  assert.equal(parseListingSubmission({ ...good, voucherTypes: [] }).ok, false)
})

test('pending listings stay out of the approved public list until approved', async () => {
  const kv = memoryKv()
  const parsed = parseListingSubmission(good)
  const pending = await storePendingListing(kv, parsed.listing, { id: 'u1', now: 1_700_000_000_000 })
  assert.equal(pending.status, 'pending')
  assert.equal((await listApproved(kv)).length, 0)
  assert.equal((await listPending(kv)).length, 1)
  const approved = await approveListing(kv, 'u1', 1_700_000_100_000)
  assert.equal(approved.address, '123 Test Ave')
  assert.equal((await listPending(kv)).length, 0)
  assert.equal((await listApproved(kv)).length, 1)
  assert.equal(publicListing(approved).contactEmail, 'alex@example.com')
})

test('reject removes a pending listing and never publishes it', async () => {
  const kv = memoryKv()
  await storePendingListing(kv, parseListingSubmission(good).listing, { id: 'u2' })
  assert.equal(await rejectListing(kv, 'u2'), true)
  assert.equal((await listPending(kv)).length, 0)
  assert.equal((await listApproved(kv)).length, 0)
  assert.equal(await rejectListing(kv, 'missing'), false)
})

test('adminAuthorized uses a timing-safe compare and rejects short secrets', () => {
  const secret = 'a'.repeat(32)
  assert.equal(adminAuthorized(secret, '', secret), true)
  assert.equal(adminAuthorized('b'.repeat(32), '', secret), false)
  assert.equal(adminAuthorized(secret, '', 'short'), false)
  assert.equal(adminAuthorized('', secret, secret), true)
})

test('API: submit stores pending; approved endpoint stays empty until approve', async () => {
  const kv = memoryKv()
  const origin = 'https://leasepath.test'
  const created = await handleApi({
    method: 'POST',
    pathname: '/api/listings',
    body: good,
    origin,
    requestOrigin: origin,
    listingsKv: kv,
  })
  assert.equal(created.status, 201)
  assert.equal(created.json.ok, true)
  const approved = await handleApi({ method: 'GET', pathname: '/api/listings/approved', listingsKv: kv })
  assert.equal(approved.status, 200)
  assert.equal(approved.json.listings.length, 0)
  const pending = await handleApi({
    method: 'GET',
    pathname: '/api/listings/pending',
    listingsKv: kv,
    listingsAdminToken: 'a'.repeat(32),
    authorization: `Bearer ${'a'.repeat(32)}`,
  })
  assert.equal(pending.status, 200)
  assert.equal(pending.json.listings.length, 1)
  const id = pending.json.listings[0].id
  const approve = await handleApi({
    method: 'POST',
    pathname: `/api/listings/${id}/approve`,
    body: {},
    origin,
    requestOrigin: origin,
    listingsKv: kv,
    listingsAdminToken: 'a'.repeat(32),
    authorization: `Bearer ${'a'.repeat(32)}`,
  })
  assert.equal(approve.status, 200)
  const after = await handleApi({ method: 'GET', pathname: '/api/listings/approved', listingsKv: kv })
  assert.equal(after.json.listings.length, 1)
})

test('API: pending and review require the admin token', async () => {
  const kv = memoryKv()
  const denied = await handleApi({ method: 'GET', pathname: '/api/listings/pending', listingsKv: kv, listingsAdminToken: 'a'.repeat(32) })
  assert.equal(denied.status, 401)
})

test('list-unit page copy covers source-of-income and pending review', () => {
  const root = new URL('..', import.meta.url).pathname
  const page = readFileSync(join(root, 'src/components/ListUnitPage.jsx'), 'utf8')
  assert.match(page, /List a voucher-ready unit/)
  assert.match(page, /source-of-income discrimination is illegal/)
  assert.match(page, /pending-review queue/)
  assert.match(page, /no application fees/)
  const admin = readFileSync(join(root, 'src/components/ListingsAdminPage.jsx'), 'utf8')
  assert.match(admin, /Review voucher-ready units/)
  const app = readFileSync(join(root, 'src/App.jsx'), 'utf8')
  assert.match(app, /list-unit/)
  assert.match(app, /listings-admin/)
  assert.match(app, /voucher-ready/)
})

test('wrangler binds LISTINGS_KV and LISTINGS_LIMITER', () => {
  const root = new URL('..', import.meta.url).pathname
  const config = readFileSync(join(root, 'wrangler.jsonc'), 'utf8')
  assert.match(config, /LISTINGS_KV/)
  assert.match(config, /2140cf57fe764bb49ec36f4ebf895e64/)
  assert.match(config, /LISTINGS_LIMITER/)
  assert.match(config, /list-unit/)
})

test('list-unit page is ready to hand to a stranger: free to list, review, no application fees', () => {
  const root = new URL('..', import.meta.url).pathname
  const page = readFileSync(join(root, 'src/components/ListUnitPage.jsx'), 'utf8')
  // The three promises a landlord or broker needs before they fill in the form.
  assert.match(page, /tx\("Free to list\."\)/)
  assert.match(page, /no listing fee/)
  assert.match(page, /never asks a voucher holder for an application fee/)
  assert.match(page, /Submissions go to a pending-review queue and are never shown publicly until approved/)
  // The success screen says what happens next instead of stopping at "received".
  assert.match(page, /className="list-unit-next"/)
  assert.match(page, /LeasePath reviews the unit/)
  assert.match(page, /we email the contact address you gave/)
  // The slow invisible human check is announced instead of looking frozen.
  assert.match(page, /Checking that you are a person/)
  assert.match(page, /aria-live="polite"/)
})

test('Ruby first-visit intro never covers the landlord form or the admin screen', () => {
  const root = new URL('..', import.meta.url).pathname
  const app = readFileSync(join(root, 'src/App.jsx'), 'utf8')
  assert.match(app, /const landlordRoute = route\.name === 'list-unit' \|\| route\.name === 'listings-admin'/)
  assert.match(app, /const rubyIntroShown = rubyIntroOpen && consentDone && !landlordRoute/)
  assert.match(app, /<RubyIntro open=\{rubyIntroShown\}/)
})

test('admin review screen shows a lister email and phone that can be replied to', () => {
  const root = new URL('..', import.meta.url).pathname
  const admin = readFileSync(join(root, 'src/components/ListingsAdminPage.jsx'), 'utf8')
  assert.match(admin, /mailto:\$\{unit\.contactEmail\}/)
  assert.match(admin, /`tel:\$\{String\(unit\.contactPhone/)
  assert.match(admin, /Email or call the lister before you reject a unit/)
})
