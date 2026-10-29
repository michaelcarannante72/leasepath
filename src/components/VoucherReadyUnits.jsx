import { tx } from '../i18nAuto.js'
import { useEffect, useState } from 'react'
import { bedroomLabel } from '../data/listingForm.js'

function money(value) {
  return `$${Number(value).toLocaleString('en-US')}`
}

function shortDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return ''
  const date = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/** "Studio · 1 bath" or "2 bedrooms · 2 baths", built from the counts rather than a free-text size. */
function unitLine(unit) {
  const parts = []
  if (Number.isInteger(unit.bedrooms)) parts.push(tx(bedroomLabel(unit.bedrooms)))
  if (Number.isInteger(unit.bathrooms)) parts.push(unit.bathrooms === 1 ? tx("1 bath") : tx("{n} baths", { n: unit.bathrooms }))
  return parts.join(' · ')
}

/**
 * The money and pet lines. For a voucher renter these decide whether they call: "No application fee"
 * is the promise of the site, and a dog policy is the thing that rules a unit in or out fastest.
 * Blank fields say nothing at all rather than "not stated" on every card.
 */
function termsLines(unit) {
  const lines = []
  if (unit.applicationFee === 0) lines.push(tx("No application fee"))
  else if (Number.isInteger(unit.applicationFee)) lines.push(tx("Application fee: {amount}", { amount: money(unit.applicationFee) }))
  if (Number.isInteger(unit.securityDeposit)) {
    lines.push(unit.securityDeposit === 0 ? tx("No security deposit") : tx("Deposit: {amount}", { amount: money(unit.securityDeposit) }))
  }
  if (unit.brokerFee === 'None') lines.push(tx("No broker fee"))
  else if (unit.brokerFee) lines.push(tx("Broker fee: {fee}", { fee: tx(unit.brokerFee) }))
  if (unit.catsAllowed === true) lines.push(tx("Cats OK"))
  else if (unit.catsAllowed === false) lines.push(tx("No cats"))
  if (unit.dogs === 'No') lines.push(tx("No dogs"))
  else if (unit.dogs === 'Small only') lines.push(tx("Dogs: small only"))
  else if (unit.dogs === 'Large OK') lines.push(tx("Dogs OK"))
  return lines
}

export function VoucherReadyUnits({ compact = false } = {}) {
  const [listings, setListings] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch('/api/listings/approved')
        const data = await response.json().catch(() => ({}))
        if (cancelled) return
        if (!response.ok) {
          setError(data.message || 'Approved units could not load.')
          setListings([])
          return
        }
        setListings(Array.isArray(data.listings) ? data.listings : [])
      } catch {
        if (!cancelled) {
          setError('Approved units could not load.')
          setListings([])
        }
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (listings === null) {
    return (
      <section className="voucher-ready panel" aria-busy="true">
        <h2>{tx("Voucher-ready units")}</h2>
        <p>{tx("Loading approved units…")}</p>
      </section>
    )
  }

  if (!listings.length) {
    if (compact) return null
    return (
      <section className="voucher-ready panel">
        <h2>{tx("Voucher-ready units")}</h2>
        <p>{tx("No approved units yet. Landlords and brokers can")} <a href="#/list-unit">{tx("list a voucher-ready unit")}</a> {tx("for review.")}</p>
        {error && <p className="form-error">{error}</p>}
      </section>
    )
  }

  return (
    <section className="voucher-ready panel" aria-labelledby="voucher-ready-heading">
      <h2 id="voucher-ready-heading">{tx("Voucher-ready units")}</h2>
      <p>{tx("These units were submitted by landlords or brokers and approved by LeasePath. Confirm everything with the contact and your worker before you visit or pay anything.")}</p>
      <ul className="cards voucher-ready-cards">
        {listings.map((unit) => {
          const email = String(unit.contactEmail || '').trim()
          const phone = String(unit.contactPhone || '').replace(/[^\d+]/g, '')
          const available = shortDate(unit.availableDate)
          const photos = Array.isArray(unit.photos) ? unit.photos : []
          return (
            <li key={unit.id} className="card voucher-card">
              <div className="card-body">
                {photos.length > 0 && (
                  <ul className="card-photos">
                    {photos.slice(0, 4).map((photo) => (
                      <li key={photo.n}>
                        <img
                          src={photo.url}
                          alt={tx("Photo of {address}", { address: unit.address })}
                          loading="lazy"
                          width={photo.width || undefined}
                          height={photo.height || undefined}
                        />
                      </li>
                    ))}
                  </ul>
                )}
                <div className="card-top">
                  <strong>{tx(unit.propertyType || unit.size || '')}{unit.propertyType && unit.borough ? ' · ' : ''}{unit.borough}</strong>
                  <span>{money(unit.rent)}{tx("/mo")}</span>
                </div>
                <h3>
                  {unit.address}
                  {unit.unit ? <span className="card-unit"> · {tx("Unit")} {unit.unit}</span> : null}
                </h3>
                {unitLine(unit) && <p className="card-beds">{unitLine(unit)}</p>}
                <p className="card-area">
                  {[unit.neighborhood, available ? tx("Available {date}", { date: available }) : ''].filter(Boolean).join(' · ')}
                </p>
                {unit.voucherAccepted && unit.voucherAccepted !== 'Yes' ? (
                  <p className="card-voucher">{tx("Vouchers: {answer}", { answer: tx(unit.voucherAccepted) })}</p>
                ) : (
                  <p className="card-voucher ok">{tx("Vouchers accepted")}</p>
                )}
                {termsLines(unit).length > 0 && (
                  <ul className="card-terms">
                    {termsLines(unit).map((line) => <li key={line}>{line}</li>)}
                  </ul>
                )}
                {unit.description && <p className="card-description">{unit.description}</p>}
                {Array.isArray(unit.amenities) && unit.amenities.length > 0 && (
                  <p className="card-amenities">{unit.amenities.map((a) => tx(a)).join(' · ')}</p>
                )}
                <p className="card-what">{tx("Contact:")} {unit.contactName}</p>
                {(email || phone) && (
                  <div className="card-actions">
                    {email ? <a className="card-call" href={`mailto:${email}`}>{tx("Email")}</a> : null}
                    {phone ? <a className="card-call" href={`tel:${phone}`}>{tx("Call")}</a> : null}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {!compact && (
        <p className="fine"><a href="#/list-unit">{tx("List a voucher-ready unit")}</a></p>
      )}
    </section>
  )
}
