import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from './Icon.jsx'

export function Header({ canInstall, onInstall, planCurrent }) {
  const [accountOpen, setAccountOpen] = useState(false)
  const closeButton = useRef(null)
  const closeAccount = useCallback(() => setAccountOpen(false), [])

  return (
    <header className="topbar">
      <a className="brand" href="#/">
        <img className="brand-mark" src="/favicon.svg" alt="" width="36" height="36" />
        <span className="brand-name">Lease<span>Path</span></span>
      </a>
      <p className="topbar-note"><span className="status-dot" aria-hidden="true" /> Your housing journey, one step at a time</p>
      <div className="topbar-actions">
        {canInstall && (
          <button type="button" className="install-button" onClick={onInstall}>
            Install app
          </button>
        )}
        <a className="plan-pill" href="#/plan" aria-current={planCurrent ? 'page' : undefined}>
          <span className="plan-mark" aria-hidden="true"><Icon name="heart" size={15} /></span>
          <span className="plan-pill-label">My voucher</span>
          <Icon name="chevron" size={16} />
        </a>
        <button type="button" className="account-button" onClick={() => setAccountOpen(true)}>
          <span className="account-long">Sign up / Sign in</span>
          <span className="account-short">Sign in</span>
        </button>
      </div>
      {accountOpen && <AccountDialog closeButton={closeButton} onClose={closeAccount} />}
    </header>
  )
}

function AccountDialog({ closeButton, onClose }) {
  const [mode, setMode] = useState('sign-in')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    closeButton.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeButton, onClose])

  const finish = (event) => {
    event.preventDefault()
    const link = event.currentTarget?.name === 'magic-link'
    setNotice(link
      ? 'Email links are not open yet. You can keep searching, saving samples, and reading resources without an account.'
      : 'Accounts are not open yet. You can keep searching, saving samples, and reading resources without one.')
  }

  return (
    <div className="sheet-backdrop modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="setup-modal account-modal" role="dialog" aria-modal="true" aria-labelledby="account-title">
        <button ref={closeButton} type="button" className="icon-button modal-close" aria-label="Close" onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
        <p className="eyebrow">Account</p>
        <h2 id="account-title">{mode === 'sign-up' ? 'Create an account' : 'Sign in'}</h2>
        <p className="setup-intro">Search stays open either way. An account will be for saving listings and other personal features later.</p>
        <div className="account-switch" role="group" aria-label="Account action">
          <button type="button" className={mode === 'sign-in' ? 'is-on' : ''} aria-pressed={mode === 'sign-in'} onClick={() => { setMode('sign-in'); setNotice('') }}>
            Sign in
          </button>
          <button type="button" className={mode === 'sign-up' ? 'is-on' : ''} aria-pressed={mode === 'sign-up'} onClick={() => { setMode('sign-up'); setNotice('') }}>
            Sign up
          </button>
        </div>
        <form className="setup-fields" onSubmit={finish}>
          <label>
            <span>Email</span>
            <input type="email" name="email" autoComplete="email" required placeholder="you@example.com" />
          </label>
          <label>
            <span>Password</span>
            <input type="password" name="password" autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} required minLength={8} placeholder="At least 8 characters" />
          </label>
          {notice && <p className="account-empty" role="status">{notice}</p>}
          <div className="setup-actions">
            <button type="button" className="button button-quiet" name="magic-link" onClick={finish}>Email me a link</button>
            <button type="submit" className="button">{mode === 'sign-up' ? 'Create account' : 'Sign in'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
