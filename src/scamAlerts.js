/** Voucher scam and red-flag page — official sources only. */

export const LAST_REVIEWED = 'October 27, 2026'
export const SCAM_ROUTE = '/scam-alerts'
export const SCAM_TITLE = 'Voucher scam alerts'

export const SOURCES = {
  nychaEligibility: {
    label: 'NYCHA: Eligibility (scam warning)',
    href: 'https://www.nyc.gov/site/nycha/eligibility/eligibility.page',
  },
  dcwpComplaint: {
    label: 'NYC DCWP: File a consumer complaint',
    href: 'https://www.nyc.gov/site/dca/consumers/file-complaint.page',
  },
  agHousing: {
    label: 'NY Attorney General: Housing and real estate complaint',
    href: 'https://ag.ny.gov/file-complaint/housing-real-estate',
  },
  nyc311AffordableFee: {
    label: 'NYC 311: Affordable housing fee fraud',
    href: 'https://portal.311.nyc.gov/article/?kanumber=KA-01113',
  },
  nyc311: {
    label: 'NYC 311',
    href: 'https://portal.311.nyc.gov/',
  },
}

export const INTRO =
  'Scammers target people searching with a voucher. Slow down before you pay or send IDs. If something feels off, walk away and report it. LeasePath never asks for payment to apply for housing.'

/** Red flags grounded in NYCHA eligibility scam warning + common consumer protections cited via DCWP/311/AG. */
export const RED_FLAGS = [
  {
    id: 'app-fee',
    title: 'Application or “processing” fees for NYCHA or Section 8',
    body: 'NYCHA does not charge or request a fee to apply for public housing or Section 8, or to process a Section 8 rental. Anyone asking for that money is a red flag.',
    sources: ['nychaEligibility', 'nyc311AffordableFee'],
  },
  {
    id: 'fake-agent',
    title: 'Fake “NYCHA agents” or brokers who claim they can jump the waitlist',
    body: 'NYCHA staff will not call you to demand payment or send you to a private broker to “unlock” a voucher. If someone posing as NYCHA asks for money, report it.',
    sources: ['nychaEligibility'],
  },
  {
    id: 'wire-crypto',
    title: 'Wire, gift card, cash-app, or crypto “to hold the apartment”',
    body: 'Legitimate landlords and agencies do not ask you to wire rent or deposits to a stranger, or pay in crypto or gift cards, before you have a real lease and agency approval. Treat that ask as a scam signal and report it.',
    sources: ['dcwpComplaint', 'agHousing'],
  },
  {
    id: 'keys-before-view',
    title: 'Keys, deposits, or a full month’s rent before you view the unit',
    body: 'Do not send money or personal documents for a place you have not seen, or for a listing that only exists in a text thread. Meet at the building. Confirm the owner or licensed broker.',
    sources: ['dcwpComplaint', 'agHousing'],
  },
  {
    id: 'pressure',
    title: 'Pressure to decide today or lose the voucher',
    body: 'Your shopping letter has a real expiration, but nobody legitimate needs your bank login, gift cards, or a same-hour wire. Call your caseworker or housing specialist before you pay.',
    sources: ['nychaEligibility'],
  },
]

export const REPORT = [
  {
    id: '311',
    title: 'Call 311',
    body: 'Report affordable-housing fee fraud and other consumer housing scams through NYC 311. Ask for help with a housing or consumer complaint.',
    phone: '311',
    href: SOURCES.nyc311.href,
    linkLabel: SOURCES.nyc311.label,
    sources: ['nyc311', 'nyc311AffordableFee'],
  },
  {
    id: 'dcwp',
    title: 'NYC Department of Consumer and Worker Protection (DCWP)',
    body: 'File a consumer complaint online (no account required) or by mail/fax. Upload screenshots, ads, and receipts when you can.',
    href: SOURCES.dcwpComplaint.href,
    linkLabel: SOURCES.dcwpComplaint.label,
    sources: ['dcwpComplaint'],
  },
  {
    id: 'ag',
    title: 'New York Attorney General',
    body: 'File a housing or real-estate complaint with the NY Attorney General. OAG Help Line: 1-800-771-7755.',
    phone: '1-800-771-7755',
    href: SOURCES.agHousing.href,
    linkLabel: SOURCES.agHousing.label,
    sources: ['agHousing'],
  },
  {
    id: 'nycha-ig',
    title: 'NYCHA Inspector General / HUD OIG',
    body: 'If someone posing as NYCHA asks for payment: ig@nycha.nyc.gov or 212-306-3355. You can also contact HUD’s Office of Inspector General at 1-800-347-3735.',
    phone: '212-306-3355',
    href: SOURCES.nychaEligibility.href,
    linkLabel: SOURCES.nychaEligibility.label,
    sources: ['nychaEligibility'],
  },
]

export const CAVEAT =
  'This page summarizes official scam warnings and complaint portals. It is not legal advice. When in doubt, call 311 or your worker before you pay.'
