// The third addition to list-unit-v2: a three-step form, a single voucher question, fees and pets on
// the card, a required photo, and "marked as rented" as a state of its own.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AMENITIES, BATHROOM_COUNTS, BEDROOM_COUNTS, BROKER_FEES, DOG_POLICIES, PROPERTY_TYPES, VOUCHER_CHOICES, VOUCHER_TYPES,
  bedroomLabel,
} from '../src/data/listingForm.js'
import {
  LISTING_PHOTOS_REQUIRED, approveListing, listApproved, listPending, listRented, markListingRented, parseListingSubmission,
  parsePhotos, publicListing, relistListing, removeListingForToken, storePendingListing,
} from '../server/listings.js'
import { handleApi } from '../server/api.js'

function memoryKv() {
  const map = new Map()
  return {
    async get(key, type) {
      const value = map.get(key)
      if (value === undefined) return null
      if (type === 'json') return JSON.parse(value)
      return value
    },
    async put(key, value) { map.set(key, value) },
    async delete(key) { map.delete(key) },
  }
}

const base = {
  address: '410 W 145th St',
  unit: '5C',
  borough: 'Manhattan',
  neighborhood: 'Harlem',
  propertyType: 'Condo or apartment unit',
  bedrooms: 2,
  bathrooms: 1,
  rent: '2750',
  availableDate: '2026-12-01',
  contactName: 'Nia Owner',
  contactEmail: 'nia@example.com',
  attestation: true,
}
const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q=='
const photoMeta = () => ({ type: 'image/jpeg', bytes: Buffer.from([0xff, 0xd8, 0xff, 1, 2, 3]), width: 1, height: 1 })

test('property type is required and every required field is refused when missing', () => {
  assert.equal(parseListingSubmission(base).ok, true)
  for (const type of PROPERTY_TYPES) {
    const parsed = parseListingSubmission({ ...base, propertyType: type })
    assert.equal(parsed.ok, true, type)
    assert.equal(parsed.listing.propertyType, type)
  }
  assert.equal(parseListingSubmission({ ...base, propertyType: '' }).ok, false, 'no type')
  assert.equal(parseListingSubmission({ ...base, propertyType: 'Co-op' }).ok, false, 'not on the list')
  // Every required field the landlord must fill: drop each one and the submission must be refused.
  for (const field of ['address', 'borough', 'propertyType', 'bedrooms', 'bathrooms', 'rent', 'availableDate']) {
    assert.equal(parseListingSubmission({ ...base, [field]: '' }).ok, false, `missing ${field}`)
  }
  assert.equal(parseListingSubmission({ ...base, bedrooms: '' }).ok, false, 'a blank bedroom count is not a studio')
  assert.equal(parseListingSubmission({ ...base, bedrooms: 0 }).ok, true, '0 is a studio, and is allowed')
  const studio = parseListingSubmission({ ...base, bedrooms: 0 })
  assert.equal(studio.listing.size, 'Studio', 'the card label is derived from the count')
  assert.equal(bedroomLabel(2), '2 bedrooms')
  // The fields that are deliberately optional stay optional.
  for (const field of ['unit', 'neighborhood', 'securityDeposit', 'applicationFee', 'brokerFee', 'catsAllowed', 'dogs']) {
    assert.equal(parseListingSubmission({ ...base, [field]: '' }).ok, true, `${field} is optional`)
  }
  assert.deepEqual(BEDROOM_COUNTS, [0, 1, 2, 3, 4, 5, 6])
  assert.deepEqual(BATHROOM_COUNTS, [1, 2, 3, 4, 5])
  assert.deepEqual(BROKER_FEES, ['None', 'One month', 'Half month', 'Other'])
  assert.equal(AMENITIES.length, 12)
})

