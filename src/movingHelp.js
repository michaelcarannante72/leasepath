/** Moving help — One Shot Deal, ACCESS HRA, special grants. Official sources only. */

export const LAST_REVIEWED = 'October 27, 2026'
export const MOVING_ROUTE = '/moving-help'
export const MOVING_TITLE = 'Moving help'

export const ACCESS_HRA_URL = 'https://a069-access.nyc.gov/accesshra/'
export const ACCESS_NYC_ONE_SHOT = 'https://access.nyc.gov/programs/one-shot-deal/'
export const HRA_SPECIAL_GRANT_GUIDE = 'https://www.nyc.gov/site/hra/help/special-grant-document-guide.page'
export const HRA_HOMEBASE = 'https://www.nyc.gov/site/hra/help/homebase.page'
export const ACCESS_HRA_INFO = 'https://www.nyc.gov/site/hra/help/access-hra.page'

export const HRA_INFOLINE = {
  phone: '718-557-1399',
  hours: 'Monday–Friday, 8 a.m. to 5 p.m.',
  sourceLabel: 'ACCESS NYC: One Shot Deal',
  sourceHref: ACCESS_NYC_ONE_SHOT,
}

export const SOURCES = {
  oneShot: { label: 'ACCESS NYC: One Shot Deal / Emergency Assistance', href: ACCESS_NYC_ONE_SHOT },
  accessHra: { label: 'ACCESS HRA (apply online)', href: ACCESS_HRA_URL },
  accessHraInfo: { label: 'HRA: ACCESS HRA', href: ACCESS_HRA_INFO },
  specialGrant: { label: 'HRA: Special Grant document guide', href: HRA_SPECIAL_GRANT_GUIDE },
  homebase: { label: 'HRA: Homebase', href: HRA_HOMEBASE },
}

export const INTRO =
  'Moving with a voucher is stressful. You may qualify for emergency cash help, moving expenses, or furniture help through HRA — eligibility is case by case. Start at ACCESS HRA or ask your worker. Do not invent numbers from a friend; only HRA decides.'

export const SECTIONS = [
  {
    id: 'one-shot',
    title: 'One Shot Deal / Emergency Assistance',
    body: 'You may qualify for a One Shot Deal (Emergency Assistance) if you cannot pay bills after a job loss, pay cut, or another emergency. ACCESS NYC says this can help if you are homeless or will lose housing, if utilities were shut off or will be, if you lost clothes or furniture to theft, fire, or a natural disaster, if you are affected by domestic violence, or if other issues threaten health and safety. HRA may ask you to pay some or all of it back. You still need an interview after you apply.',
    sources: ['oneShot', 'accessHra'],
  },
  {
    id: 'furniture',
    title: 'Furniture help',
    body: 'If you lost furniture because of theft, a fire, or a natural disaster, Emergency Assistance / One Shot Deal is the official path ACCESS NYC lists. There is no public flat dollar amount on that page — HRA decides what you may get. Ask your worker before you buy anything expecting a repayment. Community furniture banks on the Resources tab can also help while you wait.',
    sources: ['oneShot'],
  },
  {
    id: 'moving-allowance',
    title: 'Moving expenses and related special grants',
    body: 'If you already get Cash Assistance, HRA’s Special Grant guide covers moving expenses (you give estimates from licensed movers), storage, security vouchers (including NYCHA), broker’s fee vouchers, and rent in advance forms. Ask your center or worker which grant fits. Do not move first and assume HRA will pay later.',
    sources: ['specialGrant'],
  },
  {
    id: 'how-apply',
    title: 'How to apply',
    body: 'Apply for Emergency Assistance online on ACCESS HRA, or in person at an HRA Benefits Access Center. After you apply, you must have an interview. If you already receive Cash Assistance, ask for a Special Grant instead of a new One Shot application. If you are at risk of entering shelter, contact Homebase.',
    sources: ['oneShot', 'accessHra', 'homebase', 'specialGrant'],
  },
]

export const CAVEAT =
  'LeasePath does not decide eligibility and does not file for you. Amounts and rules change. Confirm every figure with HRA or your worker.'
