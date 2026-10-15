const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

let pending = null

export function loadGoogleSignIn() {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (pending) return pending
  pending = new Promise((resolve, reject) => {
    const done = () => {
      if (window.google?.accounts?.id) resolve()
      else {
        pending = null
        reject(new Error('google'))
      }
    }
    const fail = () => {
      pending = null
      reject(new Error('google'))
    }
    let script = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
    if (!script) {
      script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      document.head.appendChild(script)
    }
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    script.addEventListener('load', done)
    script.addEventListener('error', fail)
  })
  return pending
}
