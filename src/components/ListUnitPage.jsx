import { tx } from '../i18nAuto.js'
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
  const [checking, setChecking] = useState(false)

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
      setChecking(true)
      try {
        turnstileToken = await getTurnstileToken()
      } catch {
        setError('The human check did not finish. Refresh and try again.')
        return
      } finally {
        setChecking(false)
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
        <p className="eyebrow">{tx("Landlords and brokers")}</p>
        <h1>{tx("Listing received")}</h1>
        <p className="lede">
          {tx("Thanks. Your unit is in the pending-review queue. It is never shown publicly until LeasePath approves it.")}
        </p>
        <ol className="list-unit-next">
          <li>{tx("LeasePath reviews the unit, usually within a few business days.")}</li>
          <li>{tx("If it is approved, it shows on the voucher-ready units page with the contact details you gave, so renters or their workers can reach you directly.")}</li>
          <li>{tx("If we have a question or cannot approve it, we email the contact address you gave.")}</li>
        </ol>
        <p className="fine">
          {tx("Need to correct something? Submit the unit again with the right details and mention it in your next reply from the contact email.")}
        </p>
        <div className="button-row">
          <button type="button" className="button" onClick={() => setDone(false)}>{tx("List another unit")}</button>
          <a className="button button-quiet" href="#/voucher-ready">{tx("See approved units")}</a>
        </div>
      </article>
    )
  }

  return (
    <article className="page list-unit-page">
      <p className="eyebrow">{tx("Landlords and brokers")}</p>
      <h1>{tx("List a voucher-ready unit")}</h1>
      <p className="lede">
        {tx("Tell LeasePath about a unit that accepts housing vouchers. Submissions go to a pending-review queue and are never shown publicly until approved.")}
      </p>
      <p className="list-unit-free panel">
        <strong>{tx("Free to list.")}</strong>{' '}
        {tx("There is no charge to submit a unit and no listing fee. LeasePath never asks a voucher holder for an application fee.")}
      </p>
      <p className="notice-card panel soi-note">
        {tx("In New York City, source-of-income discrimination is illegal. A landlord or broker may not refuse a renter because they pay with Section 8, CityFHEPS, FHEPS, HASA, or another lawful housing subsidy. Report it to the")}{' '}
        <a href="https://www.nyc.gov/site/cchr/index.page" target="_blank" rel="noopener noreferrer">{tx("NYC Commission on Human Rights")}</a>.
      </p>

      <form className="list-unit-form panel" onSubmit={submit} noValidate>
        <label>
          {tx("Street address")}
          <input name="address" autoComplete="street-address" value={form.address} onChange={(e) => set({ address: e.target.value })} required maxLength={300} />
        </label>
        <label>
          {tx("Borough")}
          <select name="borough" value={form.borough} onChange={(e) => set({ borough: e.target.value })} required>
            <option value="">{tx("Pick a borough")}</option>
            {BOROUGHS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>
        <label>
          {tx("Size")}
          <select name="size" value={form.size} onChange={(e) => set({ size: e.target.value })} required>
            <option value="">{tx("Pick a size")}</option>
            {UNIT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>
          {tx("Monthly rent (USD)")}
          <input name="rent" inputMode="numeric" value={form.rent} onChange={(e) => set({ rent: e.target.value.replace(/[^\d]/g, '').slice(0, 6) })} required />
        </label>

        <fieldset>
          <legend>{tx("Voucher types accepted")}</legend>
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
          <legend>{tx("Inspection-ready")}</legend>
          <div className="check-grid">
            <label className="check-line">
              <input type="radio" name="inspectionReady" checked={form.inspectionReady === 'yes'} onChange={() => set({ inspectionReady: 'yes' })} />
              {tx("Yes")}
            </label>
            <label className="check-line">
              <input type="radio" name="inspectionReady" checked={form.inspectionReady === 'no'} onChange={() => set({ inspectionReady: 'no' })} />
              {tx("No / not sure")}
            </label>
          </div>
        </fieldset>

        <label>
          {tx("Contact name")}
          <input name="contactName" autoComplete="name" value={form.contactName} onChange={(e) => set({ contactName: e.target.value })} required maxLength={200} />
        </label>
        <label>
          {tx("Contact email")}
          <input name="contactEmail" type="email" autoComplete="email" value={form.contactEmail} onChange={(e) => set({ contactEmail: e.target.value })} required maxLength={120} />
        </label>
        <label>
          {tx("Contact phone")}
          <input name="contactPhone" type="tel" autoComplete="tel" value={form.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} required maxLength={40} />
        </label>

        <label className="check-line attestation">
          <input type="checkbox" checked={form.attestation} onChange={(e) => set({ attestation: e.target.checked })} required />
          {tx("I attest that this unit accepts housing vouchers and that I charge no application fees to voucher holders.")}
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}
        <p className="fine list-unit-status" role="status" aria-live="polite">
          {checking ? tx("Checking that you are a person. This can take a few seconds — keep this tab open.") : ''}
        </p>
        <div className="button-row">
          <button type="submit" className="button" disabled={busy}>{busy ? tx("Sending…") : tx("Submit for review")}</button>
          <a className="button button-quiet" href="#/voucher-ready">{tx("Voucher-ready units")}</a>
        </div>
        <p className="fine">{tx("LeasePath does not sell listing data. Pending units stay off the public site until approved.")}</p>
      </form>
    </article>
  )
}
