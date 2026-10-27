import { useEffect, useState } from 'react'

function money(value) {
  return `$${Number(value).toLocaleString('en-US')}`
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
        <h2>Voucher-ready units</h2>
        <p>Loading approved units…</p>
      </section>
    )
  }

  if (!listings.length) {
    if (compact) return null
    return (
      <section className="voucher-ready panel">
        <h2>Voucher-ready units</h2>
        <p>No approved units yet. Landlords and brokers can <a href="#/list-unit">list a voucher-ready unit</a> for review.</p>
        {error && <p className="form-error">{error}</p>}
      </section>
    )
  }

  return (
    <section className="voucher-ready panel" aria-labelledby="voucher-ready-heading">
      <h2 id="voucher-ready-heading">Voucher-ready units</h2>
      <p>These units were submitted by landlords or brokers and approved by LeasePath. Confirm everything with the contact and your worker before you visit or pay anything.</p>
      <ul className="cards voucher-ready-cards">
        {listings.map((unit) => (
          <li key={unit.id} className="card">
            <div className="card-body">
              <div className="card-top">
                <strong>{unit.borough} · {unit.size}</strong>
                <span>{money(unit.rent)}/mo</span>
              </div>
              <h3>{unit.address}</h3>
              <p className="card-what">Accepts: {(unit.voucherTypes || []).join(', ')}</p>
              <p className="card-area">Inspection-ready: {unit.inspectionReady ? 'Yes' : 'No / not sure'}</p>
              <p className="card-what">Contact: {unit.contactName}</p>
              <div className="card-actions">
                <a className="card-call" href={`mailto:${unit.contactEmail}`}>Email</a>
                <a className="card-call" href={`tel:${String(unit.contactPhone || '').replace(/[^\d+]/g, '')}`}>Call</a>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {!compact && (
        <p className="fine"><a href="#/list-unit">List a voucher-ready unit</a></p>
      )}
    </section>
  )
}
