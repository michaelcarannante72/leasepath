// "After you find an apartment": every word the page shows lives here, so the housing specialist can
// swap in her sourced wording one entry at a time without touching the component.
// Written in LeasePath's own words from the official agency pages linked below.
// CHAP is press reporting only. It is never used by the rent check, the voucher picker, or any calculator.

export const LAST_REVIEWED = 'October 19, 2026'

export const SOURCES = {
  nychaS8: { label: 'NYCHA: About Section 8', href: 'https://www.nyc.gov/site/nycha/section-8/about-section-8.page' },
  nychaOwners: { label: 'NYCHA: Section 8 owners', href: 'https://www.nyc.gov/site/nycha/section-8/owners.page' },
  hpdOwners: { label: 'HPD: Section 8 property owners', href: 'https://www.nyc.gov/site/hpd/services-and-information/section-8-owners.page' },
  hpdStandards: { label: 'HPD: Subsidy and payment standards', href: 'https://www.nyc.gov/site/hpd/services-and-information/subsidy-and-payment-standards.page' },
  cityfheps: { label: 'HRA: CityFHEPS', href: 'https://www.nyc.gov/site/hra/help/cityfheps.page' },
  cityfhepsDocs: { label: 'HRA: CityFHEPS documents', href: 'https://www.nyc.gov/site/hra/help/cityfheps-documents.page' },
  fheps: { label: 'HRA: FHEPS', href: 'https://www.nyc.gov/site/hra/help/fheps.page' },
  hasa: { label: 'HRA: HIV/AIDS Services Administration (HASA)', href: 'https://www.nyc.gov/site/hra/help/hiv-aids-services.page' },
  cchr: { label: 'NYC Commission on Human Rights: Source of income', href: 'https://www.nyc.gov/site/cchr/media/source-of-income.page' },
  fare: { label: 'DCWP: Broker fees (FARE Act) FAQ', href: 'https://www.nyc.gov/site/dca/about/FAQ-Broker-Fees.page' },
  cityLimits: { label: 'City Limits, Aug 21, 2026: Meet CHAP, NYC’s new rental voucher', href: 'https://citylimits.org/meet-chap-nycs-new-rental-voucher-and-what-else-happened-this-week-in-housing/' },
}

export const PROGRAMS = [
  { program: 'Section 8 (NYCHA)', agency: 'NYCHA, the city housing authority', serves: 'Federal Housing Choice Voucher. Low-income households NYCHA issued a voucher to.', source: 'nychaS8' },
  { program: 'Section 8 (HPD)', agency: 'HPD, the city housing agency', serves: 'Federal Housing Choice Voucher. Low-income households HPD issued a voucher to, often through a special referral.', source: 'hpdOwners' },
  { program: 'CityFHEPS', agency: 'HRA / DSS', serves: 'City rental assistance, mostly for people in shelter or at risk of losing their home.', source: 'cityfheps' },
  { program: 'FHEPS', agency: 'HRA / DSS (state-authorized)', serves: 'Rental assistance for families with children on cash assistance who face eviction or are in shelter.', source: 'fheps' },
  { program: 'HASA', agency: 'HRA’s HIV/AIDS Services Administration', serves: 'Housing and benefits help for New Yorkers living with HIV or AIDS who qualify.', source: 'hasa' },
]

