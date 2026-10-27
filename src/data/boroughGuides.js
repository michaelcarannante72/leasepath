/** Voucher-renter guides by borough. Office addresses and phones are copied from HRA's official
 * Benefits Access Center and SNAP Center pages. If a figure is not on those pages, it is left out. */

import { BOROUGHS, SEARCH_PAGES } from './voucherSearches.js'

export const GUIDE_SOURCES = {
  bac: {
    label: 'HRA Benefits Access Centers',
    href: 'https://www.nyc.gov/site/hra/locations/job-locations-and-service-centers.page',
  },
  snap: {
    label: 'HRA SNAP Centers',
    href: 'https://www.nyc.gov/site/hra/locations/snap-locations.page',
  },
  locations: {
    label: 'HRA Center Locations',
    href: 'https://www.nyc.gov/site/hra/locations/locations.page',
  },
  accessHra: {
    label: 'ACCESS HRA',
    href: 'https://www.nyc.gov/accesshra',
  },
  mta: {
    label: 'MTA',
    href: 'https://www.mta.info/',
  },
  nycha: {
    label: 'NYCHA',
    href: 'https://www.nyc.gov/site/nycha/index.page',
  },
  hpd: {
    label: 'HPD',
    href: 'https://www.nyc.gov/site/hpd/index.page',
  },
}

/** Hours stated on the HRA BAC and SNAP center pages. */
export const HRA_HOURS = 'Monday – Friday, 8:30 a.m. to 5:00 p.m.'

/**
 * @typedef {{ name: string, address: string, phone?: string, note?: string, source: 'bac' | 'snap' }} Office
 */

/** @type {Record<string, {
 *   slug: string,
 *   name: string,
 *   the: string,
 *   transit: string[],
 *   tips: string[],
 *   offices: Office[],
 * }>} */
