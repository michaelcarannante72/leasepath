/** Online / offline helpers. No network calls — only the browser's onLine flag and events. */

export function isOnline(win = globalThis) {
  if (typeof win?.navigator?.onLine === 'boolean') return win.navigator.onLine
  return true
}

export function subscribeOnline(listener, win = globalThis) {
  if (!win?.addEventListener) return () => {}
  const update = () => listener(isOnline(win))
  win.addEventListener('online', update)
  win.addEventListener('offline', update)
  return () => {
    win.removeEventListener('online', update)
    win.removeEventListener('offline', update)
  }
}

/** Routes that keep working from the cached app shell while offline. */
export const OFFLINE_READY = [
  { hash: '/', label: 'Search' },
  { hash: '/steps', label: 'Steps (docs checklist)' },
  { hash: '/resources', label: 'Resources' },
  { hash: '/plan', label: 'My voucher' },
  { hash: '/blog', label: 'Blog' },
  { hash: '/after-you-find', label: 'After you find' },
]
