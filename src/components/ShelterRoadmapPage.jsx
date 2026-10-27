import { tx } from '../i18nAuto.js'
import { ROADMAP_STEPS } from '../data/shelterRoadmap.js'
import { Icon } from './Icon.jsx'

export function ShelterRoadmapPage() {
  return (
    <article className="page shelter-roadmap">
      <p className="eyebrow">{tx("Roadmap")}</p>
      <h1>{tx("Shelter to housing")}</h1>
      <p className="lede">
        {tx("A plain timeline from shelter to keys. You may qualify for different paths — your caseworker and the program office decide. Links open tools already in LeasePath. Nothing here is sent to a server.")}
      </p>

      <ol className="roadmap-timeline">
        {ROADMAP_STEPS.map((step, index) => (
          <li key={step.id} className="roadmap-step">
            <div className="roadmap-marker" aria-hidden="true">{index + 1}</div>
            <div className="roadmap-body">
              <h2>{step.title}</h2>
              <p>{step.body}</p>
              <div className="card-actions">
                {step.links.map((link) => (
                  <a key={link.href + link.label} className="button button-quiet" href={link.href}>
                    {link.label} <Icon name="external" size={14} />
                  </a>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <p className="fine">
        {tx("Official shelter and voucher rules live on DHS, HRA, NYCHA, HPD, and HUD sites linked from Resources. This page is a practice guide, not an agency notice.")}
      </p>
      <p className="card-actions">
        <a className="button" href="#/steps">{tx("Open Steps")}</a>
        <a className="button button-quiet" href="#/resources">{tx("Resources")}</a>
      </p>
    </article>
  )
}
