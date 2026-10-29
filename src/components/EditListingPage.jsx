import { tx } from '../i18nAuto.js'
import { useEffect, useState } from 'react'
import { getTurnstileTokenOrEmpty } from '../turnstile.js'
import { FormError, FormStatus } from './FormError.jsx'
import { emptyListingForm, readEditToken } from '../listingRules.js'
import { ListingForm } from './ListingForm.jsx'

const LISTING_CHALLENGE_TIMEOUT = 5_000

function InvalidLink() {
  return (
    <article className="page list-unit-page edit-listing-page">
      <p className="eyebrow">{tx("Landlords and brokers")}</p>
      <h1>{tx("This link is no longer valid")}</h1>
      <p className="lede">
        {tx("That edit link has expired, or the unit it pointed to is no longer on LeasePath. Nothing was changed.")}
      </p>
      <div className="button-row">
        <a className="button" href="#/list-unit">{tx("Post a unit")}</a>
        <a className="button button-quiet" href="#/voucher-ready">{tx("See approved units")}</a>
      </div>
    </article>
  )
}

export function EditListingPage({ token: tokenProp }) {
  const [token] = useState(() => tokenProp ?? readEditToken())
  // A missing token is a decided state, not something to discover in an effect.
  const [state, setState] = useState(token ? 'loading' : 'invalid')
  const [listing, setListing] = useState(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [removed, setRemoved] = useState(false)
  const [confirmingRented, setConfirmingRented] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch('/api/listings/edit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await response.json().catch(() => ({}))
        if (cancelled) return
        if (!response.ok || !data.listing) {
          setState('invalid')
          return
        }
        setListing(data.listing)
        setState('ready')
      } catch {
        if (!cancelled) {
          setState('error')
          setError(tx("That link could not be checked. Check your connection and try again."))
        }
      }
    })()
    return () => { cancelled = true }
  }, [token])

  const save = async ({ problem, body } = {}) => {
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    setSaved('')
    setBusy(true)
    setStatus(tx("Saving your changes…"))
    try {
      const turnstileToken = await getTurnstileTokenOrEmpty({
        timeoutMs: LISTING_CHALLENGE_TIMEOUT,
        action: 'landlord_listing',
      })
      const response = await fetch('/api/listings/edit/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...body, token, turnstileToken }),
      })
      const data = await response.json().catch(() => ({}))
      if (response.status === 404) {
        setState('invalid')
        return
      }
      if (!response.ok) {
        setError(data.message || tx("That change could not be saved. Your edits are still here — try again."))
        return
      }
      setSaved(data.message || tx("Saved."))
      setListing((current) => ({ ...current, status: data.status || current.status }))
    } catch {
      setError(tx("Network problem. Your edits are still here. Try again in a moment."))
    } finally {
      setBusy(false)
      setStatus('')
    }
  }

  const remove = async () => {
    setBusy(true)
    setError('')
    setStatus(tx("Removing your listing…"))
    try {
      const response = await fetch('/api/listings/edit/remove', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await response.json().catch(() => ({}))
      if (response.status === 404) {
        setState('invalid')
        return
      }
      if (!response.ok) {
        setError(data.message || tx("That unit could not be removed. Try again in a moment."))
        return
      }
      setRemoved(true)
    } catch {
      setError(tx("Network problem. The unit was not removed. Try again in a moment."))
    } finally {
      setBusy(false)
      setStatus('')
    }
  }

  /**
   * Rented is not removed. Renters stop seeing it (it comes off the public list), but the record and
   * its contact details stay for LeasePath, so the same landlord can mark it available again when the
   * tenant leaves. `removed` means gone for good until reposted.
   */
  const setRented = async (rented) => {
    setBusy(true)
    setError('')
    setStatus(rented ? tx("Marking the unit as rented…") : tx("Putting the unit back on the list…"))
    try {
      const response = await fetch(rented ? '/api/listings/edit/rented' : '/api/listings/edit/relist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await response.json().catch(() => ({}))
      if (response.status === 404) {
        setState('invalid')
        return
      }
      if (!response.ok) {
        setError(data.message || tx("That change could not be saved. Try again in a moment."))
        return
      }
      setListing((current) => ({ ...current, status: data.status || (rented ? 'rented' : 'pending') }))
      setSaved(data.message || (rented ? tx("Marked as rented.") : tx("Back on the list.")))
      setConfirmingRented(false)
    } catch {
      setError(tx("Network problem. Nothing was changed. Try again in a moment."))
    } finally {
      setBusy(false)
      setStatus('')
    }
  }

  if (state === 'loading') {
    return (
      <article className="page list-unit-page edit-listing-page" aria-busy="true">
        <p className="eyebrow">{tx("Landlords and brokers")}</p>
        <h1>{tx("Edit your listing")}</h1>
        <p>{tx("Opening your listing…")}</p>
      </article>
    )
  }
  if (state === 'invalid') return <InvalidLink />

  if (removed) {
    return (
      <article className="page list-unit-page edit-listing-page">
        <p className="eyebrow">{tx("Landlords and brokers")}</p>
        <h1>{tx("Your listing is removed")}</h1>
        <p className="lede">
          {tx("It no longer shows on the voucher-ready units page, and it is out of the review queue. Thank you for letting renters know.")}
        </p>
        <div className="button-row">
          <a className="button" href="#/list-unit">{tx("Post a unit")}</a>
          <a className="button button-quiet" href="#/voucher-ready">{tx("See approved units")}</a>
        </div>
      </article>
    )
  }

  if (state === 'error') {
    return (
      <article className="page list-unit-page edit-listing-page">
        <p className="eyebrow">{tx("Landlords and brokers")}</p>
        <h1>{tx("Edit your listing")}</h1>
        <FormError message={error} />
        <div className="button-row">
          <button type="button" className="button" onClick={() => window.location.reload()}>{tx("Try again")}</button>
        </div>
      </article>
    )
  }

  const initial = {
    ...emptyListingForm(),
    ...listing,
    rent: listing?.rent != null ? String(listing.rent) : '',
    // Null means "not stated" on the server and blank means the same thing here.
    securityDeposit: listing?.securityDeposit != null ? String(listing.securityDeposit) : '',
    applicationFee: listing?.applicationFee != null ? String(listing.applicationFee) : '',
    catsAllowed: typeof listing?.catsAllowed === 'boolean' ? listing.catsAllowed : '',
    amenities: Array.isArray(listing?.amenities) ? listing.amenities : [],
    attestation: true,
  }

  return (
    <article className="page list-unit-page edit-listing-page">
      <p className="eyebrow">{tx("Landlords and brokers")}</p>
      <h1>{tx("Edit your listing")}</h1>
      <p className="lede">
        {listing?.status === 'approved'
          ? tx("This unit is live. If you change the address, rent, bedrooms, vouchers, fees, description, pets, amenities, available date, or photos, it goes back to review before it shows publicly again. Changing only your contact details keeps it live.")
          : listing?.status === 'rented'
            ? tx("You marked this unit as rented, so it is off the public list and saved in your records here. If it opens up again, mark it available and it will go back into review.")
            : tx("This unit is waiting for review. Your changes replace the version in the queue, and it stays in the queue.")}
      </p>
      {saved && <p className="ok-msg" role="status">{saved}</p>}
      <ListingForm
        initial={initial}
        initialPhotos={(listing?.photos || []).map((photo) => ({ id: `saved-${photo.n}`, n: photo.n, dataUrl: photo.dataUrl }))}
        isEdit
        error={error}
        status={status}
        busy={busy}
        onSubmit={save}
        submitLabel={tx("Save changes")}
        busyLabel={tx("Saving…")}
        extra={<a className="button button-quiet" href="#/voucher-ready">{tx("See approved units")}</a>}
      />
      <section className="panel rented-card">
        <h2>{listing?.status === 'rented' ? tx("This unit is rented") : tx("Rented it?")}</h2>
        {listing?.status === 'rented' ? (
          <>
            <p className="fine">
              {tx("It is off the public list. Renters cannot see it or contact you about it. It stays in this dashboard so you can put it back when it is free again.")}
            </p>
            <button type="button" className="button button-quiet" onClick={() => setRented(false)} disabled={busy}>
              {tx("Mark available again")}
            </button>
          </>
        ) : (
          <>
            <p className="fine">
              {tx("Marking it rented takes it off the public list right away. It is not deleted: it stays in this dashboard so you can put it back later.")}
            </p>
            {!confirmingRented ? (
              <button type="button" className="button button-quiet" onClick={() => setConfirmingRented(true)} disabled={busy}>
                {tx("Mark as rented")}
              </button>
            ) : (
              <div className="takedown-confirm">
                <p>{tx("Mark this unit as rented and take it off the public list?")}</p>
                <div className="button-row">
                  <button type="button" className="button" onClick={() => setRented(true)} disabled={busy}>{tx("Yes, it is rented")}</button>
                  <button type="button" className="button button-quiet" onClick={() => setConfirmingRented(false)} disabled={busy}>{tx("Cancel")}</button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
      <section className="panel takedown-card">
        <h2>{tx("Remove this listing")}</h2>
        <p className="fine">
          {tx("Taking the unit down hides it right away and takes it out of the review queue. You can post it again later if it becomes available.")}
        </p>
        {!confirming ? (
          <button type="button" className="button button-quiet" onClick={() => setConfirming(true)} disabled={busy}>
            {tx("Remove this listing")}
          </button>
        ) : (
          <div className="takedown-confirm">
            <p>{tx("Remove this unit from LeasePath? Renters will not see it anymore.")}</p>
            <div className="button-row">
              <button type="button" className="button button-danger" onClick={remove} disabled={busy}>{tx("Yes, remove it")}</button>
              <button type="button" className="button button-quiet" onClick={() => setConfirming(false)} disabled={busy}>{tx("Keep the listing")}</button>
            </div>
          </div>
        )}
        <FormStatus message={status} />
      </section>
    </article>
  )
}
