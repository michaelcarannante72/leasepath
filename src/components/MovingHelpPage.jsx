import {
  ACCESS_HRA_URL,
  CAVEAT,
  HRA_INFOLINE,
  INTRO,
  LAST_REVIEWED,
  MOVING_TITLE,
  SECTIONS,
  SOURCES,
} from '../movingHelp.js'
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

export function MovingHelpPage() {
  return (
    <div className="page moving-page">
      <p className="eyebrow">Resources</p>
      <h1>{MOVING_TITLE}</h1>
      <p className="lede">{INTRO}</p>

      <div className="button-row moving-actions">
        <a className="button" href={ACCESS_HRA_URL} target="_blank" rel="noreferrer">
          Open ACCESS HRA <Icon name="external" size={14} />
        </a>
        <a className="button button-quiet" href={`tel:${HRA_INFOLINE.phone.replace(/\D/g, '')}`}>
          Call HRA Infoline {HRA_INFOLINE.phone}
        </a>
      </div>
      <p className="fine">
        Infoline hours: {HRA_INFOLINE.hours}. Source:{' '}
        <a href={HRA_INFOLINE.sourceHref} target="_blank" rel="noreferrer">
          {HRA_INFOLINE.sourceLabel} <Icon name="external" size={12} />
        </a>
      </p>

      {SECTIONS.map((section) => (
        <section key={section.id} className="panel" aria-labelledby={`moving-${section.id}`}>
          <h2 id={`moving-${section.id}`}>{section.title}</h2>
          <p>{section.body}</p>
          <Sources ids={section.sources} />
        </section>
      ))}

      <aside className="notice-card" aria-labelledby="moving-may">
        <h2 id="moving-may">You may qualify — HRA decides</h2>
        <p>
          Eligibility is case by case. Bring IDs, proof of income, rent bills, and your lease when HRA asks.
          Never send ACCESS HRA passwords to LeasePath — we do not collect them.
        </p>
      </aside>

      <p className="fine after-caveat">{CAVEAT} Last reviewed {LAST_REVIEWED}.</p>
    </div>
  )
}
