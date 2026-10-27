/**
 * On-device document checklist and deadline tracker.
 * Everything stays in localStorage on this phone. Nothing is uploaded.
 */
export const DOCS_KEY = 'leasepath.docsTracker'
export const PRIVACY_NOTE =
  'Stays on your phone. LeasePath never uploads this checklist or these dates. Clear it any time with Delete all on this page.'

/** Shopping letter windows published by the programs. CityFHEPS / FHEPS: 120 days (DSS-7r). */
export const SHOPPING_LETTER_DAYS_BY_PROGRAM = {
  CityFHEPS: 120,
  FHEPS: 120,
  HASA: 120,
  'Section 8': 0, // Voucher paperwork — use the date on your letter; no fixed app default.
}

const BASE_DOCS = [
  { id: 'photo-id', label: 'Photo ID (state ID, driver’s license, or passport)' },
  { id: 'ssn-card', label: 'Social Security card (or official SSA letter)' },
  { id: 'birth-certs', label: 'Birth certificates for everyone on the case' },
  { id: 'income-proof', label: 'Income proof (pay stubs, award letters, or tax return)' },
  { id: 'bank-statements', label: 'Recent bank statements, if your worker asked for them' },
  { id: 'lease-packet', label: 'Lease and apartment packet from the landlord or broker' },
]

const PROGRAM_DOCS = {
  CityFHEPS: [
    { id: 'shopping-letter', label: 'CityFHEPS shopping letter (DSS)' },
    { id: 'household-share', label: 'Household share letter (for you — not for the landlord)' },
    ...BASE_DOCS,
    { id: 'landlord-forms', label: 'Landlord / broker CityFHEPS forms your worker sent' },
  ],
  FHEPS: [
    { id: 'shopping-letter', label: 'FHEPS shopping letter' },
    ...BASE_DOCS,
    { id: 'landlord-forms', label: 'Landlord / broker FHEPS forms your worker sent' },
  ],
  HASA: [
    { id: 'shopping-letter', label: 'HASA housing packet / shopping paperwork' },
    ...BASE_DOCS,
    { id: 'hasa-caseworker', label: 'Your HASA caseworker’s contact and any forms they gave you' },
  ],
  'Section 8': [
    { id: 'shopping-letter', label: 'Section 8 voucher / shopping paperwork from NYCHA or HPD' },
    ...BASE_DOCS,
    { id: 'rfta', label: 'Request for Tenancy Approval (RFTA) or equivalent agency form' },
  ],
}

export function docsForProgram(program) {
  const key = PROGRAM_DOCS[program] ? program : null
  if (key) return PROGRAM_DOCS[key].map((item) => ({ ...item }))
  return [
    { id: 'shopping-letter', label: 'Shopping letter or voucher paperwork from your worker' },
    ...BASE_DOCS.map((item) => ({ ...item })),
  ]
}

export function emptyState(program = '') {
  return {
    program: program || '',
    checked: {},
    deadlines: {
      letterIssued: '',
      letterExpires: '',
      inspection: '',
      leaseSigning: '',
    },
    notes: '',
    updatedAt: null,
  }
}

function getStore(storage) {
  return storage || globalThis.localStorage
}

export function loadDocs(storage) {
  let raw = null
  try {
    const text = getStore(storage)?.getItem(DOCS_KEY)
    if (text) raw = JSON.parse(text)
  } catch {
    raw = null
  }
  if (!raw || typeof raw !== 'object') return emptyState()
  return {
    ...emptyState(raw.program || ''),
    ...raw,
    checked: raw.checked && typeof raw.checked === 'object' ? raw.checked : {},
    deadlines: {
      ...emptyState().deadlines,
      ...(raw.deadlines && typeof raw.deadlines === 'object' ? raw.deadlines : {}),
    },
  }
}

export function saveDocs(state, storage) {
  const next = { ...state, updatedAt: new Date().toISOString() }
  try {
    const store = getStore(storage)
    if (!store) return { ok: false, state: next }
    store.setItem(DOCS_KEY, JSON.stringify(next))
    return { ok: true, state: next }
  } catch {
    return { ok: false, state: next }
  }
}

