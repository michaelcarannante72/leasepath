import { slotsFor } from '../data/sponsors.js'
import { Icon } from './Icon.jsx'

/**
 * Clearly labeled Sponsored placement. Renders nothing when the config for
 * that placement is empty. No ad beacons, no third-party scripts — just a link.
 */
export function SponsoredSlot({ placement, config }) {
  const slots = slotsFor(placement, config)
  if (!slots.length) return null

  return (
    <aside className="sponsor-placement" aria-label="Sponsored">
      <p className="sponsor-placement-label">Sponsored</p>
      <ul className="sponsor-placement-list">
        {slots.map((slot) => (
          <li key={slot.id} className="sponsor-placement-card">
            <div className="sponsor-placement-main">
              <strong className="sponsor-placement-title">{slot.title}</strong>
              {slot.blurb && <p className="sponsor-placement-blurb">{slot.blurb}</p>}
            </div>
            <a className="card-link" href={slot.href} target="_blank" rel="noopener noreferrer sponsored">
              {slot.cta || 'Learn more'} <Icon name="external" size={14} />
            </a>
          </li>
        ))}
      </ul>
      <p className="sponsor-placement-note">
        Paid placement. Does not change Ruby’s answers or Search rankings.{' '}
        <a href="#/sponsor">Sponsor LeasePath</a>
      </p>
    </aside>
  )
}
