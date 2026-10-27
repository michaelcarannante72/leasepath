import { tx } from '../i18nAuto.js'
import { HEAP, SECTIONS, SOURCES } from '../data/utilityHelp.js'
import { Icon } from './Icon.jsx'

export function UtilityHelpPage() {
  return (
    <article className="page utility-help">
      <p className="eyebrow">{tx("Utilities")}</p>
      <h1>{tx("HEAP and utility help")}</h1>
      <p className="lede">
        {tx("Official New York State HEAP links, HRA emergency assistance, and 311. Amounts and open dates change — confirm on the State page before you apply. You may qualify; OTDA and HRA decide. Nothing you type here is sent to a server.")}
      </p>

      <aside className="utility-callout">
        <h2>{tx("Apply in NYC")}</h2>
        <p>
          {tx("When the Regular HEAP season is open, NYC residents apply at")}{' '}
          <a href={HEAP.applyNyc} target="_blank" rel="noreferrer">{tx("access.nyc.gov")}</a>
          {' '}{tx("or mail HRA/HEAP at")} {HEAP.nycMail}{tx(". Emergency HEAP in NYC:")}{' '}
          <a href={`tel:${HEAP.nycEmergencyPhone.replace(/\D/g, '')}`}>{HEAP.nycEmergencyPhone}</a>.
        </p>
        <p className="fine">
          {tx("Sources:")}{' '}
          <a href={SOURCES.nyHeapApply.href} target="_blank" rel="noreferrer">{SOURCES.nyHeapApply.label}</a>
          {' · '}
          <a href={SOURCES.otdaHeap.href} target="_blank" rel="noreferrer">{SOURCES.otdaHeap.label}</a>
        </p>
      </aside>

      <ul className="utility-list">
        {SECTIONS.map((section) => (
          <li key={section.id} className="utility-card">
            <h2>{section.title}</h2>
            <p>{section.body}</p>
            <div className="card-actions">
              {section.links.map((link) => (
                <a
                  key={link.href + link.label}
                  className={link.external ? 'card-link' : 'button button-quiet'}
                  href={link.href}
                  {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                >
                  {link.label} {link.external ? <Icon name="external" size={14} /> : null}
                </a>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <p className="card-actions">
        <a className="button" href="#/resources">{tx("Resources")}</a>
        <a className="button button-quiet" href="#/know-your-rights">{tx("Know your rights")}</a>
      </p>
    </article>
  )
}
