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
      <p className="eyebrow">Showings</p>
      <h1>Apartment viewing checklist</h1>
      <p className="lede">
        Questions to ask, things to inspect, and red flags. Check boxes stay on this device for this visit — print or screenshot before you go.
        You may qualify for different program rules; your shopping letter controls.
      </p>

      <p className="card-actions print-actions">
        <button type="button" className="button" onClick={() => window.print()}>Print checklist</button>
        <a className="button button-quiet" href="#/inspection-prep">HQS inspection prep</a>
        <a className="button button-quiet" href="#/scam-alerts">Voucher scam alerts</a>
      </p>

      <List title="Ask the landlord or broker" items={CHECKLIST.ask} />
      <List title="Inspect while you are there" items={CHECKLIST.inspect} />
      <List title="Red flags — walk away and report" items={CHECKLIST.redFlags} />

      <p className="fine">
        For repairs and heat after move-in, see Resources. LeasePath sample listings are practice only — confirm real apartments with your worker.
      </p>
      <p className="card-actions">
        <a className="button button-quiet" href="#/resources">Resources</a>
        <a className="button button-quiet" href="#/">Search</a>
      </p>
    </article>
  )
}