// applies: which programs a step is about. 'all' = every voucher above.
export const STEPS = [
  {
    id: 'program',
    title: 'Know your program',
    applies: ['Section 8', 'CityFHEPS', 'FHEPS', 'HASA'],
    body: 'Before you talk numbers, know which agency runs your voucher and what your letter or voucher says: the bedroom or household size, who is on it, the expiration date, and any limits. The landlord and broker need the same facts. If the voucher is close to expiring, ask your worker about an extension now, not after.',
    sources: ['nychaS8', 'cityfheps'],
  },
  {
    id: 'ceiling',
    title: 'The payment standard is a ceiling, not a promise',
    applies: ['Section 8', 'CityFHEPS', 'FHEPS', 'HASA'],
    body: 'The top number on your paperwork is the most the program can work with, not the rent it will approve. The agency also checks that the rent is reasonable next to similar apartments, subtracts or allows for utilities you pay yourself, and checks the legal rent if the apartment is rent-stabilized. A LeasePath rent check that says “may fit” only means the asking rent is under that ceiling on paper.',
    sources: ['hpdStandards', 'cityfheps'],
    tips: ['Ask the landlord which utilities you pay: heat, hot water, gas, electric.', 'Ask whether the apartment is rent-stabilized and what the legal rent is.'],
  },
  {
    id: 'package',
    title: 'The landlord package has to match everywhere',
    applies: ['Section 8', 'CityFHEPS', 'FHEPS', 'HASA'],
    body: 'The landlord sends the agency a package: forms, tax and ownership papers, and the proposed lease. Section 8 uses NYCHA or HPD forms; CityFHEPS goes through your shelter or provider and HRA. One mismatch can stall it for weeks. Check that your name, the apartment number, the address, the rent, the utilities, and the start date are the same on every page you sign.',
    sources: ['nychaOwners', 'hpdOwners', 'cityfhepsDocs'],
  },
  {
    id: 'inspection',
    title: 'Inspection, or preclearance and walkthrough',
    applies: ['Section 8', 'CityFHEPS'],
    body: 'For Section 8, NYCHA or HPD inspects the apartment and it has to pass before final approval. For CityFHEPS, HRA clears the building first and then the apartment gets a walkthrough. A failed check means repairs and another visit, so look before they do.',
    sources: ['nychaOwners', 'hpdOwners', 'cityfheps'],
    checklistTitle: 'Your own pre-check',
    checklist: ['Smoke and carbon-monoxide alarms work', 'Heat works', 'Hot water runs', 'Door and window locks work', 'No leaks under sinks or from the ceiling', 'No peeling or chipping paint'],
  },
  {
    id: 'approval',
    title: 'Don’t move in or pay until you have it in writing',
    applies: ['Section 8', 'CityFHEPS', 'FHEPS', 'HASA'],
    body: 'A signed lease or a passed inspection is not the finish line. Wait for written final approval or a move-in authorization from your agency before you take keys, move your things, or hand over money. Never pay a fee that is not in the lease and the program paperwork. Under the FARE Act, a broker the landlord hired cannot charge you the broker fee.',
    sources: ['nychaOwners', 'cityfheps', 'fare'],
    tips: ['After move-in, keep your own record of what you pay each month. Your share and the agency’s share arrive separately, and a bank statement alone is not a rent record.'],
  },
]

export const RIGHTS = {
  title: 'Know your rights',
  body: 'In New York City it is illegal for a landlord, broker, or building to refuse you because you pay with a voucher or rental assistance. That is source-of-income discrimination under the NYC Human Rights Law. You can report it to the NYC Commission on Human Rights.',
  source: 'cchr',
}

export const CHAP = {
  title: 'Coming 2027: CHAP',
  label: 'Press reporting. HPD has not posted official rules yet.',
  points: [
    'The City Housing Assistance Program is a new city voucher run by HPD, not HRA.',
    'It is meant for people in any city shelter, or facing eviction from a rent-stabilized apartment.',
    'Reported income cap: 50% of area median income, about $76,000 for a family of three. A work requirement is not a barrier.',
    'Tenants in buildings with a regulatory agreement are not eligible. You can look a building up in ACRIS.',
    'Funding is capped at $175 million, about 5,600 households, so there may be a waitlist.',
    'Applications are expected to open by January 2027, with first eligibility decisions in March 2027. It is not open yet.',
    'In shelter? Ask your housing specialist about it.',
  ],
  source: 'cityLimits',
}

export const CAVEAT = 'Policy changes often. Confirm every step with your agency, worker, or housing specialist. LeasePath is not affiliated with HRA, NYCHA, HPD, or any government agency.'
