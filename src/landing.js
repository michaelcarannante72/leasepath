import { CITYFHEPS_2026_ROWS } from './data/cityfheps.js'

export const NOT_AFFILIATED = 'Not affiliated with HRA, NYCHA, or any government agency.'

/** Hero photo: CC BY 2.0, so the credit and source link must stay visible. */
export const HERO_PHOTO = {
  alt: 'A row of brownstone townhouses on East 126th Street in Harlem, each with its own front steps, door and cornice, the facades changing shade from house to house.',
  credit: 'Photo: edwardhblake, Wikimedia Commons, CC BY 2.0',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:17_E._126th_St,_Harlem.jpg',
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

const usd = (n) => `$${n.toLocaleString('en-US')}`

/** The mockup example. The limit comes from the sourced DSS-8r row, never a typed number. */
export function landingSample() {
  const row = CITYFHEPS_2026_ROWS.find((r) => r.unitKind === 'apartment' && r.bedrooms === 1 && r.householdSize === '1-2')
  const rent = 2650
  return {
    program: 'CityFHEPS',
    rent,
    limit: row.maxRent,
    fits: rent <= row.maxRent,
    effective: `effective ${formatDate(row.effectiveDate)}`,
    sourceDocNumber: row.sourceDocNumber,
    line: `Sample: 1-bedroom, household of 2, ${usd(rent)}/mo with all utilities included — fits your CityFHEPS limit (${usd(row.maxRent)}).`,
    usd,
  }
}

export const LANDING_STEPS = [
  { title: 'Check your voucher', detail: 'Put the amount from your letter in My voucher.', href: '#/plan' },
  { title: 'Find apartments', detail: 'Compare your limit to the asking rent.', href: '#search-results' },
  { title: 'Consult Ruby, our Resource Navigator', detail: 'Straight answers and your next step. Your worker still decides.', action: 'assistant' },
]

export const OPEN_ACCOUNT_EVENT = 'leasepath:open-account'
export const openAccount = () => window.dispatchEvent(new Event(OPEN_ACCOUNT_EVENT))
