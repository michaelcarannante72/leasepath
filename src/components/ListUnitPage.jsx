import { useState } from 'react'
import { getTurnstileToken } from '../turnstile.js'
import { BOROUGHS, UNIT_SIZES, VOUCHER_TYPES } from '../data/listingForm.js'

const empty = {
  address: '',
  borough: '',
  size: '',
  rent: '',
  voucherTypes: [],
  inspectionReady: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  attestation: false,
}

export function ListUnitPage() {
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const set = (patch) => setForm((current) => ({ ...current, ...patch }))

  const toggleVoucher = (name) => {
    setForm((current) => {
      const has = current.voucherTypes.includes(name)
      return {
        ...current,
        voucherTypes: has ? current.voucherTypes.filter((v) => v !== name) : [...current.voucherTypes, name],
      }
    })
  }

  const submit = async (event) => {
    event.preventDefault()
    if (busy) return
    setError('')
    setBusy(true)
    try {
      let turnstileToken = ''
      try {
        turnstileToken = await getTurnstileToken()
      } catch {
        setError('The human check did not finish. Refresh and try again.')
        return
      }
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          inspectionReady: form.inspectionReady === 'yes',
          turnstileToken,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (response.status === 403 && data.error === 'challenge_required') {
        setError(data.message || 'Complete the human check and try again.')
        return
      }
      if (response.status === 429) {
        setError(data.message || 'Too many submissions. Wait a minute and try again.')
        return
      }
      if (!response.ok) {
        setError(data.message || 'That listing could not be saved.')
        return
      }
      setDone(true)
      setForm(empty)
    } catch {
      setError('Network problem. Try again in a moment.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <article className="page list-unit-page">
        <p className="eyebrow">Landlords and brokers</p>
        <h1>Listing received</h1>
        <p className="lede">
          Thanks. Your unit is in the pending-review queue. It is never shown publicly until LeasePath approves it.
        </p>
        <div className="button-row">
          <button type="button" className="button" onClick={() => setDone(false)}>List another unit</button>
          <a className="button button-quiet" href="#/voucher-ready">See approved units</a>
        </div>
      </article>
    )
  }

  return (
    <article className="page list-unit-page">
      <p className="eyebrow">Landlords and brokers</p>
      <h1>List a voucher-ready unit</h1>
      <p className="lede">
        Tell LeasePath about a unit that accepts housing vouchers. Submissions go to a pending-review queue and are never
        shown publicly until approved.
      </p>
      <p className="notice-card panel soi-note">
        In New York City, source-of-income discrimination is illegal. A landlord or broker may not refuse a renter because
        they pay with Section 8, CityFHEPS, FHEPS, HASA, or another lawful housing subsidy. Report it to the{' '}
        <a href="https://www.nyc.gov/site/cchr/index.page" target="_blank" rel="noopener noreferrer">NYC Commission on Human Rights</a>.
      </p>

      <form className="list-unit-form panel" onSubmit={submit} noValidate>
        <label>
          Street address
          <input name="address" autoComplete="street-address" value={form.address} onChange={(e) => set({ address: e.target.value })} required maxLength={300} />
        </label>
        <label>
          Borough
          <select name="borough" value={form.borough} onChange={(e) => set({ borough: e.target.value })} required>
            <option value="">Pick a borough</option>
            {BOROUGHS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>
        <label>
          Size
          <select name="size" value={form.size} onChange={(e) => set({ size: e.target.value })} required>
            <option value="">Pick a size</option>
            {UNIT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>
          Monthly rent (USD)
          <input name="rent" inputMode="numeric" value={form.rent} onChange={(e) => set({ rent: e.target.value.replace(/[^\d]/g, '').slice(0, 6) })} required />
        </label>

        <fieldset>
          <legend>Voucher types accepted</legend>
          <div className="check-grid">
            {VOUCHER_TYPES.map((name) => (
              <label key={name} className="check-line">
                <input type="checkbox" checked={form.voucherTypes.includes(name)} onChange={() => toggleVoucher(name)} />
                {name}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Inspection-ready</legend>
          <div className="check-grid">
            <label className="check-line">
              <input type="radio" name="inspectionReady" checked={form.inspectionReady === 'yes'} onChange={() => set({ inspectionReady: 'yes' })} />
              Yes
            </label>
            <label className="check-line">
              <input type="radio" name="inspectionReady" checked={form.inspectionReady === 'no'} onChange={() => set({ inspectionReady: 'no' })} />
              No / not sure
            </label>
          </div>
        </fieldset>

        <label>
          Contact name
          <input name="contactName" autoComplete="name" value={form.contactName} onChange={(e) => set({ contactName: e.target.value })} required maxLength={200} />
        </label>
        <label>
          Contact email
          <input name="contactEmail" type="email" autoComplete="email" value={form.contactEmail} onChange={(e) => set({ contactEmail: e.target.value })} required maxLength={120} />
        </label>
        <label>
          Contact phone
          <input name="contactPhone" type="tel" autoComplete="tel" value={form.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} required maxLength={40} />
        </label>

        <label className="check-line attestation">
          <input type="checkbox" checked={form.attestation} onChange={(e) => set({ attestation: e.target.checked })} required />
          I attest that this unit accepts housing vouchers and that I charge no application fees to voucher holders.
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="button-row">
          <button type="submit" className="button" disabled={busy}>{busy ? 'Sending…' : 'Submit for review'}</button>
          <a className="button button-quiet" href="#/voucher-ready">Voucher-ready units</a>
        </div>
        <p className="fine">LeasePath does not sell listing data. Pending units stay off the public site until approved.</p>
      </form>
    </article>
  )
}
