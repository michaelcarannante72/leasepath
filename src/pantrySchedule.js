const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const RECORD_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const KEPT_UPPER = { nyc: 'NYC', ny: 'NY', hiv: 'HIV', aids: 'AIDS', usa: 'USA', ymca: 'YMCA', ywca: 'YWCA' }
const SMALL_WORDS = new Set(['of', 'and', 'the', 'at', 'for', 'a', 'an'])
const COMPASS = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest']

export function parseClock(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/)
  if (!match) return null
  let hour = Number(match[1])
  const minute = Number(match[2])
  if (hour < 1 || hour > 12 || minute > 59) return null
  const meridiem = match[3].toUpperCase()
  if (meridiem === 'AM') hour = hour === 12 ? 0 : hour
  else hour = hour === 12 ? 12 : hour + 12
  return hour * 60 + minute
}

export function formatClock(minutes) {
  const hour24 = Math.floor(minutes / 60)
  const minute = minutes % 60
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour = hour24 % 12 || 12
  return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`
}

export function readableNote(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (!text || text !== text.toUpperCase()) return text
  return text.toLowerCase().replace(/(^|[^a-z0-9])([a-z])/g, (_, lead, letter) => lead + letter.toUpperCase())
}

export function pantryName(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim().replace(/\s*\((?:fp|sk|fp,sk)\)\s*$/i, '')
  if (!text) return 'Food pantry'
  if (text !== text.toUpperCase()) return text
  return text.toLowerCase().split(' ').map((word, index) => {
    const bare = word.replace(/[^a-z]/g, '')
    if (KEPT_UPPER[bare]) return word.replace(bare, KEPT_UPPER[bare])
    if (index > 0 && SMALL_WORDS.has(bare)) return word
    return word.charAt(0).toUpperCase() + word.slice(1)
  }).join(' ')
}

export function hoursFromRecord(record) {
  const hours = {}
  for (const day of RECORD_DAYS) {
    const flag = String(record[`fp_${day}`] || '').trim().toLowerCase()
    if (flag === 'closed') continue
    const windows = []
    for (let slot = 1; slot <= 3; slot += 1) {
      const open = parseClock(record[`fp_${day}_open${slot}`])
      const close = parseClock(record[`fp_${day}_close${slot}`])
      if (open == null || close == null || close <= open) continue
      windows.push([open, close])
    }
    if (windows.length) hours[day] = windows
  }
  return hours
}

export function newYorkParts(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const read = (type) => parts.find((part) => part.type === type)?.value
  const weekday = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[read('weekday')]
  return {
    weekday,
    year: Number(read('year')),
    month: Number(read('month')),
    day: Number(read('day')),
    minutes: Number(read('hour')) * 60 + Number(read('minute')),
  }
}

function timeZoneOffset(date) {
  const parts = newYorkParts(date)
  const clockAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, Math.floor(parts.minutes / 60), parts.minutes % 60)
  return clockAsUtc - date.getTime()
}

export function newYorkDate(year, month, day, minutes) {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  const guess = Date.UTC(year, month - 1, day, hour, minute)
  const adjusted = guess - timeZoneOffset(new Date(guess))
  return new Date(adjusted - (timeZoneOffset(new Date(adjusted)) - timeZoneOffset(new Date(guess))))
}

function shiftDays(parts, offset) {
  const noon = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + offset, 16, 0))
  return newYorkParts(noon)
}

export function nextOpening(hours, now = new Date()) {
  if (!hours) return null
  const here = newYorkParts(now)
  let upcoming = null
  for (let offset = 0; offset < 8; offset += 1) {
    const day = shiftDays(here, offset)
    const windows = hours[DAY_KEYS[day.weekday]] || []
    for (const [open, close] of windows) {
      const start = newYorkDate(day.year, day.month, day.day, open)
      const end = newYorkDate(day.year, day.month, day.day, close)
      if (end.getTime() <= now.getTime()) continue
      const opening = {
        openNow: start.getTime() <= now.getTime(),
        startMs: start.getTime(),
        endMs: end.getTime(),
        startMinutes: open,
        endMinutes: close,
        weekday: day.weekday,
      }
      if (opening.openNow) return opening
      if (!upcoming || opening.startMs < upcoming.startMs) upcoming = opening
    }
  }
  return upcoming
}

export function whenLabel(opening, now = new Date()) {
  if (!opening) return 'Hours were not listed. Call before you go.'
  if (opening.openNow) return `Open now, until ${formatClock(opening.endMinutes)}`
  const start = newYorkParts(new Date(opening.startMs))
  const today = newYorkParts(now)
  const tomorrow = shiftDays(today, 1)
  const clock = formatClock(opening.startMinutes)
  if (start.year === today.year && start.month === today.month && start.day === today.day) return `Opens today at ${clock}`
  if (start.year === tomorrow.year && start.month === tomorrow.month && start.day === tomorrow.day) return `Opens tomorrow at ${clock}`
  return `Opens ${WEEKDAYS[opening.weekday]} at ${clock}`
}

function toRadians(degrees) {
  return degrees * Math.PI / 180
}

export function milesBetween(from, to) {
  const earth = 3958.8
  const dLat = toRadians(to.lat - from.lat)
  const dLon = toRadians(to.lon - from.lon)
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(a)))
}

export function directionFrom(from, to) {
  const y = Math.sin(toRadians(to.lon - from.lon)) * Math.cos(toRadians(to.lat))
  const x = Math.cos(toRadians(from.lat)) * Math.sin(toRadians(to.lat))
    - Math.sin(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.cos(toRadians(to.lon - from.lon))
  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
  return COMPASS[Math.round(bearing / 45) % 8]
}

export function formatMiles(miles) {
  if (miles < 0.1) return 'Under 0.1 miles'
  if (miles < 10) {
    const rounded = miles.toFixed(1)
    return rounded === '1.0' ? '1 mile' : `${rounded} miles`
  }
  return `${Math.round(miles)} miles`
}

export function relation(miles, direction) {
  return `${formatMiles(miles)} ${direction} of you`
}

function describe(origin, pantry, now) {
  return {
    pantry,
    miles: milesBetween(origin, pantry),
    direction: directionFrom(origin, pantry),
    opening: nextOpening(pantry.hours, now),
  }
}

function rankNext(items, nearestId) {
  const others = items.filter((item) => item.pantry.id !== nearestId && item.opening)
  const openNow = others.filter((item) => item.opening.openNow).sort((a, b) => a.miles - b.miles)
  if (openNow.length) return openNow[0]
  return others.sort((a, b) => a.opening.startMs - b.opening.startMs || a.miles - b.miles)[0] || null
}

export function choosePantries(origin, pantries, now = new Date()) {
  const ranked = (pantries || [])
    .filter((pantry) => Number.isFinite(pantry.lat) && Number.isFinite(pantry.lon))
    .map((pantry) => describe(origin, pantry, now))
    .sort((a, b) => a.miles - b.miles || String(a.pantry.name).localeCompare(String(b.pantry.name)))
  if (!ranked.length) return { nearest: null, next: null }
  const nearest = ranked[0]
  let next = null
  for (const radius of [2, 5, 12, 50]) {
    next = rankNext(ranked.filter((item) => item.miles <= radius), nearest.pantry.id)
    if (next) break
  }
  return { nearest, next }
}
