// Filtering for #/resources. Pure functions only: everything runs in the browser on data already in
// the bundle. Nothing is fetched, stored, or sent anywhere, and nothing here touches analytics.

export const BOROUGHS = ['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Online']

const FIELDS = ['name', 'group', 'area', 'where', 'when', 'offers', 'centers', 'who', 'how', 'lead', 'scope', 'title', 'detail']

export function normalize(text) {
  return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim()
}

/** Text a listing can be found by: its own fields plus its section's title and type words. */
export function searchText(item, section = {}) {
  return normalize([...FIELDS.map((key) => item[key]), section.title, section.jump, section.type].filter(Boolean).join(' '))
}

/** Every word of the query must appear somewhere in the listing. */
export function matchesQuery(item, section, query) {
  const words = normalize(query).split(' ').filter(Boolean)
  if (!words.length) return true
  const hay = searchText(item, section)
  return words.every((word) => hay.includes(word))
}

/** Borough filter. City programs (citywide) show under every borough; listings with no borough stated only show under "All". */
export function matchesBorough(item, borough) {
  if (!borough || item.citywide) return true
  return normalize(item.area).includes(normalize(borough))
}

export function filterSection(section, { query = '', borough = '' } = {}) {
  return section.items.filter((item) => matchesQuery(item, section, query) && matchesBorough(item, borough))
}
