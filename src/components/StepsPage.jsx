import { tx } from '../i18nAuto.js'
import { STEPS } from '../data.js'
import { Icon } from './Icon.jsx'
import { LandingSteps } from './LandingHero.jsx'

export function StepsPage({ checked, onToggle, onAsk }) {
  const done = checked.length
  return (
    <div className="page">
      <p className="eyebrow">{tx("Steps")}</p>
      <h1>{tx("From the letter to the lease")}</h1>
      <p className="lede">{done} {tx("of")} {STEPS.length} {tx("checked. Your worker’s instructions come first if they differ.")}</p>
      {/* Moved from the home page: the pitch and the 3-step strip. */}
      <section className="steps-intro" aria-label={tx("How LeasePath works")}>
        <p className="pitch">{tx("Brokers who say “I’ll call you back” and then transfer you are the reason this exists.")}</p>
        <LandingSteps onFind={() => { window.location.hash = '#/' }} onAsk={onAsk} />
      </section>
      <aside className="roadmap-callout" aria-labelledby="roadmap-callout-title">
        <h2 id="roadmap-callout-title">{tx("Shelter to housing roadmap")}</h2>
        <p>{tx("See the full timeline — shopping letter, search, packet, inspection, lease — with links to each tool.")}</p>
        <p><a className="button" href="#/roadmap">{tx("Open roadmap")}</a></p>
      </aside>
      <div className="step-progress" role="progressbar" aria-label={tx("Steps checked")} aria-valuemin={0} aria-valuemax={STEPS.length} aria-valuenow={done}>
        <span style={{ width: `${STEPS.length ? Math.round((done / STEPS.length) * 100) : 0}%` }} />
      </div>
      <p className="after-link"><a href="#/after-you-find">{tx("After you find an apartment: rent review, inspection, and move-in →")}</a></p>
      <p className="after-link"><a href="#/caseworker-pack">{tx("Share a caseworker pack (PDF on this phone) →")}</a></p>
      <p className="after-link"><a href="#/docs-tracker">{tx("Documents and deadlines (on this phone) →")}</a></p>
      <p className="after-link"><a href="#/inspection-prep">{tx("HQS inspection prep checklist →")}</a></p>
      <p className="after-link"><a href="#/moving-help">{tx("Moving help: One Shot Deal and special grants →")}</a></p>
      <ol className="steps">
        {STEPS.map((step, index) => {
          const on = checked.includes(index)
          return (
            <li key={step.title}>
              <label className={on ? 'step is-on' : 'step'}>
                <input type="checkbox" checked={on} onChange={() => onToggle(index)} />
                <span className="step-mark" aria-hidden="true">{on ? <Icon name="check" size={16} /> : index + 1}</span>
                <span>
                  <strong>{tx(step.title)}</strong>
                  <span>{tx(step.detail)}</span>
                </span>
              </label>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
