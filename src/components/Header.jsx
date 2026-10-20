import { useEffect, useState } from 'react'
import { AccountDialog } from './AccountDialog.jsx'
import { NAV_TABS } from '../navTabs.js'
import { Icon } from './Icon.jsx'

export function Header({ canInstall, onInstall, planCurrent, session, signingIn, signInError, onGoogleCredential, onEmailAuth, onSignOut, navActive, onNav }) {
  const [accountOpen, setAccountOpen] = useState(false)
  const closeAccount = () => setAccountOpen(false)
  if (session?.signedIn && accountOpen) setAccountOpen(false)
  useEffect(() => {
    const open = () => setAccountOpen(true)
    window.addEventListener('leasepath:open-account', open)
    return () => window.removeEventListener('leasepath:open-account', open)
  }, [])

  return (
    <header className="topbar">
      <a className="brand" href="#/">
        <img className="brand-mark" src="/favicon.svg" alt="" width="36" height="36" />
        <span className="brand-name">Lease<span>Path</span></span>
      </a>
      <p className="topbar-note">HASA · CityFHEPS · Section 8</p>
      {onNav && (
        <nav className="topnav" aria-label="Main">
          {NAV_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={navActive === tab.id ? 'is-active' : ''}
              aria-current={navActive === tab.id ? 'page' : undefined}
              onClick={() => onNav(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}
      <div className="topbar-actions">
        {canInstall && (
          <button type="button" className="install-button" onClick={onInstall}>
            <span className="install-long">Install app</span>
            <span className="install-short">Install</span>
          </button>
        )}
        <a className="plan-pill" href="#/plan" aria-current={planCurrent ? 'page' : undefined}>
          <span className="plan-mark" aria-hidden="true"><Icon name="heart" size={15} /></span>
          <span className="plan-pill-label">My voucher</span>
          <Icon name="chevron" size={16} />
        </a>
        {session?.signedIn ? (
          <>
            <span className="account-email" title={session.email}>{session.email}</span>
            <button type="button" className="account-button" onClick={onSignOut}>
              <span className="account-long">Sign out</span>
              <span className="account-short">Sign out</span>
            </button>
          </>
        ) : (
          <button type="button" className="account-button" onClick={() => setAccountOpen(true)}>
            <span className="account-long">Sign up / Sign in</span>
            <span className="account-short">Sign in</span>
          </button>
        )}
      </div>
      {session?.signedIn && signInError ? <p className="account-sync-error" role="status">{signInError}</p> : null}
      <AccountDialog
        open={accountOpen}
        onClose={closeAccount}
        clientId={session?.googleClientId || ''}
        nonce={session?.googleNonce || ''}
        signingIn={signingIn}
        signInError={signInError}
        onGoogleCredential={onGoogleCredential}
        onEmailAuth={onEmailAuth}
      />
    </header>
  )
}
