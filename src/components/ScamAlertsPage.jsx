import { tx } from '../i18nAuto.js'
import { CAVEAT, INTRO, LAST_REVIEWED, RED_FLAGS, REPORT, SCAM_TITLE, SOURCES } from '../scamAlerts.js'
import { Icon } from './Icon.jsx'

function Sources({ ids }) {
  return (
    <p className="fine after-sources">
      {tx("Source:")}{' '}
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

export function ScamAlertsPage() {
  return (
    <div className="page scam-page">
      <p className="eyebrow">{tx("Resources")}</p>
      <h1>{SCAM_TITLE}</h1>
      <p className="lede">{INTRO}</p>

      <aside className="notice-card" aria-labelledby="scam-nycha">
        <h2 id="scam-nycha">{tx("NYCHA’s warning")}</h2>
        <p>
          {tx("NYCHA never charges a fee to apply for public housing or Section 8, or to process a Section 8 rental. If anyone asks you for money while posing as NYCHA, report it.")}
        </p>
        <Sources ids={['nychaEligibility']} />
      </aside>

      <section className="panel" aria-labelledby="scam-flags">
        <h2 id="scam-flags">{tx("Red flags")}</h2>
        <ul className="scam-flags">
          {RED_FLAGS.map((flag) => (
            <li key={flag.id} className="scam-flag">
              <h3>{flag.title}</h3>
              <p>{flag.body}</p>
              <Sources ids={flag.sources} />
            </li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-labelledby="scam-report">
        <h2 id="scam-report">{tx("How to report")}</h2>
        <ul className="scam-report">
          {REPORT.map((item) => (
            <li key={item.id} className="scam-report-item">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <div className="button-row">
                {item.phone && (
                  <a className="button" href={`tel:${item.phone.replace(/\D/g, '')}`}>
                    {tx("Call")} {item.phone}
                  </a>
                )}
                {item.href && (
                  <a className="button button-quiet" href={item.href} target="_blank" rel="noreferrer">
                    {item.linkLabel} <Icon name="external" size={14} />
                  </a>
                )}
              </div>
              <Sources ids={item.sources} />
            </li>
          ))}
        </ul>
      </section>

      <p className="fine after-caveat">{CAVEAT} {tx("Last reviewed")} {LAST_REVIEWED}.</p>
    </div>
  )
}