test('the single voucher question maps onto the voucherTypes the rest of the site reads', () => {
  // The landlord answers one question. "Yes" means every lawful subsidy, which is what the
  // attestation already promises, so nothing has to be picked from a list of programme names.
  assert.deepEqual(VOUCHER_CHOICES, ['Yes', 'No', 'Ask me'])
  assert.equal(parseListingSubmission({ ...base }).listing.voucherAccepted, 'Yes', 'default is Yes')
  const yes = parseListingSubmission({ ...base, voucherAccepted: 'Yes' }).listing
  assert.deepEqual(yes.voucherTypes, VOUCHER_TYPES, 'Yes stores every lawful subsidy')
  assert.ok(yes.voucherTypes.includes('CityFHEPS') && yes.voucherTypes.includes('HASA'))
  const no = parseListingSubmission({ ...base, voucherAccepted: 'No' }).listing
  assert.equal(no.voucherAccepted, 'No')
  assert.deepEqual(no.voucherTypes, [], 'No claims no subsidy')
  const ask = parseListingSubmission({ ...base, voucherAccepted: 'Ask me' }).listing
  assert.equal(ask.voucherAccepted, 'Ask me')
  assert.deepEqual(ask.voucherTypes, [])
  assert.equal(parseListingSubmission({ ...base, voucherAccepted: 'Section 8 only' }).ok, false, 'a stray answer is refused, not upgraded to Yes')
  // An old record that still sends the taxonomy keeps its own answer.
  const legacy = parseListingSubmission({ ...base, voucherAccepted: 'No', voucherTypes: ['Section 8'] }).listing
  assert.deepEqual(legacy.voucherTypes, ['Section 8'])
  assert.equal(/inspection/i.test(JSON.stringify(publicListing({ ...legacy, id: 'x' }))), false, 'inspection-ready is gone')
})

test('a dog policy round-trips through the API onto the public card, with the fees and pet lines', async () => {
  const kv = memoryKv()
  const body = {
    ...base,
    catsAllowed: true,
    dogs: 'Small only',
    securityDeposit: '0',
    applicationFee: '0',
    brokerFee: 'None',
    amenities: ['Laundry in unit', 'Dishwasher', 'Not a real amenity'],
    photos: [PHOTO],
  }
  const created = await handleApi({
    method: 'POST', pathname: '/api/listings', body,
    origin: 'https://leasepath.test', requestOrigin: 'https://leasepath.test', listingsKv: kv,
  })
  assert.equal(created.status, 201)
  const id = created.json.id
  await approveListing(kv, id)
  const publicList = await handleApi({ method: 'GET', pathname: '/api/listings/approved', listingsKv: kv })
  const card = publicList.json.listings[0]
  assert.equal(card.dogs, 'Small only', 'the dog answer reaches the card')
  assert.equal(card.catsAllowed, true)
  assert.equal(card.securityDeposit, 0, '$0 deposit is kept, not treated as blank')
  assert.equal(card.applicationFee, 0, '$0 application fee is kept')
  assert.equal(card.brokerFee, 'None')
  assert.equal(card.unit, '5C')
  assert.equal(card.propertyType, 'Condo or apartment unit')
  assert.equal(card.bedrooms, 2)
  assert.equal(card.bathrooms, 1)
  assert.deepEqual(card.amenities, ['Laundry in unit', 'Dishwasher'], 'unknown amenities are dropped')
  assert.equal(card.voucherAccepted, 'Yes')
  assert.deepEqual(card.voucherTypes, VOUCHER_TYPES)
  assert.equal(card.inspectionReady, undefined, 'inspection-ready is not in the payload')
  assert.equal(DOG_POLICIES.includes('Large OK'), true)
  // Blank money means "not stated", which is different from zero.
  const blank = parseListingSubmission({ ...base }).listing
  assert.equal(blank.securityDeposit, null)
  assert.equal(blank.applicationFee, null)
  // And the dog policy is validated rather than stored free-form.
  assert.equal(parseListingSubmission({ ...base, dogs: 'Two dogs, maybe' }).ok, false)
})

test('a submission with no photo is rejected, and the message says why', () => {
  assert.equal(parsePhotos({ photos: [] }, { required: true }).ok, false)
  assert.equal(parsePhotos({ photos: [] }, { required: true }).json.error, 'photos_required')
  assert.match(LISTING_PHOTOS_REQUIRED.message, /photo/i)
  assert.equal(parsePhotos({ photos: [] }).ok, true, 'an edit that keeps its photo is not forced to add one')
})