export const BOROUGH_GUIDES = {
  bronx: {
    slug: 'bronx',
    name: 'Bronx',
    the: 'the Bronx',
    transit: [
      'The 2, 5, 4, 6, B, and D trains serve much of the Bronx. Check the MTA trip planner before a showing.',
      'Metro-North stops at Harlem–125th Street connect to upper Manhattan and the Bronx.',
      'Bring a MetroCard or OMNY for each trip to a viewing. Do not count on a landlord to reimburse fares.',
    ],
    tips: [
      'Ask your worker whether the apartment must stay in the five boroughs (rooms and SROs for CityFHEPS do) or can be elsewhere in New York State.',
      'Use ACCESS HRA for many benefits applications before you wait at a center.',
      'Save sample listings in LeasePath, then confirm any real apartment with the broker and your worker before you pay or visit.',
      'If a landlord refuses a lawful voucher, that can be source-of-income discrimination. Call 311 or the NYC Commission on Human Rights.',
    ],
    offices: [
      {
        name: 'HRA Benefits Access Center Crotona',
        address: '1910 Monterey Avenue, Bronx, NY 10457',
        phone: '929-252-7310',
        source: 'bac',
      },
      {
        name: 'HRA Benefits Access Center Fordham',
        address: '2541-2549 Bainbridge Avenue, Bronx, NY 10458',
        phone: '929-252-3331',
        source: 'bac',
      },
      {
        name: 'Crotona SNAP Center',
        address: '1910 Monterey Avenue, 5th Fl., Bronx, NY 10457',
        source: 'snap',
      },
      {
        name: 'Hunts Point SNAP Center',
        address: '845 Barretto Street, B-Level Fl., Bronx, NY 10474',
        source: 'snap',
      },
    ],
  },
  brooklyn: {
    slug: 'brooklyn',
    name: 'Brooklyn',
    the: 'Brooklyn',
    transit: [
      'The 2, 3, 4, 5, A, C, F, G, L, N, Q, and R trains cover large parts of Brooklyn. Plan the walk from the station to the building.',
      'The LIRR stops at Atlantic Terminal for longer trips into Brooklyn.',
      'Night and weekend schedules change. Check the MTA before an evening viewing.',
    ],
    tips: [
      'Bring your shopping letter, ID, and a list of questions for the broker. Do not hand over a deposit because of a sample listing.',
      'Many voucher searches in Brooklyn compete fast. Call the same day you see a fit.',
      'Use ACCESS HRA online when you can. Center lines move slowly.',
      'You may qualify for more than one program. Your worker decides what applies to your case.',
    ],
    offices: [
      {
        name: 'HRA Benefits Access Center Bushwick',
        address: '2 George Street, Brooklyn, NY 11206',
        phone: '212-331-4289',
        source: 'bac',
      },
      {
        name: 'HRA Benefits Access Center Clinton Hill',
        address: '495 Clermont Ave, Brooklyn, NY 11238',
        phone: '929-221-2809',
        source: 'bac',
      },
      {
        name: 'HRA Benefits Access Center East New York',
        address: '2400 Fulton Street, 1st Floor, Brooklyn, NY 11233',
        phone: '718-636-2495',
        source: 'bac',
      },
      {
        name: 'Williamsburg SNAP Center',
        address: '2 George Street, 1st Fl., Brooklyn, NY 11206',
        source: 'snap',
      },
      {
        name: 'East New York SNAP Center',
        address: '2400 Fulton Street, 3rd & 4th Fl., Brooklyn, NY 11233',
        source: 'snap',
      },
    ],
  },
  manhattan: {
    slug: 'manhattan',
    name: 'Manhattan',
    the: 'Manhattan',
    transit: [
      'Most Manhattan neighborhoods sit on several subway lines. The 1, 2, 3, A, C, B, D, 4, 5, 6, N, Q, R, and L cover large stretches of the borough.',
      'Allow extra time for transfers at Times Square, Union Square, and 42nd Street–Grand Central.',
      'Confirm elevator and station accessibility on the MTA site if you need step-free access.',
    ],
    tips: [
      'Asking rents in Manhattan often sit near or above voucher limits. Compare the letter amount before you travel to a showing.',
      'SROs and rooms for CityFHEPS must stay in the five boroughs.',
      'Bring only the papers your worker told you to share. Do not send a Social Security number to a stranger who texts about an apartment.',
      'HASA, CityFHEPS, and Section 8 have different rules. LeasePath is practice — your worker and the agency control the real case.',
    ],
    offices: [
      {
        name: 'HRA Benefits Access Center St. Nicholas',
        address: '132 W. 125th Street, New York, NY 10027',
        phone: '212-274-5162',
        source: 'bac',
      },
      {
        name: 'HRA Benefits Access Center Dyckman',
        address: '4055 10th Avenue, New York, NY 10034',
        phone: '212-331-5110',
        source: 'bac',
      },
      {
        name: 'HRA Benefits Access Center Lower Manhattan',
        address: '109 E. 16th Street, New York, NY 10003',
        source: 'bac',
      },
      {
        name: 'East End SNAP Center',
        address: '2322 Third Avenue, 3rd Fl., New York, NY 10035',
        source: 'snap',
      },
      {
        name: 'Washington Heights SNAP Center',
        address: '4055 10th Avenue, Lower Level, New York, NY 10034',
        source: 'snap',
      },
    ],
  },
  queens: {
    slug: 'queens',
    name: 'Queens',
    the: 'Queens',
    transit: [
      'The 7, E, F, M, R, N, and A trains serve large parts of Queens. The Rockaways also use the A and the ferry.',
      'The LIRR has many Queens stops. Check schedules if a showing is far from the subway.',
      'Trips across Queens can be long. Build in buffer time so you are not late to a broker appointment.',
    ],
    tips: [
      'Neighborhoods vary widely on rent. Filter LeasePath Search by borough and bedroom size before you ride out.',
      'Keep a paper or phone copy of your shopping letter for every viewing.',
      'You may qualify for CityFHEPS, FHEPS, HASA, or Section 8 depending on your case — only your worker decides.',
      'For a full list of HRA offices, use the official HRA locations page linked below.',
    ],
    offices: [
      {
        name: 'HRA Benefits Access Center Jamaica',
        address: '165-08 88th Avenue, Queens, NY 11432',
        phone: '718-523-2146',
        source: 'bac',
      },
      {
        name: 'HRA Benefits Access Center Queens',
        address: '32-20 Northern Blvd, 4th Floor, Queens, NY 11101',
        phone: '718-784-5919',
        source: 'bac',
      },
      {
        name: 'HRA Benefits Access Center Rockaway',
        address: '219 Beach 59th Street, Queens, NY 11692',
        phone: '718-637-2144',
        source: 'bac',
      },
      {
        name: 'Jamaica SNAP Center',
        address: '165-08 88th Avenue, 3rd Fl., Jamaica, NY 11432',
        source: 'snap',
      },
      {
        name: 'Queens SNAP Center',
        address: '32-20 Northern Blvd., 2nd Fl., LIC, NY 11101 (entrance on One Honeywell Street)',
        source: 'snap',
      },
    ],
  },
  'staten-island': {
    slug: 'staten-island',
    name: 'Staten Island',
    the: 'Staten Island',
    transit: [
      'The Staten Island Ferry connects St. George to Manhattan. The SIR (Staten Island Railway) runs along the east shore.',
      'Many apartment searches on Staten Island need a bus after the ferry or SIR. Check the MTA bus map for your viewing.',
      'Allow ferry wait time. Weekend and late-night boats are less frequent.',
    ],
    tips: [
      'There are fewer sample listings for Staten Island in LeasePath Search. Still compare any asking rent to your letter.',
      'The Richmond HRA building on Bay Street houses Benefits Access and SNAP services on different floors.',
      'Call ahead when a phone number is listed. Bring ID and your case papers your worker named.',
      'Online options through ACCESS HRA can save a trip when your case allows it.',
    ],
    offices: [
      {
        name: 'HRA Benefits Access Center Richmond',
        address: '201 Bay Street, Staten Island, NY 10301',
        phone: '929-221-7915',
        source: 'bac',
      },
      {
        name: 'Richmond SNAP Center',
        address: '201 Bay Street, 2nd Fl., Staten Island, NY 10301',
        source: 'snap',
      },
    ],
  },
}

