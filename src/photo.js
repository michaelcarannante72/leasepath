// Client-side photo prep. Phones hand us 4-12 MB pictures; the Worker should never see those, and a
// landlord on a slow connection should not wait for them either. Everything is re-encoded as JPEG at a
// 1600px long edge before it leaves the phone. HEIC is not decoded by most browsers, so a HEIC file gets
// a clear message instead of a silent failure.
import { MAX_PHOTO_BYTES, MAX_PHOTOS_TOTAL_BYTES, PHOTO_MAX_EDGE, PHOTO_QUALITY, PHOTO_TYPES } from './data/listingForm.js'

/** Bytes behind a base64 data URL, without decoding it. */
export function dataUrlBytes(dataUrl) {
  const comma = String(dataUrl).indexOf(',')
  if (comma < 0) return 0
  const body = dataUrl.slice(comma + 1)
  const padding = body.endsWith('==') ? 2 : body.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((body.length * 3) / 4) - padding)
}

/**
 * Check a picked file before any work: type and size. Returns '' when it is fine.
 * `name` is used in the message so a person knows which of several photos failed.
 */
export function photoFileProblem(file) {
  const type = String(file?.type || '').toLowerCase()
  if (!PHOTO_TYPES.includes(type)) return { code: 'type' }
  if (Number(file.size) > MAX_PHOTO_BYTES) return { code: 'size' }
  return null
}

/** Decode, scale to the long edge, and re-encode as JPEG. Resolves to { ok, dataUrl, width, height } or { ok:false, code }. */
export async function compressPhoto(file, { maxEdge = PHOTO_MAX_EDGE, quality = PHOTO_QUALITY } = {}) {
  const problem = photoFileProblem(file)
  if (problem) return { ok: false, ...problem }
  let source
  try {
    source = await createImageBitmap(file)
  } catch {
    // A HEIC (or a corrupt file) that the browser cannot decode lands here.
    return { ok: false, code: 'decode' }
  }
  try {
    const longest = Math.max(source.width, source.height) || 1
    const scale = Math.min(1, maxEdge / longest)
    const width = Math.max(1, Math.round(source.width * scale))
    const height = Math.max(1, Math.round(source.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return { ok: false, code: 'decode' }
    // JPEG has no alpha, so a transparent PNG gets white rather than black.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(source, 0, 0, width, height)
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    if (!dataUrl.startsWith('data:image/jpeg')) return { ok: false, code: 'decode' }
    return { ok: true, dataUrl, width, height, type: 'image/jpeg' }
  } finally {
    source.close?.()
  }
}

/** Whole-set budget: 2 MB decoded once the photos are base64-encoded into the submission. */
export function photosTotalBytes(photos) {
  return (photos || []).reduce((sum, photo) => sum + dataUrlBytes(photo.dataUrl), 0)
}

export function photosOverBudget(photos) {
  return photosTotalBytes(photos) > MAX_PHOTOS_TOTAL_BYTES
}
