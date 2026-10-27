// Transcribed exactly from a printed HRA apartment list Michael photographed on 2026-10-27
// (a CSV copy is kept outside the repo). Rooms, address, unit, borough, rent and contact only:
// the sheet has no photos, amenities, dates or voucher terms, so none are added here.
// The sheet's "Harlem" and "West Harlem" are Manhattan; the written name is kept as the neighborhood.
// Nothing here says a unit accepts vouchers, and nothing implies HRA endorses LeasePath.
import { SIZES, VOUCHERS, pagePath } from './voucherSearches.js'

export const SHEET_LABEL = "From an HRA apartment list, Oct 2026. Call to confirm it's still available."
export const SHEET_DATE = '2026-10-27'

// [#, rooms, street, unit, borough as written, rent, contact as written]
const ROWS = [
  [1, "studio", "1405 Vyse Avenue", "3F", "Bronx", 2462, "(917) 563-2458"],
  [2, "studio", "2515 Olinville Ave", "4C", "Bronx", 1400, "(718) 582-3710"],
  [3, "studio", "785 Fairmount Place", "2P", "Bronx", 1900, "(718) 866-4716"],
  [4, "studio", "2110 5th Avenue", "1B", "Harlem", 2750, "(516) 857-9922"],
  [5, "studio", "1546 Madison Avenue", "4AA", "Harlem", 2450, "(516) 205-6746"],
  [6, "1", "181 East 206th Street", "4F", "Bronx", 1695, "(718) 791-3394"],
  [7, "1", "2725 Creston Avenue", "102", "Bronx", 2000, "(412) 915-3589"],
  [8, "1", "2387 Morris Avenue", "A7", "Bronx", 1995, "(212) 729-815"],
  [9, "1", "1072 Woodycrest Avenue", "4E", "Bronx", 2150, "(212) 729-8151"],
  [10, "1", "735 Walton Avenue", "E13", "Bronx", 1750, "(347) 780-8034"],
  [11, "1", "14 Convent Avenue", "1R", "West Harlem", 2500, "(832) 398-2334"],
  [12, "1", "119 East 97th Street", "3RW", "Manhattan", 2750, "(212) 582-2009"],
  [13, "1", "293 Riverside Drive", "5C", "Manhattan", 3500, "(212) 672-6350"],
  [14, "1", "91-59 191st Street", "4C", "Queens", 2275, "(718) 943-6102"],
  [15, "1", "67-40 Yellowstone Boulevard", "1J", "Queens", 2500, "(631) 306-6209"],
  [16, "2", "276 Grand Concourse", "415", "Bronx", 2975, "(917) 451-6788"],
  [17, "2", "2074 Arthur Avenue", "4E", "Bronx", 1990, "(201) 565-3847"],
  [18, "2", "1890 Pelham Parkway South", "A7", "Bronx", 2900, "(917) 563-2458"],
  [19, "2", "55 West Mosholu Parkway North", "3B", "Bronx", 2513, "(718) 866-4716"],
  [20, "2", "1651 Tomlinson Avenue", "GROUND", "Bronx", 2495, "(347) 780-8034"],
  [21, "2", "474 West 158th Street", "4", "Harlem", 2900, "(212) 381-2462"],
  [22, "2", "2267 1st Avenue", "2S", "Harlem", 3250, "(212) 427-8595"],
  [23, "2", "515 East 118th Street", "1", "Harlem", 3049, "(917) 885-6057"],
  [24, "2", "130-00 Atlantic Ave", "", "Queens", 3000, "(917) 943-2925"],
  [25, "2", "87-13 Myrtle Avenue", "2A", "Queens", 2650, "(917) 567-4708"],
  [26, "2", "89-20 55th Avenue", "1P", "Queens", 2900, "(347) 649-5278"],
  [27, "2", "35-16 28th Street", "GROUND", "Queens", 2850, "(718) 957-8210"],
  [28, "2", "1366 East 100th Street", "2", "Brooklyn", 2450, "(929) 499-2008"],
  [29, "2", "167 Sands Street", "218", "Brooklyn", 3395, "(646) 988-5355"],
  [30, "2", "2832 West 15th Street", "1B", "Brooklyn", 2450, "(646) 379-7580"],
  [31, "2", "376 Columbia Street", "2", "Brooklyn", 3200, "(347) 616-0935"],
  [32, "2", "717 Henry Street", "4L", "Brooklyn", 2950, "(646) 670-7912"],
  [33, "3", "200 Marcy Place", "3E", "Bronx", 2900, "(718) 313-3069"],
  [34, "3", "130-00 Atlantic Ave", "", "Queens", 3500, "(917) 943-2925"],
  [35, "3", "876 Greene Avenue", "3F", "Brooklyn", 2990, "(917) 304-2929"],
]