export function guideList() {
  return BOROUGHS.map((borough) => BOROUGH_GUIDES[borough.slug]).filter(Boolean)
}

export function guideFor(slug) {
  return BOROUGH_GUIDES[slug] || null
}

/** Popular in-app /search pages for this borough (CityFHEPS 1–2BR and NYCHA S8 1–2BR when present). */
export function searchLinksFor(boroughSlug) {
  const prefer = [
    ['cityfheps', '1br'],
    ['cityfheps', '2br'],
    ['nycha-section-8', '1br'],
    ['nycha-section-8', '2br'],
    ['fheps', '1br'],
    ['fheps', '2br'],
  ]
  const links = []
  for (const [voucherSlug, sizeSlug] of prefer) {
    const page = SEARCH_PAGES.find(
      (item) => item.boroughSlug === boroughSlug && item.voucherSlug === voucherSlug && item.sizeSlug === sizeSlug,
    )
    if (page) links.push({ path: page.path, label: page.chipLabel, h1: page.h1 })
  }
  if (!links.length) {
    for (const page of SEARCH_PAGES.filter((item) => item.boroughSlug === boroughSlug).slice(0, 6)) {
      links.push({ path: page.path, label: page.chipLabel, h1: page.h1 })
    }
  }
  return links
}

export function telHref(phone) {
  return `tel:${String(phone).replace(/[^\d]/g, '')}`
}
