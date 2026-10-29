/** Landlord/broker voucher-ready unit submissions. Pending until an admin approves. Stored in KV. */
import {
  AMENITIES,
  bedroomLabel,
  BEDROOM_COUNTS,
  BATHROOM_COUNTS,
  BOROUGHS,
  BROKER_FEES,
  DOG_POLICIES,
  MAX_DESCRIPTION,
  MAX_PHOTOS,
  MAX_PHOTO_BYTES,
  MAX_PHOTOS_TOTAL_BYTES,
  PETS,
  PHOTO_TYPES,
  PROPERTY_TYPES,
  UNIT_SIZES,
  VOUCHER_CHOICES,
  VOUCHER_TYPES,
} from '../src/data/listingForm.js'

export { AMENITIES, BOROUGHS, DOG_POLICIES, PROPERTY_TYPES, UNIT_SIZES, VOUCHER_CHOICES, VOUCHER_TYPES, PETS }

export const LISTING_RATE_LIMITED = {
  error: 'rate_limit',
  message: 'Too many listing submissions from your network. Wait a minute and try again.',
}

export const LISTING_CHALLENGE = {
  error: 'challenge_required',
  message: 'LeasePath needs a quick check that you are a person before that listing is saved. Try again.',
}

/** One calm answer for a wrong token, a removed unit, and a missing record, so tokens cannot be probed. */
export const LISTING_LINK_INVALID = {
  error: 'invalid_link',
  message: 'This link is no longer valid. You can post the unit again, or reply to the text you got.',
}

export const LISTING_PHOTOS_REQUIRED = {
  error: 'photos_required',
  message: 'Add at least one photo. A unit with a photo gets replies; one without gets skipped.',
}

export const LISTING_PHOTOS_TOO_BIG = {
  error: 'photos_too_big',
  message: 'The photos add up to more than 2 MB. Remove one photo and try again.',
}

export { MAX_PHOTOS_TOTAL_BYTES }

const MAX_FIELD = 200
const MAX_ADDRESS = 300
const MAX_PHONE = 40
const MAX_EMAIL = 120
const PHOTO_KEY_PREFIX = 'photo:'

function trim(value, max) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function cleanPhone(value) {
  return trim(value, MAX_PHONE).replace(/[^\d+().\-\s]/g, '')
}

function emailOk(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= MAX_EMAIL
}

/** 10 digits is the shortest real US number a landlord might type, with or without a country code. */
export function phoneOk(value) {
  return String(value || '').replace(/\D/g, '').length >= 10
}

/** ISO YYYY-MM-DD that names a real calendar day in a plausible range. */
export function dateOk(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (year < 2000 || year > 2100) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

const B64 = /^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=]+)$/i

/** Decode one data URL photo. Returns { ok, type, bytes } without ever trusting the declared type alone. */
export function decodePhotoDataUrl(value) {
  if (typeof value !== 'string') return { ok: false, reason: 'type' }
  const match = B64.exec(value.trim())
  if (!match) return { ok: false, reason: 'type' }
  const type = match[1].toLowerCase()
  if (!PHOTO_TYPES.includes(type)) return { ok: false, reason: 'type' }
  let bytes
  try {
    const binary = atob(match[2])
    bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  } catch {
    return { ok: false, reason: 'decode' }
  }
  if (!bytes.length) return { ok: false, reason: 'decode' }
  if (bytes.length > MAX_PHOTO_BYTES) return { ok: false, reason: 'size' }
  if (!looksLikeImage(bytes, type)) return { ok: false, reason: 'type' }
  return { ok: true, type, bytes }
}

/** Magic numbers, so a renamed file or a text payload cannot ride in as an "image". */
function looksLikeImage(bytes, type) {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (type === 'image/png') return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end))
  return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP'
}

/** Money in whole dollars, blank allowed. "-" and junk become ''. */
function dollars(value, max) {
  const raw = String(value ?? '').replace(/[^\d]/g, '').slice(0, 7)
  if (raw === '') return ''
  const amount = Number(raw)
  return Number.isInteger(amount) && amount <= max ? amount : NaN
}

