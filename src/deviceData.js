/** Everything LeasePath keeps on this device lives under keys that start with this prefix. */
export const DEVICE_PREFIX = 'leasepath'

/**
 * Erase LeasePath data on this device: localStorage and sessionStorage keys (plan, voucher program, household size,
 * letter amount, utilities, income in leasepath.checks, saved ids, steps, intent, neighborhood, cookie choice),
 * and any IndexedDB database named for LeasePath. Returns the keys it removed.
 */
export async function clearDeviceData({ storages, idb } = {}) {
  const targets = storages || [globalThis.localStorage, globalThis.sessionStorage].filter(Boolean)
  const removed = []
  for (const storage of targets) {
    try {
      const keys = []
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i)
        if (key && key.startsWith(DEVICE_PREFIX)) keys.push(key)
      }
      for (const key of keys) {
        storage.removeItem(key)
        removed.push(key)
      }
    } catch {
      // Blocked storage: nothing to clear.
    }
  }
  const db = idb === undefined ? globalThis.indexedDB : idb
  if (db?.databases) {
    try {
      const list = await db.databases()
      for (const { name } of list) {
        if (name && name.toLowerCase().startsWith(DEVICE_PREFIX)) db.deleteDatabase(name)
      }
    } catch {
      // Older browsers cannot list databases. LeasePath does not create any.
    }
  }
  return removed
}

export const CONFIRM_WORD = 'DELETE'
export const confirmMatches = (text) => String(text || '').trim() === CONFIRM_WORD
