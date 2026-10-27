import { tx } from '../i18nAuto.js'
import { useMemo, useState } from 'react'
import { Icon } from './Icon.jsx'
import {
  PARTNERS,
  PARTNER_BOROUGHS,
  PARTNER_SOURCES,
  filterPartners,
  telHref,
} from '../data/partners.js'

export function PartnerDirectoryPage() {
  const [borough, setBorough] = useState('')
  const [query, setQuery] = useState('')
  const shown = useMemo(() => filterPartners(PARTNERS, { borough, query }), [borough, query])

  return (
    <article className="page partner-directory">
      <p className="eyebrow">{tx("Partners")}</p>
      <h1>{tx("Legal aid and nonprofit partners")}</h1>
      <p className="lede">
        {tx("Vetted groups that help NYC tenants and voucher holders. Phones and links are copied from the official pages named on each card. You may qualify for free legal help — the provider decides. LeasePath is not a law firm and does not take your case.")}
      </p>

      <div className="resource-search" role="search">
        <label htmlFor="partner-q">{tx("Search partners")}</label>
        <input
          id="partner-q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tx("Name, eviction, housing court, borough…")}
          autoComplete="off"
          spellCheck="false"
        />
        <div className="borough-chips" role="group" aria-label={tx("Borough")}>
          {['', ...PARTNER_BOROUGHS].map((name) => (
            <button
              key={name || 'all'}
              type="button"
              className="chip"
              aria-pressed={borough === name}
              onClick={() => setBorough(name)}
            >
              {name || 'All boroughs'}
            </button>
          ))}
        </div>
      </div>

      <p className="fine">{shown.length} {tx("of")} {PARTNERS.length} {tx("shown")}</p>

      <ul className="partner-list">
        {shown.map((partner) => {
          const source = PARTNER_SOURCES[partner.sourceId]
          return (
            <li key={partner.id} className="partner-card">
              <h2>{partner.name}</h2>
              <p>{partner.blurb}</p>
              <p className="partner-boroughs">
                <Icon name="pin" size={14} />
                <span>{partner.boroughs.join(' · ')}</span>
              </p>
              <div className="card-actions">
                {(partner.phones || []).map((phone) => (
                  <a key={phone.number} className="card-call" href={telHref(phone.number)}>
                    {tx("Call")} {phone.label || phone.number}
                  </a>
                ))}
                {partner.email ? (
                  <a className="card-link" href={`mailto:${partner.email}`}>Email {partner.email}</a>
                ) : null}
                <a className="card-link" href={partner.href} target="_blank" rel="noreferrer">
                  {tx("Their website")} <Icon name="external" size={14} />
                </a>
              </div>
              {source ? (
                <p className="fine">
                  {tx("Source:")}{' '}
                  <a href={source.href} target="_blank" rel="noreferrer">
                    {source.label}
                  </a>
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>

      {!shown.length ? (
        <p className="empty-note">{tx("No partners match that filter. Clear the search or pick All boroughs.")}</p>
      ) : null}

      <p className="partner-directory-nav">
        <a className="button button-quiet" href="#/resources">{tx("Back to Resources")}</a>
      </p>
    </article>
  )
}
