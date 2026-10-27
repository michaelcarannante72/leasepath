import {
  CAVEAT,
  INTRO,
  LANDLORD_TITLE,
  LAST_REVIEWED,
  LIST_UNIT_HASH,
  NYCHA_CCC,
  REASONS,
  SOURCES,
} from '../landlordWelcome.js'
import { Icon } from './Icon.jsx'

function Sources({ ids }) {
  return (
    <p className="fine after-sources">
      Source:{' '}
      {ids.map((id, i) => {
        const source = SOURCES[id]
        if (!source) return null
        return (
          <span key={id}>
            {i > 0 && ' · '}
            <a href={source.href} target="_blank" rel="noreferrer">
              {source.label} <Icon name="external" size={12} />
            </a>
          </span>
        )
      })}
    </p>
  )
}

export function LandlordWelcomePage() {
  return (
    <div className="page landlord-page">
      <p className="eyebrow">Resources</p>
      <h1>{LANDLORD_TITLE}</h1>
      <p className="lede">{INTRO}</p>

      <div className="button-row landlord-actions">
        <a className="button" href={LIST_UNIT_HASH}>List a voucher-ready unit</a>
        <a className="button button-quiet" href={SOURCES.nychaOwners.href} target="_blank" rel="noreferrer">
          NYCHA owners info <Icon name="external" size={14} />
        </a>
      </div>

      {REASONS.map((reason) => (
        <section key={reason.id} className="panel" aria-labelledby={`ll-${reason.id}`}>
          <h2 id={`ll-${reason.id}`}>{reason.title}</h2>
          <p>{reason.body}</p>
          <Sources ids={reason.sources} />
        </section>
      ))}

      <aside className="notice-card" aria-labelledby="ll-next">
        <h2 id="ll-next">Next step</h2>
        <p>
          Ready to reach voucher holders on LeasePath?{' '}
          <a href={LIST_UNIT_HASH}>List a voucher-ready unit</a>
          {' '}(form route <code>{LIST_UNIT_HASH}</code>). For NYCHA Section 8 questions, call{' '}
          <a href={`tel:${NYCHA_CCC.phone.replace(/\D/g, '')}`}>{NYCHA_CCC.phone}</a>
          {' '}({NYCHA_CCC.label}).
        </p>
        <Sources ids={['nychaOwners', 'hpdOwners', 'cchr']} />
      </aside>

      <p className="fine after-caveat">{CAVEAT} Last reviewed {LAST_REVIEWED}.</p>
    </div>
  )
}
