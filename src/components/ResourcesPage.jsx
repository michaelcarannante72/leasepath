import { RESOURCES } from '../data.js'
import { Icon } from './Icon.jsx'
import { PantryFinder } from './PantryFinder.jsx'
import { FREE_FOOD_CAUTION, FREE_FOOD_LABEL, ADDED_ON, SOURCE_CREDIT, COMMUNITY_SECTIONS } from '../freeFood.js'

function tel(phone) {
  return `tel:${phone.replace(/ ext\. ?/, ',').replace(/[^\d,]/g, '')}`
}

function siteLabel(href) {
  return href.includes('instagram.com') ? 'Their Instagram' : 'Their website'
}

function jumpTo(event, id) {
  // Hash routing owns location.hash, so scroll in place instead of changing it.
  event.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function CommunityCard({ item, caution }) {
  const links = item.links || (item.link ? [{ href: item.link, label: siteLabel(item.link) }] : [])
  return (
    <li className="free-food-card">
      <strong>{item.name}</strong>
      {item.group !== item.name && <span>Run by {item.group}</span>}
      {item.lead && <p className="free-food-lead">{item.lead}</p>}
      {item.scope && <p className="free-food-scope">{item.scope}</p>}
      <dl>
        {item.who && <div><dt>Who</dt><dd>{item.who}</dd></div>}
        {item.when && <div><dt>When</dt><dd>{item.when}</dd></div>}
        {item.where && <div><dt>Where</dt><dd>{item.where}</dd></div>}
        <div><dt>What</dt><dd>{item.offers}</dd></div>
        {item.centers && <div><dt>Centers</dt><dd>{item.centers}</dd></div>}
        {item.cost && <div><dt>Cost</dt><dd>{item.cost}</dd></div>}
        {item.how && <div><dt>How</dt><dd>{item.how}</dd></div>}
        {item.phone && <div><dt>Phone</dt><dd><a href={tel(item.phone)}>{item.phone}</a></dd></div>}
        {item.email && <div><dt>Email</dt><dd><a href={`mailto:${item.email}`}>{item.email}</a></dd></div>}
      </dl>
      {item.note && <p className="free-food-note">{item.note}</p>}
      {links.map((link) => (
        <a key={link.href} className="free-food-link" href={link.href} target="_blank" rel="noopener noreferrer">{link.label} <Icon name="external" size={14} /></a>
      ))}
      <p className="free-food-caution">{caution ? <>{FREE_FOOD_CAUTION} Added {ADDED_ON}.</> : <>Added {ADDED_ON}.</>}</p>
    </li>
  )
}

export function ResourcesPage() {
  const groups = [...new Set(RESOURCES.map((item) => item.group))]
  return (
    <div className="page">
      <p className="eyebrow">Resources</p>
      <h1>Open resources for a HASA voucher</h1>
      <p className="lede">No sign-in. This list is for a household that already has HASA rental assistance. It includes the food box, pantries, SNAP, and the other city programs next to that voucher. The agency site is where the rule lives.</p>
      <p className="after-link"><a href="#/after-you-find#chap">Coming 2027: CHAP, a new city voucher (press reporting)</a> · <a href="#/after-you-find">After you find an apartment</a></p>
      <PantryFinder />
      <section className="resource-group free-food" aria-label="Community resources">
        <nav className="community-jump" aria-label="Jump to a community section">
          <p>Jump to:</p>
          <ul>
            {COMMUNITY_SECTIONS.map((section) => (
              <li key={section.id}><a href={`#/resources`} onClick={(event) => jumpTo(event, section.id)}>{section.jump}</a></li>
            ))}
          </ul>
        </nav>
        {COMMUNITY_SECTIONS.map((section, index) => {
          const Heading = index === 0 ? 'h2' : 'h3'
          return (
            <div key={section.id} className="community-part">
              <Heading id={section.id} className="community-heading">{section.title}</Heading>
              {section.label && <p className="free-food-label">{FREE_FOOD_LABEL}</p>}
              <ul className="resource-list">
                {section.items.map((item) => <CommunityCard key={item.name} item={item} caution={section.caution} />)}
              </ul>
            </div>
          )
        })}
        <p className="free-food-source">{SOURCE_CREDIT.before}<a href={SOURCE_CREDIT.href} target="_blank" rel="noopener noreferrer">{SOURCE_CREDIT.text} ({SOURCE_CREDIT.href})</a>{SOURCE_CREDIT.after}</p>
      </section>
      {groups.map((group) => (
        <section key={group} className="resource-group">
          <h2>{group}</h2>
          <ul className="resource-list">
            {RESOURCES.filter((item) => item.group === group).map((item) => (
              <li key={item.title}>
                <a href={item.href} target={item.href.startsWith('tel:') ? undefined : '_blank'} rel="noreferrer">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                  <em>{item.action} <Icon name="external" size={14} /></em>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
