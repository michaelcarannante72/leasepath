import { tx } from '../i18nAuto.js'
import { useState } from 'react'
import { HOUSING_CONNECT } from '../data/matchFeed.js'
import {
  MATCH_BEDROOMS,
  MATCH_BOROUGHS,
  MATCH_PROGRAMS,
  notificationPermission,
  notificationSupported,
  requestNotifyPermission,
  runMatchCheck,
  saveMatchPrefs,
} from '../matchAlerts.js'

function bedLabel(value) {
  if (value === '') return 'Any size'
  if (value === '0') return 'Studio / 0 BR'
  return `${value} BR`
}

export function MatchAlertsCard({ prefs, onPrefs, seed }) {
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const perm = notificationPermission()

  const update = (patch) => {
    const next = saveMatchPrefs({ ...prefs, ...patch })
    onPrefs(next)
    return next
  }

  const enable = async () => {
    setBusy(true)
    setStatus('')
    try {
      const base = {
        ...prefs,
        enabled: true,
        borough: prefs.borough || seed?.borough || '',
        bedrooms: prefs.bedrooms || seed?.bedrooms || '',
        program: prefs.program || seed?.program || '',
      }
      let next = saveMatchPrefs(base)
      onPrefs(next)
      const result = await runMatchCheck(next)
      onPrefs(result.prefs)
      setStatus(
        result.matches.length
          ? `Found ${result.matches.length} match${result.matches.length === 1 ? '' : 'es'} on this device. Review below or in Search.`
          : 'Alerts on. LeasePath will check this phone when you open the app. Nothing is sent to a server.',
      )
    } finally {
      setBusy(false)
    }
  }

  const askNotify = async () => {
    setBusy(true)
    setStatus('')
    try {
      const result = await requestNotifyPermission()
      if (result === 'granted') {
        const next = update({ notify: true, enabled: true })
        setStatus('Phone notifications on. LeasePath only asks when something new matches on this device.')
        const check = await runMatchCheck(next)
        onPrefs(check.prefs)
      } else if (result === 'denied') {
        update({ notify: false })
        setStatus('Notifications blocked in the browser. In-app alerts still work when alerts are on.')
      } else {
        setStatus('This browser cannot show notifications. In-app alerts still work.')
      }
    } finally {
      setBusy(false)
    }
  }

  const disable = () => {
    update({ enabled: false, notify: false })
    setStatus('Match alerts off. Saved preferences stay on this phone until you clear them.')
  }

  return (
    <section className="panel match-alerts-card" aria-labelledby="match-alerts-title">
      <h2 id="match-alerts-title">{tx("Match alerts")}</h2>
      <p>
        {tx("Opt in to check this phone when LeasePath opens for a new Housing Connect lottery reminder or a sample voucher-ready unit that fits your borough, size, and voucher. Preferences stay on this device. LeasePath does not scrape Housing Connect and does not send your choices to a server.")}
      </p>
      <p className="device-note">
        {tx("Official lotteries:")} <a href={HOUSING_CONNECT.href} target="_blank" rel="noreferrer">{HOUSING_CONNECT.label}</a>
        {' · '}
        <a href={HOUSING_CONNECT.hpd} target="_blank" rel="noreferrer">{tx("HPD Housing Connect page")}</a>
        {HOUSING_CONNECT.hotline ? (
          <>
            {' · '}{tx("Applicant hotline")} <a href={`tel:${HOUSING_CONNECT.hotline.replace(/\D/g, '')}`}>{HOUSING_CONNECT.hotline}</a>
          </>
        ) : null}
      </p>

      <div className="match-alert-fields">
        <label>
          <span>{tx("Borough")}</span>
          <select
            value={prefs.borough}
            onChange={(event) => update({ borough: event.target.value })}
            disabled={busy}
          >
            <option value="">{tx("Any borough")}</option>
            {MATCH_BOROUGHS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{tx("Bedroom size")}</span>
          <select
            value={prefs.bedrooms}
            onChange={(event) => update({ bedrooms: event.target.value })}
            disabled={busy}
          >
            <option value="">{tx("Any size")}</option>
            {MATCH_BEDROOMS.map((value) => (
              <option key={value} value={value}>{bedLabel(value)}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{tx("Voucher")}</span>
          <select
            value={prefs.program}
            onChange={(event) => update({ program: event.target.value })}
            disabled={busy}
          >
            <option value="">{tx("Any voucher")}</option>
            {MATCH_PROGRAMS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="button-row">
        {!prefs.enabled ? (
          <button type="button" className="button" disabled={busy} onClick={enable}>
            {tx("Turn on match alerts")}
          </button>
        ) : (
          <button type="button" className="button button-quiet" disabled={busy} onClick={disable}>
            {tx("Turn off alerts")}
          </button>
        )}
        {notificationSupported() && prefs.enabled && perm !== 'granted' ? (
          <button type="button" className="button" disabled={busy} onClick={askNotify}>
            {tx("Allow phone notifications")}
          </button>
        ) : null}
        {prefs.enabled && perm === 'granted' && prefs.notify ? (
          <span className="fine">{tx("Phone notifications allowed")}</span>
        ) : null}
      </div>
      {status ? <p className="fine match-alert-status" role="status">{status}</p> : null}
      {prefs.enabled ? (
        <p className="fine">
          {tx("Watching:")} {prefs.borough || 'any borough'} · {bedLabel(prefs.bedrooms)} · {prefs.program || 'any voucher'}{tx(". Last check stays on this phone only.")}
        </p>
      ) : null}
    </section>
  )
}

export function MatchAlertBanner({ matches, onDismiss, onOpen }) {
  if (!matches?.length) return null
  const first = matches[0]
  return (
    <aside className="match-alert-banner" role="status" aria-labelledby="match-banner-title">
      <div>
        <h2 id="match-banner-title">
          {matches.length === 1 ? 'New match on this device' : `${matches.length} new matches on this device`}
        </h2>
        <p>{first.title}{matches.length > 1 ? ` and ${matches.length - 1} more` : ''}{tx(". Preferences stay on this phone.")}</p>
      </div>
      <div className="button-row">
        <button type="button" className="button" onClick={onOpen}>{tx("Review")}</button>
        <button type="button" className="button button-quiet" onClick={onDismiss}>{tx("Dismiss")}</button>
      </div>
    </aside>
  )
}
