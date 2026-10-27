import { tx } from '../i18nAuto.js'
import { useEffect, useRef, useState } from 'react'
import { loadGoogleSignIn } from '../googleSignIn.js'

export function GoogleSignInButton({ clientId, nonce, onCredential, active = true }) {
  const host = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const node = host.current
    if (!active || !clientId || !nonce || !node) return undefined
    let cancel = false
    setError('')
    loadGoogleSignIn()
      .then(() => {
        if (cancel || !host.current || !window.google?.accounts?.id) return
        host.current.replaceChildren()
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => onCredential(response?.credential || ''),
          nonce,
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: 'popup',
        })
        const width = Math.max(220, Math.min(320, host.current.parentElement?.clientWidth || 280))
        window.google.accounts.id.renderButton(host.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width,
        })
      })
      .catch(() => {
        if (!cancel) setError('Google’s sign-in button did not load. Check your connection and try again.')
      })
    return () => {
      cancel = true
    }
  }, [active, clientId, nonce, onCredential])

  if (!clientId) {
    return <p className="account-empty">{tx("This server does not have a Google client id yet, so the button cannot load.")}</p>
  }
  if (!nonce) {
    return <p className="account-empty">{tx("Sign-in is still loading. Wait a moment and try again.")}</p>
  }

  return (
    <>
      <div className="google-button" ref={host} />
      {error && <p className="fine">{error}</p>}
    </>
  )
}