export function clearDocs(storage) {
  try {
    getStore(storage)?.removeItem(DOCS_KEY)
    return true
  } catch {
    return false
  }
}

/** YYYY-MM-DD → Date at local noon (avoids TZ edge on ICS all-day). */
export function parseDateInput(value) {
  const raw = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  const [y, m, d] = raw.split('-').map(Number)
  const dt = new Date(y, m - 1, d, 12, 0, 0, 0)
  return Number.isNaN(dt.getTime()) ? null : dt
}

export function formatDateInput(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(date, days) {
  const next = new Date(date.getTime())
  next.setDate(next.getDate() + Number(days || 0))
  return next
}

export function suggestLetterExpiry(program, issuedValue) {
  const issued = parseDateInput(issuedValue)
  if (!issued) return ''
  const days = SHOPPING_LETTER_DAYS_BY_PROGRAM[program]
  if (!days) return ''
  return formatDateInput(addDays(issued, days))
}

export function checklistProgress(state) {
  const docs = docsForProgram(state.program)
  const total = docs.length
  let done = 0
  for (const doc of docs) {
    if (state.checked?.[doc.id]) done += 1
  }
  return { done, total, docs }
}

function icsEscape(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function icsDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

/**
 * Build a simple all-day .ics calendar for the deadlines the person filled in.
 * Reminder: morning of the day (VALARM) when the browser/calendar supports it.
 */
export function buildDeadlineIcs(state, now = new Date()) {
  const events = []
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const push = (dateValue, summary, description) => {
    const date = parseDateInput(dateValue)
    if (!date) return
    const day = icsDate(date)
    const uid = `${day}-${summary.replace(/\W+/g, '').slice(0, 24)}@leasepath.app`
    events.push(
      [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${day}`,
        `SUMMARY:${icsEscape(summary)}`,
        `DESCRIPTION:${icsEscape(description)}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT9H',
        'ACTION:DISPLAY',
        `DESCRIPTION:${icsEscape(summary)}`,
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n'),
    )
  }

  push(
    state.deadlines?.letterExpires,
    'LeasePath: shopping letter expires',
    'Your shopping letter or voucher paperwork may expire on this date. Confirm with your worker. Dates stay on your phone in LeasePath.',
  )
  push(
    state.deadlines?.inspection,
    'LeasePath: apartment inspection',
    'Inspection or walkthrough date you saved in LeasePath. Confirm with the landlord and your worker.',
  )
  push(
    state.deadlines?.leaseSigning,
    'LeasePath: lease signing',
    'Lease-signing date you saved in LeasePath. Bring your checklist documents. Confirm with your worker.',
  )

  if (events.length === 0) return null
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LeasePath//Docs Deadline Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcs(icsText, filename = 'leasepath-deadlines.ics') {
  if (!icsText || typeof document === 'undefined') return false
  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return true
}

/** Best-effort local notification permission + schedule for one deadline (same-day morning). */
export async function requestLocalReminder(title, dateValue, body) {
  const date = parseDateInput(dateValue)
  if (!date || typeof Notification === 'undefined') {
    return { ok: false, reason: 'unsupported' }
  }
  let permission = Notification.permission
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission()
    } catch {
      return { ok: false, reason: 'denied' }
    }
  }
  if (permission !== 'granted') return { ok: false, reason: 'denied' }

  const fireAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0, 0)
  const delay = fireAt.getTime() - Date.now()
  if (delay <= 0) {
    // Already due — show once now so the person still gets a heads-up.
    new Notification(title, { body, tag: `leasepath-${title}` })
    return { ok: true, reason: 'shown' }
  }
  // Page-lifetime timer only. Export .ics for a durable calendar reminder.
  const id = setTimeout(() => {
    try {
      new Notification(title, { body, tag: `leasepath-${title}` })
    } catch {
      /* ignore */
    }
  }, Math.min(delay, 2_147_000_000))
  return { ok: true, reason: 'scheduled', timerId: id }
}

export { PROGRAM_DOCS, BASE_DOCS }
