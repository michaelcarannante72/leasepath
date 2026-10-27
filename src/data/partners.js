/** Vetted nonprofits and legal-aid partners. Phones and links only when published on the cited official page. */

export const PARTNER_SOURCES = {
  hraLegal: {
    label: 'HRA Legal Services for Tenants',
    href: 'https://www.nyc.gov/site/hra/help/legal-services-for-tenants.page',
  },
  ocj: {
    label: 'DSS Office of Civil Justice',
    href: 'https://nyc.gov/civiljustice',
  },
  ocjShort: {
    label: 'nyc.gov/civiljustice',
    href: 'https://nyc.gov/civiljustice',
  },
  tenantHelpline: {
    label: 'Tenant Helpline (Mayor’s PEU)',
    href: 'https://www.nyc.gov/site/mayorspeu/resources/tenant-helpline.page',
  },
  tenantHelplineHours: {
    label: 'Tenant Support Unit contact',
    href: 'https://www.nyc.gov/site/mayorspeu/programs/contact-the-tenant-support-unit.page',
  },
  legalAidHousing: {
    label: 'Legal Aid Society — housing help',
    href: 'https://legalaidnyc.org/get-help/housing-problems/',
  },
  housingCourtAnswers: {
    label: 'Housing Court Answers',
    href: 'https://housingcourtanswers.org/',
  },
  cchr: {
    label: 'NYC Commission on Human Rights',
    href: 'https://www.nyc.gov/site/cchr/index.page',
  },
}

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   blurb: string,
 *   boroughs: string[],
 *   phones?: { label?: string, number: string }[],
 *   email?: string,
 *   href: string,
 *   sourceId: keyof typeof PARTNER_SOURCES,
 *   tags: string[],
 * }} Partner
 */

