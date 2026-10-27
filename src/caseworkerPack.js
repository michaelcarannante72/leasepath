/**
 * On-device caseworker share pack. Reads checklist / plan / optional listing-check
 * and docs-tracker blobs from this phone only, builds a PDF in memory, and never
 * POSTs it. Share via the browser share sheet or a local download.
 */

import { STEPS } from './data.js'
import { readJson } from './storage.js'

export const PLAN_KEY = 'leasepath.plan'
export const STEPS_KEY = 'leasepath.steps'
export const CHECKS_KEY = 'leasepath.checks'
/** Optional: paste-a-listing checker writes here when that feature is present. */
export const LISTING_CHECK_KEY = 'leasepath.listingCheck'
/** Optional: docs tracker writes here when that feature is present. */
export const DOCS_TRACKER_KEY = 'leasepath.docsTracker'

export const PACK_ROUTE = '/caseworker-pack'
export const PACK_TITLE = 'Caseworker share pack'
export const LAST_REVIEWED = 'October 27, 2026'

export function loadPackSnapshot(read = readJson) {
  const plan = normalizeObject(read(PLAN_KEY, {}))
  const checks = normalizeObject(read(CHECKS_KEY, {}))
  const checked = Array.isArray(read(STEPS_KEY, []))
    ? read(STEPS_KEY, []).filter((i) => Number.isInteger(i))
    : []
  const listingCheck = normalizeObject(read(LISTING_CHECK_KEY, null))
  const docsTracker = normalizeObject(read(DOCS_TRACKER_KEY, null))
  return {
    generatedAt: new Date().toISOString(),
    plan,
    checks,
    steps: STEPS.map((step, index) => ({
      title: step.title,
      detail: step.detail,
      done: checked.includes(index),
    })),
    listingCheck: listingCheck && hasAnyValue(listingCheck) ? listingCheck : null,
    docsTracker: docsTracker && hasAnyValue(docsTracker) ? docsTracker : null,
  }
}

function normalizeObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value
}

function hasAnyValue(obj) {
  return Object.values(obj).some((v) => {
    if (v == null) return false
    if (typeof v === 'string') return v.trim().length > 0
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'object') return hasAnyValue(v)
    return true
  })
}

export function packLines(snapshot) {
  const lines = [
    'LeasePath — Caseworker share pack',
    'On-device only. Not an agency form. Confirm with your worker.',
    `Generated: ${snapshot.generatedAt}`,
    '',
    '— My voucher (from this phone) —',
  ]
  const plan = snapshot.plan || {}
  lines.push(`Program: ${plan.program || '(not set)'}`)
  lines.push(`Household size: ${plan.household || '(not set)'}`)
  lines.push(`Letter rent: ${plan.letterRent ? `$${plan.letterRent}` : '(not set)'}`)
  lines.push(`Utilities note: ${plan.utilities || '(not set)'}`)
  lines.push(`Situation: ${plan.situation || '(not set)'}`)
  lines.push(`Receiving: ${plan.receiving || '(not set)'}`)

  const checks = snapshot.checks || {}
  lines.push('')
  lines.push('— Letter / rent checks (device only) —')
  lines.push(`Letter date: ${checks.letterDate || '(not set)'}`)
  lines.push(`Section 8 agency: ${checks.section8Agency || '(not set)'}`)
  lines.push(`Voucher bedrooms: ${checks.voucherBedrooms || '(not set)'}`)
  lines.push(`CityFHEPS allowance row: ${checks.cityfhepsAllowance || '(not set)'}`)
  // Income stays on device; include only if the person already entered it locally.
  if (checks.incomeAmount) {
    lines.push(`Income (device): $${checks.incomeAmount} / ${checks.incomePeriod || 'month'}`)
  }

  lines.push('')
  lines.push('— Steps checklist —')
  for (const step of snapshot.steps) {
    lines.push(`${step.done ? '[x]' : '[ ]'} ${step.title}`)
  }

  lines.push('')
  if (snapshot.listingCheck) {
    lines.push('— Paste-a-listing check (from this phone) —')
    for (const [key, value] of Object.entries(snapshot.listingCheck)) {
      lines.push(`${labelize(key)}: ${stringifyValue(value)}`)
    }
  } else {
    lines.push('— Paste-a-listing check —')
    lines.push('(No listing check saved on this phone yet.)')
  }

  lines.push('')
  if (snapshot.docsTracker) {
    lines.push('— Docs tracker (from this phone) —')
    for (const [key, value] of Object.entries(snapshot.docsTracker)) {
      lines.push(`${labelize(key)}: ${stringifyValue(value)}`)
    }
  } else {
    lines.push('— Docs tracker —')
    lines.push('(No docs tracker saved on this phone yet.)')
  }

  lines.push('')
  lines.push('LeasePath does not send this pack to a server. You share it yourself.')
  return lines
}

