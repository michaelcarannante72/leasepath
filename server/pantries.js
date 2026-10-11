import { hoursFromRecord, pantryName, readableNote } from '../src/pantrySchedule.js'

const LAYER = 'https://services6.arcgis.com/yG5s3afENB5iO9fj/arcgis/rest/services/Food_Help_Programs_PROD_view/FeatureServer/0/query'
const SOURCE = 'Food Help NYC'
const SOURCE_URL = 'https://foodhelp.nyc.gov/'
const CACHE_MS = 6 * 60 * 60 * 1000
const FIELDS = [
  'FID', 'program', 'org_phone', 'distadd', 'dist_location_info', 'fp_notes', 'lat', 'lon',
  ...['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].flatMap((day) => [
    `fp_${day}`,
    `fp_${day}_open1`, `fp_${day}_close1`,
    `fp_${day}_open2`, `fp_${day}_close2`,
    `fp_${day}_open3`, `fp_${day}_close3`,
  ]),
]

let cache = { at: 0, payload: null }

function clean(value, limit = 240) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text
}

export function normalizePantry(attributes) {
  const lat = Number(attributes?.lat)
  const lon = Number(attributes?.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  const address = clean(attributes.distadd, 180)
  if (!address) return null
  return {
    id: attributes.FID,
    name: pantryName(attributes.program),
    address,
    placeNote: readableNote(clean(attributes.dist_location_info, 180)),
    note: readableNote(clean(attributes.fp_notes, 240)),
    phone: clean(attributes.org_phone, 40),
    lat,
    lon,
    hours: hoursFromRecord(attributes),
  }
}

async function fetchPage(fetchImpl, offset) {
  const params = new URLSearchParams({
    where: "type_fp = 'FP'",
    outFields: FIELDS.join(','),
    returnGeometry: 'false',
    orderByFields: 'FID',
    resultOffset: String(offset),
    resultRecordCount: '2000',
    f: 'json',
  })
  const response = await fetchImpl(`${LAYER}?${params}`, {
    headers: { accept: 'application/json', 'user-agent': 'LeasePath (leasepath.app)' },
  })
  if (!response.ok) throw new Error('pantry source')
  const data = await response.json()
  if (data?.error) throw new Error('pantry source')
  return data
}

export async function loadPantries(fetchImpl = fetch, now = Date.now()) {
  if (cache.payload && now - cache.at < CACHE_MS) return cache.payload
  const features = []
  for (let page = 0; page < 5; page += 1) {
    const data = await fetchPage(fetchImpl, features.length)
    const batch = Array.isArray(data.features) ? data.features : []
    features.push(...batch)
    if (!data.exceededTransferLimit || batch.length === 0) break
  }
  const pantries = features.map((feature) => normalizePantry(feature.attributes)).filter(Boolean)
  if (!pantries.length) throw new Error('pantry source')
  const payload = {
    source: SOURCE,
    sourceUrl: SOURCE_URL,
    fetchedAt: new Date(now).toISOString(),
    pantries,
  }
  cache = { at: now, payload }
  return payload
}

export function clearPantryCache() {
  cache = { at: 0, payload: null }
}