test('no-photo submission is refused over HTTP as a 400 and nothing is stored', async () => {
  const kv = memoryKv()
  const response = await handleApi({
    method: 'POST', pathname: '/api/listings', body: base,
    origin: 'https://leasepath.test', requestOrigin: 'https://leasepath.test', listingsKv: kv,
  })
  assert.equal(response.status, 400)
  assert.equal(response.json.error, 'photos_required')
  assert.equal((await listPending(kv)).length, 0, 'nothing reached the queue')
})

test('a rented unit leaves the public list but stays visible to admin', async () => {
  const kv = memoryKv()
  const stored = await storePendingListing(kv, parseListingSubmission(base).listing, { id: 'r1', photos: [photoMeta()] })
  await approveListing(kv, 'r1')
  assert.equal((await listApproved(kv)).length, 1)

  const marked = await markListingRented(kv, stored.editToken)
  assert.equal(marked.alreadyRented, false)
  assert.equal(marked.listing.status, 'rented')

  // Gone from public, out of the pending review queue, present for admin as rented (not removed).
  assert.equal((await listApproved(kv)).length, 0, 'public list is empty')
  const publicList = await handleApi({ method: 'GET', pathname: '/api/listings/approved', listingsKv: kv })
  assert.equal(publicList.json.listings.length, 0)
  assert.equal((await listPending(kv)).length, 0)
  const admin = 'a'.repeat(32)
  const rented = await handleApi({ method: 'GET', pathname: '/api/listings/rented', listingsKv: kv, listingsAdminToken: admin, authorization: `Bearer ${admin}` })
  assert.equal(rented.status, 200)
  assert.equal(rented.json.listings.length, 1)
  assert.equal(rented.json.listings[0].id, 'r1')
  assert.equal(rented.json.listings[0].contactEmail, 'nia@example.com', 'contact details stay for the landlord')
  // Distinct from removed: the removed list is empty, and the public photo is no longer served.
  const removed = await handleApi({ method: 'GET', pathname: '/api/listings/removed', listingsKv: kv, listingsAdminToken: admin, authorization: `Bearer ${admin}` })
  assert.equal(removed.json.listings.length, 0)
  assert.equal((await listRented(kv)).length, 1)
  const photo = await handleApi({ method: 'GET', pathname: '/api/listings/photo/r1/1', listingsKv: kv })
  assert.equal(photo.status, 404, 'a rented unit is not public')

  // Marking twice is harmless, and taking it down from rented still works.
  assert.equal((await markListingRented(kv, stored.editToken)).alreadyRented, true)

  // Relisting puts it back in review, never straight back to public.
  const back = await relistListing(kv, stored.editToken)
  assert.equal(back.status, 'pending')
  assert.equal((await listRented(kv)).length, 0)
  assert.equal((await listPending(kv)).length, 1)
  assert.equal((await listApproved(kv)).length, 0)

  // And a rented unit can still be removed outright, which is a different end state.
  await approveListing(kv, 'r1')
  await markListingRented(kv, stored.editToken)
  const taken = await removeListingForToken(kv, stored.editToken)
  assert.equal(taken.status, 'removed', 'a rented unit can still be taken down outright')
  assert.equal((await listRented(kv)).length, 0, 'removed takes it out of the rented view too')
})

test('rented units are refused to the wrong admin token, and the API never leaks them publicly', async () => {
  const kv = memoryKv()
  const stored = await storePendingListing(kv, parseListingSubmission(base).listing, { id: 'r2', photos: [photoMeta()] })
  await markListingRented(kv, stored.editToken)
  const admin = 'a'.repeat(32)
  const denied = await handleApi({ method: 'GET', pathname: '/api/listings/rented', listingsKv: kv, listingsAdminToken: admin })
  assert.equal(denied.status, 401)
  assert.equal(JSON.stringify(denied.json).includes('410 W 145th St'), false)
  const publicList = await handleApi({ method: 'GET', pathname: '/api/listings/approved', listingsKv: kv })
  assert.equal(JSON.stringify(publicList.json).includes('410 W 145th St'), false)
})
