import { tx } from '../i18nAuto.js'
import { bedroomLabel } from '../data/listingForm.js'
import { useCallback, useEffect, useState } from 'react'

/**
 * Pending photos are not public. They are fetched with the admin token in an Authorization header and
 * shown from a blob URL, so the token never lands in an image URL, a referrer, or a log line.
 */
function AdminPhoto({ id, n, token, address }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let url = ''
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch(`/api/listings/photo/${id}/${n}`, { headers: { authorization: `Bearer ${token}` } })
        if (!response.ok) return
        const blob = await response.blob()
        if (cancelled) return
        url = URL.createObjectURL(blob)
        setSrc(url)
      } catch {
        /* the placeholder stays */
      }
    })()
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [id, n, token])
  if (!src) return <li className="photo-pending" aria-hidden="true" />
  return <li><img src={src} alt={tx("Photo of {address}", { address })} /></li>
}

export function ListingsAdminPage() {
  const [token, setToken] = useState('')
  const [listings, setListings] = useState([])
  const [removed, setRemoved] = useState([])
  const [rented, setRented] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError('')
    setMessage('')
    setBusy(true)
    try {
      const [pendingResponse, removedResponse, rentedResponse] = await Promise.all([
        fetch('/api/listings/pending', { headers: { authorization: `Bearer ${token}` } }),
        fetch('/api/listings/removed', { headers: { authorization: `Bearer ${token}` } }),
        fetch('/api/listings/rented', { headers: { authorization: `Bearer ${token}` } }),
      ])
      const data = await pendingResponse.json().catch(() => ({}))
      const removedData = await removedResponse.json().catch(() => ({}))
      const rentedData = await rentedResponse.json().catch(() => ({}))
      if (!pendingResponse.ok) {
        setError(data.message || 'Could not load pending units.')
        setListings([])
        setLoaded(false)
        return
      }
      setListings(Array.isArray(data.listings) ? data.listings : [])
      setRemoved(removedResponse.ok && Array.isArray(removedData.listings) ? removedData.listings : [])
      setRented(rentedResponse.ok && Array.isArray(rentedData.listings) ? rentedData.listings : [])
      setLoaded(true)
    } catch {
      setError('Network problem loading pending units.')
    } finally {
      setBusy(false)
    }
  }, [token])

  const act = async (id, action) => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch(`/api/listings/${id}/${action}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.message || `Could not ${action} that unit.`)
        return
      }
      setMessage(action === 'approve' ? 'Unit approved. It can show in Voucher-ready units.' : 'Unit rejected and removed from the queue.')
      await load()
    } catch {
      setError('Network problem updating that unit.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="page listings-admin-page">
      <p className="eyebrow">{tx("LeasePath admin")}</p>
      <h1>{tx("Review voucher-ready units")}</h1>
      <p className="lede">{tx("Pending submissions stay off the public site until you approve them. Use the admin token from Wrangler secrets. Do not share it.")}</p>
      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault()
          load()
        }}
      >
        <label>
          {tx("Admin token")}
          <input
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="button" disabled={busy || !token}>{busy ? 'Loading…' : 'Load pending'}</button>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="ok-msg" role="status">{message}</p>}
      <p className="fine">
        {tx("Contact details come straight from the submission. Email or call the lister before you reject a unit so they know why.")}
      </p>
      {loaded && !listings.length && <p>{tx("No pending units right now.")}</p>}
      <ul className="cards">
        {listings.map((unit) => (
          <li key={unit.id} className="card">
            <div className="card-body">
              <h2>{unit.address}</h2>
              <p>
                {unit.borough}
                {unit.propertyType ? ` · ${unit.propertyType}` : ''}
                {Number.isInteger(unit.bedrooms) ? ` · ${bedroomLabel(unit.bedrooms)}` : ''}
                {Number.isInteger(unit.bathrooms) ? ` · ${unit.bathrooms} bath${unit.bathrooms === 1 ? '' : 's'}` : ''}
                {` · $${Number(unit.rent).toLocaleString('en-US')}`}{tx("/mo")}
              </p>
              <p>{tx("Vouchers:")} {unit.voucherAccepted || 'Yes'}{unit.voucherAccepted === 'Yes' ? ` (${(unit.voucherTypes || []).length} subsidies)` : ''}</p>
              <p>
                {unit.applicationFee === 0
                  ? tx("No application fee")
                  : Number.isInteger(unit.applicationFee) ? `${tx("Application fee:")} $${Number(unit.applicationFee).toLocaleString('en-US')}` : ''}
                {unit.applicationFee != null && unit.securityDeposit != null ? ' · ' : ''}
                {Number.isInteger(unit.securityDeposit) ? `${tx("Deposit:")} $${Number(unit.securityDeposit).toLocaleString('en-US')}` : ''}
                {unit.brokerFee ? ` · ${tx("Broker fee:")} ${unit.brokerFee}` : ''}
              </p>
              <p>
                {tx("Cats:")} {unit.catsAllowed === true ? tx("Yes") : unit.catsAllowed === false ? tx("Not allowed") : tx("Not stated")}
                {` · ${tx("Dogs:")} ${unit.dogs || tx("Not stated")}`}
              </p>
              {Array.isArray(unit.amenities) && unit.amenities.length > 0 && <p>{tx("Amenities:")} {unit.amenities.join(', ')}</p>}
              {unit.availableDate && <p>{tx("Available:")} {unit.availableDate}</p>}
              {unit.description && <p className="admin-description">{unit.description}</p>}
              {Array.isArray(unit.photos) && unit.photos.length > 0 && (
                <ul className="card-photos admin-photos">
                  {unit.photos.map((photo) => (
                    <AdminPhoto key={photo.n} id={unit.id} n={photo.n} token={token} address={unit.address} />
                  ))}
                </ul>
              )}
              <p className="admin-contact">
                <span>{unit.contactName}</span>
                {unit.contactEmail && <a href={`mailto:${unit.contactEmail}?subject=${encodeURIComponent(`LeasePath: your unit at ${unit.address}`)}`}>{unit.contactEmail}</a>}
                {unit.contactPhone && <a href={`tel:${String(unit.contactPhone || '').replace(/[^\d+]/g, '')}`}>{unit.contactPhone}</a>}
              </p>
              <p className="fine">{tx("Submitted")} {unit.submittedAt}</p>
              <div className="button-row">
                <button type="button" className="button" disabled={busy} onClick={() => act(unit.id, 'approve')}>{tx("Approve")}</button>
                <button type="button" className="button button-quiet" disabled={busy} onClick={() => act(unit.id, 'reject')}>{tx("Reject")}</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {loaded && rented.length > 0 && (
        <section className="rented-list-section">
          <h2>{tx("Marked as rented")}</h2>
          <p className="fine">
            {tx("These units were marked rented with their private edit link. Renters do not see them, but the listing and its contact details stay here in case it opens up again. This is not the same as removed.")}
          </p>
          <ul className="cards">
            {rented.map((unit) => (
              <li key={unit.id} className="card">
                <div className="card-body">
                  <h3>{unit.address}{unit.unit ? ` · ${tx("Unit")} ${unit.unit}` : ''}</h3>
                  <p>
                    {unit.borough}
                    {unit.propertyType ? ` · ${unit.propertyType}` : ''}
                    {` · $${Number(unit.rent).toLocaleString('en-US')}`}{tx("/mo")}
                  </p>
                  <p className="admin-contact">
                    <span>{unit.contactName}</span>
                    {unit.contactEmail && <a href={`mailto:${unit.contactEmail}`}>{unit.contactEmail}</a>}
                    {unit.contactPhone && <a href={`tel:${String(unit.contactPhone || '').replace(/[^\d+]/g, '')}`}>{unit.contactPhone}</a>}
                  </p>
                  <p className="fine">{tx("Marked rented")} {unit.rentedAt || ''}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {loaded && removed.length > 0 && (
        <section className="removed-list">
          <h2>{tx("Removed by the lister")}</h2>
          <p className="fine">{tx("These units were taken down with their private edit link. They are hidden from renters and out of the review queue.")}</p>
          <ul className="cards">
            {removed.map((unit) => (
              <li key={unit.id} className="card">
                <div className="card-body">
                  <h3>{unit.address}</h3>
                  <p>
                    {unit.borough}
                    {unit.propertyType ? ` · ${unit.propertyType}` : ''}
                    {` · $${Number(unit.rent).toLocaleString('en-US')}`}{tx("/mo")}
                  </p>
                  <p className="fine">{tx("Removed")} {unit.removedAt || ''}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
