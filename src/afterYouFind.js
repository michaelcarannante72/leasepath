// "After you find an apartment": every word the page shows lives here, so the housing specialist can
// swap in her sourced wording one entry at a time without touching the component.
// Wording: the housing specialist's sourced tips (criteria/after-you-find-an-apartment-tips.md, Oct 19, 2026).
// HAVP and CHAP are info cards only. Neither is used by the rent check, the voucher picker, or any calculator.

export const LAST_REVIEWED = 'October 19, 2026'

export const SOURCES = {
  nychaS8: { label: 'NYCHA: About Section 8', href: 'https://www.nyc.gov/site/nycha/section-8/about-section-8.page' },
  nychaOwners: { label: 'NYCHA: Section 8 owners', href: 'https://www.nyc.gov/site/nycha/section-8/owners.page' },
  hpdOwners: { label: 'HPD: Section 8 property owners', href: 'https://www.nyc.gov/site/hpd/services-and-information/section-8-owners.page' },
  cityfheps: { label: 'HRA: CityFHEPS', href: 'https://www.nyc.gov/site/hra/help/cityfheps.page' },
  cityfhepsDocs: { label: 'HRA: CityFHEPS documents (incl. Landlord and Broker FAQ, Jan 2026; DSS-8r (E))', href: 'https://www.nyc.gov/site/hra/help/cityfheps-documents.page' },
  fheps: { label: 'HRA: FHEPS', href: 'https://www.nyc.gov/site/hra/help/fheps.page' },
  hasa: { label: 'HRA: HIV/AIDS Services Administration (HASA)', href: 'https://www.nyc.gov/site/hra/help/hiv-aids-services.page' },
  havp: { label: 'HPD: About HAVP', href: 'https://www.nyc.gov/site/hpd/services-and-information/about-hpd-havp.page' },
  havpFaq: { label: 'HPD: HAVP tenant FAQ (PDF)', href: 'https://www.nyc.gov/assets/hpd/downloads/pdfs/services/havp-tenant-faq.pdf' },
  cchr: { label: 'NYC Commission on Human Rights: Source of income', href: 'https://www.nyc.gov/site/cchr/media/source-of-income.page' },
  fare: { label: 'DCWP: Broker fees (FARE Act) FAQ', href: 'https://www.nyc.gov/site/dca/about/FAQ-Broker-Fees.page' },
  cityLimits: { label: 'City Limits, Aug 21, 2026: Meet CHAP, NYC’s new rental voucher', href: 'https://citylimits.org/meet-chap-nycs-new-rental-voucher-and-what-else-happened-this-week-in-housing/' },
}

export const PROGRAMS = [
  { program: 'Section 8 (NYCHA)', agency: 'NYCHA', serves: 'Federal Housing Choice Voucher issued by NYCHA.', source: 'nychaS8' },
  { program: 'Section 8 (HPD)', agency: 'HPD', serves: 'Federal Housing Choice Voucher issued by HPD.', source: 'hpdOwners' },
  { program: 'CityFHEPS', agency: 'HRA / DSS', serves: 'City rental assistance, mostly for people in shelter or at risk of losing their home.', source: 'cityfheps' },
  { program: 'FHEPS', agency: 'HRA / DSS (state-authorized)', serves: 'Rental assistance for families with children who face eviction or are in shelter.', source: 'fheps' },
  { program: 'HASA', agency: 'HRA (HIV/AIDS Services Administration)', serves: 'Housing and benefits help for New Yorkers living with HIV or AIDS who qualify.', source: 'hasa' },
  { program: 'HAVP', agency: 'HPD', serves: 'State Housing Access Voucher Program pilot. Referral only, for people who are homeless or at risk.', source: 'havp' },
  { program: 'CHAP', agency: 'HPD', serves: 'New city voucher. Applications open by January 2027 (reported). Not open yet.', source: 'cityLimits' },
]

