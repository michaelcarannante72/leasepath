import { Icon } from './Icon.jsx'
import {
  GUIDE_SOURCES,
  HRA_HOURS,
  guideFor,
  guideList,
  searchLinksFor,
  telHref,
} from '../data/boroughGuides.js'

function SourceLink({ id }) {
  const source = GUIDE_SOURCES[id]
  if (!source) return null
  return (
    <a href={source.href} target="_blank" rel="noreferrer">
      {source.label} <Icon name="external" size={12} />
    </a>
  )
}

export function BoroughGuidesIndex() {
  const guides = guideList()
  return (
    <article className="page borough-guides">
      <p className="eyebrow">Borough guides</p>
      <h1>Voucher-renter guides by borough</h1>
      <p className="lede">
        Transit notes, HRA Benefits Access and SNAP centers with addresses from HRA&apos;s own pages, and tips for searching with a shopping letter.
        Hours on those pages are {HRA_HOURS}. LeasePath is not HRA, NYCHA, or HPD.
      </p>
      <ul className="borough-guide-grid">
        {guides.map((guide) => (
          <li key={guide.slug}>
            <a className="borough-guide-card" href={`#/guides/${guide.slug}`}>
              <strong>{guide.name}</strong>
              <span>{guide.offices.length} HRA offices listed · search links for {guide.the}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="fine borough-guide-sources">
        Official lists: <SourceLink id="bac" /> · <SourceLink id="snap" /> · <SourceLink id="locations" /> · <SourceLink id="mta" />
      </p>
    </article>
  )
}

export function BoroughGuidePage({ slug }) {
  const guide = guideFor(slug)
  if (!guide) {
    return (
      <div className="page">
        <h1>That borough guide is not on this list.</h1>
        <a className="button" href="#/guides">Back to borough guides</a>
      </div>
    )
  }
  const searches = searchLinksFor(guide.slug)
  return (
    <article className="page borough-guide">
      <p className="eyebrow">Borough guide</p>
      <h1>{guide.name} voucher-renter guide</h1>
      <p className="lede">
        For people searching in {guide.the} with CityFHEPS, FHEPS, HASA, or Section 8.
        You may qualify for more than one program — your worker decides. Office details below are copied from HRA.
      </p>

      <section className="borough-section" aria-labelledby="transit-title">
        <h2 id="transit-title">Getting around</h2>
        <ul className="plain-list">
          {guide.transit.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="fine">Schedules: <SourceLink id="mta" /></p>
      </section>

      <section className="borough-section" aria-labelledby="offices-title">
        <h2 id="offices-title">HRA centers and offices</h2>
        <p className="device-note">
          Hours on HRA&apos;s pages: {HRA_HOURS}. Phones are listed only when HRA published them on the Benefits Access Center page.
          For the full citywide list, open <SourceLink id="locations" />.
        </p>
        <ul className="borough-office-list">
          {guide.offices.map((office) => (
            <li key={office.name + office.address} className="borough-office">
              <h3>{office.name}</h3>
              <p>{office.address}</p>
              {office.phone ? (
                <p>
                  <a href={telHref(office.phone)}>{office.phone}</a>
                </p>
              ) : null}
              {office.note ? <p className="fine">{office.note}</p> : null}
              <p className="fine">
                Source: <SourceLink id={office.source} />
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="borough-section" aria-labelledby="search-title">
        <h2 id="search-title">Popular voucher searches</h2>
        <p>Prefilled Craigslist and StreetEasy pages for {guide.the}, using the verified payment standards on LeasePath.</p>
        {searches.length ? (
          <ul className="borough-search-chips">
            {searches.map((item) => (
              <li key={item.path}>
                <a className="popular-search-chip" href={item.path}>{item.label}</a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="fine">Search pages for this borough are not on main yet.</p>
        )}
        <p className="fine"><a href="/search">See all popular voucher searches</a> · <a href="#/">Open in-app Search</a></p>
      </section>

      <section className="borough-section" aria-labelledby="tips-title">
        <h2 id="tips-title">Tips for {guide.the}</h2>
        <ul className="plain-list">
          {guide.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <p className="fine">
          Online applications: <SourceLink id="accessHra" /> · Public housing and Section 8: <SourceLink id="nycha" /> · HPD: <SourceLink id="hpd" />
        </p>
      </section>

      <p className="borough-guide-nav">
        <a className="button button-quiet" href="#/guides">All borough guides</a>
        <a className="button button-quiet" href="#/resources">Resources</a>
      </p>
    </article>
  )
}
