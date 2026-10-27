import { readJson, writeItem } from './storage.js'
import { matchFeed } from './data/matchFeed.js'

export const MATCH_PREFS_KEY = 'leasepath.matchAlerts'

const BOROUGHS = ['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Staten Island']
const PROGRAMS = ['CityFHEPS', 'FHEPS', 'HASA', 'Section 8']
const BEDROOMS = ['0', '1', '2', '3', '4', '5', '6', '7', '8']

export function emptyMatchPrefs() {
  return {
    enabled: false,
    notify: false,
    borough: '',
    bedrooms: '',
    program: '',
    seenIds: [],
    lastCheckedAt: '',
  }
}

export function loadMatchPrefs() {
  const stored = readJson(MATCH_PREFS_KEY, null)
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return emptyMatchPrefs()
  const seen = Array.isArray(stored.seenIds) ? stored.seenIds.filter((id) => typeof id === 'string') : []
  return {
    enabled: stored.enabled === true,
    notify: stored.notify === true,
    borough: BOROUGHS.includes(stored.borough) ? stored.borough : '',
    bedrooms: BEDROOMS.includes(String(stored.bedrooms)) ? String(stored.bedrooms) : '',
    program: PROGRAMS.includes(stored.program) ? stored.program : '',
    seenIds: seen.slice(0, 200),
    lastCheckedAt: typeof stored.lastCheckedAt === 'string' ? stored.lastCheckedAt : '',
  }
}

export function saveMatchPrefs(prefs) {
  const next = {
    ...emptyMatchPrefs(),
    ...prefs,
    seenIds: Array.isArray(prefs.seenIds) ? prefs.seenIds.filter((id) => typeof id === 'string').slice(0, 200) : [],
  }
  writeItem(MATCH_PREFS_KEY, JSON.stringify(next))
  return next
}

export function itemMatchesPrefs(item, prefs) {
  if (!prefs?.enabled) return false
  if (prefs.borough && item.borough !== prefs.borough) return false
  if (prefs.program && !(item.programs || []).includes(prefs.program)) return false
  if (prefs.bedrooms !== '' && prefs.bedrooms != null) {
    if (item.bedrooms == null) {
      // Lottery watch items have no bedroom filter — still match on borough/program.
    } else if (Number(item.bedrooms) !== Number(prefs.bedrooms)) {
      return false
    }
  }
  return true
}

export function findMatches(prefs, feed = matchFeed()) {
  if (!prefs?.enabled) return []
  return feed.filter((item) => itemMatchesPrefs(item, prefs))
}

export function findNewMatches(prefs, feed = matchFeed()) {
  const seen = new Set(prefs?.seenIds || [])
  return findMatches(prefs, feed).filter((item) => !seen.has(item.id))
}

export function markSeen(prefs, ids) {
  const seen = new Set(prefs.seenIds || [])
  for (const id of ids) seen.add(id)
  return saveMatchPrefs({
    ...prefs,
    seenIds: [...seen],
    lastCheckedAt: new Date().toISOString(),
  })
}

export function notificationSupported() {
  return typeof globalThis.Notification === 'function'
}

export function notificationPermission() {
  if (!notificationSupported()) return 'unsupported'
  try {
    return Notification.permission
  } catch {
    return 'unsupported'
  }
}

/** Must be called from a user gesture. Never request on page load. */
export async function requestNotifyPermission() {
  if (!notificationSupported()) return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function buildNotification(matches) {
  const count = matches.length
  const first = matches[0]
  const title = count === 1 ? 'LeasePath match on this device' : `${count} LeasePath matches on this device`
  const body =
    count === 1
      ? first.title
      : `${first.title} and ${count - 1} more. Preferences stay on this phone. Open LeasePath to review.`
  return { title, body, tag: 'leasepath-match', data: { ids: matches.map((m) => m.id) } }
}

/** Show a system notification from the page when permission is already granted. */
export function showPageNotification(matches) {
  if (!matches.length) return false
  if (notificationPermission() !== 'granted') return false
  const { title, body, tag, data } = buildNotification(matches)
  try {
    const note = new Notification(title, { body, tag, data })
    note.onclick = () => {
      try {
        globalThis.focus?.()
      } catch {
        /* ignore */
      }
      note.close()
    }
    return true
  } catch {
    return false
  }
}

/** Ask the service worker to show the same notification (works when the tab is backgrounded). */
export async function postMatchesToServiceWorker(matches) {
  if (!matches.length) return false
  if (notificationPermission() !== 'granted') return false
  if (!globalThis.navigator?.serviceWorker?.ready) return false
  try {
    const reg = await navigator.serviceWorker.ready
    const payload = buildNotification(matches)
    reg.active?.postMessage({ type: 'leasepath-match-alert', ...payload })
    return true
  } catch {
    return false
  }
}

export async function runMatchCheck(prefs) {
  if (!prefs?.enabled) return { prefs, matches: [], notified: false }
  const matches = findNewMatches(prefs)
  let notified = false
  if (matches.length && prefs.notify) {
    notified = (await postMatchesToServiceWorker(matches)) || showPageNotification(matches)
  }
  const next = markSeen(prefs, matches.map((m) => m.id))
  return { prefs: next, matches, notified }
}

export { BOROUGHS as MATCH_BOROUGHS, PROGRAMS as MATCH_PROGRAMS, BEDROOMS as MATCH_BEDROOMS }
