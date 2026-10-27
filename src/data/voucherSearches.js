// Popular voucher × borough × bedroom SEO pages. Limits match the verified table only
// (NYCHA Section 8 new-rental, CityFHEPS 2026, FHEPS 2025). No HPD, HCR, or HASA dollar pages.

import { CITYFHEPS_2026_ROWS } from './cityfheps.js'
import { SECTION8_NEW_RENTAL_ROWS } from './section8.js'

export const BOROUGHS = [
  { slug: 'bronx', name: 'Bronx', the: 'the Bronx', craigslist: 'brx', streeteasy: 'bronx' },
  { slug: 'brooklyn', name: 'Brooklyn', the: 'Brooklyn', craigslist: 'brk', streeteasy: 'brooklyn' },
  { slug: 'manhattan', name: 'Manhattan', the: 'Manhattan', craigslist: 'mnh', streeteasy: 'manhattan' },
  { slug: 'queens', name: 'Queens', the: 'Queens', craigslist: 'que', streeteasy: 'queens' },
  { slug: 'staten-island', name: 'Staten Island', the: 'Staten Island', craigslist: 'stn', streeteasy: 'staten-island' },
]

export const SIZES = [
  { slug: 'sro', label: 'SRO', shortLabel: 'SRO', beds: null, unitKind: 'sro' },
  { slug: 'studio', label: 'studio', shortLabel: 'Studio', beds: 0, unitKind: 'studio' },
  { slug: '1br', label: '1-bedroom', shortLabel: '1BR', beds: 1, unitKind: 'apartment' },
  { slug: '2br', label: '2-bedroom', shortLabel: '2BR', beds: 2, unitKind: 'apartment' },
  { slug: '3br', label: '3-bedroom', shortLabel: '3BR', beds: 3, unitKind: 'apartment' },
  { slug: '4br', label: '4-bedroom', shortLabel: '4BR', beds: 4, unitKind: 'apartment' },
]

/** Verified FHEPS 2025 limits (all utilities included). Not in the CityFHEPS/NYCHA schedules. */
export const FHEPS_2025_LIMITS = {
  studio: 2646,
  '1br': 2762,
  '2br': 3058,
  '3br': 3811,
  '4br': 4111,
}

const CITYFHEPS_SOURCE = {
  name: 'DSS / HRA',
  title: 'DSS CityFHEPS Payment Standards (DSS-8r)',
  url: 'https://www.nyc.gov/assets/hra/downloads/pdf/cityfheps-documents/DSS-8r-(E).pdf',
}

const NYCHA_SOURCE = {
  name: 'NYCHA',
  title: 'NYCHA Voucher Payment Standards',
  url: 'https://www.nyc.gov/site/nycha/section-8/voucher-payment-standards-utility-allowance-schedules.page',
}

const FHEPS_SOURCE = {
  name: 'DSS / HRA',
  title: 'FHEPS (HRA)',
  url: 'https://www.nyc.gov/site/hra/help/fheps.page',
}

function cityfhepsLimit(sizeSlug) {
  const size = SIZES.find((item) => item.slug === sizeSlug)
  if (!size) return null
  if (size.unitKind === 'sro') {
    const row = CITYFHEPS_2026_ROWS.find((item) => item.unitKind === 'sro')
    return row ? row.maxRent : null
  }
  if (size.unitKind === 'studio') {
    const row = CITYFHEPS_2026_ROWS.find((item) => item.unitKind === 'studio' || item.bedrooms === 0)
    return row ? row.maxRent : null
  }
  const row = CITYFHEPS_2026_ROWS.find((item) => item.bedrooms === size.beds)
  return row ? row.maxRent : null
}

function nychaLimit(sizeSlug) {
  if (sizeSlug === 'sro') return null
  const size = SIZES.find((item) => item.slug === sizeSlug)
  if (!size || size.beds === null) return null
  const row = SECTION8_NEW_RENTAL_ROWS.find((item) => item.bedrooms === size.beds)
  return row ? row.maxRent : null
}

export const VOUCHERS = [
  {
    slug: 'cityfheps',
    name: 'CityFHEPS',
    h1Program: 'CityFHEPS',
    chipProgram: 'CityFHEPS',
    sizes: ['sro', 'studio', '1br', '2br', '3br', '4br'],
    limitFor: cityfhepsLimit,
    source: CITYFHEPS_SOURCE,
    note: 'CityFHEPS maximum rent with all utilities included. Your shopping letter and DSS still control the real case.',
  },
  {
    slug: 'nycha-section-8',
    name: 'NYCHA Section 8',
    h1Program: 'NYCHA Section 8',
    chipProgram: 'NYCHA Section 8',
    sizes: ['studio', '1br', '2br', '3br', '4br'],
    limitFor: nychaLimit,
    source: NYCHA_SOURCE,
    note: 'NYCHA Section 8 payment standard for a new rental or transfer, all utilities included. HPD and HCR use different standards. Your voucher paperwork still controls.',
  },
  {
    slug: 'fheps',
    name: 'FHEPS',
    h1Program: 'FHEPS',
    chipProgram: 'FHEPS',
    sizes: ['studio', '1br', '2br', '3br', '4br'],
    limitFor: (sizeSlug) => FHEPS_2025_LIMITS[sizeSlug] ?? null,
    source: FHEPS_SOURCE,
    note: 'FHEPS 2025 maximum rent with all utilities included. Your letter and HRA still control the real case.',
  },
]

