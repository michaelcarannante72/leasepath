/** On-device match feed. Preferences and seen ids stay in localStorage.
 * Housing Connect links are official HPD / Housing Connect URLs only.
 * Sample units come from the in-app LISTINGS practice list — not live vacancies. */

import { LISTINGS } from '../data.js'
import { SAMPLE_LISTINGS_ENABLED } from '../features.js'

export const HOUSING_CONNECT = {
  label: 'NYC Housing Connect',
  href: 'https://housingconnect.nyc.gov/PublicWeb/',
  hpd: 'https://www.nyc.gov/site/hpd/services-and-information/nyc-housing-connect.page',
  /** Applicant hotline published on HPD’s Housing Connect page. Leave a voicemail if unanswered. */
  hotline: '212-863-7990',
}

const BOROUGHS = ['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Staten Island']

/** One Housing Connect watch item per borough. Ids are stable; users are alerted once unless the feed version changes. */
export function housingConnectItems(version = '2026-10') {
  return BOROUGHS.map((borough) => ({
    id: `hc-${borough.toLowerCase().replace(/\s+/g, '-')}-${version}`,
    kind: 'lottery',
    borough,
    bedrooms: null,
    programs: ['CityFHEPS', 'FHEPS', 'HASA', 'Section 8'],
    title: `Check NYC Housing Connect lotteries in ${borough}`,
    detail:
      'Open lotteries change. LeasePath does not scrape Housing Connect. This alert is a reminder to check the official portal for your borough and household size. You may qualify for some lotteries — Housing Connect and HPD decide.',
    href: HOUSING_CONNECT.href,
    sourceLabel: 'NYC Housing Connect (HPD)',
    sourceHref: HOUSING_CONNECT.hpd,
  }))
}

/** Practice sample units that name a voucher program. Not offers or live vacancies. */
export function unitItems() {
  return LISTINGS.map((listing) => ({
    id: `unit-${listing.id}`,
    kind: 'unit',
    borough: listing.borough,
    bedrooms: listing.bedrooms,
    programs: listing.programs,
    title: `${listing.neighborhood} · ${listing.bedrooms === 0 ? 'Studio / SRO-size' : `${listing.bedrooms}BR`} sample`,
    detail: `Practice sample that lists ${listing.programs.join(', ')}. Asking rent $${listing.rent}. Not a vacancy — confirm any real apartment with the broker and your worker.`,
    href: `#/listing/${listing.id}`,
    sourceLabel: 'LeasePath sample list',
    sourceHref: '#/',
    listingId: listing.id,
  }))
}

export function matchFeed() {
  // Sample units only join the feed while sample listings are switched on.
  return [...housingConnectItems(), ...(SAMPLE_LISTINGS_ENABLED ? unitItems() : [])]
}
