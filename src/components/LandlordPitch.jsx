import { tx } from '../i18nAuto.js'

export const LIST_UNIT_HASH = '#/list-unit'

export const PITCH_HEADLINE = 'Place your apartment on LeasePath and reach voucher-ready tenants.'

/** Pitch for developers, realtors, brokers, and property managers. Full banner on the home page; compact in empty states. */
export function LandlordPitch({ compact = false, headingId = 'landlord-pitch-heading' } = {}) {
  return (
    <section className={compact ? 'landlord-pitch is-compact' : 'landlord-pitch'} aria-labelledby={headingId}>
      <p className="eyebrow">{tx("For developers, realtors, brokers, and property managers")}</p>
      <h2 id={headingId}>{tx(PITCH_HEADLINE)}</h2>
      {compact ? (
        <p>{tx("Free to list. LeasePath is a new startup — we will not promise big traffic. You can edit or take a listing down anytime with a private link, and we will help you fill out the form.")}</p>
      ) : (
        <>
          <p>{tx("LeasePath is a new startup that helps New Yorkers with HASA, CityFHEPS, and Section 8 find a place to live. Listing a unit is free.")}</p>
          <p>{tx("We will not promise a rush of leads. What we offer is a clear listing in front of voucher-ready renters, and a private link so you can edit or take the unit down anytime. For many voucher programs, the city or housing agency pays its share of the rent directly to the owner after the unit and the lease are approved — that payment is between you and the agency, and LeasePath cannot guarantee it. Need a hand with the form? We will help you fill it out.")}</p>
        </>
      )}
      <div className="button-row">
        <a className="button" href={LIST_UNIT_HASH}>{tx("List a unit for free")}</a>
        <a className="button button-quiet" href="#/landlord-welcome">{tx("Why take vouchers?")}</a>
      </div>
    </section>
  )
}