function labelize(key) {
  return String(key)
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

function stringifyValue(value) {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(stringifyValue).join('; ')
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/** Escape PDF literal string (parentheses and backslash). */
function pdfEscape(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

/**
 * Build a minimal one-page-or-more PDF (Helvetica) from plain lines.
 * Pure JS, no network. Returns a Uint8Array.
 */
export function buildPackPdf(snapshot, lines = packLines(snapshot)) {
  const fontSize = 11
  const leading = 14
  const marginLeft = 48
  const pageWidth = 612
  const pageHeight = 792
  const top = pageHeight - 54
  const bottom = 54
  const maxWidthChars = 90

  const wrapped = []
  for (const line of lines) {
    const chunks = wrapLine(line, maxWidthChars)
    if (chunks.length === 0) wrapped.push('')
    else wrapped.push(...chunks)
  }

  const pages = []
  let current = []
  let y = top
  for (const line of wrapped) {
    if (y < bottom) {
      pages.push(current)
      current = []
      y = top
    }
    current.push({ line, y })
    y -= leading
  }
  if (current.length || pages.length === 0) pages.push(current)

  const objects = []
  const add = (body) => {
    objects.push(body)
    return objects.length
  }

  const kids = []
  const contentIds = []
  for (const page of pages) {
    const parts = [`BT /F1 ${fontSize} Tf`]
    for (const { line, y: yy } of page) {
      parts.push(`1 0 0 1 ${marginLeft} ${yy} Tm (${pdfEscape(line)}) Tj`)
    }
    parts.push('ET')
    const stream = parts.join('\n')
    const contentId = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
    contentIds.push(contentId)
  }

  const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  for (let i = 0; i < pages.length; i += 1) {
    const pageId = add(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentIds[i]} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`,
    )
    kids.push(pageId)
  }
  const pagesId = add(`<< /Type /Pages /Kids [${kids.map((id) => `${id} 0 R`).join(' ')}] /Count ${kids.length} >>`)
  // Patch parent refs now that pagesId is known.
  for (const id of kids) {
    objects[id - 1] = objects[id - 1].replace('/Parent 0 0 R', `/Parent ${pagesId} 0 R`)
  }
  const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(utf8ByteLength(pdf))
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`
  }
  const xrefStart = utf8ByteLength(pdf)
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  return new TextEncoder().encode(pdf)
}


function utf8ByteLength(text) {
  return new TextEncoder().encode(text).length
}

function wrapLine(line, max) {
  const text = String(line)
  if (text.length <= max) return [text]
  const words = text.split(/\s+/)
  const out = []
  let cur = ''
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word
    if (next.length > max && cur) {
      out.push(cur)
      cur = word
    } else {
      cur = next
    }
  }
  if (cur) out.push(cur)
  return out
}

export function packFilename(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `leasepath-caseworker-pack-${y}${m}${d}.pdf`
}

/**
 * Share the PDF via the Web Share API when files are supported; otherwise download.
 * Never uploads. Returns { method: 'share' | 'download' }.
 */
export async function shareOrDownloadPack(pdfBytes, {
  filename = packFilename(),
  share = typeof navigator !== 'undefined' ? navigator.share?.bind(navigator) : null,
  canShare = typeof navigator !== 'undefined' ? navigator.canShare?.bind(navigator) : null,
  download = defaultDownload,
} = {}) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const file = typeof File === 'function' ? new File([blob], filename, { type: 'application/pdf' }) : null
  if (share && file && (!canShare || canShare({ files: [file] }))) {
    try {
      await share({ files: [file], title: PACK_TITLE, text: 'LeasePath caseworker pack from my phone.' })
      return { method: 'share' }
    } catch (error) {
      if (error?.name === 'AbortError') return { method: 'share', aborted: true }
      // Fall through to download.
    }
  }
  download(blob, filename)
  return { method: 'download' }
}

function defaultDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
