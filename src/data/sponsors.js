// Static sponsor placements. EMPTY by default — nothing shows until Michael adds a row.
// No tracking pixels, no third-party scripts. Plain links only.
// Shape of a slot:
//   { id, title, blurb, href, cta? }
// Placements: resources | search

/** @typedef {{ id: string, title: string, blurb: string, href: string, cta?: string }} SponsorSlot */

/** @type {{ resources: SponsorSlot[], search: SponsorSlot[] }} */
export const SPONSOR_SLOTS = {
  resources: [
    // Example (keep commented — config stays empty in production until Michael adds a sponsor):
    // { id: 'example', title: 'Example Housing Partners', blurb: 'Voucher-friendly brokers. Applying stays free.', href: 'https://example.com', cta: 'Learn more' },
  ],
  search: [],
}

export const SPONSOR_CONTACT = 'michaelcarannante@yahoo.com'
export const SPONSOR_PAGE_PATH = '#/sponsor'

export function slotsFor(placement, config = SPONSOR_SLOTS) {
  const list = config?.[placement]
  return Array.isArray(list) ? list.filter((slot) => slot && slot.id && slot.title && slot.href) : []
}

export function hasSponsors(placement, config = SPONSOR_SLOTS) {
  return slotsFor(placement, config).length > 0
}
