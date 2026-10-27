import { tx } from '../i18nAuto.js'
import { CHECKLIST } from '../data/viewingChecklist.js'

function List({ title, items }) {
  return (
    <section className="viewing-section">
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <label className="viewing-item">
              <input type="checkbox" />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ViewingChecklistPage() {
  return (
    <article className="page viewing-checklist">
      <p className="eyebrow">{tx("Showings")}</p>
      <h1>{tx("Apartment viewing checklist")}</h1>
      <p className="lede">
        {tx("Questions to ask, things to inspect, and red flags. Check boxes stay on this device for this visit — print or screenshot before you go. You may qualify for different program rules; your shopping letter controls.")}
      </p>

      <p className="card-actions print-actions">
        <button type="button" className="button" onClick={() => window.print()}>{tx("Print checklist")}</button>
        <a className="button button-quiet" href="#/inspection-prep">{tx("HQS inspection prep")}</a>
        <a className="button button-quiet" href="#/scam-alerts">{tx("Voucher scam alerts")}</a>
      </p>

      <List title={tx("Ask the landlord or broker")} items={CHECKLIST.ask} />
      <List title={tx("Inspect while you are there")} items={CHECKLIST.inspect} />
      <List title={tx("Red flags — walk away and report")} items={CHECKLIST.redFlags} />

      <p className="fine">
        {tx("For repairs and heat after move-in, see Resources. LeasePath sample listings are practice only — confirm real apartments with your worker.")}
      </p>
      <p className="card-actions">
        <a className="button button-quiet" href="#/resources">{tx("Resources")}</a>
        <a className="button button-quiet" href="#/">{tx("Search")}</a>
      </p>
    </article>
  )
}
