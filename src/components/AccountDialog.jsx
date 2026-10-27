import { tx } from '../i18nAuto.js'
import { useEffect, useRef, useState } from 'react'
import { GoogleSignInButton } from './GoogleSignInButton.jsx'
import { Icon } from './Icon.jsx'

export function AccountDialog({ open, onClose, clientId, nonce, signingIn, signInError, onGoogleCredential, onEmailAuth }) {
  const dialog = useRef(null)
  const [emailMode, setEmailMode] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) {
      setEmailMode(null)
      setShowPassword(false)
    }
  }

  useEffect(() => {
    const node = dialog.current
    if (!node) return undefined
    if (open && !node.open) node.showModal()
    if (!open && node.open) node.close()
    return undefined
  }, [open])

  useEffect(() => {
    const node = dialog.current
    if (!node) return undefined
    node.setAttribute('closedby', 'any')
    const onDialogClose = () => onClose()
    node.addEventListener('close', onDialogClose)
    let onClick
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      onClick = (event) => {
        if (event.target !== node) return
        const rect = node.getBoundingClientRect()
        const inside =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        if (!inside) node.close()
      }
      node.addEventListener('click', onClick)
    }
    return () => {
      node.removeEventListener('close', onDialogClose)
      if (onClick) node.removeEventListener('click', onClick)
    }
  }, [onClose])

  return (
    <dialog className="account-dialog" ref={dialog} aria-labelledby="account-title">
      <button type="button" className="icon-button modal-close" aria-label={tx("Close")} onClick={() => dialog.current?.close()}>
        <Icon name="close" size={18} />
      </button>
      <p className="eyebrow">{tx("Account")}</p>
      <h2 id="account-title">{emailMode === 'create' ? 'Sign up without Google' : emailMode === 'sign-in' ? 'Sign in with email' : 'Sign in'}</h2>
      <p className="setup-intro">{tx("Search stays open either way. Signing in keeps your letter, saved apartments, and steps on this account, so another phone can open them.")}</p>
      {emailMode ? (
        <form
          className="setup-fields account-email-form"
          onSubmit={(event) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            onEmailAuth({
              email: String(data.get('email') || ''),
              password: String(data.get('password') || ''),
              mode: emailMode,
            })
          }}
        >
          <label htmlFor="email">Email
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              enterKeyHint="next"
              required
            />
          </label>
          <p className="setup-note">{tx("This email is the name of the account, so another phone can open the same letter.")}</p>
          <label htmlFor={emailMode === 'create' ? 'new-password' : 'current-password'}>{tx("Password")}
            <span className="password-line">
              <input
                id={emailMode === 'create' ? 'new-password' : 'current-password'}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={emailMode === 'create' ? 'new-password' : 'current-password'}
                minLength={8}
                maxLength={200}
                enterKeyHint="done"
                required
              />
              <button type="button" onClick={() => setShowPassword((current) => !current)}>
                {showPassword ? 'Hide password' : 'Show password'}
              </button>
            </span>
          </label>
          <button className="button" type="submit" disabled={signingIn}>{emailMode === 'create' ? 'Create account' : 'Sign in'}</button>
          <button
            className="button button-quiet"
            type="button"
            onClick={() => setEmailMode(emailMode === 'create' ? 'sign-in' : 'create')}
          >
            {emailMode === 'create' ? 'I already have an email account' : 'Create an email account'}
          </button>
          {emailMode === 'create' && <p className="setup-note">{tx("Next you’ll enter what’s on your letter. If you forget the password, LeasePath cannot email a reset yet.")}</p>}
          <p className="setup-note"><a href="/privacy">{tx("Privacy notice")}</a> · <a href="/terms">{tx("Terms of Service")}</a></p>
          <button className="button button-quiet" type="button" onClick={() => setEmailMode(null)}>{tx("Back to Google")}</button>
        </form>
      ) : (
        <>
          <GoogleSignInButton clientId={clientId} nonce={nonce} onCredential={onGoogleCredential} active={open} />
          <button type="button" className="button button-quiet account-email-start" onClick={() => setEmailMode('create')}>
            {tx("Sign up without Google")}
          </button>
        </>
      )}
      {signingIn && <p className="setup-note">{tx("Signing in…")}</p>}
      {signInError && <p className="account-empty" role="status">{signInError}</p>}
    </dialog>
  )
}
