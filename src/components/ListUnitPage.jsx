import { tx } from '../i18nAuto.js'
import { useState } from 'react'
import { getTurnstileTokenOrEmpty } from '../turnstile.js'
import { emptyListingForm } from '../listingRules.js'
import { ListingForm } from './ListingForm.jsx'

// A challenge that hangs is not allowed to hold the form hostage. Five seconds is plenty for a managed
// widget, and if it has not answered by then the submission goes out without a token.
const LISTING_CHALLENGE_TIMEOUT = 5_000

export function ListUnitPage() {
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [done, setDone] = useState(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const submit = async ({ problem, body } = {}) => {
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    setBusy(true)
    setStatus(tx("Checking that you are a person. This takes a few seconds."))
    try {
      // Best effort. A blocked challenge, an in-app browser, or a strict ad blocker returns '' here and
      // the submission still goes out: the server's rate limiter is what actually stops abuse.
      const turnstileToken = await getTurnstileTokenOrEmpty({
        timeoutMs: LISTING_CHALLENGE_TIMEOUT,
        action: 'landlord_listing',
      })
      setStatus(tx("Sending your unit…"))
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...body, turnstileToken }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.message || tx("That listing could not be saved. Your details are still here — try again."))
        return
      }
      setDone(data)
      setStatus('')
    } catch {
      setError(tx("Network problem. Your details are still here. Try again in a moment."))
    } finally {
      setBusy(false)
      setStatus('')
    }
  }

  if (done) {
    const editUrl = done.editToken ? `${window.location.origin}${window.location.pathname}#/edit-listing?t=${done.editToken}` : ''
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(editUrl)
        setCopied(true)
      } catch {
        setCopied(false)
      }
    }
    return (
      <article className="page list-unit-page">
        <p className="eyebrow">{tx("Landlords and brokers")}</p>
        <h1>{tx("Listing received")}</h1>
        <p className="lede">
          {tx("Thanks. Your unit is in the pending-review queue. It is never shown publicly until LeasePath approves it.")}
        </p>
        {/* What happens next, and where it will show up. Both matter: the landlord has just handed
            over their phone number and needs to know that nothing is public yet, and where to look. */}
        <ol className="list-unit-next">
          <li>{tx("LeasePath reviews the unit, usually within a few business days.")}</li>
          <li>{tx("If it is approved, it goes live on the public voucher-ready units page: ")}<a href="#/voucher-ready">{tx("the voucher-ready units page")}</a>{"."}</li>
          <li>{tx("Renters see the rent, the fees, the pet policy, and the contact details you gave, and can call or email you directly.")}</li>
          <li>{tx("If we have a question or cannot approve it, we email the contact address you gave.")}</li>
          <li>{tx("You can change the rent, the details, or take the unit down any time with your private edit link below. There is also a Mark as rented button there once it is taken.")}</li>
        </ol>
        {editUrl && (
          <section className="edit-link-card panel">
            <h2>{tx("Your private edit link")}</h2>
            <p>
              {tx("Save this link. It is the only way back to change the rent, the contact details, or to take the unit down. Anyone with the link can edit the listing, so do not post it publicly.")}
            </p>
            <code className="edit-link">{editUrl}</code>
            <div className="button-row">
              <button type="button" className="button" onClick={copy}>{copied ? tx("Copied") : tx("Copy link")}</button>
              <a className="button button-quiet" href={editUrl}>{tx("Open the edit page")}</a>
            </div>
            {copied && <p className="fine" role="status">{tx("Link copied. Paste it into a note or text it to yourself.")}</p>}
          </section>
        )}
        <div className="button-row">
          <button
            type="button"
            className="button"
            onClick={() => {
              setDone(null)
              setCopied(false)
              setFormKey((n) => n + 1)
            }}
          >
            {tx("List another unit")}
          </button>
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
      <ListingForm
        key={formKey}
        initial={emptyListingForm()}
        error={error}
        status={status}
        busy={busy}
        onSubmit={submit}
        extra={<a className="button button-quiet" href="#/voucher-ready">{tx("Voucher-ready units")}</a>}
      />
    </article>
  )
}
