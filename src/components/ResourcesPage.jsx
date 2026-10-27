import { useMemo, useState } from 'react'
import { RESOURCES } from '../data.js'
import { Icon } from './Icon.jsx'
import { PantryFinder } from './PantryFinder.jsx'
import { FREE_FOOD_CAUTION, FREE_FOOD_LABEL, ADDED_ON, SOURCE_CREDIT, COMMUNITY_SECTIONS } from '../freeFood.js'
import { BOROUGHS, filterSection } from '../resourceFilter.js'

// Search and filters live only in component state: nothing is fetched, saved, or sent.

const CITY_ID = 'city-programs'

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const CITY_SECTIONS = [...new Set(RESOURCES.map((item) => item.group))].map((group) => ({
  id: `city-${slug(group)}`,
  title: group,
  type: 'city program government',
  items: RESOURCES.filter((item) => item.group === group).map((item) => ({ ...item, name: item.title, citywide: true })),
}))

function tel(phone) {
  return `tel:${phone.replace(/ ext\. ?/, ',').replace(/[^\d,]/g, '')}`
}

function siteLabel(href) {
  return href.includes('instagram.com') ? 'Their Instagram' : 'Their website'
}

function scrollToId(id) {
  requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

function CommunityCard({ item, caution }) {
  const links = item.links || (item.link ? [{ href: item.link, label: siteLabel(item.link) }] : [])
  return (
    <li className="free-food-card">
      <strong>{item.name}</strong>
      {item.lead && <p className="free-food-lead">{item.lead}</p>}
      {item.scope && <p className="free-food-scope">{item.scope}</p>}
      <p className="card-what">{item.offers}</p>
      {item.area && !item.scope && <p className="card-area"><Icon name="pin" size={14} /> {item.area}</p>}
      {(item.phone || links.length > 0) && (
        <div className="card-actions">
          {item.phone && <a className="card-call" href={tel(item.phone)} aria-label={`Call ${item.name} at ${item.phone}`}>Call {item.phone}</a>}
          {links.map((link) => (
            <a key={link.href} className="free-food-link" href={link.href} target="_blank" rel="noopener noreferrer">{link.label} <Icon name="external" size={14} /></a>
          ))}
        </div>
      )}
      <details className="card-more">
        <summary>More<span className="sr-only"> about {item.name}</span></summary>
        {item.group !== item.name && <span>Run by {item.group}</span>}
        <dl>
          {item.who && <div><dt>Who</dt><dd>{item.who}</dd></div>}
          {item.when && <div><dt>When</dt><dd>{item.when}</dd></div>}
          {item.where && <div><dt>Where</dt><dd>{item.where}</dd></div>}
          {item.centers && <div><dt>Centers</dt><dd>{item.centers}</dd></div>}
          {item.cost && <div><dt>Cost</dt><dd>{item.cost}</dd></div>}
          {item.how && <div><dt>How</dt><dd>{item.how}</dd></div>}
          {item.phone && <div><dt>Phone</dt><dd><a href={tel(item.phone)}>{item.phone}</a></dd></div>}
          {item.email && <div><dt>Email</dt><dd><a href={`mailto:${item.email}`}>{item.email}</a></dd></div>}
        </dl>
        {item.note && <p className="free-food-note">{item.note}</p>}
        <p className="free-food-caution">{caution ? <>{FREE_FOOD_CAUTION} Added {ADDED_ON}.</> : <>Added {ADDED_ON}.</>}</p>
      </details>
    </li>
  )
}

function CityCard({ item }) {
  const external = !item.href.startsWith('tel:')
  return (
    <li>
      <a href={item.href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
        <strong>{item.title}</strong>
        <span>{item.detail}</span>
        <em>{item.action} <Icon name="external" size={14} /></em>
      </a>
    </li>
  )
}

function Collapsible({ id, title, count, open, onToggle, children }) {
  const panel = `${id}-panel`
  return (
    <div className="community-part">
      <h3 id={id} className="community-heading">
        <button type="button" className="section-toggle" aria-expanded={open} aria-controls={panel} onClick={onToggle}>
          <span>{title} <span className="section-count">({count})</span></span>
          <span className="section-chevron" aria-hidden="true"><Icon name="chevron" size={18} /></span>
        </button>
      </h3>
      <div id={panel} hidden={!open}>{children}</div>
    </div>
  )
}

export function ResourcesPage() {
  const [query, setQuery] = useState('')
  const [borough, setBorough] = useState('')
  const [category, setCategory] = useState('')
  const [open, setOpen] = useState({ 'free-food-title': true })
  const filtering = Boolean(query.trim() || borough)

  const community = useMemo(() => COMMUNITY_SECTIONS.map((section) => ({ ...section, shown: filterSection(section, { query, borough }) })), [query, borough])
  const city = useMemo(() => CITY_SECTIONS.map((section) => ({ ...section, shown: filterSection(section, { query, borough }) })), [query, borough])
  const total = [...COMMUNITY_SECTIONS, ...CITY_SECTIONS].reduce((sum, s) => sum + s.items.length, 0)
  const visibleCommunity = community.filter((s) => (!category || category === s.id) && s.shown.length)
  const visibleCity = !category || category === CITY_ID ? city.filter((s) => s.shown.length) : []
  const shownCount = [...visibleCommunity, ...visibleCity].reduce((sum, s) => sum + s.shown.length, 0)
  const isOpen = (id) => (open[id] ?? false) || filtering || category === id || (category === CITY_ID && id.startsWith('city-'))
  const toggle = (id) => setOpen((prev) => ({ ...prev, [id]: !isOpen(id) }))

  const pickCategory = (id) => {
    const next = category === id ? '' : id
    setCategory(next)
    if (next) {
      setOpen((prev) => ({ ...prev, [id]: true }))
      scrollToId('resource-results')
    }
  }
  const jumpTo = (id) => {
    setCategory('')
    setOpen((prev) => ({ ...prev, [id]: true }))
    scrollToId(id)
  }
  const clearAll = () => { setQuery(''); setBorough(''); setCategory('') }

  return (
    <div className="page resources-page">
      <p className="eyebrow">Resources</p>
      <h1>Open resources for a HASA voucher</h1>
      <p className="lede">No sign-in. This list is for a household that already has HASA rental assistance. It includes the food box, pantries, SNAP, and the other city programs next to that voucher. The agency site is where the rule lives.</p>
      <p className="after-link"><a href="#/after-you-find#chap">Coming 2027: CHAP, a new city voucher (press reporting)</a> · <a href="#/after-you-find">After you find an apartment</a> · <a href="#/moving-help">Moving help</a></p>

      <aside className="help-now" aria-labelledby="help-now-title">
        <h2 id="help-now-title">Need help now?</h2>
        <ul>
          <li><a className="help-call" href="tel:311">Need shelter tonight? Call 311</a></li>
          <li><a className="help-call" href="tel:988">Call or text 988 for a mental health crisis</a></li>
        </ul>
        <p className="help-jumps">
          <button type="button" onClick={() => jumpTo('free-food-title')}>Food</button>
          <button type="button" onClick={() => jumpTo('health-title')}>Health and support</button>
        </p>
      </aside>

      <section className="resource-group free-food" aria-label="Community resources">
        <div className="resource-search" role="search">
          <label htmlFor="resource-q">Search resources</label>
          <input id="resource-q" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, neighborhood, borough, or type" autoComplete="off" spellCheck="false" />
          <div className="borough-chips" role="group" aria-label="Borough">
            {['', ...BOROUGHS].map((name) => (
              <button key={name || 'all'} type="button" className="chip" aria-pressed={borough === name} onClick={() => setBorough(name)}>{name || 'All'}</button>
            ))}
          </div>
        </div>

        <nav className="community-jump" aria-label="Resource categories">
          <ul>
            {COMMUNITY_SECTIONS.map((section) => (
              <li key={section.id}><button type="button" className="chip" aria-pressed={category === section.id} onClick={() => pickCategory(section.id)}>{section.jump}</button></li>
            ))}
            <li><button type="button" className="chip" aria-pressed={category === CITY_ID} onClick={() => pickCategory(CITY_ID)}>City programs</button></li>
          </ul>
        </nav>

        <p id="resource-results" className="resource-status" role="status" aria-live="polite">
          {filtering || category ? `Showing ${shownCount} of ${total} listings.` : `${total} listings.`}
          {(filtering || category) && <> <button type="button" className="link-button" onClick={clearAll}>Clear filters</button></>}
        </p>
        {shownCount === 0 && <p className="resource-empty">No listings match. Try another word or borough.</p>}

        {visibleCommunity.map((section) => (
          <Collapsible key={section.id} id={section.id} title={section.title} count={section.shown.length} open={isOpen(section.id)} onToggle={() => toggle(section.id)}>
            {section.label && <p className="free-food-label">{FREE_FOOD_LABEL}</p>}
            <ul className="resource-list">
              {section.shown.map((item) => <CommunityCard key={item.name} item={item} caution={section.caution} />)}
            </ul>
          </Collapsible>
        ))}

        {visibleCity.length > 0 && <h2 id={CITY_ID} className="city-title">City programs</h2>}
        {visibleCity.map((section) => (
          <Collapsible key={section.id} id={section.id} title={section.title} count={section.shown.length} open={isOpen(section.id)} onToggle={() => toggle(section.id)}>
            <ul className="resource-list">
              {section.shown.map((item) => <CityCard key={item.title} item={item} />)}
            </ul>
          </Collapsible>
        ))}

        <p className="free-food-source">{SOURCE_CREDIT.before}<a href={SOURCE_CREDIT.href} target="_blank" rel="noopener noreferrer">{SOURCE_CREDIT.text} ({SOURCE_CREDIT.href})</a>{SOURCE_CREDIT.after}</p>
      </section>

      <PantryFinder />
    </div>
  )
}
