import { tx } from '../i18nAuto.js'
import { searchPagesForFilters } from '../data/voucherSearches.js'
import { LandlordPitch } from './LandlordPitch.jsx'

function money(value) {
  return `$${Number(value).toLocaleString('en-US')}`
}

/** Shown in place of listing results while LeasePath has no public units of its own. */
export function SearchEmptyState({ filters }) {
  const pages = searchPagesForFilters(filters)
  const exact = pages.length === 1 ? pages[0] : null

  return (
    <section id="search-results" className="search-empty panel" aria-labelledby="search-empty-heading">
      <h2 id="search-empty-heading">{tx("Looking for an apartment?")}</h2>
      <p>{tx("LeasePath is just getting started, so our own listings are still filling in. You can search Craigslist and StreetEasy already set to a voucher rent limit, or check open Housing Connect lotteries.")}</p>

      {exact ? (
        <>
          <h3>{tx("Search listings at this limit")}</h3>
          <p>{tx("These links open Craigslist or StreetEasy with the max rent and bedroom size already set. Listings change. Confirm rent, utilities, and voucher acceptance yourself.")}</p>
          <p className="search-empty-limit">
            <a href={exact.path}>{exact.chipLabel}</a>
            {' · '}
            {tx("Max rent {limit} / month, utilities included.", { limit: money(exact.limit) })}
          </p>
          <div className="button-row">
            <a className="button" href={exact.craigslist} target="_blank" rel="noopener noreferrer">{tx("Craigslist · {borough}", { borough: exact.borough.name })}</a>
            <a className="button button-quiet" href={exact.streeteasy} target="_blank" rel="noopener noreferrer">{tx("StreetEasy · {borough}", { borough: exact.borough.name })}</a>
          </div>
        </>
      ) : (
        <>
          <h3>{tx("Popular voucher searches")}</h3>
          <p>{tx("These open a LeasePath page with the rent limit and prefilled Craigslist and StreetEasy links.")}</p>
          <div className="popular-search-chips">
            {pages.map((page) => (
              <a key={page.path} className="popular-search-chip" href={page.path}>{page.chipLabel}</a>
            ))}
          </div>
          <p className="popular-searches-more"><a href="/search">{tx("See all popular voucher searches")}</a></p>
        </>
      )}

      <h3>{tx("Housing Connect lotteries")}</h3>
      <p>{tx("NYC Housing Connect posts affordable lotteries across the five boroughs. Applying is always free.")}</p>
      <div className="button-row">
        <a className="button button-quiet" href="#/housing-connect">{tx("See open Housing Connect lotteries")}</a>
      </div>

      <LandlordPitch compact headingId="search-empty-pitch-heading" />
    </section>
  )
}
