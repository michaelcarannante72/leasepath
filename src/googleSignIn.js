let pending = null

export function loadGoogleSignIn() {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (pending) return pending
  pending = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      pending = null
      reject(new Error('google'))
    }
    document.head.appendChild(script)
  })
  return pending
}
