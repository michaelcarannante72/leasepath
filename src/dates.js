const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** Parse YYYY-MM-DD into a UTC day number. Returns null for anything that is not a real calendar date. */
export function dayNumber(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''))
  if (!match) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const ms = Date.UTC(year, month - 1, day)
  const check = new Date(ms)
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null
  return ms / 86_400_000
}

export function fromDayNumber(days) {
  return new Date(days * 86_400_000).toISOString().slice(0, 10)
}

/** Today as YYYY-MM-DD on the device's own calendar (not UTC), so a letter dated today counts as day 0. */
export function localToday(now = new Date()) {
  const pad = (number) => String(number).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function formatDate(value) {
  const days = dayNumber(value)
  if (days === null) return ''
  const [year, month, day] = value.split('-').map(Number)
  return `${MONTHS[month - 1]} ${day}, ${year}`
}