function integerChoice(value, allowed) {
  // A blank select must not read as 0, which is a studio for bedrooms and an impossible bathroom count.
  if (value === '' || value == null) return null
  const n = Number(value)
  return Number.isInteger(n) && allowed.includes(n) ? n : null
}

/**
 * Validate and normalize a public submission body.
 *
 * `bedrooms` is the real filter now; `size` is kept as a derived label so older records and every
 * card that reads it keep working. `voucherAccepted` is the only thing a landlord is asked about
 * vouchers — a landlord should never have to tell Section 8 from CityFHEPS from HASA. Picking "Yes"
 * stores every lawful subsidy on the listing, which is what the attestation already promises.
 */
export function parseListingSubmission(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Send the unit details as a form submission.' }
  }
  const address = trim(body.address, MAX_ADDRESS)
  const unit = trim(body.unit, 20)
  const borough = trim(body.borough, 40)
  const neighborhood = trim(body.neighborhood, 80)
  const propertyType = trim(body.propertyType, 40)
  const rentRaw = String(body.rent ?? '').replace(/[^\d]/g, '').slice(0, 6)
  const rent = Number(rentRaw)
  const contactName = trim(body.contactName, MAX_FIELD)
  const contactEmail = trim(body.contactEmail, MAX_EMAIL).toLowerCase()
  const contactPhone = cleanPhone(body.contactPhone)
  const description = typeof body.description === 'string' ? body.description.slice(0, MAX_DESCRIPTION) : ''
  const availableDate = typeof body.availableDate === 'string' ? body.availableDate.trim() : ''
  const attestation = body.attestation === true || body.attestation === 'yes' || body.attestation === 'true'

  const bedrooms = integerChoice(body.bedrooms, BEDROOM_COUNTS)
  const bathrooms = integerChoice(body.bathrooms, BATHROOM_COUNTS)
  // The form calls it securityDeposit; older drafts called it deposit. Accept both.
  const deposit = dollars(body.securityDeposit ?? body.deposit, 200000)
  const applicationFee = dollars(body.applicationFee, 20000)
  const brokerFee = trim(body.brokerFee, 40)
  const dogs = trim(body.dogs, 20)
  const catsAllowed = body.catsAllowed === true || body.catsAllowed === 'yes' || body.catsAllowed === 'Yes'
  const catsStated = typeof body.catsAllowed === 'boolean' || body.catsAllowed === 'yes' || body.catsAllowed === 'no' || body.catsAllowed === 'Yes' || body.catsAllowed === 'No'

  // Yes → every lawful subsidy. Ask me → none claimed yet. No → none: the unit is still listed so a
  // renter can see the honest answer, which is more useful than hiding it.
  const voucherChoiceRaw = trim(body.voucherAccepted, 20)
  // Default Yes, but a value that is not one of the three is a mistake, not a silent "yes": quietly
  // upgrading a landlord's answer is the one thing this field must never do.
  const voucherAccepted = voucherChoiceRaw === '' ? 'Yes' : VOUCHER_CHOICES.includes(voucherChoiceRaw) ? voucherChoiceRaw : null
  const legacyVoucherTypes = Array.isArray(body.voucherTypes)
    ? [...new Set(body.voucherTypes.map((v) => trim(String(v), 40)).filter((v) => VOUCHER_TYPES.includes(v)))]
    : []
  const voucherTypes = voucherAccepted === 'Yes' ? [...VOUCHER_TYPES] : []

  const amenities = Array.isArray(body.amenities)
    ? [...new Set(body.amenities.map((a) => trim(String(a), 40)).filter((a) => AMENITIES.includes(a)))]
    : []
  // Older records carry only the single `pets` label; keep accepting it so an edit does not drop it.
  const legacyPets = typeof body.pets === 'string' && PETS.includes(body.pets.trim()) ? body.pets.trim() : ''

  if (!address) return { ok: false, error: 'Add the street address.' }
  if (!BOROUGHS.includes(borough)) return { ok: false, error: 'Pick a borough.' }
  if (!PROPERTY_TYPES.includes(propertyType)) return { ok: false, error: 'Pick the property type: house, condo or apartment unit, or townhouse.' }
  if (bedrooms === null) return { ok: false, error: 'Pick the number of bedrooms. A studio is 0 bedrooms.' }
  if (bathrooms === null) return { ok: false, error: 'Pick the number of full bathrooms.' }
  if (!Number.isInteger(rent) || rent < 100 || rent > 20000) return { ok: false, error: 'Enter a monthly rent between $100 and $20,000.' }
  if (!dateOk(availableDate)) return { ok: false, error: 'Pick the date the unit is available.' }
  if (!voucherAccepted) return { ok: false, error: 'Answer whether you accept vouchers: yes, no, or ask me.' }
  if (Number.isNaN(deposit)) return { ok: false, error: 'Enter the security deposit in dollars, or leave it blank if you would rather not say.' }
  if (Number.isNaN(applicationFee)) return { ok: false, error: 'Enter the application fee in dollars. Put 0 if there is none.' }
  if (brokerFee && !BROKER_FEES.includes(brokerFee)) return { ok: false, error: 'Pick a broker fee from the list, or leave it blank.' }
  if (dogs && !DOG_POLICIES.includes(dogs)) return { ok: false, error: 'Pick a dog policy from the list, or leave it blank.' }
  if (!contactName) return { ok: false, error: 'Add a contact name.' }
  // One reachable contact is enough: a phone-only landlord is the common case.
  if (!contactEmail && !phoneOk(contactPhone)) {
    return { ok: false, error: 'Add a contact email or a phone with at least 10 digits.' }
  }
  if (contactEmail && !emailOk(contactEmail)) return { ok: false, error: 'That contact email does not look right. Fix it or leave it empty and give a phone.' }
  if (!attestation) {
    return {
      ok: false,
      error: 'You must attest that you accept vouchers and charge no application fees.',
    }
  }

  const listing = {
    address,
    unit,
    borough,
    neighborhood,
    propertyType,
    bedrooms,
    bathrooms,
    size: bedroomLabel(bedrooms),
    rent,
    availableDate,
    securityDeposit: deposit === '' ? null : deposit,
    applicationFee: applicationFee === '' ? null : applicationFee,
    brokerFee,
    catsAllowed: catsStated ? catsAllowed : null,
    dogs,
    voucherAccepted,
    voucherTypes: voucherTypes.length ? voucherTypes : legacyVoucherTypes,
    amenities,
    contactName,
    contactEmail,
    contactPhone,
    description,
    pets: legacyPets,
    attestation: true,
  }
  return { ok: true, listing }
}

