// Rent figures live in src/data/ (one module per program) and are checked in src/rentCheck.js.
// This file only holds listing helpers that do not carry a program figure of their own.
import { money, rentFlags } from './rentCheck.js'

export { money }

export const PROGRAMS = ['CityFHEPS', 'HASA', 'Section 8']

/** Programs a person can already be receiving. FHEPS is not a search filter. */
export const VOUCHER_PROGRAMS = [...PROGRAMS, 'FHEPS']

export function sizeLabel(listing) {
  if (listing.unitKind === 'room') return 'Room'
  if (listing.unitKind === 'sro') return 'SRO'
  if (listing.unitKind === 'studio') return 'Studio'
  const beds = typeof listing.bedrooms === 'number' ? listing.bedrooms : Number.NaN
  if (!Number.isFinite(beds)) return 'Apartment'
  return beds === 1 ? '1 bed' : `${beds} beds`
}

export function utilityLabel(utilities) {
  if (utilities === 'all') return 'All utilities in the rent'
  if (utilities === 'tenant-electric') return 'Tenant pays electric'
  if (utilities === 'tenant-electric-gas') return 'Tenant pays electric and cooking gas'
  return 'Ask which utilities are included'
}

export function assessListing(listing, plan, options = {}) {
  const flags = []
  const program = plan?.program
  const knownProgram = PROGRAMS.includes(program)

  if (knownProgram && listing.programs.includes(program)) {
    flags.push({
      kind: 'marked',
      level: 'good',
      text: `Marked for ${program}. Confirm it with the broker and your worker before you visit or pay anyone.`,
    })
  } else if (knownProgram) {
    flags.push({
      kind: 'marked',
      level: 'watch',
      text: `This sample is not marked for ${program}.`,
    })
  } else if (program === 'FHEPS') {
    flags.push({
      kind: 'marked',
      level: 'note',
      text: 'Your plan says FHEPS. These samples are marked for CityFHEPS, HASA, or Section 8. LeasePath has no FHEPS rent figures. Compare the asking rent with the amount on your letter, then confirm the program with your worker.',
    })
  }

  const letter = Number(plan?.letterRent)
  if (letter > 0) {
    // The figure is the person's own. Without a program it says so, so it is not mistaken for a program limit.
    const named = VOUCHER_PROGRAMS.includes(program)
    const label = named ? `${program} letter` : 'No program selected'
    const whose = named ? `Your ${program} letter` : 'No program selected. Your letter'
    if (listing.rent > letter) {
      flags.push({
        kind: 'letter',
        label,
        level: 'watch',
        text: `${whose} says ${money(letter)}. This asking rent is ${money(listing.rent - letter)} higher.`,
      })
    } else {
      flags.push({
        kind: 'letter',
        label,
        level: 'good',
        text: `${whose} says ${money(letter)}. This asking rent is within that amount.`,
      })
    }
  }

  flags.push(...rentFlags(listing, plan, options).map((item) => ({ ...item, kind: 'program' })))
  return flags
}

export function leadFlag(flags) {
  return flags.find((flag) => flag.level === 'watch') || flags.find((flag) => flag.level === 'good') || flags[0] || null
}

/**
 * The lines a search card shows. The program result always comes first, so a "within your letter" line can never
 * hide a program caveat (a tenant-paid utility, an ask-your-caseworker result, a size mismatch). A second line
 * shows the most useful of the other flags. At most two lines.
 */
export function cardFlags(flags) {
  const program = flags.find((flag) => flag.kind === 'program') || null
  const rest = flags.filter((flag) => flag.kind !== 'program')
  const other = rest.find((flag) => flag.kind === 'letter') || rest.find((flag) => flag.level === 'watch') || rest[0] || null
  return [program, other].filter(Boolean)
}

/** Short text label for a flag or card line, so its meaning never depends on color alone. It says what was compared, so "within" never reads as an approval. */
export function cardLabel(flag) {
  if (flag.label) return flag.label
  if (flag.kind === 'program' && flag.summary) {
    const program = flag.source?.program || 'program'
    if (flag.level === 'watch') return `Above ${program} limit`
    if (flag.level === 'good') return `Within ${program} limit`
    return 'Check utilities'
  }
  if (flag.kind === 'program') return flag.source ? `${flag.source.program} note` : 'Ask'
  if (flag.kind === 'marked') return flag.level === 'good' ? 'Marked' : flag.level === 'watch' ? 'Not marked' : 'Note'
  return flag.level === 'watch' ? 'Look closer' : flag.level === 'good' ? 'Good sign' : 'Note'
}

/** Text for a card line. A line with a program figure shows its no-figure summary, never the figure without a link. */
export function cardText(flag) {
  if (flag.source) {
    if (flag.summary) return flag.summary
    // An ask or caveat line with no dollar figure is safe to show as written.
    return /\$\d/.test(flag.text) ? `${flag.source.program}: open this apartment for the details and the source.` : flag.text
  }
  return flag.text
}

function sizeMatches(listing, beds) {
  if (!beds || beds === 'Any') return true
  if (beds === 'Room') return listing.unitKind === 'room'
  if (beds === 'SRO') return listing.unitKind === 'sro'
  if (beds === 'Studio') return listing.unitKind === 'studio'
  if (beds === '4+') return listing.unitKind === 'apartment' && listing.bedrooms >= 4
  return listing.unitKind === 'apartment' && listing.bedrooms === Number(beds)
}

export function filterListings(listings, filters, savedIds) {
  const query = (filters.q || '').trim().toLowerCase()
  const maxRent = Number(filters.maxRent)
  const saved = new Set(savedIds)

  const matched = listings.filter((listing) => {
    if (filters.savedOnly && !saved.has(listing.id)) return false
    if (filters.program && filters.program !== 'All' && !listing.programs.includes(filters.program)) return false
    if (filters.borough && filters.borough !== 'All' && listing.borough !== filters.borough) return false
    if (maxRent > 0 && listing.rent > maxRent) return false
    if (!sizeMatches(listing, filters.beds)) return false
    if (!query) return true
    const haystack = [
      listing.neighborhood,
      listing.borough,
      listing.crossStreets,
      listing.zip,
      listing.programs.join(' '),
      sizeLabel(listing),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })

  const sorted = [...matched]
  if (filters.sort === 'rent-desc') sorted.sort((a, b) => b.rent - a.rent || a.neighborhood.localeCompare(b.neighborhood))
  else if (filters.sort === 'neighborhood') sorted.sort((a, b) => a.neighborhood.localeCompare(b.neighborhood) || a.rent - b.rent)
  else sorted.sort((a, b) => a.rent - b.rent || a.neighborhood.localeCompare(b.neighborhood))
  return sorted
}

export function starterMessage(listing, plan) {
  const program = VOUCHER_PROGRAMS.includes(plan?.program) ? plan.program : 'a housing voucher'
  const letter = Number(plan?.letterRent)
  const letterLine = letter > 0 ? ` The amount on my current letter is ${money(letter)} a month.` : ''
  return `Hello, I'm interested in the ${sizeLabel(listing).toLowerCase()} near ${listing.crossStreets} in ${listing.neighborhood}. I have ${program} and would like to know if you consider applicants with this voucher. I understand the asking rent is ${money(listing.rent)}.${letterLine} Could you confirm the rent, which utilities are included, and what you need from me next? Thank you.`
}
