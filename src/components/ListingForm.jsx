import { tx } from '../i18nAuto.js'
import { useRef, useState } from 'react'
import {
  AMENITIES, BATHROOM_COUNTS, BEDROOM_COUNTS, BOROUGHS, BROKER_FEES, DOG_POLICIES, MAX_DESCRIPTION, MAX_PHOTOS,
  PHOTO_TYPES, PROPERTY_TYPES, VOUCHER_CHOICES,
} from '../data/listingForm.js'
import { STEPS, emptyListingForm, listingProblem, stepProblem, todayIso } from '../listingRules.js'
import { compressPhoto, photosOverBudget, photosTotalBytes } from '../photo.js'
import { FormError, FormStatus } from './FormError.jsx'

function photoId() {
  return `p${Math.random().toString(36).slice(2, 10)}`
}

/**
 * The listing form, shared by the public submit page and the private edit page.
 *
 * Three steps instead of one long scroll: step one is the apartment and takes under a minute, so a
 * landlord on a phone gets somewhere before they run out of patience. Nothing is submitted until the
 * last step, and state never resets on error: whatever was typed stays on screen.
 */
export function ListingForm({
  initial = emptyListingForm(),
  initialPhotos = [],
  error = '',
  busy = false,
  status = '',
  submitLabel,
  busyLabel,
  onSubmit,
  extra,
  isEdit = false,
}) {
  const [form, setForm] = useState(initial)
  const [photos, setPhotos] = useState(() => initialPhotos.map((photo) => ({ ...photo, id: photo.id || photoId(), saved: photo.n != null })))
  const [photoError, setPhotoError] = useState('')
  const [checking, setChecking] = useState(0)
  const [step, setStep] = useState(0)
  const [stepError, setStepError] = useState('')
  const fileInput = useRef(null)

  const set = (patch) => setForm((current) => ({ ...current, ...patch }))

  const toggleAmenity = (name) => {
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(name)
        ? current.amenities.filter((a) => a !== name)
        : [...current.amenities, name],
    }))
  }

  const addFiles = async (files) => {
    const list = Array.from(files || [])
    if (!list.length) return
    const room = MAX_PHOTOS - photos.length
    const take = list.slice(0, Math.max(0, room))
    const skipped = list.length - take.length
    setPhotoError(skipped > 0 ? tx("Add up to 4 photos. The extra ones were not added.") : '')
    if (!take.length) return
    setChecking(take.length)
    const added = []
    for (const file of take) {
      const result = await compressPhoto(file)
      if (result.ok) {
        added.push({ id: photoId(), dataUrl: result.dataUrl, width: result.width, height: result.height, type: result.type, name: file.name, saved: false })
      } else {
        // Name the file, because "one photo failed" is useless when four were picked.
        const name = file.name || tx("That photo")
        if (result.code === 'size') setPhotoError(tx("{name} is larger than 5 MB. Try a smaller one.", { name }))
        else if (result.code === 'type') setPhotoError(tx("{name} is not a JPG, PNG, or WebP. On an iPhone, share HEIC photos as JPEG.", { name }))
        else setPhotoError(tx("{name} could not be read. Try adding it again.", { name }))
      }
      setChecking((n) => Math.max(0, n - 1))
    }
    setChecking(0)
    if (added.length) setPhotos((current) => [...current, ...added].slice(0, MAX_PHOTOS))
    if (fileInput.current) fileInput.current.value = ''
  }

  const removePhoto = (id) => {
    setPhotoError('')
    setPhotos((current) => current.filter((photo) => photo.id !== id))
  }

  // One photo is required to publish: a card with no image does not get clicked, so a listing
  // without one is a wasted submission. Said plainly, next to the picker.
  const photosProblem = photos.length ? '' : tx("Add at least one photo. A listing with a photo gets replies; one without gets skipped.")

  const next = () => {
    const problem = stepProblem(form, step)
    setStepError(problem)
    if (!problem) setStep(Math.min(STEPS.length - 1, step + 1))
  }

  const back = () => {
    setStepError('')
    setStep(Math.max(0, step - 1))
  }

  const submit = (event) => {
    event.preventDefault()
    if (busy) return
    // Every earlier step is re-checked, because someone can walk back and empty a field.
    for (let i = 0; i < STEPS.length - 1; i++) {
      const problem = stepProblem(form, i)
      if (problem) {
        setStep(i)
        setStepError(problem)
        return
      }
    }
    const problem = listingProblem(form) || photosProblem
    if (problem) {
      setStepError(problem)
      onSubmit({ problem })
      return
    }
    if (photosOverBudget(photos)) {
      const message = tx("The photos add up to more than 2 MB. Remove one and try again.")
      setStepError(message)
      onSubmit({ problem: message })
      return
    }
    const fresh = photos.filter((photo) => !photo.saved)
    const kept = photos.filter((photo) => photo.saved)
    onSubmit({
      body: {
        ...form,
        photos: fresh.map((photo) => photo.dataUrl),
        // Only an edit sends this: the numbers of saved photos that stay, in their new order.
        ...(isEdit ? { keepPhotos: kept.map((photo) => photo.n) } : {}),
      },
    })
  }

  const overBudget = photosOverBudget(photos)

  return (
    <form className="list-unit-form panel" onSubmit={submit} noValidate>
      <ol className="step-bar" aria-label={tx("Steps")}>
        {STEPS.map((s, i) => (
          <li key={s.key} className={i === step ? 'step-current' : i < step ? 'step-done' : ''}>
            <span className="step-number" aria-hidden="true">{i + 1}</span>
            <span className="step-title">{tx(s.title)}</span>
          </li>
        ))}
      </ol>
      <p className="fine step-hint">{tx(STEPS[step].hint)}</p>

      {step === 0 && (
        <fieldset className="form-step">
          <legend>{tx(STEPS[0].title)}</legend>
          <div className="field-pair field-pair-address">
          <label>
            {tx("Street address")}
            <input name="address" autoComplete="street-address" value={form.address} onChange={(e) => set({ address: e.target.value })} maxLength={300} />
          </label>
          <label>
            {tx("Unit number")}
            <input name="unit" value={form.unit} onChange={(e) => set({ unit: e.target.value })} maxLength={30} placeholder={tx("Apt 4B")} />
            <span className="fine">{tx("Optional.")}</span>
          </label>
          </div>
          <div className="field-pair field-pair-pair-only">
            <label>
              {tx("Borough")}
              <select name="borough" value={form.borough} onChange={(e) => set({ borough: e.target.value })}>
                <option value="">{tx("Pick a borough")}</option>
                {BOROUGHS.map((b) => <option key={b} value={b}>{tx(b)}</option>)}
              </select>
            </label>
            <label>
              {tx("Neighborhood")}
              <input name="neighborhood" value={form.neighborhood} onChange={(e) => set({ neighborhood: e.target.value })} maxLength={80} placeholder={tx("Optional")} />
            </label>
          </div>
          <fieldset className="chip-field">
            <legend>{tx("Property type")}</legend>
            <div className="chip-group">
              {PROPERTY_TYPES.map((type) => (
                <label key={type} className={form.propertyType === type ? 'chip chip-on' : 'chip'}>
                  <input type="radio" name="propertyType" value={type} checked={form.propertyType === type} onChange={() => set({ propertyType: type })} />
                  {tx(type)}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="field-pair">
            <label>
              {tx("Bedrooms")}
              <select name="bedrooms" value={form.bedrooms} onChange={(e) => set({ bedrooms: e.target.value === '' ? '' : Number(e.target.value) })}>
                <option value="">{tx("Pick bedrooms")}</option>
                {BEDROOM_COUNTS.map((n) => <option key={n} value={n}>{n === 0 ? tx("Studio") : n}</option>)}
              </select>
            </label>
            <label>
              {tx("Full bathrooms")}
              <select name="bathrooms" value={form.bathrooms} onChange={(e) => set({ bathrooms: e.target.value === '' ? '' : Number(e.target.value) })}>
                <option value="">{tx("Pick bathrooms")}</option>
                {BATHROOM_COUNTS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          <label>
            {tx("Monthly rent (USD)")}
            <input name="rent" inputMode="numeric" value={form.rent} onChange={(e) => set({ rent: e.target.value.replace(/[^\d]/g, '').slice(0, 6) })} />
          </label>
          <label>
            {tx("Available date")}
            <div className="date-row">
              <input name="availableDate" type="date" value={form.availableDate} onChange={(e) => set({ availableDate: e.target.value })} />
              {!form.availableDate && (
                <button type="button" className="button-quiet" onClick={() => set({ availableDate: todayIso() })}>
                  {tx("Available now")}
                </button>
              )}
            </div>
          </label>
        </fieldset>
      )}

      {step === 1 && (
        <fieldset className="form-step">
          <legend>{tx(STEPS[1].title)}</legend>
          <div className="field-pair">
            <label>
              {tx("Security deposit (USD)")}
              <input name="securityDeposit" inputMode="numeric" value={form.securityDeposit} onChange={(e) => set({ securityDeposit: e.target.value.replace(/[^\d]/g, '').slice(0, 7) })} placeholder={tx("Leave blank if not stated")} />
            </label>
            <label>
              {tx("Application fee (USD)")}
              <input name="applicationFee" inputMode="numeric" value={form.applicationFee} onChange={(e) => set({ applicationFee: e.target.value.replace(/[^\d]/g, '').slice(0, 5) })} placeholder="0" />
            </label>
          </div>
          <p className="fine">{tx("Enter 0 if there is none. Blank means you would rather not say.")}</p>
          <label>
            {tx("Broker fee")}
            <select name="brokerFee" value={form.brokerFee} onChange={(e) => set({ brokerFee: e.target.value })}>
              <option value="">{tx("Not stated")}</option>
              {BROKER_FEES.map((f) => <option key={f} value={f}>{tx(f)}</option>)}
            </select>
          </label>
          <fieldset className="chip-field">
            <legend>{tx("Cats allowed")}</legend>
            <div className="chip-group">
              {[{ v: true, label: 'Yes' }, { v: false, label: 'No' }].map((o) => (
                <label key={o.label} className={form.catsAllowed === o.v ? 'chip chip-on' : 'chip'}>
                  <input type="radio" name="catsAllowed" checked={form.catsAllowed === o.v} onChange={() => set({ catsAllowed: o.v })} />
                  {tx(o.label)}
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            {tx("Dogs allowed")}
            <select name="dogs" value={form.dogs} onChange={(e) => set({ dogs: e.target.value })}>
              <option value="">{tx("Not stated")}</option>
              {DOG_POLICIES.map((d) => <option key={d} value={d}>{tx(d)}</option>)}
            </select>
          </label>
          <fieldset className="chip-field">
            <legend>{tx("Housing vouchers accepted")}</legend>
            <p className="fine">{tx("LeasePath is a voucher-first site. Most renters here pay with a voucher.")}</p>
            <div className="chip-group">
              {VOUCHER_CHOICES.map((choice) => (
                <label key={choice} className={form.voucherAccepted === choice ? 'chip chip-on' : 'chip'}>
                  <input type="radio" name="voucherAccepted" checked={form.voucherAccepted === choice} onChange={() => set({ voucherAccepted: choice })} />
                  {tx(choice)}
                </label>
              ))}
            </div>
          </fieldset>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="form-step">
          <legend>{tx(STEPS[2].title)}</legend>
          <fieldset className="photo-field">
            <legend>{tx("Photo")}</legend>
            <p className="fine">
              {tx("At least one is required. Zillow requires one, and a rental card with no image does not get clicked. Up to 4, JPG, PNG, or WebP, shrunk on your phone before they upload.")}
            </p>
            <input
              ref={fileInput}
              type="file"
              accept={PHOTO_TYPES.join(',')}
              multiple
              onChange={(e) => addFiles(e.target.files)}
              disabled={photos.length >= MAX_PHOTOS || busy}
            />
            {photoError && <p className="fine form-error" role="alert">{photoError}</p>}
            {photos.length > 0 && (
              <ul className="photo-grid">
                {photos.map((photo) => (
                  <li key={photo.id} className="photo-item">
                    <img src={photo.dataUrl} alt={tx("Unit photo")} />
                    <button type="button" className="photo-remove" onClick={() => removePhoto(photo.id)} disabled={busy}>
                      {tx("Remove")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {overBudget && <p className="fine form-error">{tx("The photos add up to more than 2 MB. Remove one and try again.")}</p>}
            {photos.length > 0 && !overBudget && (
              <p className="fine">{tx("{count} of 4 photos · {kb} KB", { count: photos.length, kb: Math.round(photosTotalBytes(photos) / 1024) })}</p>
            )}
          </fieldset>

          <label>
            {tx("Description (optional)")}
            <textarea
              name="description"
              rows={3}
              maxLength={MAX_DESCRIPTION}
              value={form.description}
              onChange={(e) => set({ description: e.target.value.slice(0, MAX_DESCRIPTION) })}
              placeholder={tx("Paste your existing Craigslist or Zillow ad here, or describe the unit: laundry, transportation, what is included.")}
            />
            <span className="fine">{form.description.length}/{MAX_DESCRIPTION}</span>
          </label>

          <fieldset className="chip-field">
            <legend>{tx("Amenities")}</legend>
            <div className="check-grid">
              {AMENITIES.map((name) => (
                <label key={name} className="check-line">
                  <input type="checkbox" checked={form.amenities.includes(name)} onChange={() => toggleAmenity(name)} />
                  {tx(name)}
                </label>
              ))}
            </div>
          </fieldset>

          <label>
            {tx("Contact name")}
            <input name="contactName" autoComplete="name" value={form.contactName} onChange={(e) => set({ contactName: e.target.value })} maxLength={200} />
          </label>
          <div className="field-pair">
            <label>
              {tx("Contact email")}
              <input name="contactEmail" type="email" autoComplete="email" value={form.contactEmail} onChange={(e) => set({ contactEmail: e.target.value })} maxLength={120} />
            </label>
            <label>
              {tx("Contact phone")}
              <input name="contactPhone" type="tel" autoComplete="tel" value={form.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} maxLength={40} />
            </label>
          </div>
          <p className="fine">{tx("Give a phone, an email, or both. Renters need one way to reach you.")}</p>

          {/* The source-of-income notice sits directly above the attestation it explains. It used to
              top the page, where 233px of legal copy pushed the first question off a phone screen. */}
          <p className="notice-card panel soi-note">
            {tx("In New York City, source-of-income discrimination is illegal. A landlord or broker may not refuse a renter because they pay with Section 8, CityFHEPS, FHEPS, HASA, or another lawful housing subsidy. Report it to the")}{' '}
            <a href="https://www.nyc.gov/site/cchr/index.page" target="_blank" rel="noopener noreferrer">{tx("NYC Commission on Human Rights")}</a>.
          </p>

          <label className="check-line attestation">
            <input type="checkbox" checked={form.attestation} onChange={(e) => set({ attestation: e.target.checked })} />
            {tx("I attest that this unit accepts housing vouchers and that I charge no application fees to voucher holders.")}
          </label>
        </fieldset>
      )}

      {/* The message sits inside the sticky footer, directly above the buttons and in the same
          stacking context: an error that floats over the Continue button is a dead end on a phone. */}
      <div className="step-footer">
        <FormError message={error || stepError} />
        <FormStatus message={checking > 0 ? tx("Preparing your photos…") : status} />
        <div className="button-row">
          {step > 0 && (
            <button type="button" className="button-quiet" onClick={back} disabled={busy}>
              {tx("Back")}
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" className="button" onClick={next} disabled={busy || checking > 0}>
              {tx("Continue")}
            </button>
          ) : (
            <button type="submit" className="button" disabled={busy || checking > 0}>
              {busy ? (busyLabel || tx("Sending…")) : (submitLabel || tx("Submit for review"))}
            </button>
          )}
          {extra}
        </div>
        <p className="fine step-count">{tx("Step {step} of {total}", { step: step + 1, total: STEPS.length })}</p>
      </div>
      <p className="fine">{tx("LeasePath does not sell listing data. Pending units stay off the public site until approved.")}</p>
    </form>
  )
}
