import { tx } from '../i18nAuto.js'
import { useLanguage } from './languageContext.js'

export const LEASEBOT_HASH = '#/leasebot'
export const LEASEBOT_HEADLINE = 'Your voucher just got a sidekick.'
export const LEASEBOT_SUBHEAD = 'Your AI apartment hunter for NYC voucher holders. It searches, flags scams, and follows up with landlords. You approve every message.'
export const LEASEBOT_PRIVACY = "You approve every message before it goes out. Leasebot never shares HIV status, HASA, or medical details unless you turn that on. By default it only says you have a rental subsidy. LeasePath isn't a city agency."

/** Cute app-icon mascot: a friendly little house-bot in navy and gold. */
export function LeasebotMascot({ size = 96, className = 'leasebot-mascot' } = {}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 128 128"
      role="img"
      aria-label={tx('Leasebot mascot')}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="128" height="128" rx="32" fill="#1c2d42" />
      <rect x="8" y="8" width="112" height="112" rx="26" fill="none" stroke="#f2a900" strokeWidth="4" />
      <circle cx="96" cy="28" r="6" fill="#f2a900" />
      <path d="M64 22 L64 32" stroke="#f2a900" strokeWidth="4" strokeLinecap="round" />
      <path d="M32 62 L64 36 L96 62 V98 A12 12 0 0 1 84 110 H44 A12 12 0 0 1 32 98 Z" fill="#f4f7fb" />
      <path d="M32 62 L64 36 L96 62" fill="none" stroke="#1c2d42" strokeWidth="3.5" strokeLinejoin="round" />
      <g className="leasebot-eye">
        <circle cx="54" cy="74" r="6" fill="#1c2d42" />
        <circle cx="56" cy="72.5" r="2" fill="#fff" />
      </g>
      <g className="leasebot-eye leasebot-eye-right">
        <circle cx="74" cy="74" r="6" fill="#1c2d42" />
        <circle cx="76" cy="72.5" r="2" fill="#fff" />
      </g>
      <path d="M56 88 Q64 96 72 88" fill="none" stroke="#a04a2c" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="82" r="3.5" fill="#f8c9b8" opacity="0.9" />
      <circle cx="78" cy="82" r="3.5" fill="#f8c9b8" opacity="0.9" />
      <rect x="58" y="100" width="12" height="10" rx="2" fill="#f2a900" />
    </svg>
  )
}

/** Always-visible crisis and HASA numbers. Not tied to the waitlist. */
export function LeasebotHelpNow({ headingId = 'leasebot-help-now' } = {}) {
  const { t } = useLanguage()
  return (
    <aside id="need-help-now" tabIndex={-1} className="help-now leasebot-help-now" aria-labelledby={headingId}>
      <h2 id={headingId}>{t('resources.helpNow')}</h2>
      <ul>
        <li>
          <a className="help-call" href="tel:311">{tx('Need shelter tonight? Call 311.')}</a>
        </li>
        <li>
          <a className="help-call" href="tel:718-557-1399">{tx('HASA ServiceLine: 718-557-1399, weekdays 9am to 5pm')}</a>
        </li>
      </ul>
    </aside>
  )
}

/** Bold home-page banner that leads renters to the Leasebot launch page. */
export function LeasebotBanner() {
  return (
    <section className="leasebot-banner" aria-labelledby="leasebot-banner-heading">
      <div className="leasebot-banner-main">
        <LeasebotMascot size={72} />
        <div className="leasebot-banner-copy">
          <p className="eyebrow">{tx('Coming soon')}</p>
          <h2 id="leasebot-banner-heading">{tx(LEASEBOT_HEADLINE)}</h2>
          <p>{tx(LEASEBOT_SUBHEAD)}</p>
          <div className="button-row">
            <a className="button" href={LEASEBOT_HASH}>{tx('See Leasebot')}</a>
          </div>
        </div>
      </div>
      <LeasebotHelpNow headingId="leasebot-home-help-now" />
    </section>
  )
}