/** @type {Partner[]} */
export const PARTNERS = [
  {
    id: 'ocj-tenants',
    name: 'NYC Office of Civil Justice — tenant legal services',
    blurb:
      'HRA’s Office of Civil Justice funds free legal help for tenants facing eviction (Right to Counsel / Universal Access) and other civil matters. You may qualify regardless of immigration status — OCJ and the court providers decide. Email with your name, phone, and Housing Court index number if you have one.',
    boroughs: ['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Staten Island'],
    email: 'civiljustice@hra.nyc.gov',
    href: 'https://www.nyc.gov/site/hra/help/legal-services-for-tenants.page',
    sourceId: 'hraLegal',
    tags: ['legal aid', 'eviction', 'right to counsel'],
  },
  {
    id: 'tenant-helpline',
    name: 'NYC Tenant Helpline',
    blurb:
      'One-stop help on tenant rights, referrals to legal services, mediation, and benefits. Staffed by the Mayor’s Public Engagement Unit Tenant Support Unit. Free for all New Yorkers. Hours on the city page: Monday–Friday, 9:30 a.m. to 5:00 p.m. Call 311 and ask for the Tenant Helpline.',
    boroughs: ['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Staten Island'],
    phones: [{ label: '311', number: '311' }],
    href: 'https://www.nyc.gov/site/mayorspeu/resources/tenant-helpline.page',
    sourceId: 'tenantHelpline',
    tags: ['helpline', 'tenant rights', 'referrals'],
  },
  {
    id: 'housing-court-answers',
    name: 'Housing Court Answers',
    blurb:
      'Information and referrals for people in Housing Court. HRA’s tenant legal-services page lists these hotlines Monday–Friday, 9 a.m. to 5 p.m.',
    boroughs: ['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Staten Island'],
    phones: [
      { number: '718-557-1379' },
      { number: '212-962-4795' },
    ],
    href: 'https://housingcourtanswers.org/',
    sourceId: 'hraLegal',
    tags: ['housing court', 'hotline', 'referrals'],
  },
  {
    id: 'legal-aid-manhattan',
    name: 'The Legal Aid Society — Manhattan',
    blurb:
      'Free civil legal help for people who may qualify, including housing and homelessness matters. Borough office number from Legal Aid’s housing help page. For an upcoming Housing Court eviction case, go to your first court date for Right to Counsel intake.',
    boroughs: ['Manhattan'],
    phones: [{ number: '212-426-3000' }],
    href: 'https://legalaidnyc.org/get-help/housing-problems/',
    sourceId: 'legalAidHousing',
    tags: ['legal aid', 'housing'],
  },
  {
    id: 'legal-aid-brooklyn',
    name: 'The Legal Aid Society — Brooklyn',
    blurb:
      'Free civil legal help for people who may qualify, including housing and homelessness matters. Borough office number from Legal Aid’s housing help page.',
    boroughs: ['Brooklyn'],
    phones: [{ number: '718-722-3100' }],
    href: 'https://legalaidnyc.org/get-help/housing-problems/',
    sourceId: 'legalAidHousing',
    tags: ['legal aid', 'housing'],
  },
  {
    id: 'legal-aid-bronx',
    name: 'The Legal Aid Society — Bronx',
    blurb:
      'Free civil legal help for people who may qualify, including housing and homelessness matters. Borough office number from Legal Aid’s housing help page.',
    boroughs: ['Bronx'],
    phones: [{ number: '718-991-4600' }],
    href: 'https://legalaidnyc.org/get-help/housing-problems/',
    sourceId: 'legalAidHousing',
    tags: ['legal aid', 'housing'],
  },
  {
    id: 'legal-aid-queens',
    name: 'The Legal Aid Society — Queens',
    blurb:
      'Free civil legal help for people who may qualify, including housing and homelessness matters. Borough office number from Legal Aid’s housing help page.',
    boroughs: ['Queens'],
    phones: [{ number: '718-286-2450' }],
    href: 'https://legalaidnyc.org/get-help/housing-problems/',
    sourceId: 'legalAidHousing',
    tags: ['legal aid', 'housing'],
  },
  {
    id: 'legal-aid-si',
    name: 'The Legal Aid Society — Staten Island',
    blurb:
      'Free civil legal help for people who may qualify, including housing and homelessness matters. Borough office number from Legal Aid’s housing help page.',
    boroughs: ['Staten Island'],
    phones: [{ number: '347-422-5333' }],
    href: 'https://legalaidnyc.org/get-help/housing-problems/',
    sourceId: 'legalAidHousing',
    tags: ['legal aid', 'housing'],
  },
  {
    id: 'legal-aid-homeless',
    name: 'Legal Aid Society — Homeless Rights Project',
    blurb:
      'Helpline for people who are homeless. Hours on Legal Aid’s housing page: Monday–Friday, 10 a.m. to 3 p.m.',
    boroughs: ['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Staten Island'],
    phones: [{ number: '800-649-9125' }],
    href: 'https://legalaidnyc.org/get-help/housing-problems/',
    sourceId: 'legalAidHousing',
    tags: ['homelessness', 'helpline'],
  },
  {
    id: 'cchr',
    name: 'NYC Commission on Human Rights',
    blurb:
      'Report source-of-income discrimination and other housing discrimination. This is general information, not legal advice.',
    boroughs: ['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Staten Island'],
    phones: [{ number: '212-416-0197' }],
    href: 'https://www.nyc.gov/site/cchr/index.page',
    sourceId: 'cchr',
    tags: ['discrimination', 'civil rights'],
  },
]

export const PARTNER_BOROUGHS = ['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Staten Island']

export function filterPartners(partners, { borough = '', query = '' } = {}) {
  const q = String(query || '').trim().toLowerCase()
  return partners.filter((partner) => {
    if (borough && !partner.boroughs.includes(borough)) return false
    if (!q) return true
    const hay = [partner.name, partner.blurb, ...(partner.tags || []), ...(partner.boroughs || [])].join(' ').toLowerCase()
    return q.split(/\s+/).every((word) => hay.includes(word))
  })
}

export function telHref(phone) {
  return `tel:${String(phone).replace(/[^\d]/g, '')}`
}
