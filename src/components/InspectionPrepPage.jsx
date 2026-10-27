import { tx } from '../i18nAuto.js'
import {
  AFTER_VISIT,
  BEFORE_VISIT,
  CAVEAT,
  CHECKLIST,
  INTRO,
  LAST_REVIEWED,
  NYCHA_CCC,
  PREP_TITLE,
  SOURCES,
  sourceList,
} from '../inspectionPrep.js'
import { Icon } from './Icon.jsx'

function SourceLinks({ ids }) {
  const list = sourceList(ids)
  return (
    <p className="fine after-sources">
      {tx("Source:")}{' '}
      {list.map((source, i) => (
        <span key={source.href}>
          {i > 0 && ' · '}
          <a href={source.href} target="_blank" rel="noreferrer">
            {source.label} <Icon name="external" size={12} />
          </a>
        </span>
      ))}
    </p>
  )
}

export function InspectionPrepPage() {
  const printPage = () => {
    if (typeof window !== 'undefined') window.print()
  }

  return (
    <div className="page prep-page">
      <p className="eyebrow">{tx("Steps")}</p>
      <h1>{PREP_TITLE}</h1>
      <p className="lede">{INTRO}</p>

      <div className="prep-actions no-print">
        <button type="button" className="button" onClick={printPage}>{tx("Print this checklist")}</button>
        <a className="button button-quiet" href="#/after-you-find">{tx("Back to After you find")}</a>
      </div>

      <aside className="notice-card" aria-labelledby="prep-who">
        <h2 id="prep-who">{tx("Who this is for")}</h2>
        <p>
          {tx("Section 8 (NYCHA or HPD) and other programs that use HQS or a similar walkthrough. CityFHEPS often uses building preclearance plus an apartment walkthrough — still walk the unit with this list. Your shopping letter and worker decide the exact process.")}
        </p>
      </aside>

      <section className="panel" aria-labelledby="prep-before">
        <h2 id="prep-before">{tx("Before the inspector comes")}</h2>
        <ul className="prep-list">
          {BEFORE_VISIT.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          {NYCHA_CCC.label}:{' '}
          <a href={`tel:${NYCHA_CCC.phone.replace(/\D/g, '')}`}>{NYCHA_CCC.phone}</a>
          {' · '}
          <a href={SOURCES.nychaPortal.href} target="_blank" rel="noreferrer">
            {SOURCES.nychaPortal.label} <Icon name="external" size={12} />
          </a>
        </p>
        <SourceLinks ids={['nychaHqs', 'nychaHqsFaq']} />
      </section>

      <section className="panel prep-checklist" aria-labelledby="prep-check">
        <h2 id="prep-check">{tx("Walk-through checklist")}</h2>
        <p>{tx("Ask the landlord to fix these before the visit. Check each box as you go — checks stay on this printout or screen only.")}</p>
        <ul className="prep-check-items">
          {CHECKLIST.map((item) => (
            <li key={item.id} className="prep-check-item">
              <label>
                <input type="checkbox" name={`prep-${item.id}`} />
                <span className="prep-check-title">{item.title}</span>
              </label>
              <p>{item.tip}</p>
              <SourceLinks ids={item.sources} />
            </li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-labelledby="prep-after">
        <h2 id="prep-after">{tx("After the inspection")}</h2>
        <ul className="prep-list">
          {AFTER_VISIT.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <SourceLinks ids={['nychaHqs', 'hpdInspections']} />
      </section>

      <p className="fine after-caveat">{CAVEAT} {tx("Last reviewed")} {LAST_REVIEWED}.</p>
    </div>
  )
}
