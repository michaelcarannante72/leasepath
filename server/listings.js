/** Landlord/broker voucher-ready unit submissions. Pending until an admin approves. Stored in KV. */
import { BOROUGHS, UNIT_SIZES, VOUCHER_TYPES } from '../src/data/listingForm.js'

export { BOROUGHS, UNIT_SIZES, VOUCHER_TYPES }

export const LISTING_RATE_LIMITED = {
  error: 'rate_limit',
  message: 'Too many listing submissions from your network. Wait a minute and try again.',
}

export const LISTING_CHALLENGE = {
  error: 'challenge_required',
  message: 'LeasePath needs a quick check that you are a person before that listing is saved. Try again.',
}

const MAX_FIELD = 200
const MAX_ADDRESS = 300
const MAX_PHONE = 40
const MAX_EMAIL = 120

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

/** Validate and normalize a public submission body. Returns { ok, listing?, error? }. */
export function parseListingSubmission(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Send the unit details as a form submission.' }
  }
  const address = trim(body.address, MAX_ADDRESS)
  const borough = trim(body.borough, 40)
  const size = trim(body.size, 40)
  const rentRaw = String(body.rent ?? '').replace(/[^\d]/g, '').slice(0, 6)
  const rent = Number(rentRaw)
  const contactName = trim(body.contactName, MAX_FIELD)
  const contactEmail = trim(body.contactEmail, MAX_EMAIL).toLowerCase()
  const contactPhone = cleanPhone(body.contactPhone)
  const inspectionReady = body.inspectionReady === true || body.inspectionReady === 'yes' || body.inspectionReady === 'true'
  const attestation = body.attestation === true || body.attestation === 'yes' || body.attestation === 'true'
  const voucherTypes = Array.isArray(body.voucherTypes)
    ? [...new Set(body.voucherTypes.map((v) => trim(String(v), 40)).filter((v) => VOUCHER_TYPES.includes(v)))]
    : []

  if (!address) return { ok: false, error: 'Add the street address.' }
  if (!BOROUGHS.includes(borough)) return { ok: false, error: 'Pick a borough.' }
  if (!UNIT_SIZES.includes(size)) return { ok: false, error: 'Pick the unit size.' }
  if (!Number.isInteger(rent) || rent < 100 || rent > 20000) return { ok: false, error: 'Enter a monthly rent between $100 and $20,000.' }
  if (!voucherTypes.length) return { ok: false, error: 'Pick at least one voucher type you accept.' }
  if (!contactName) return { ok: false, error: 'Add a contact name.' }
  if (!emailOk(contactEmail)) return { ok: false, error: 'Add a real contact email.' }
  if (contactPhone.replace(/\D/g, '').length < 10) return { ok: false, error: 'Add a contact phone with at least 10 digits.' }
  if (!attestation) {
    return {
      ok: false,
      error: 'You must attest that you accept vouchers and charge no application fees.',
    }
  }

  return {
    ok: true,
    listing: {
      address,
      borough,
      size,
      rent,
      voucherTypes,
      inspectionReady: Boolean(inspectionReady),
      contactName,
      contactEmail,
      contactPhone,
      attestation: true,
    },
  }
}

/** Public view of an approved unit (no private contact until we decide later — show contact for approved). */
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
    approvedAt: record.approvedAt || null,
  }
}

function pendingKey(id) {
  return `pending:${id}`
}
function approvedKey(id) {
  return `approved:${id}`
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

export function newListingId(now = Date.now()) {
  const rand = crypto.randomUUID?.() || `${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`
  return `u${now.toString(36)}${String(rand).replace(/-/g, '').slice(0, 10)}`
}

export async function storePendingListing(kv, listing, { id, now = Date.now() } = {}) {
  if (!kv) throw new Error('listings_kv')
  const listingId = id || newListingId(now)
  const record = {
    ...listing,
    id: listingId,
    status: 'pending',
    submittedAt: new Date(now).toISOString(),
  }
  await kv.put(pendingKey(listingId), JSON.stringify(record))
  const index = await readIndex(kv, 'pending')
  if (!index.includes(listingId)) await writeIndex(kv, 'pending', [listingId, ...index])
  return record
}

export async function listPending(kv) {
  const ids = await readIndex(kv, 'pending')
  const out = []
  for (const id of ids) {
    try {
      const row = await kv.get(pendingKey(id), 'json')
      if (row && row.status === 'pending') out.push(row)
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
  }
  await kv.put(approvedKey(id), JSON.stringify(record))
  await kv.delete(pendingKey(id))
  const pendingIds = (await readIndex(kv, 'pending')).filter((x) => x !== id)
  await writeIndex(kv, 'pending', pendingIds)
  const approvedIds = await readIndex(kv, 'approved')
  if (!approvedIds.includes(id)) await writeIndex(kv, 'approved', [id, ...approvedIds])
  return publicListing(record)
}

export async function rejectListing(kv, id) {
  const pending = await kv.get(pendingKey(id), 'json')
  if (!pending) return false
  await kv.delete(pendingKey(id))
  const pendingIds = (await readIndex(kv, 'pending')).filter((x) => x !== id)
  await writeIndex(kv, 'pending', pendingIds)
  return true
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
