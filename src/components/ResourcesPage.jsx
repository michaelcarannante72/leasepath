import { tx } from '../i18nAuto.js'
import { useMemo, useState } from 'react'
import { useLanguage } from './languageContext.js'
import { RESOURCES } from '../data.js'
import { Icon } from './Icon.jsx'
import { PantryFinder } from './PantryFinder.jsx'
import { FREE_FOOD_CAUTION, FREE_FOOD_LABEL, ADDED_ON, SOURCE_CREDIT, COMMUNITY_SECTIONS } from '../freeFood.js'
import { BOROUGHS, filterSection } from '../resourceFilter.js'
import { SponsoredSlot } from './SponsoredSlot.jsx'

// Search and filters live only in component state: nothing is fetched, saved, or sent.

const CITY_ID = 'city-programs'

const SECTION_ICONS = {
  'free-food-title': 'food',
  'housing-title': 'home',
  'other-help-title': 'bike',
  'health-title': 'health',
  'older-title': 'elders',
  [CITY_ID]: 'city',
}

const CITY_GROUP_ICONS = {
  'HASA voucher': 'heart',
  Food: 'food',
  'Rent help and vouchers': 'home',
  'If a landlord says no': 'card',
  'Jobs and training': 'steps',
  Call: 'phone',
}

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const CITY_SECTIONS = [...new Set(RESOURCES.map((item) => item.group))].map((group) => ({
  id: `city-${slug(group)}`,
  title: group,
  type: 'city program government',
  icon: CITY_GROUP_ICONS[group] || 'city',
  hasa: group === 'HASA voucher',
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

function oneLine(text) {
  if (!text) return ''
  const cut = text.split(/(?<=[.!?])\s/)[0] || text
  return cut.length > 140 ? `${cut.slice(0, 137).trim()}…` : cut
}

function CommunityCard({ item, caution }) {
  const links = item.links || (item.link ? [{ href: item.link, label: siteLabel(item.link) }] : [])
  return (
    <li className="resource-card">
      <div className="resource-card-main">
        <strong className="resource-card-name">{item.name}</strong>
        <p className="resource-card-what">{oneLine(item.offers)}</p>
        {(item.area || item.scope) && (
          <p className="resource-card-meta">
            <Icon name="pin" size={14} />
            <span>{item.scope || item.area}</span>
          </p>
        )}
        {item.lead && <p className="free-food-lead">{item.lead}</p>}
      </div>
      {(item.phone || links.length > 0) && (
        <div className="card-actions">
          {item.phone && <a className="card-call" href={tel(item.phone)} aria-label={`${tx('Call')} ${item.phone} (${item.name})`}>{tx("Call")} {item.phone}</a>}
          {links.map((link) => (
            <a key={link.href} className="card-link" href={link.href} target="_blank" rel="noopener noreferrer">{link.label} <Icon name="external" size={14} /></a>
          ))}
        </div>
      )}
      <details className="card-more">
        <summary>{tx("More")}<span className="sr-only"> {tx("about")} {item.name}</span></summary>
        {item.group !== item.name && <span>{tx("Run by")} {item.group}</span>}
        <dl>
          {item.who && <div><dt>{tx("Who")}</dt><dd>{item.who}</dd></div>}
          {item.when && <div><dt>{tx("When")}</dt><dd>{item.when}</dd></div>}
          {item.where && <div><dt>{tx("Where")}</dt><dd>{item.where}</dd></div>}
          {item.centers && <div><dt>{tx("Centers")}</dt><dd>{item.centers}</dd></div>}
          {item.cost && <div><dt>{tx("Cost")}</dt><dd>{item.cost}</dd></div>}
          {item.how && <div><dt>{tx("How")}</dt><dd>{item.how}</dd></div>}
          {item.phone && <div><dt>{tx("Phone")}</dt><dd><a href={tel(item.phone)}>{item.phone}</a></dd></div>}
          {item.email && <div><dt>Email</dt><dd><a href={`mailto:${item.email}`}>{item.email}</a></dd></div>}
          {item.offers && <div><dt>{tx("Offers")}</dt><dd>{item.offers}</dd></div>}
        </dl>
        {item.note && <p className="free-food-note">{item.note}</p>}
        <p className="free-food-caution">{caution ? <>{FREE_FOOD_CAUTION} {tx("Added")} {ADDED_ON}.</> : <>{tx("Added")} {ADDED_ON}.</>}</p>
      </details>
    </li>
  )
}

function CityCard({ item, hasa }) {
  const phone = item.href.startsWith('tel:')
  return (
    <li className={`resource-card${hasa ? ' resource-card-hasa' : ''}`}>
      <div className="resource-card-main">
        <strong className="resource-card-name">{item.title}</strong>
        {hasa && <span className="resource-badge">{tx("HASA-specific")}</span>}
        <p className="resource-card-what">{oneLine(item.detail)}</p>
        <p className="resource-card-meta"><Icon name="pin" size={14} /><span>{tx("Citywide · official source")}</span></p>
      </div>
      <div className="card-actions">
        {phone ? (
          <a className="card-call" href={item.href} aria-label={`${item.action}`}>{item.action}</a>
        ) : (
          <a className="card-link" href={item.href} target="_blank" rel="noopener noreferrer">{item.action} <Icon name="external" size={14} /></a>
        )}
      </div>
      <details className="card-more">
        <summary>{tx("More")}<span className="sr-only"> {tx("about")} {item.title}</span></summary>
        <p className="resource-card-full">{item.detail}</p>
      </details>
    </li>
  )
}

function Collapsible({ id, title, count, icon, badge, open, onToggle, children }) {
  const panel = `${id}-panel`
  return (
    <section className="community-part resource-section" aria-labelledby={id}>
      <h3 id={id} className="community-heading">
        <button type="button" className="section-toggle" aria-expanded={open} aria-controls={panel} onClick={onToggle}>
          <span className="section-toggle-label">
            {icon && <span className="section-icon" aria-hidden="true"><Icon name={icon} size={18} /></span>}
            <span className="section-title-text">{title}</span>
            {badge && <span className="resource-badge">{badge}</span>}
            <span className="section-count">{count}</span>
          </span>
          <span className="section-chevron" aria-hidden="true"><Icon name="chevron" size={18} /></span>
        </button>
      </h3>
      <div id={panel} hidden={!open}>{children}</div>
    </section>
  )
}

export function ResourcesPage() {
  const { t } = useLanguage()
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
  const cityCount = CITY_SECTIONS.reduce((sum, s) => sum + s.items.length, 0)
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
      <p className="eyebrow">{t("resources.eyebrow")}</p>
      <h1>{t("resources.title")}</h1>
      <p className="lede">{t("resources.lede")}</p>
      <nav className="guide-links" aria-label={t("resources.jump")}>
        <h2 className="guide-links-title">{t("resources.jump")}</h2>
        <ul className="chip-links">
          <li><a href="#/housing-connect">{t("resources.link.hc")}</a></li>
          <li><a href="#/listing-check">{t("resources.link.check")}</a></li>
          <li><a href="#/after-you-find#chap">{t("resources.chap")}</a></li>
          <li><a href="#/after-you-find">{t("resources.afterFind")}</a></li>
          <li><a href="#/inspection-prep">{t("resources.link.hqs")}</a></li>
          <li><a href="#/scam-alerts">{t("resources.link.scam")}</a></li>
          <li><a href="#/moving-help">{t("resources.link.moving")}</a></li>
          <li><a href="#/know-your-rights">{t("resources.link.rights")}</a></li>
          <li><a href="#/landlord-welcome">{t("resources.link.landlord")}</a></li>
          <li><a href="#/docs-tracker">{t("resources.link.docs")}</a></li>
          <li><a href="#/roadmap">{t("resources.link.roadmap")}</a></li>
          <li><a href="#/after-movein">{t("resources.link.movein")}</a></li>
          <li><a href="#/utility-help">{t("resources.link.heap")}</a></li>
          <li><a href="#/viewing-checklist">{t("resources.link.viewing")}</a></li>
          <li><a href="#/youth">{t("resources.link.youth")}</a></li>
          <li><a href="#/install">{t("resources.link.install")}</a></li>
        </ul>
      </nav>

      <aside className="borough-guides-callout" aria-labelledby="borough-guides-title">
        <h2 id="borough-guides-title">{tx("Borough voucher-renter guides")}</h2>
        <p>{tx("Transit notes, HRA Benefits Access and SNAP centers (addresses from HRA), and tips for each borough.")}</p>
        <p><a className="button" href="#/guides">{tx("Open borough guides")}</a></p>
      </aside>

      <aside className="partners-callout" aria-labelledby="partners-callout-title">
        <h2 id="partners-callout-title">{tx("Legal aid and nonprofit partners")}</h2>
        <p>{tx("Legal Aid Society, Housing Court Answers, the NYC Tenant Helpline, Office of Civil Justice, and more — filterable by borough.")}</p>
        <p><a className="button" href="#/partners">{tx("Open partner directory")}</a></p>
      </aside>

      <aside className="help-now" aria-labelledby="help-now-title">
        <h2 id="help-now-title">{t("resources.helpNow")}</h2>
        <ul>
          <li><a className="help-call" href="tel:311">{t("resources.shelter")}</a></li>
          <li><a className="help-call" href="tel:988">{t("resources.crisis")}</a></li>
        </ul>
        <p className="help-jumps">
          <button type="button" onClick={() => jumpTo('free-food-title')}>{t("resources.food")}</button>
          <button type="button" onClick={() => jumpTo('health-title')}>{t("resources.health")}</button>
        </p>
      </aside>

      <SponsoredSlot placement="resources" />

      <section className="resource-group free-food" aria-label={tx("Community resources")}>
        <div className="resource-search" role="search">
          <label htmlFor="resource-q">{t("resources.searchLabel")}</label>
          <input id="resource-q" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("resources.searchPlaceholder")} autoComplete="off" spellCheck="false" />
          <div className="borough-chips" role="group" aria-label={t("resources.borough")}>
            {['', ...BOROUGHS].map((name) => (
              <button key={name || 'all'} type="button" className="chip" aria-pressed={borough === name} onClick={() => setBorough(name)}>{name || t("resources.allBoroughs")}</button>
            ))}
          </div>
        </div>

        <nav className="community-jump" aria-label={t("resources.categories")}>
          <ul>
            {COMMUNITY_SECTIONS.map((section) => (
              <li key={section.id}>
                <button type="button" className="chip chip-category" aria-pressed={category === section.id} onClick={() => pickCategory(section.id)}>
                  <Icon name={SECTION_ICONS[section.id] || 'heart'} size={14} />
                  <span>{section.jump}</span>
                  <span className="chip-count">{section.items.length}</span>
                </button>
              </li>
            ))}
            <li>
              <button type="button" className="chip chip-category" aria-pressed={category === CITY_ID} onClick={() => pickCategory(CITY_ID)}>
                <Icon name="city" size={14} />
                <span>{t("resources.cityPrograms")}</span>
                <span className="chip-count">{cityCount}</span>
              </button>
            </li>
          </ul>
        </nav>

        <p id="resource-results" className="resource-status" role="status" aria-live="polite">
          {filtering || category ? t("resources.showing", { shown: shownCount, total }) : t("resources.total", { total })}
          {(filtering || category) && <> <button type="button" className="link-button" onClick={clearAll}>{t("resources.clear")}</button></>}
        </p>

        {shownCount === 0 && (
          <div className="resource-empty" role="status">
            <span className="resource-empty-icon" aria-hidden="true"><Icon name="search" size={28} /></span>
            <h2>{t("resources.emptyTitle")}</h2>
            <p>{t("resources.emptyBody")}</p>
            <button type="button" className="button" onClick={clearAll}>{t("resources.clear")}</button>
          </div>
        )}

        {visibleCommunity.map((section) => (
          <Collapsible key={section.id} id={section.id} title={section.title} count={section.shown.length} icon={SECTION_ICONS[section.id]} open={isOpen(section.id)} onToggle={() => toggle(section.id)}>
            {section.label && <p className="free-food-label">{FREE_FOOD_LABEL}</p>}
            <ul className="resource-list">
              {section.shown.map((item) => <CommunityCard key={item.name} item={item} caution={section.caution} />)}
            </ul>
          </Collapsible>
        ))}

        {visibleCity.length > 0 && (
          <div className="city-block">
            <h2 id={CITY_ID} className="city-title">
              <span className="section-icon" aria-hidden="true"><Icon name="city" size={20} /></span>
              {t("resources.cityPrograms")}
              <span className="section-count">{visibleCity.reduce((sum, s) => sum + s.shown.length, 0)}</span>
            </h2>
            <p className="city-lede">{t("resources.cityLede")}</p>
          </div>
        )}
        {visibleCity.map((section) => (
          <Collapsible
            key={section.id}
            id={section.id}
            title={section.title}
            count={section.shown.length}
            icon={section.icon}
            badge={section.hasa ? 'HASA-specific' : undefined}
            open={isOpen(section.id)}
            onToggle={() => toggle(section.id)}
          >
            <ul className="resource-list">
              {section.shown.map((item) => <CityCard key={item.title} item={item} hasa={section.hasa} />)}
            </ul>
          </Collapsible>
        ))}

        <p className="free-food-source">{SOURCE_CREDIT.before}<a href={SOURCE_CREDIT.href} target="_blank" rel="noopener noreferrer">{SOURCE_CREDIT.text} ({SOURCE_CREDIT.href})</a>{SOURCE_CREDIT.after}</p>
      </section>

      <PantryFinder />
    </div>
  )
}