/** Validated photos from a body, or a friendly error. Accepts data URLs; never trusts the declared size. */
export function parsePhotos(body, { required = false } = {}) {
  const raw = Array.isArray(body?.photos) ? body.photos : []
  if (!raw.length) {
    // Zillow requires one photo, and a card with no image does not get clicked. Say why, plainly.
    if (required) return { ok: false, error: LISTING_PHOTOS_REQUIRED.message, json: LISTING_PHOTOS_REQUIRED }
    return { ok: true, photos: [], total: 0 }
  }
  if (raw.length > MAX_PHOTOS) return { ok: false, error: `Add up to ${MAX_PHOTOS} photos.` }
  const photos = []
  let total = 0
  for (const item of raw) {
    const decoded = decodePhotoDataUrl(item)
    if (!decoded.ok) {
      if (decoded.reason === 'size') return { ok: false, error: `Each photo has to be under 5 MB.` }
      if (decoded.reason === 'decode') return { ok: false, error: 'One of those photos could not be read. Try adding it again, or use a JPG or PNG.' }
      return { ok: false, error: 'Photos must be JPG, PNG, or WebP.' }
    }
    total += decoded.bytes.length
    photos.push(decoded)
  }
  if (total > MAX_PHOTOS_TOTAL_BYTES) return { ok: false, error: LISTING_PHOTOS_TOO_BIG.message, json: LISTING_PHOTOS_TOO_BIG }
  return { ok: true, photos, total }
}

