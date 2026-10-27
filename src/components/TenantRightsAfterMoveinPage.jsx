import { HEAT_RULES, SECTIONS, SOURCES } from '../data/tenantRightsAfterMovein.js'
import { Icon } from './Icon.jsx'

export function TenantRightsAfterMoveinPage() {
  return (
    <article className="page tenant-rights-movein">
      <p className="eyebrow">After move-in</p>
      <h1>Tenant rights after you move in</h1>
      <p className="lede">
        Repairs, heat season, 311 / HPD complaints, and Housing Court help. Phones and temperatures are from the official pages named on each card.
        You may qualify for free legal help — the provider decides.
      </p>

      <section className="heat-card" aria-labelledby="heat-card-title">
        <h2 id="heat-card-title">Heat Season at a glance</h2>
        <ul>
          <li><strong>Season:</strong> {HEAT_RULES.season}</li>
          <li><strong>Day ({HEAT_RULES.day.hours}):</strong> if outside &lt; {HEAT_RULES.day.outsideBelow}°F, inside ≥ {HEAT_RULES.day.insideAtLeast}°F</li>
          <li><strong>Night ({HEAT_RULES.night.hours}):</strong> inside ≥ {HEAT_RULES.night.insideAtLeast}°F ({HEAT_RULES.night.note.toLowerCase()})</li>
          <li><strong>Hot water:</strong> ≥ {HEAT_RULES.hotWater.minF}°F, {HEAT_RULES.hotWater.days}</li>
        </ul>
        <p className="fine">
          Source:{' '}
          <a href={SOURCES.hpdHeat.href} target="_blank" rel="noreferrer">{SOURCES.hpdHeat.label}</a>
        </p>
      </section>

      <ul className="rights-movein-list">
        {SECTIONS.map((section) => (
          <li key={section.id} className="rights-movein-card">
            <h2>{section.title}</h2>
            <p>{section.body}</p>
            <div className="card-actions">
              {section.links.map((link) =>
                link.external ? (
                  <a key={link.href + link.label} className="card-link" href={link.href} target="_blank" rel="noreferrer">
                    {link.label} <Icon name="external" size={14} />
                  </a>
                ) : (
                  <a key={link.href + link.label} className="button button-quiet" href={link.href}>
                    {link.label}
                  </a>
                ),
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="card-actions">
        <a className="button" href="#/know-your-rights">Know your rights</a>
        <a className="button button-quiet" href="#/resources">Resources</a>
      </p>
    </article>
  )
}
