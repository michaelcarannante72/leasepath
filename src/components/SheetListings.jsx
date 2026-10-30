import { tx } from '../i18nAuto.js'
import { SHEET_LABEL, filterSheetListings, PUBLIC_SHEET_LISTINGS, SHEET_LISTINGS } from '../data/sheetListings.js'

function money(value) {
  return `$${Number(value).toLocaleString('en-US')}`
}

/** One listing from the HRA apartment list, in the voucher-ready card format. No photo, amenities or dates: the list has none. */
export function SheetListingCard({ unit }) {
  const fits = unit.fit.filter((row) => !row.over).length
  return (
    <li className="card sheet-card" id={unit.id}>
      <div className="card-body">
        <div className="card-top">
          <p className="sheet-rent">{money(unit.rent)}<span>{tx("/mo")}</span></p>
          <span className={`qualify-pill${fits ? '' : ' is-over'}`}>{fits ? tx("You may qualify") : tx("Over the limits")}</span>
        </div>
        <p className="sheet-meta"><strong>{tx(unit.sizeLabel)}</strong> · {unit.borough}</p>
        <h3>{unit.street}{unit.unit ? <span className="sheet-unit"> · {tx("Unit")} {unit.unit}</span> : null}</h3>
        {unit.neighborhood && <p className="card-area">{tx("Neighborhood:")} {unit.neighborhood}</p>}
        <p className="sheet-label">{tx(SHEET_LABEL)}</p>
        <ul className="sheet-fit">
          {unit.fit.map((row) => (
            <li key={row.slug} className={row.over ? 'sheet-fit-over' : 'sheet-fit-ok'}>
              {row.over ? (
                tx('Over the {voucher} limit ({limit}) by {over}. Ask your worker before you apply.', { voucher: row.voucher, limit: money(row.limit), over: money(row.overBy) })
              ) : (
                tx('You may qualify with {voucher}: the limit is {limit}.', { voucher: row.voucher, limit: money(row.limit) })
              )}
            </li>
          ))}
        </ul>
        <p className="fine">{tx("Limits assume all utilities are included. The list does not say whether vouchers are accepted. Ask when you call.")}</p>
        <div className="card-actions">
          {unit.tel ? (
            <a className="card-call" href={unit.tel}>{tx("Call")} {unit.contact}</a>
          ) : (
            <p className="sheet-phone-flag">{tx("Contact as printed:")} {unit.contact}. {tx("This number has fewer than 10 digits on the printed list. Shown as written.")}</p>
          )}
        </div>
      </div>
    </li>
  )
}

const RESET_FILTERS = { q: '', program: 'All', borough: 'All', beds: 'Any', maxRent: '', savedOnly: false, sort: 'rent-asc' }

export function SheetListings({ filters, primary = false, onChange }) {
  const units = filterSheetListings(filters)
  if (!units.length && !primary) return null
  if (!units.length) {
    return (
      <section id="search-results" className="voucher-ready sheet-listings panel" aria-labelledby="sheet-listings-heading">
        <h2 id="sheet-listings-heading">{tx("Apartments from an HRA list")} <span className="fine">(0 {tx("of")} {PUBLIC_SHEET_LISTINGS.length})</span></h2>
        <div className="empty" aria-live="polite">
          <h3>{filters.savedOnly ? tx("Saved only covers practice listings, which are hidden for now.") : tx("No HRA-list apartment matches these filters.")}</h3>
          <p>{tx("Try another borough, any bedroom size, or a higher rent ceiling.")}</p>
          {onChange && <button type="button" className="button" onClick={() => onChange(RESET_FILTERS)}>{tx("Reset filters")}</button>}
        </div>
      </section>
    )
  }
  return (
    <section id={primary ? 'search-results' : undefined} className="voucher-ready sheet-listings panel" aria-labelledby="sheet-listings-heading">
      <h2 id="sheet-listings-heading">{tx("Apartments from an HRA list")} <span className="fine" aria-live={primary ? 'polite' : undefined}>({units.length}{primary && units.length !== SHEET_LISTINGS.length ? ` ${tx('of')} ${PUBLIC_SHEET_LISTINGS.length}` : ''})</span></h2>
      <p>{tx("Copied from a printed apartment list dated October 2026. LeasePath has not checked these units. Call to confirm the rent and that the unit is still available, and confirm with your worker before you pay anything.")}</p>
      <ul className="cards voucher-ready-cards">
        {units.map((unit) => <SheetListingCard key={unit.id} unit={unit} />)}
      </ul>
    </section>
  )
}