const TIPS = [
  'Compare the asking rent to the max on this page only when heat, hot water, cooking gas, and electricity are included. If you pay a utility, the agency subtracts an allowance.',
  'A landlord who refuses CityFHEPS, FHEPS, or Section 8 because of the voucher may be breaking the law. Call the Commission on Human Rights at 212-416-0197.',
  'Applying is always free. Anyone who asks for a fee to apply for housing or a lottery is a scam.',
  'Keep your shopping letter, photo ID, and the forms your worker named. Do not send a deposit or personal papers from a listing you have not confirmed.',
]

export const HOUSING_CONNECT_URL = 'https://housingconnect.nyc.gov/'

export function craigslistUrl(borough, size, limit) {
  const base = `https://newyork.craigslist.org/search/${borough.craigslist}/apa?max_price=${limit}`
  if (size.beds === null) return base
  return `${base}&min_bedrooms=${size.beds}&max_bedrooms=${size.beds}`
}

export function streeteasyUrl(borough, size, limit) {
  const base = `https://streeteasy.com/for-rent/${borough.streeteasy}/price:-${limit}`
  if (size.beds === null) return base
  return `${base}%7Cbeds:${size.beds}`
}

export function pagePath(voucherSlug, boroughSlug, sizeSlug) {
  return `/search/${voucherSlug}/${boroughSlug}/${sizeSlug}`
}

export function chipLabel(page) {
  return `${page.chipProgram} ${page.size.shortLabel} · ${page.borough.name}`
}

export function buildSearchPages() {
  const pages = []
  for (const voucher of VOUCHERS) {
    for (const sizeSlug of voucher.sizes) {
      const size = SIZES.find((item) => item.slug === sizeSlug)
      const limit = voucher.limitFor(sizeSlug)
      if (limit == null) continue
      for (const borough of BOROUGHS) {
        const path = pagePath(voucher.slug, borough.slug, size.slug)
        const sizePhrase = size.slug === 'sro' ? 'SRO' : size.slug === 'studio' ? 'studio' : `${size.label}`
        const unitWord = size.slug === 'sro' ? 'rooms' : 'apartments'
        const h1 = `${voucher.h1Program} ${sizePhrase} ${unitWord} in ${borough.the}`
        const title = `${h1} · LeasePath`
        const description = `${voucher.h1Program} max rent for a ${sizePhrase} in ${borough.the} is $${limit.toLocaleString('en-US')} with utilities included. Search Craigslist and StreetEasy prefilled to that limit.`
        pages.push({
          path,
          voucherSlug: voucher.slug,
          boroughSlug: borough.slug,
          sizeSlug: size.slug,
          voucher,
          borough,
          size,
          limit,
          h1,
          title,
          description,
          chipProgram: voucher.chipProgram,
          chipLabel: `${voucher.chipProgram} ${size.shortLabel} · ${borough.name}`,
          craigslist: craigslistUrl(borough, size, limit),
          streeteasy: streeteasyUrl(borough, size, limit),
          source: voucher.source,
          note: voucher.note,
          tips: TIPS,
        })
      }
    }
  }
  return pages
}

export const SEARCH_PAGES = buildSearchPages()

export function findSearchPage(voucherSlug, boroughSlug, sizeSlug) {
  return SEARCH_PAGES.find(
    (page) => page.voucherSlug === voucherSlug && page.boroughSlug === boroughSlug && page.sizeSlug === sizeSlug,
  ) || null
}

export function parseSearchPath(pathname) {
  const path = String(pathname || '').replace(/\/+$/, '') || '/'
  if (path === '/search') return { kind: 'index' }
  const match = /^\/search\/([a-z0-9-]+)\/([a-z0-9-]+)\/([a-z0-9-]+)$/.exec(path)
  if (!match) return null
  const page = findSearchPage(match[1], match[2], match[3])
  if (!page) return null
  return { kind: 'page', page }
}

/** Verified max-rent table used by tests (no HPD / HCR / HASA). */
export const VERIFIED_LIMITS = {
  'cityfheps:sro': 1953,
  'cityfheps:studio': 2604,
  'cityfheps:1br': 2734,
  'cityfheps:2br': 2997,
  'cityfheps:3br': 3753,
  'cityfheps:4br': 4077,
  'nycha-section-8:studio': 2604,
  'nycha-section-8:1br': 2734,
  'nycha-section-8:2br': 2997,
  'nycha-section-8:3br': 3753,
  'nycha-section-8:4br': 4077,
  'fheps:studio': 2646,
  'fheps:1br': 2762,
  'fheps:2br': 3058,
  'fheps:3br': 3811,
  'fheps:4br': 4111,
}