/** Search filter "beds" values: Studio, 1, 2, 3. */
const SIZE_BY_ROOMS = { studio: 'studio', 1: '1br', 2: '2br', 3: '3br' }
const FIT_VOUCHERS = ['nycha-section-8', 'cityfheps', 'fheps']

/** A tel: link only for a full 10-digit US number. A number printed short is shown as written, with no link. */
export function telHref(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  return digits.length === 10 ? `tel:+1${digits}` : null
}

export function voucherFit(sizeSlug, rent, boroughSlug) {
  return FIT_VOUCHERS.map((slug) => {
    const voucher = VOUCHERS.find((item) => item.slug === slug)
    const limit = voucher.limitFor(sizeSlug)
    if (limit == null) return null
    const over = rent > limit
    return {
      voucher: voucher.name,
      slug,
      limit,
      over,
      overBy: over ? rent - limit : 0,
      path: pagePath(slug, boroughSlug, sizeSlug),
    }
  }).filter(Boolean)
}

export const SHEET_LISTINGS = ROWS.map(([number, rooms, street, unit, written, rent, contact]) => {
  const borough = /harlem/i.test(written) ? 'Manhattan' : written
  const sizeSlug = SIZE_BY_ROOMS[rooms]
  const size = SIZES.find((item) => item.slug === sizeSlug)
  const boroughSlug = borough.toLowerCase().replace(/\s+/g, '-')
  return {
    id: `hra-sheet-${number}`,
    number,
    rooms,
    sizeSlug,
    bedrooms: size.beds,
    unitKind: size.unitKind,
    sizeLabel: rooms === 'studio' ? 'Studio' : `${rooms} bedroom${rooms === 1 ? '' : 's'}`,
    street,
    unit: unit || null,
    address: unit ? `${street} #${unit}` : street,
    borough,
    boroughSlug,
    neighborhood: borough === written ? null : written,
    rent,
    contact,
    tel: telHref(contact),
    phoneFlag: telHref(contact) ? null : 'This number has fewer than 10 digits on the printed list. Shown as written.',
    fit: voucherFit(sizeSlug, rent, boroughSlug),
  }
})

const BEDS_FILTER = { Studio: 'studio', 1: '1br', 2: '2br', 3: '3br' }

/** Same filters as the practice search: borough, beds, max rent, text. Saved-only hides them (they cannot be saved). */
export function filterSheetListings(filters = {}) {
  if (filters.savedOnly) return []
  const q = String(filters.q || '').trim().toLowerCase()
  const maxRent = Number(filters.maxRent)
  const beds = filters.beds && filters.beds !== 'Any' ? filters.beds : null
  return SHEET_LISTINGS.filter((item) => {
    if (filters.borough && filters.borough !== 'All' && item.borough !== filters.borough) return false
    if (maxRent > 0 && item.rent > maxRent) return false
    if (beds) {
      const want = BEDS_FILTER[beds]
      if (!want || want !== item.sizeSlug) return false
    }
    if (q && ![item.address, item.borough, item.neighborhood || '', item.sizeLabel].join(' ').toLowerCase().includes(q)) return false
    return true
  }).sort((a, b) => (filters.sort === 'rent-desc' ? b.rent - a.rent : a.rent - b.rent) || a.number - b.number)
}

export function sheetListingsFor(boroughSlug, sizeSlug) {
  return SHEET_LISTINGS.filter((item) => item.boroughSlug === boroughSlug && item.sizeSlug === sizeSlug)
}

function norm(text) {
  return String(text || '').toLowerCase().replace(/\bave\b/g, 'avenue').replace(/\bst\b/g, 'street').replace(/[^a-z0-9]+/g, ' ').trim()
}

/** Listing checker: pasted text that names a street address or phone from the list. */
export function matchSheetListing(raw) {
  const text = ` ${norm(raw)} `
  const digits = String(raw || '').replace(/\D/g, '')
  return SHEET_LISTINGS.filter((item) => text.includes(` ${norm(item.street)} `) || (item.tel && digits.includes(item.tel.slice(6))))
}
