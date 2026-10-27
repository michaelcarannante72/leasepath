import { tx } from '../i18nAuto.js'
import {
  CARD_LINES,
  CAVEAT,
  CCHR,
  INTRO,
  LAST_REVIEWED,
  LAW_POINTS,
  RIGHTS_TITLE,
  WHAT_TO_SAY,
} from '../knowYourRights.js'
import { Icon } from './Icon.jsx'

export function KnowYourRightsPage() {
  const printCard = () => {
    if (typeof window !== 'undefined') window.print()
  }

  return (
    <div className="page rights-page">
      <p className="eyebrow">{tx("Resources")}</p>
      <h1>{RIGHTS_TITLE}</h1>
      <p className="lede">{INTRO}</p>

      <div className="button-row rights-actions no-print">
        <button type="button" className="button" onClick={printCard}>{tx("Print rights card")}</button>
        <a className="button button-quiet" href={`tel:${CCHR.phone.replace(/\D/g, '')}`}>
          {tx("Call")} {CCHR.phone}
        </a>
      </div>

      <section className="panel" aria-labelledby="rights-law">
        <h2 id="rights-law">{tx("The law in plain English")}</h2>
        <ul className="rights-list">
          {LAW_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <p className="fine">
          {tx("Source:")}{' '}
          <a href={CCHR.href} target="_blank" rel="noreferrer">
            {CCHR.label} <Icon name="external" size={12} />
          </a>
        </p>
      </section>

      <section className="panel" aria-labelledby="rights-say">
        <h2 id="rights-say">{tx("What to say to a landlord or broker")}</h2>
        <ul className="rights-say">
          {WHAT_TO_SAY.map((line) => (
            <li key={line}><blockquote>{line}</blockquote></li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-labelledby="rights-report">
        <h2 id="rights-report">{tx("How to report")}</h2>
        <ol className="rights-list">
          <li>{tx("Dial 311 and ask for “Human Rights.”")}</li>
          <li>
            {tx("Or call the Commission at")}{' '}
            <a href={`tel:${CCHR.phone.replace(/\D/g, '')}`}>{CCHR.phone}</a>.
          </li>
          <li>
            {tx("Or use the online form:")}{' '}
            <a href={CCHR.reportHref} target="_blank" rel="noreferrer">
              {CCHR.reportLabel} <Icon name="external" size={12} />
            </a>
          </li>
        </ol>
        <p className="fine">
          {tx("Source:")}{' '}
          <a href={CCHR.href} target="_blank" rel="noreferrer">
            {CCHR.label} <Icon name="external" size={12} />
          </a>
        </p>
      </section>

      <section className="panel rights-card" aria-labelledby="rights-card-title">
        <h2 id="rights-card-title">{tx("Printable card")}</h2>
        <div className="rights-card-face">
          <p className="rights-card-brand">LeasePath</p>
          {CARD_LINES.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <p className="fine no-print">{tx("Cut or screenshot this card. Keep it with your shopping letter.")}</p>
      </section>

      <p className="fine after-caveat">{CAVEAT} {tx("Last reviewed")} {LAST_REVIEWED}.</p>
    </div>
  )
}
