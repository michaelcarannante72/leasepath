/**
 * Landlord welcome — why take vouchers.
 * LIST_UNIT_HASH matches origin/landlord-listing-form (#/list-unit). Easy to change.
 */

export const LAST_REVIEWED = 'October 27, 2026'
export const LANDLORD_ROUTE = '/landlord-welcome'
export const LANDLORD_TITLE = 'Landlords: why take vouchers'

/** Route for the voucher-ready listing form (landlord-listing-form branch). */
export const LIST_UNIT_HASH = '#/list-unit'

export const SOURCES = {
  nychaOwners: {
    label: 'NYCHA: Section 8 owners',
    href: 'https://www.nyc.gov/site/nycha/section-8/owners.page',
  },
  hpdOwners: {
    label: 'HPD: Section 8 property owners',
    href: 'https://www.nyc.gov/site/hpd/services-and-information/section-8-owners.page',
  },
  cchr: {
    label: 'NYC Commission on Human Rights: Source of income',
    href: 'https://www.nyc.gov/site/cchr/media/source-of-income.page',
  },
  cityfhepsDocs: {
    label: 'HRA: CityFHEPS documents (landlord / broker)',
    href: 'https://www.nyc.gov/site/hra/help/cityfheps-documents.page',
  },
}

export const NYCHA_CCC = { phone: '718-707-7771', label: 'NYCHA Customer Contact Center' }

export const INTRO =
  'Thousands of NYC owners already rent to voucher holders. The subsidy portion pays on a schedule, the unit must pass inspection, and refusing a lawful voucher is illegal in most NYC rentals. LeasePath helps tenants find you — and helps you list a voucher-ready unit.'

export const REASONS = [
  {
    id: 'payment',
    title: 'Reliable rent payment',
    body: 'For NYCHA Section 8, Housing Assistance Payments go to owners electronically. NYCHA states it pays on the first of the month by direct deposit after it receives HUD funding. Tenant share is separate; the subsidy is the government portion.',
    sources: ['nychaOwners'],
  },
  {
    id: 'inspection',
    title: 'Clear inspection process',
    body: 'Units must meet Housing Quality Standards before move-in and stay in compliance. NYCHA says it schedules an inspection within five business days of an approved rental packet. Fix smoke/CO alarms, heat, windows, and other basics before the visit.',
    sources: ['nychaOwners'],
  },
  {
    id: 'law',
    title: 'The law: source of income',
    body: 'It is illegal in New York City for most landlords and brokers to refuse a tenant because they pay with Section 8, CityFHEPS, HASA, or other lawful assistance. Ads that say “no vouchers” are also illegal. Report discrimination to the NYC Commission on Human Rights.',
    sources: ['cchr', 'nychaOwners'],
  },
  {
    id: 'market',
    title: 'Tenants are searching now',
    body: 'NYCHA notes tens of thousands of owners already participate and voucher holders are actively looking. CityFHEPS and other HRA programs have their own landlord packets — your worker or the tenant’s worker will send the right forms.',
    sources: ['nychaOwners', 'cityfhepsDocs', 'hpdOwners'],
  },
]

export const CAVEAT =
  'LeasePath is not NYCHA, HPD, or HRA. Listing a unit here does not approve a HAP contract. Confirm every step with the issuing agency.'
