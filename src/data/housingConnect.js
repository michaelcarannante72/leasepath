// NYC Housing Connect lotteries from official Open Data.
// Lotteries: https://data.cityofnewyork.us/resource/vy5i-a666.json
// Addresses: https://data.cityofnewyork.us/resource/nibs-na6y.json
// No dollar figures. AMI tiers are official HPD category names only.

export const HOUSING_CONNECT_HOME = 'https://housingconnect.nyc.gov/PublicWeb/'
export const HOUSING_CONNECT_APPLY_BASE = 'https://housingconnect.nyc.gov/PublicWeb/details/'
export const LOTTERIES_DATASET = 'https://data.cityofnewyork.us/resource/vy5i-a666.json'
export const ADDRESSES_DATASET = 'https://data.cityofnewyork.us/resource/nibs-na6y.json'
export const OPEN_DATA_SOURCE = {
  name: 'NYC Open Data / HPD',
  title: 'Advertised Lotteries on Housing Connect',
  url: 'https://data.cityofnewyork.us/Housing-Development/Advertised-Lotteries-on-Housing-Connect-by-Lottery/vy5i-a666',
}

export const BOROUGH_CODES = [
  { code: 'BX', name: 'Bronx', the: 'the Bronx' },
  { code: 'BK', name: 'Brooklyn', the: 'Brooklyn' },
  { code: 'MN', name: 'Manhattan', the: 'Manhattan' },
  { code: 'QN', name: 'Queens', the: 'Queens' },
  { code: 'SI', name: 'Staten Island', the: 'Staten Island' },
]

/** Official AMI category labels. Never attach dollar cutoffs here. */
export const AMI_TIERS = [
  { field: 'applied_income_ami_ext_low', label: 'Extremely Low Income' },
  { field: 'applied_income_ami_very_low', label: 'Very Low Income' },
  { field: 'applied_income_ami_low', label: 'Low Income' },
  { field: 'applied_income_ami_moderate', label: 'Moderate Income' },
  { field: 'applied_income_ami_middle', label: 'Middle Income' },
  { field: 'applied_income_ami_above', label: 'Above Middle Income' },
]

export const UNIT_FIELDS = [
  { field: 'unit_distribution_studio', label: 'Studio' },
  { field: 'unit_distribution_1bed', label: '1-bedroom' },
  { field: 'unit_distribution_2bed', label: '2-bedroom' },
  { field: 'unit_distribution_3bed', label: '3-bedroom' },
  { field: 'unit_distribution_4bed', label: '4-bedroom+' },
]

export function boroughName(code) {
  return BOROUGH_CODES.find((item) => item.code === code)?.name || code || 'NYC'
}

export function applyUrl(lotteryId) {
  return `${HOUSING_CONNECT_APPLY_BASE}${encodeURIComponent(String(lotteryId))}`
}

export function countField(row, field) {
  const n = Number(row?.[field])
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function amiTiersFromRow(row) {
  return AMI_TIERS.map((tier) => ({ label: tier.label, units: countField(row, tier.field) })).filter((tier) => tier.units > 0)
}

export function unitSizesFromRow(row) {
  return UNIT_FIELDS.map((size) => ({ label: size.label, units: countField(row, size.field) })).filter((size) => size.units > 0)
}

export function formatDeadline(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
}

export function isFutureEnd(iso, now = new Date()) {
  if (!iso) return false
  const end = new Date(iso)
  if (Number.isNaN(end.getTime())) return false
  return end.getTime() > now.getTime()
}

export function normalizeLottery(row, addresses = []) {
  const id = String(row.lottery_id || '')
  const boroughCode = String(row.borough || '').toUpperCase()
  const addrList = addresses
    .filter((a) => String(a.lottery_id) === id)
    .map((a) => {
      const num = (a.house_number || '').trim()
      const street = (a.street_name || '').trim()
      const zip = (a.address_zipcode || '').trim()
      const line = [num, street].filter(Boolean).join(' ')
      return zip ? `${line}, ${zip}` : line
    })
    .filter(Boolean)
  return {
    id,
    name: row.lottery_name || `Lottery ${id}`,
    boroughCode,
    borough: boroughName(boroughCode),
    status: row.lottery_status || '',
    endDate: row.lottery_end_date || '',
    deadlineLabel: formatDeadline(row.lottery_end_date),
    unitCount: countField(row, 'unit_count') || null,
    amiTiers: amiTiersFromRow(row),
    unitSizes: unitSizesFromRow(row),
    addresses: addrList,
    applyUrl: applyUrl(id),
  }
}

export function filterActiveRentals(rows, now = new Date()) {
  return (rows || []).filter(
    (row) =>
      String(row.development_type || '').toLowerCase() === 'rental' &&
      isFutureEnd(row.lottery_end_date, now),
  )
}

export function filterByBorough(lotteries, boroughCode) {
  if (!boroughCode || boroughCode === 'All') return lotteries
  return lotteries.filter((item) => item.boroughCode === boroughCode)
}

/** Build SoQL URL for active rental lotteries with end date after `now`. */
export function lotteriesQueryUrl(now = new Date()) {
  const iso = now.toISOString().replace(/\.\d{3}Z$/, '.000')
  const where = `development_type = 'Rental' AND lottery_end_date > '${iso}'`
  const params = new URLSearchParams({
    $where: where,
    $order: 'lottery_end_date ASC',
    $limit: '200',
  })
  return `${LOTTERIES_DATASET}?${params}`
}

export function addressesQueryUrl(lotteryIds) {
  const ids = [...new Set((lotteryIds || []).map(String).filter(Boolean))]
  if (!ids.length) return null
  const list = ids.map((id) => `'${id.replace(/'/g, "''")}'`).join(',')
  const params = new URLSearchParams({
    $where: `lottery_id in (${list})`,
    $limit: '500',
  })
  return `${ADDRESSES_DATASET}?${params}`
}

/**
 * Fetch active rental lotteries and optional addresses from NYC Open Data.
 * `fetcher` defaults to global fetch so tests can inject a stub.
 */
export async function loadActiveLotteries({ fetcher = globalThis.fetch, now = new Date() } = {}) {
  const lotteryRes = await fetcher(lotteriesQueryUrl(now))
  if (!lotteryRes.ok) throw new Error(`lotteries_${lotteryRes.status}`)
  const rows = await lotteryRes.json()
  const active = filterActiveRentals(Array.isArray(rows) ? rows : [], now)
  let addresses = []
  const addrUrl = addressesQueryUrl(active.map((r) => r.lottery_id))
  if (addrUrl) {
    try {
      const addrRes = await fetcher(addrUrl)
      if (addrRes.ok) {
        const raw = await addrRes.json()
        addresses = Array.isArray(raw) ? raw : []
      }
    } catch {
      addresses = []
    }
  }
  return active
    .map((row) => normalizeLottery(row, addresses))
    .sort((a, b) => String(a.endDate).localeCompare(String(b.endDate)))
}
