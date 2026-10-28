import { tx } from '../i18nAuto.js'
import { STEPS } from '../data.js'
import { Icon } from './Icon.jsx'
import { useLanguage } from './languageContext.js'
import { PageHero } from './PageHero.jsx'

function ProgressRing({ done, total }) {
  const r = 30
  const c = 2 * Math.PI * r
  const pct = total ? done / total : 0
  return (
    <div className="progress-ring" role="progressbar" aria-label={tx("Steps checked")} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
      <svg viewBox="0 0 72 72" aria-hidden="true" focusable="false">
        <circle className="ring-track" cx="36" cy="36" r={r} />
        <circle className="ring-fill" cx="36" cy="36" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      </svg>
      <span className="progress-ring-num"><span><strong>{done}</strong>/{total}</span></span>
    </div>
  )
}

function Row({ href, icon, label }) {
  return (
    <li>
      <a className="icon-row" href={href}>
        <span className="icon-row-icon" aria-hidden="true"><Icon name={icon} size={18} /></span>
        <span className="icon-row-label">{label.replace(/\s*→$/, '')}</span>
        <span className="icon-row-chev" aria-hidden="true"><Icon name="chevron" size={18} /></span>
      </a>
    </li>
  )
}

export function StepsPage({ checked, onToggle, onAsk }) {
  const { t } = useLanguage()
  const done = checked.length
  const journey = [
    { title: t('landing.step1.title'), detail: t('landing.step1.detail'), href: '#/plan', icon: 'card' },
    { title: t('landing.step2.title'), detail: t('landing.step2.detail'), href: '#/', icon: 'search' },
    { title: t('landing.step3.title'), detail: t('landing.step3.detail'), href: '#/', icon: 'spark', ask: true },
  ]
  return (
    <div className="page steps-page">
      <PageHero
        eyebrow={tx("Steps")}
        title={tx("From the letter to the lease")}
        id="steps-title"
        aside={<ProgressRing done={done} total={STEPS.length} />}
      >
        <p className="page-hero-lede">{done} {tx("of")} {STEPS.length} {tx("checked. Your worker’s instructions come first if they differ.")}</p>
      </PageHero>

      {/* Moved from the home page: the pitch and the 3-step strip. */}
      <section className="steps-intro" aria-label={tx("How LeasePath works")}>
        <p className="pitch-quote">{tx("Brokers who say “I’ll call you back” and then transfer you are the reason this exists.")}</p>
        <ol className="journey" aria-label={t('landing.stepsLabel')}>
          {journey.map((step, i) => (
            <li key={step.title}>
              <a className="journey-card" href={step.href} onClick={step.ask ? (event) => { event.preventDefault(); onAsk?.() } : undefined}>
                <span className="journey-num" aria-hidden="true">{i + 1}</span>
                <span className="journey-icon" aria-hidden="true"><Icon name={step.icon} size={20} /></span>
                <span className="journey-text">
                  <strong>{step.title}</strong>
                  <span>{step.detail}</span>
                </span>
                <span className="journey-go" aria-hidden="true"><Icon name="chevron" size={18} /></span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      <a className="roadmap-feature" href="#/roadmap" aria-labelledby="roadmap-callout-title">
        <span className="roadmap-copy">
          <span className="eyebrow">{tx("Roadmap")}</span>
          <strong id="roadmap-callout-title" className="roadmap-title">{tx("Shelter to housing roadmap")}</strong>
          <span>{tx("See the full timeline — shopping letter, search, packet, inspection, lease — with links to each tool.")}</span>
          <span className="roadmap-cta">{tx("Open roadmap")} <span aria-hidden="true">→</span></span>
        </span>
        <svg className="roadmap-mini" viewBox="0 0 200 60" aria-hidden="true" focusable="false">
          <line x1="14" y1="30" x2="186" y2="30" />
          {[14, 57, 100, 143, 186].map((x, i) => <circle key={x} cx={x} cy="30" r={i === 4 ? 9 : 6} className={i === 4 ? 'mini-end' : undefined} />)}
        </svg>
      </a>

      <nav className="icon-rows" aria-label={tx("More help after the search")}>
        <ul>
          <Row href="#/after-you-find" icon="home" label={tx("After you find an apartment: rent review, inspection, and move-in →")} />
          <Row href="#/caseworker-pack" icon="card" label={tx("Share a caseworker pack (PDF on this phone) →")} />
          <Row href="#/docs-tracker" icon="blog" label={tx("Documents and deadlines (on this phone) →")} />
          <Row href="#/inspection-prep" icon="check" label={tx("HQS inspection prep checklist →")} />
          <Row href="#/moving-help" icon="city" label={tx("Moving help: One Shot Deal and special grants →")} />
        </ul>
      </nav>

      <h2 className="steps-list-title">{tx("Your checklist")}</h2>
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
