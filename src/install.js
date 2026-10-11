let deferred = null
const listeners = new Set()

function notify() {
  listeners.forEach((listener) => listener(Boolean(deferred)))
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  deferred = event
  notify()
})

window.addEventListener('appinstalled', () => {
  deferred = null
  notify()
})

export function onInstallAvailable(listener) {
  listener(Boolean(deferred))
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export async function promptInstall() {
  if (!deferred) return null
  deferred.prompt()
  const choice = await deferred.userChoice
  deferred = null
  notify()
  return choice
}