/** Public view of an approved unit. Contact shows for approved units; the edit hash never does. */
export function publicListing(record) {
  if (!record) return null
  return {
    id: record.id,
    address: record.address,
    borough: record.borough,
    size: record.size,
    rent: record.rent,
    voucherTypes: record.voucherTypes,
    inspectionReady: record.inspectionReady,
    contactName: record.contactName,
    contactEmail: record.contactEmail,
    contactPhone: record.contactPhone,
    unit: record.unit || '',
    neighborhood: record.neighborhood || '',
    propertyType: record.propertyType || '',
    bedrooms: Number.isInteger(record.bedrooms) ? record.bedrooms : null,
    bathrooms: Number.isInteger(record.bathrooms) ? record.bathrooms : null,
    availableDate: record.availableDate || '',
    securityDeposit: record.securityDeposit ?? null,
    applicationFee: record.applicationFee ?? null,
    brokerFee: record.brokerFee || '',
    catsAllowed: record.catsAllowed ?? null,
    dogs: record.dogs || '',
    voucherAccepted: record.voucherAccepted || (record.voucherTypes?.length ? 'Yes' : 'Ask me'),
    amenities: Array.isArray(record.amenities) ? record.amenities : [],
    description: record.description || '',
    pets: record.pets || '',
    photos: (record.photos || []).map((photo) => ({
      n: photo.n,
      width: photo.width || 0,
      height: photo.height || 0,
      url: `/api/listings/photo/${record.id}/${photo.n}`,
    })),
    approvedAt: record.approvedAt || null,
  }
}

/** Admin view of any record: everything except the edit token hash. */
export function adminListing(record) {
  if (!record) return null
  const rest = { ...record }
  // The raw token hash is the only thing an admin screen must never receive.
  delete rest.editTokenHash
  return {
    ...rest,
    photos: (record.photos || []).map((photo) => ({ n: photo.n, width: photo.width || 0, height: photo.height || 0 })),
  }
}

function pendingKey(id) {
  return `pending:${id}`
}
function approvedKey(id) {
  return `approved:${id}`
}
function removedKey(id) {
  return `removed:${id}`
}
function rentedKey(id) {
  return `rented:${id}`
}
export function photoKey(id, n) {
  return `${PHOTO_KEY_PREFIX}${id}:${n}`
}

