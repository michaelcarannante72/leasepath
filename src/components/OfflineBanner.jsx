import { tx } from '../i18nAuto.js'
import { useEffect, useState } from 'react'
import { isOnline, OFFLINE_READY, subscribeOnline } from '../offline.js'

export function OfflineBanner() {
  const [online, setOnline] = useState(() => isOnline())

  useEffect(() => subscribeOnline(setOnline), [])

  if (online) return null

  return (
    <aside className="offline-banner" role="status" aria-live="polite" aria-labelledby="offline-banner-title">
      <h2 id="offline-banner-title">{tx("You are offline")}</h2>
      <p>
        {tx("Resources, the docs checklist (Steps), Search samples, My voucher, and other saved pages still open from this phone. Ruby and sign-in need a connection. Nothing new is fetched until you are back online.")}
      </p>
      <p className="offline-banner-links">
        {OFFLINE_READY.map((item) => (
          <a key={item.hash} href={`#${item.hash === '/' ? '/' : item.hash}`}>{item.label}</a>
        ))}
      </p>
    </aside>
  )
}