// applies: which programs a step is about.
export const STEPS = [
  {
    id: 'program',
    title: 'Know your program',
    applies: ['Section 8', 'CityFHEPS', 'FHEPS', 'HASA', 'HAVP'],
    body: 'NYCHA Section 8, HPD Section 8, CityFHEPS/FHEPS, HASA, and HAVP (HPD) each use different forms and steps. Check your shopping letter for the agency, bedroom or household size, and expiration date.',
    sources: ['nychaS8', 'cityfhepsDocs', 'havp'],
  },
  {
    id: 'ceiling',
    title: 'The rent limit is a ceiling, not a promise',
    applies: ['Section 8', 'CityFHEPS', 'FHEPS', 'HASA'],
    body: 'The agency still checks rent reasonableness (similar unassisted units), who pays utilities, and the legal rent if the unit is rent-stabilized. Our rent check means “may fit,” not “approved.”',
    sources: ['cityfhepsDocs'],
  },
  {
    id: 'package',
    title: 'Your landlord sends a package',
    applies: ['Section 8', 'CityFHEPS', 'FHEPS', 'HASA', 'HAVP'],
    body: 'Names, address, unit number, rent, utilities, and dates must match on every form. One mismatch can delay you for weeks.',
    sources: ['nychaOwners', 'hpdOwners', 'cityfhepsDocs'],
  },
  {
    id: 'inspection',
    title: 'Inspection or walkthrough',
    applies: ['Section 8', 'HAVP', 'CityFHEPS'],
    body: 'Section 8 and HAVP: the unit must pass an HQS inspection. CityFHEPS: building preclearance plus an apartment walkthrough.',
    sources: ['havpFaq', 'cityfhepsDocs'],
    checklistTitle: 'Ask the landlord to fix before the visit',
    checklist: ['Smoke and carbon-monoxide alarms', 'Heat and hot water', 'Locks', 'Windows', 'Leaks', 'Peeling paint'],
  },
  {
    id: 'approval',
    title: 'Don’t move in or pay anything until final written approval',
    applies: ['Section 8', 'CityFHEPS', 'FHEPS', 'HASA', 'HAVP'],
    body: 'Never pay fees outside the lease and program. Under the FARE Act, a tenant generally doesn’t pay the broker the landlord hired.',
    sources: ['fare'],
  },
]

export const RIGHTS = {
  title: 'Know your rights',
  body: 'Refusing to rent because you have a voucher is illegal source-of-income discrimination under the NYC Human Rights Law. Report it to the NYC Commission on Human Rights or call 311.',
  source: 'cchr',
}

export const HAVP = {
  title: 'HAVP: Housing Access Voucher Program',
  label: 'Live since March 1, 2026. Run by HPD.',
  points: [
    'A New York State voucher pilot that runs through 2030. NYC has about $32.5 million for roughly 900 to 1,100 households.',
    'You cannot apply on your own. You must be homeless or at risk of homelessness, have income under 50% of area median income, and be referred by a partner such as DSS or HPD Emergency Housing Services.',
    'You get 120 days to find an apartment, with a possible 60-day extension.',
    'You pay about 30% of your adjusted income toward rent.',
    'The apartment must pass a Section 8-style (HQS) inspection.',
    'LeasePath has no HAVP rent check: HPD has not published HAVP payment standards we could find.',
  ],
  sources: ['havp', 'havpFaq'],
}

export const CHAP = {
  title: 'Coming 2027: CHAP',
  label: 'Reported, not live. Press reporting until HPD posts official rules.',
  points: [
    'The City Housing Assistance Program is a new city voucher run by HPD, not HRA.',
    'Applications are expected by January 2027, with first eligibility decisions in March 2027. It is not open yet.',
    'It is reported to serve people in any city shelter or facing eviction from a rent-stabilized apartment, with an income cap of 50% of area median income (about $76,000 for a family of three). Buildings with a regulatory agreement are excluded (check ACRIS). Funding is capped at about 5,600 households, so a waitlist is possible.',
    'No rent check until HPD publishes. In shelter? Ask your housing specialist.',
  ],
  source: 'cityLimits',
}

export const CAVEAT = 'Policy changes often. Confirm every step with your agency, worker, or housing specialist. LeasePath is not affiliated with HRA, NYCHA, HPD, or any government agency.'

// NYCHA scam warning: exact copy, shown on this page, on the Section 8 card, and in Ruby's notes.
export const NYCHA_SCAM_WARNING = 'NYCHA never charges a fee to apply for public housing or Section 8, or to process a Section 8 rental. If anyone asks you for money, report it to the NYCHA Inspector General at ig@nycha.nyc.gov or 212-306-3355, or to HUD\'s Inspector General at 1-800-347-3735.'
export const NYCHA_ELIGIBILITY = { label: 'NYCHA: Eligibility', href: 'https://www.nyc.gov/site/nycha/eligibility/eligibility.page' }

// Application help only. Never used by the rent check, the voucher picker, or any calculator.
export const NYCHA_INCOME_LIMITS = {
  title: 'Applying to NYCHA',
  label: "NYCHA's posted limits, check before applying",
  section8: [56700, 64800, 72900, 81000, 87500, 94000, 100450, 106950],
  publicHousing: [95000, 108600, 122150, 135700, 146600, 157450, 168300, 179150, 190000, 200850, 211700, 222550, 233450, 244300, 255150],
  notes: [
    'Section 8 income is checked when the voucher is issued.',
    'Public housing: the head of household must be 18 or older, or an emancipated minor.',
    'NYCHA senior buildings require everyone in the household to be 62 or older.',
    'Other eligibility questions: see NYCHA’s eligibility page.',
  ],
}
