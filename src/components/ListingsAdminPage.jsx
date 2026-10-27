import { useCallback, useState } from 'react'

export function ListingsAdminPage() {
  const [token, setToken] = useState('')
  const [listings, setListings] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError('')
    setMessage('')
    setBusy(true)
    try {
      const response = await fetch('/api/listings/pending', {
        headers: { authorization: `Bearer ${token}` },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.message || 'Could not load pending units.')
        setListings([])
        setLoaded(false)
        return
      }
      setListings(Array.isArray(data.listings) ? data.listings : [])
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
      <p className="eyebrow">LeasePath admin</p>
      <h1>Review voucher-ready units</h1>
      <p className="lede">Pending submissions stay off the public site until you approve them. Use the admin token from Wrangler secrets. Do not share it.</p>
      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault()
          load()
        }}
      >
        <label>
          Admin token
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
      {loaded && !listings.length && <p>No pending units right now.</p>}
      <ul className="cards">
        {listings.map((unit) => (
          <li key={unit.id} className="card">
            <div className="card-body">
              <h2>{unit.address}</h2>
              <p>{unit.borough} · {unit.size} · ${Number(unit.rent).toLocaleString('en-US')}/mo</p>
              <p>Vouchers: {(unit.voucherTypes || []).join(', ')}</p>
              <p>Inspection-ready: {unit.inspectionReady ? 'Yes' : 'No'}</p>
              <p>{unit.contactName} · {unit.contactEmail} · {unit.contactPhone}</p>
              <p className="fine">Submitted {unit.submittedAt}</p>
              <div className="button-row">
                <button type="button" className="button" disabled={busy} onClick={() => act(unit.id, 'approve')}>Approve</button>
                <button type="button" className="button button-quiet" disabled={busy} onClick={() => act(unit.id, 'reject')}>Reject</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </article>
  )
}
