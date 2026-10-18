// localStorage can throw (blocked storage, Safari private mode, quota). The app keeps working
// for the visit when that happens, and the letter just is not remembered.
export function readItem(key) {
  try {
    return globalThis.localStorage?.getItem(key) ?? null
  } catch {
    return null
  }
}

export function writeItem(key, value) {
  try {
    const storage = globalThis.localStorage
    if (!storage) return false
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function readJson(key, fallback) {
  const raw = readItem(key)
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}
