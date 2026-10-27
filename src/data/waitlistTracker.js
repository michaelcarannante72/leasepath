/** On-device waitlist / lottery / application tracker with .ics export. */

export const STORAGE_KEY = 'leasepath.waitlistTracker'

export const KINDS = [
  { id: 'nycha', label: 'NYCHA' },
  { id: 'lottery', label: 'Housing Connect lottery' },
  { id: 'application', label: 'Other application' },
]

export function uid() {
  return `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function readEntries(storage) {
  try {
    const raw = (storage || globalThis.localStorage)?.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeEntries(entries, storage) {
  const store = storage || globalThis.localStorage
  store?.setItem(STORAGE_KEY, JSON.stringify(entries))
  return entries
}

export function clearEntries(storage) {
  try {
    (storage || globalThis.localStorage)?.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  return []
}

export function upsertEntry(entries, entry) {
  const next = [...entries]
  const i = next.findIndex((e) => e.id === entry.id)
  if (i >= 0) next[i] = entry
  else next.push(entry)
  return next
}

export function deleteEntry(entries, id) {
  return entries.filter((e) => e.id !== id)
}

/** Build a minimal VEVENT .ics for a reminder date (all-day local). */
export function toIcs(entry) {
  if (!entry?.remindOn) return null
  const day = String(entry.remindOn).replace(/-/g, '')
  if (!/^\d{8}$/.test(day)) return null
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const summary = (entry.title || 'LeasePath reminder').replace(/[,;\\]/g, ' ')
  const desc = [entry.kind, entry.status, entry.notes].filter(Boolean).join(' — ').replace(/[,;\\]/g, ' ')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LeasePath//Waitlist Tracker//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${entry.id}@leasepath.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${day}`,
    `SUMMARY:${summary}`,
    desc ? `DESCRIPTION:${desc}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')
}

export function downloadIcs(entry) {
  const body = toIcs(entry)
  if (!body || typeof document === 'undefined') return false
  const blob = new Blob([body], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(entry.title || 'reminder').replace(/\s+/g, '-').slice(0, 40)}.ics`
  a.click()
  URL.revokeObjectURL(url)
  return true
}
