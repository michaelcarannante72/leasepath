import { tx } from '../i18nAuto.js'
import { SHEET_LABEL, filterSheetListings } from '../data/sheetListings.js'

function money(value) {
  return `$${Number(value).toLocaleString('en-US')}`
}

/** One listing from the HRA apartment list, in the voucher-ready card format. No photo, amenities or dates: the list has none. */
export function SheetListingCard({ unit }) {
  return (
    <li className="card sheet-card" id={unit.id}>
      <div className="card-body">
        <div className="card-top">
          <strong>{unit.borough} · {tx(unit.sizeLabel)}</strong>
          <span>{money(unit.rent)}{tx("/mo")}</span>
        </div>
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

export function SheetListings({ filters }) {
  const units = filterSheetListings(filters)
  if (!units.length) return null
  return (
    <section className="voucher-ready sheet-listings panel" aria-labelledby="sheet-listings-heading">
      <h2 id="sheet-listings-heading">{tx("Apartments from an HRA list")} <span className="fine">({units.length})</span></h2>
      <p>{tx("Copied from a printed apartment list dated October 2026. LeasePath has not checked these units. Call to confirm the rent and that the unit is still available, and confirm with your worker before you pay anything.")}</p>
      <ul className="cards voucher-ready-cards">
        {units.map((unit) => <SheetListingCard key={unit.id} unit={unit} />)}
      </ul>
    </section>
  )
}
