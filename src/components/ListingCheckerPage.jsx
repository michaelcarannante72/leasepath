import { tx } from '../i18nAuto.js'
import { useMemo, useState } from 'react'
import { checkListing } from '../listingChecker.js'
import { Icon } from './Icon.jsx'

function money(value) {
  return `$${Number(value).toLocaleString('en-US')}`
}

function FlagCard({ flag }) {
  return (
    <li className={`flag flag-${flag.level} lc-flag`}>
      <span className="flag-tag">{flag.label}</span>
      <p>{flag.detail}</p>
    </li>
  )
}

export function ListingCheckerPage() {
  const [text, setText] = useState('')
  const result = useMemo(() => checkListing(text), [text])

  return (
    <div className="panel lc-page">
      <p className="eyebrow">{tx("ON YOUR PHONE")}</p>
      <h1>{tx("Check a listing")}</h1>
      <p className="lede">
        {tx("Paste a Craigslist, StreetEasy, or Facebook Marketplace ad. LeasePath reads the rent, size, and borough on this device, compares them to verified CityFHEPS, FHEPS, and NYCHA Section 8 limits, and flags common scam lines. Nothing is sent to a server.")}
      </p>
      <p className="lc-privacy">
        <Icon name="pin" size={14} />
        <span>{tx("Stays on your phone. Clear the box when you are done. LeasePath never stores the paste.")}</span>
      </p>

      <label className="field">
        <span>{tx("Paste the listing text")}</span>
        <textarea
          className="lc-paste"
          rows={8}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={tx("Example: 2BR in Bushwick, Brooklyn. $2,400/mo. Heat and hot water included. Near Myrtle Ave. No broker fee.")}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
        />
      </label>
      {text && (
        <p className="lc-actions">
          <button type="button" className="link-button" onClick={() => setText('')}>{tx("Clear paste")}</button>
        </p>
      )}

      {!result.empty && (
        <section className="lc-results" aria-live="polite">
          <h2>{tx("What we found")}</h2>
          <ul className="lc-parsed">
            <li>
              <span className="lc-parsed-label">{tx("Rent")}</span>
              <strong>{result.parsed.rent != null ? `${money(result.parsed.rent)} / month` : 'Not found — add it to the paste or ask the landlord'}</strong>
            </li>
            <li>
              <span className="lc-parsed-label">{tx("Size")}</span>
              <strong>{result.sizeLabel || 'Not found'}</strong>
            </li>
            <li>
              <span className="lc-parsed-label">{tx("Borough")}</span>
              <strong>{result.parsed.borough || 'Not found'}</strong>
            </li>
            <li>
              <span className="lc-parsed-label">{tx("Address")}</span>
              <strong>{result.parsed.addressHint || 'Not found'}</strong>
            </li>
          </ul>

          {result.comparisons.length > 0 && (
            <div className="lc-block">
              <h3>{tx("Rent vs verified limits")}</h3>
              <p className="lc-note">
                {tx("Limits are CityFHEPS, FHEPS, and NYCHA Section 8 only, with utilities included. HPD, HCR, and HASA dollar checks are not in this tool — ask your worker for those. This is practice, not an approval. You may qualify under your own letter even when a row says over.")}
              </p>
              <ul className="flag-list">
                {result.comparisons.map((row) => (
                  <li key={row.program} className={`flag flag-${row.status === 'within' ? 'good' : row.status === 'over' ? 'watch' : 'note'}`}>
                    <span className="flag-tag">{row.program}</span>
                    <p>{row.summary}</p>
                    {row.source?.url && (
                      <p className="source-line">
                        <a href={row.source.url} target="_blank" rel="noopener noreferrer">{row.source.title}</a>
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.flags.length > 0 && (
            <div className="lc-block">
              <h3>{tx("Watch-outs")}</h3>
              <ul className="flag-list">
                {result.flags.map((flag) => (
                  <FlagCard key={flag.id} flag={flag} />
                ))}
              </ul>
            </div>
          )}

          <div className="lc-block">
            <h3>{tx("Checklist")}</h3>
            <ul className="lc-checklist">
              {result.checklist.map((item) => (
                <li key={item.id} className={item.pass === true ? 'lc-check-pass' : item.pass === false ? 'lc-check-miss' : ''}>
                  <span aria-hidden="true">{item.pass === true ? '✓' : item.pass === false ? '!' : '·'}</span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lc-block">
            <h3>{tx("Questions to ask the landlord")}</h3>
            <ol className="lc-questions">
              {result.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <p className="lc-law">
        {tx("In New York City it is illegal to refuse a renter because they pay with a lawful housing voucher (source-of-income discrimination). Report it to the NYC Commission on Human Rights at 212-416-0197.")}
      </p>
      <p className="after-link">
        <a href="#/resources">{tx("Back to Resources")}</a>
        {' · '}
        <a href="#/after-you-find">{tx("After you find an apartment")}</a>
      </p>
    </div>
  )
}