async function readIndex(kv, name) {
  if (!kv) return []
  try {
    const raw = await kv.get(`index:${name}`, 'json')
    return Array.isArray(raw) ? raw.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

async function writeIndex(kv, name, ids) {
  await kv.put(`index:${name}`, JSON.stringify(ids.slice(0, 5000)))
}

async function addToIndex(kv, name, id) {
  const ids = await readIndex(kv, name)
  if (!ids.includes(id)) await writeIndex(kv, name, [id, ...ids])
}

async function dropFromIndex(kv, name, id) {
  const ids = await readIndex(kv, name)
  if (ids.includes(id)) await writeIndex(kv, name, ids.filter((x) => x !== id))
}

export function newListingId(now = Date.now()) {
  const rand = crypto.randomUUID?.() || `${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`
  return `u${now.toString(36)}${String(rand).replace(/-/g, '').slice(0, 10)}`
}

/** 32 random bytes, base64url. Long enough that guessing is hopeless; never stored raw. */
export function newEditToken() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const encoder = new TextEncoder()

/** SHA-256 of the raw token. Only this hash is stored, so a KV dump does not hand out edit access. */
export async function hashEditToken(token) {
  if (typeof token !== 'string' || !token) return ''
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`listing-edit:${token}`))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function sameToken(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function writePhotos(kv, id, photos) {
  const stored = []
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    const n = i + 1
    await kv.put(photoKey(id, n), photo.bytes, {
      metadata: { type: photo.type, size: photo.bytes.length },
    })
    stored.push({ n, type: photo.type, size: photo.bytes.length, width: photo.width || 0, height: photo.height || 0 })
  }
  return stored
}

async function clearPhotos(kv, id, above = 0) {
  for (let n = above + 1; n <= MAX_PHOTOS; n++) {
    try {
      await kv.delete(photoKey(id, n))
    } catch {
      /* already gone */
    }
  }
}

export async function storePendingListing(kv, listing, { id, now = Date.now(), photos = [] } = {}) {
  if (!kv) throw new Error('listings_kv')
  const listingId = id || newListingId(now)
  const editToken = newEditToken()
  const record = {
    ...listing,
    photos: [],
    editTokenHash: await hashEditToken(editToken),
    id: listingId,
    status: 'pending',
    submittedAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  }
  record.photos = await writePhotos(kv, listingId, photos)
  await kv.put(pendingKey(listingId), JSON.stringify(record))
  await addToIndex(kv, 'pending', listingId)
  // The raw token goes back to the person who submitted, once. It is never written to KV or any list.
  return { ...adminListing(record), editToken }
}

export async function listPending(kv) {
  return readRecords(kv, 'pending', pendingKey, (row) => row.status === 'pending')
}

export async function listRemoved(kv) {
  return readRecords(kv, 'removed', removedKey, (row) => row.status === 'removed')
}

/** Units a landlord marked rented. Out of the public list, still visible to an admin. */
export async function listRented(kv) {
  return readRecords(kv, 'rented', rentedKey, (row) => row.status === 'rented')
}

async function readRecords(kv, name, keyFor, keep) {
  const ids = await readIndex(kv, name)
  const out = []
  for (const id of ids) {
    try {
      const row = await kv.get(keyFor(id), 'json')
      if (row && keep(row)) out.push(adminListing(row))
    } catch {
      /* skip */
    }
  }
  return out
}

export async function listApproved(kv) {
  const ids = await readIndex(kv, 'approved')
  const out = []
  for (const id of ids) {
    try {
      const row = await kv.get(approvedKey(id), 'json')
      if (row && row.status === 'approved') out.push(publicListing(row))
    } catch {
      /* skip */
    }
  }
  return out
}

export async function approveListing(kv, id, now = Date.now()) {
  const pending = await kv.get(pendingKey(id), 'json')
  if (!pending) return null
  const record = {
    ...pending,
    status: 'approved',
    approvedAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  }
  await kv.put(approvedKey(id), JSON.stringify(record))
  await kv.delete(pendingKey(id))
  await dropFromIndex(kv, 'pending', id)
  await addToIndex(kv, 'approved', id)
  return publicListing(record)
}

export async function rejectListing(kv, id) {
  const pending = await kv.get(pendingKey(id), 'json')
  if (!pending) return false
  await kv.delete(pendingKey(id))
  await dropFromIndex(kv, 'pending', id)
  await clearPhotos(kv, id)
  return true
}

/** Pull a listing: keeps the record, hides it everywhere public, and frees its photos. */
export async function removeListing(kv, id, now = Date.now()) {
  const found = await findLiveRecord(kv, id)
  if (!found) return null
  const record = {
    ...found.record,
    status: 'removed',
    removedAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  }
  await kv.put(removedKey(id), JSON.stringify(record))
  await kv.delete(pendingKey(id))
  await kv.delete(approvedKey(id))
  await kv.delete(rentedKey(id))
  await dropFromIndex(kv, 'pending', id)
  await dropFromIndex(kv, 'approved', id)
  await dropFromIndex(kv, 'rented', id)
  await addToIndex(kv, 'removed', id)
  await clearPhotos(kv, id)
  return adminListing(record)
}

/** Only a live record can be taken down. A second request finds nothing and answers like a dead link. */
async function findLiveRecord(kv, id) {
  const approved = await kv.get(approvedKey(id), 'json')
  if (approved && approved.status === 'approved') return { record: approved, status: 'approved' }
  const pending = await kv.get(pendingKey(id), 'json')
  if (pending && pending.status === 'pending') return { record: pending, status: 'pending' }
  const rented = await kv.get(rentedKey(id), 'json')
  if (rented && rented.status === 'rented') return { record: rented, status: 'rented' }
  return null
}

/**
 * A token works for a listing the owner can still act on: pending, approved, or marked rented.
 * A removed unit is finished, so its link answers like any dead link.
 */
async function findByToken(kv, token) {
  const hash = await hashEditToken(token)
  if (!hash) return null
  for (const [name, keyFor] of [['pending', pendingKey], ['approved', approvedKey], ['rented', rentedKey]]) {
    for (const id of await readIndex(kv, name)) {
      const row = await kv.get(keyFor(id), 'json')
      if (row && typeof row.editTokenHash === 'string' && sameToken(row.editTokenHash, hash)) {
        return { record: row, name }
      }
    }
  }
  return null
}

/** Private prefill for the edit page. Returns { ok, listing } or { ok:false }. Photos come back as data URLs. */
export async function loadListingForEdit(kv, token) {
  if (!kv) return { ok: false }
  const found = await findByToken(kv, token)
  if (!found) return { ok: false }
  const record = found.record
  const photos = []
  for (const photo of record.photos || []) {
    const value = await kv.get(photoKey(record.id, photo.n), 'arrayBuffer')
    if (value) photos.push({ n: photo.n, type: photo.type, dataUrl: `data:${photo.type};base64,${base64(new Uint8Array(value))}` })
  }
  return {
    ok: true,
    listing: {
      id: record.id,
      status: record.status,
      address: record.address || '',
      unit: record.unit || '',
      borough: record.borough,
      neighborhood: record.neighborhood || '',
      propertyType: record.propertyType || '',
      bedrooms: Number.isInteger(record.bedrooms) ? record.bedrooms : null,
      bathrooms: Number.isInteger(record.bathrooms) ? record.bathrooms : null,
      rent: record.rent,
      availableDate: record.availableDate || '',
      securityDeposit: record.securityDeposit ?? '',
      applicationFee: record.applicationFee ?? '',
      brokerFee: record.brokerFee || '',
      catsAllowed: record.catsAllowed ?? null,
      dogs: record.dogs || '',
      voucherAccepted: record.voucherAccepted || 'Yes',
      voucherTypes: record.voucherTypes || [],
      amenities: Array.isArray(record.amenities) ? record.amenities : [],
      contactName: record.contactName || '',
      contactEmail: record.contactEmail || '',
      contactPhone: record.contactPhone || '',
      description: record.description || '',
      pets: record.pets || '',
      photos,
      submittedAt: record.submittedAt || null,
    },
  }
}

function base64(bytes) {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  return btoa(binary)
}

/** Fields a renter reads. A change to any of these needs a fresh review before the unit is public again. */
const REVIEWED_FIELDS = [
  'address', 'unit', 'borough', 'neighborhood', 'propertyType', 'bedrooms', 'bathrooms', 'rent',
  'availableDate', 'securityDeposit', 'applicationFee', 'brokerFee', 'catsAllowed', 'dogs',
  'voucherAccepted', 'voucherTypes', 'amenities', 'description', 'pets',
]
/** Fields where a null and a blank mean the same thing, so clearing a fee is not a "change". */
const LOOSE_FIELDS = new Set(['securityDeposit', 'applicationFee', 'catsAllowed'])

function sameValue(a, b) {
  if (Array.isArray(a) || Array.isArray(b)) {
    const left = Array.isArray(a) ? [...a].sort() : []
    const right = Array.isArray(b) ? [...b].sort() : []
    return left.length === right.length && left.every((v, i) => v === right[i])
  }
  return a === b
}

export function listingNeedsReview(record, next, photosChanged) {
  if (photosChanged) return true
  return REVIEWED_FIELDS.some((field) => {
    if (field === 'rent') return Number(record[field]) !== Number(next[field])
    if (LOOSE_FIELDS.has(field)) {
      const before = record[field] ?? ''
      const after = next[field] ?? ''
      return String(before) !== String(after)
    }
    return !sameValue(record[field] ?? '', next[field] ?? '')
  })
}

/**
 * Save an edit in place: same id, no duplicate. A content change sends an approved unit back to pending;
 * a contact-only change keeps it approved. Returns { ok, status, listing } or { ok:false }.
 */
export async function saveListingEdit(kv, token, body, { now = Date.now() } = {}) {
  if (!kv) return { ok: false }
  const found = await findByToken(kv, token)
  if (!found) return { ok: false }
  const parsed = parseListingSubmission(body)
  if (!parsed.ok) return { ok: false, error: parsed.error }
  const kept = Array.isArray(body?.keepPhotos) ? body.keepPhotos : null
  const newPhotos = parsePhotos(body)
  if (!newPhotos.ok) return { ok: false, error: newPhotos.error }

  const record = found.record
  const oldPhotos = record.photos || []
  // keepPhotos lists the photo numbers that survive (in order); anything else is dropped.
  const keptNumbers = kept ? kept.map(Number).filter((n) => oldPhotos.some((p) => p.n === n)) : []
  const remaining = kept ? keptNumbers : oldPhotos.map((p) => p.n)
  // Adding a photo, dropping one, or reordering them all change what a renter sees.
  const photosChanged =
    newPhotos.photos.length > 0 ||
    (Boolean(kept) && (remaining.length !== oldPhotos.length || remaining.join() !== oldPhotos.map((p) => p.n).join()))
  const next = { ...parsed.listing }

  // Rewrite the surviving photos under their new positions, then the new uploads.
  const photoBytes = []
  for (const n of remaining) {
    const value = await kv.get(photoKey(record.id, n), 'arrayBuffer')
    const meta = oldPhotos.find((p) => p.n === n)
    if (value && meta) photoBytes.push({ type: meta.type, bytes: new Uint8Array(value), width: meta.width || 0, height: meta.height || 0 })
  }
  for (const photo of newPhotos.photos) photoBytes.push(photo)
  // A listing always keeps one photo, on edit as well: the card has nothing to show without it.
  if (!photoBytes.length) return { ok: false, error: LISTING_PHOTOS_REQUIRED.message, json: LISTING_PHOTOS_REQUIRED }
  const photoTotal = photoBytes.reduce((sum, p) => sum + p.bytes.length, 0)
  if (photoTotal > MAX_PHOTOS_TOTAL_BYTES) {
    return { ok: false, error: LISTING_PHOTOS_TOO_BIG.message, json: LISTING_PHOTOS_TOO_BIG }
  }

  const review = listingNeedsReview(record, next, photosChanged)
  // A rented unit stays rented: it is not in the public list, so there is nothing to re-review.
  const status = record.status === 'rented' ? 'rented' : record.status === 'approved' && review ? 'pending' : record.status
  const updated = {
    ...record,
    ...next,
    photos: [],
    status,
    updatedAt: new Date(now).toISOString(),
    ...(status === 'pending' && record.status === 'approved' ? { approvedAt: null } : {}),
  }
  updated.photos = await writePhotos(kv, record.id, photoBytes)
  await clearPhotos(kv, record.id, photoBytes.length)

  if (status === 'pending') {
    await kv.put(pendingKey(record.id), JSON.stringify(updated))
    await kv.delete(approvedKey(record.id))
    await dropFromIndex(kv, 'approved', record.id)
    await addToIndex(kv, 'pending', record.id)
  } else if (status === 'rented') {
    await kv.put(rentedKey(record.id), JSON.stringify(updated))
    await addToIndex(kv, 'rented', record.id)
  } else {
    await kv.put(approvedKey(record.id), JSON.stringify(updated))
    await addToIndex(kv, 'approved', record.id)
  }
  return { ok: true, status, needsReview: review, listing: adminListing(updated) }
}

/** Takedown by token: the landlord's own way out. Keeps the record with status 'removed'. */
export async function removeListingForToken(kv, token, now = Date.now()) {
  if (!kv) return null
  const found = await findByToken(kv, token)
  if (!found) return null
  return removeListing(kv, found.record.id, now)
}

/**
 * The landlord found a tenant. Keep the record and the photos, pull it out of the public list, and
 * leave it visible to an admin — distinct from `removed`, which is a takedown.
 */
export async function markListingRented(kv, token, now = Date.now()) {
  if (!kv) return null
  const found = await findByToken(kv, token)
  if (!found) return null
  const record = found.record
  if (record.status === 'rented') return { alreadyRented: true, listing: adminListing(record) }
  const updated = {
    ...record,
    status: 'rented',
    rentedAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  }
  await kv.put(rentedKey(record.id), JSON.stringify(updated))
  await kv.delete(pendingKey(record.id))
  await kv.delete(approvedKey(record.id))
  await dropFromIndex(kv, 'pending', record.id)
  await dropFromIndex(kv, 'approved', record.id)
  await addToIndex(kv, 'rented', record.id)
  return { alreadyRented: false, listing: adminListing(updated) }
}

/** Undo a "mark as rented": the unit goes back to the review queue, not straight to public. */
export async function relistListing(kv, token, now = Date.now()) {
  if (!kv) return null
  const found = await findByToken(kv, token)
  if (!found) return null
  const record = found.record
  if (record.status !== 'rented') return { ok: true, status: record.status, listing: adminListing(record) }
  const updated = {
    ...record,
    status: 'pending',
    rentedAt: null,
    approvedAt: null,
    updatedAt: new Date(now).toISOString(),
  }
  await kv.put(pendingKey(record.id), JSON.stringify(updated))
  await kv.delete(rentedKey(record.id))
  await dropFromIndex(kv, 'rented', record.id)
  await addToIndex(kv, 'pending', record.id)
  return { ok: true, status: 'pending', listing: adminListing(updated) }
}

/** A photo for an approved unit. Pending units need the admin token; removed units are gone. */
export async function readListingPhoto(kv, id, n) {
  if (!kv || !/^[a-zA-Z0-9]+$/.test(String(id)) || !Number.isInteger(n) || n < 1 || n > MAX_PHOTOS) return null
  const record = await kv.get(approvedKey(id), 'json')
  if (!record || record.status !== 'approved') return null
  const meta = (record.photos || []).find((photo) => photo.n === n)
  if (!meta) return null
  const value = await kv.get(photoKey(id, n), 'arrayBuffer')
  if (!value) return null
  return { bytes: new Uint8Array(value), type: meta.type }
}

/** Pending photos, for the admin review screen only. */
export async function readPendingPhoto(kv, id, n) {
  if (!kv || !/^[a-zA-Z0-9]+$/.test(String(id)) || !Number.isInteger(n) || n < 1 || n > MAX_PHOTOS) return null
  const record = await kv.get(pendingKey(id), 'json')
  if (!record || record.status !== 'pending') return null
  const meta = (record.photos || []).find((photo) => photo.n === n)
  if (!meta) return null
  const value = await kv.get(photoKey(id, n), 'arrayBuffer')
  if (!value) return null
  return { bytes: new Uint8Array(value), type: meta.type }
}

export function adminAuthorized(headerToken, queryToken, secret) {
  if (!secret || typeof secret !== 'string' || secret.length < 16) return false
  const token = headerToken || queryToken || ''
  if (typeof token !== 'string' || !token || token.length !== secret.length) return false
  let diff = 0
  for (let i = 0; i < secret.length; i++) diff |= token.charCodeAt(i) ^ secret.charCodeAt(i)
  return diff === 0
}

export function readBearer(header) {
  const value = String(header || '')
  const match = /^Bearer\s+(.+)$/i.exec(value)
  return match ? match[1].trim() : ''
}
