import { useState } from 'react'
import { Building } from './Building.jsx'
import { Icon } from './Icon.jsx'
import { money, sizeLabel, starterMessage, utilityLabel } from '../fit.js'
import { brokerFeeNotices, cashDepositNotice, fareNotices, securityVoucherNotices } from '../fees.js'
import { FlagList } from './SourceLine.jsx'

export function DetailPage({ listing, flags, plan, saved, onToggleSave, onBack, onAsk, onDraft }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const draft = starterMessage(listing, plan)
  // Typed here for this visit only. Not saved and not sent anywhere.
  const [tenantFee, setTenantFee] = useState('')
  const [cashAsked, setCashAsked] = useState(false)
  const program = plan?.program || ''
  const feeNotices = [...brokerFeeNotices(program, listing.rent, Number(tenantFee) || 0), ...fareNotices(program)]
  const depositNotices = [...securityVoucherNotices(program), ...(cashAsked ? [cashDepositNotice(program)] : [])]

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draft)
      setCopyError('')
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
      setCopyError('Select the message and copy it yourself.')
    }
  }

  return (
    <article className="detail">
      <button type="button" className="text-button" onClick={onBack}>
        <Icon name="back" size={18} /> Back to search
      </button>
      <div className="detail-hero">
        <Building tone={listing.facade} />
        <div>
          <p className="eyebrow">Sample listing</p>
          <h1>{sizeLabel(listing)} in {listing.neighborhood}</h1>
          <p className="where">{listing.borough} · {listing.crossStreets} · {listing.zip}</p>
          <p className="rent rent-large">{money(listing.rent)}<span>/mo asking</span></p>
          <ul className="pills">
            {listing.programs.map((program) => (
              <li key={program} className={`pill pill-${program.replace(/\s/g, '').toLowerCase()}`}>{program}</li>
            ))}
          </ul>
        </div>
      </div>

      <dl className="facts">
        <div><dt>Size</dt><dd>{sizeLabel(listing)}, {listing.baths} bath</dd></div>
        <div><dt>Utilities</dt><dd>{utilityLabel(listing.utilities)}</dd></div>
        <div><dt>Transit</dt><dd>{listing.transit}</dd></div>
        <div><dt>In the building</dt><dd>{listing.amenities.join(' · ')}</dd></div>
      </dl>

      <section className="panel">
        <h2>Against your voucher</h2>
        {flags.length === 0 ? (
          <p>Add a program and the amount from your letter under My voucher. LeasePath will compare this sample with those figures. The comparison is a reading aid. Your worker decides.</p>
        ) : (
          <FlagList flags={flags} />
        )}
        <div className="button-row">
          <button type="button" className="button" onClick={() => onAsk(`Does the asking rent on this sample look workable with my voucher? Tell me what I should confirm before I contact anyone.`)}>
            Ask LeasePath about this rent
          </button>
          <button type="button" className="button button-quiet" onClick={onDraft}>
            Ask LeasePath to draft a message
          </button>
          <button type="button" className={`button button-quiet ${saved ? 'is-saved' : ''}`} onClick={onToggleSave}>
            <Icon name={saved ? 'heartFill' : 'heart'} size={16} /> {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Broker fee</h2>
        <FlagList flags={feeNotices} />
        <div className="stack">
          <label>
            <span>Does this listing ask you to pay a broker fee? Amount (optional)</span>
            <input inputMode="numeric" value={tenantFee} onChange={(event) => setTenantFee(event.target.value.replace(/[^\d]/g, '').slice(0, 6))} placeholder="Leave blank if none" />
          </label>
        </div>
      </section>

      <section className="panel">
        <h2>Security deposit</h2>
        <FlagList flags={depositNotices} />
        <div className="stack">
          <label className="check-line">
            <input type="checkbox" checked={cashAsked} onChange={(event) => setCashAsked(event.target.checked)} />
            This listing asks for a cash deposit
          </label>
        </div>
      </section>

      <section className="panel">
        <h2>Practice message</h2>
        <p>This text is a starter for the sample listing. It is not from the assistant. Edit it before you send anything to a real broker.</p>
        <textarea readOnly value={draft} aria-label="Practice broker message" />
        <button type="button" className="button" onClick={copyDraft}>
          {copied ? 'Copied' : 'Copy starter'}
        </button>
        {copyError && <p className="form-error">{copyError}</p>}
      </section>
    </article>
  )
}
