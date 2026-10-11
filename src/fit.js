// CityFHEPS figures from DSS-8j (E), "CityFHEPS Frequently Asked Questions
// for Landlords and Brokers", dated 01/28/2026. The 2026 column applies to
// new packages submitted on or after March 1, 2026, or leases starting
// April 1, 2026 or later. Amounts are maximum rent when every utility is
// included in the lease. A utility the tenant pays is subtracted as a
// utility allowance. LeasePath does not decide anyone's official maximum.

export const CITYFHEPS_SOURCE =
  'DSS-8j (E), 01/28/2026, CityFHEPS FAQ for landlords and brokers'

export const CITYFHEPS_2026 = [
  { unitKind: 'sro', family: [1], bedrooms: 0, label: 'SRO', maxRentAllUtilities: 1953 },
  { unitKind: 'studio', family: [1], bedrooms: 0, label: 'Studio', maxRentAllUtilities: 2604 },
  { unitKind: 'apartment', family: [1, 2], bedrooms: 1, label: '1 bedroom', maxRentAllUtilities: 2734 },
  { unitKind: 'apartment', family: [3, 4], bedrooms: 2, label: '2 bedrooms', maxRentAllUtilities: 2997 },
  { unitKind: 'apartment', family: [5, 6], bedrooms: 3, label: '3 bedrooms', maxRentAllUtilities: 3753 },
  { unitKind: 'apartment', family: [7, 8], bedrooms: 4, label: '4 bedrooms', maxRentAllUtilities: 4077 },
]

export const CITYFHEPS_ROOM_MAX = 1100

export const PROGRAMS = ['CityFHEPS', 'HASA', 'Section 8']

/** Programs a person can already be receiving. FHEPS is not a search filter. */
export const VOUCHER_PROGRAMS = [...PROGRAMS, 'FHEPS']

export function money(value) {
  return `$${Number(value).toLocaleString('en-US')}`
}

export function sizeLabel(listing) {
  if (listing.unitKind === 'room') return 'Room'
  if (listing.unitKind === 'sro') return 'SRO'
  if (listing.unitKind === 'studio') return 'Studio'
  const beds = listing.bedrooms
  return beds === 1 ? '1 bed' : `${beds} beds`
}

export function utilityLabel(utilities) {
  if (utilities === 'all') return 'All utilities in the rent'
  if (utilities === 'tenant-electric') return 'Tenant pays electric'
  if (utilities === 'tenant-electric-gas') return 'Tenant pays electric and cooking gas'
  return 'Ask which utilities are included'
}

export function cityfhepsRow(listing, household) {
  const size = Number(household)
  if (!size) return null
  if (listing.unitKind === 'room') {
    return { unitKind: 'room', label: 'Room', maxRentAllUtilities: CITYFHEPS_ROOM_MAX, family: [] }
  }
  return (
    CITYFHEPS_2026.find(
      (row) =>
        row.unitKind === listing.unitKind &&
        row.bedrooms === listing.bedrooms &&
        row.family.includes(size),
    ) || null
  )
}

export function assessListing(listing, plan) {
  const flags = []
  const program = plan?.program
  const knownProgram = PROGRAMS.includes(program)

  if (knownProgram && listing.programs.includes(program)) {
    flags.push({
      level: 'good',
      text: `Marked for ${program}. Confirm it with the broker and your worker before you visit or pay anyone.`,
    })
  } else if (knownProgram) {
    flags.push({
      level: 'watch',
      text: `This sample is not marked for ${program}.`,
    })
  } else if (program === 'FHEPS') {
    flags.push({
      level: 'note',
      text: 'Your plan says FHEPS. These samples are marked for CityFHEPS, HASA, or Section 8. Compare the asking rent with the amount on your letter, then confirm the program with your worker.',
    })
  }

  const letter = Number(plan?.letterRent)
  if (letter > 0) {
    if (listing.rent > letter) {
      flags.push({
        level: 'watch',
        text: `Your letter says ${money(letter)}. This asking rent is ${money(listing.rent - letter)} higher.`,
      })
    } else {
      flags.push({
        level: 'good',
        text: `Your letter says ${money(letter)}. This asking rent is within that amount.`,
      })
    }
  }

  if (program === 'CityFHEPS') {
    const size = Number(plan.household)
    if (!size) {
      flags.push({
        level: 'note',
        text: 'Add your household size under My voucher to compare this with the published CityFHEPS chart.',
      })
    } else if (listing.unitKind === 'room') {
      if (listing.rent > CITYFHEPS_ROOM_MAX) {
        flags.push({
          level: 'watch',
          text: `The CityFHEPS landlord FAQ caps a rented room in NYC at ${money(CITYFHEPS_ROOM_MAX)}. This asking rent is higher.`,
        })
      } else {
        flags.push({
          level: 'note',
          text: `A CityFHEPS room in NYC is capped at ${money(CITYFHEPS_ROOM_MAX)} in the landlord FAQ. Heat, hot water, electricity, and cooking gas (when the stove is not electric) have to be included. Ask your worker whether a room works for your household.`,
        })
      }
      if (listing.utilities !== 'all') {
        flags.push({
          level: 'watch',
          text: 'This room does not include every utility. The CityFHEPS room rule requires those utilities in the rent.',
        })
      }
    } else {
      const row = cityfhepsRow(listing, size)
      if (!row) {
        flags.push({
          level: 'watch',
          text: `A ${sizeLabel(listing).toLowerCase()} is not the size on the CityFHEPS chart for a household of ${size}. Ask your worker before you treat this as an option.`,
        })
      } else if (listing.rent > row.maxRentAllUtilities) {
        flags.push({
          level: 'watch',
          text: `Above the published CityFHEPS 2026 maximum for a ${row.label.toLowerCase()} when all utilities are included (${money(row.maxRentAllUtilities)}).`,
        })
      } else {
        flags.push({
          level: 'good',
          text: `Within the published CityFHEPS 2026 maximum for a ${row.label.toLowerCase()} when all utilities are included (${money(row.maxRentAllUtilities)}).`,
        })
      }
      if (listing.utilities !== 'all') {
        flags.push({
          level: 'note',
          text: 'You would pay a utility here. DSS subtracts a utility allowance, so the rent that can be approved can be lower than the chart. The allowance table is at nyc.gov/dsshousing.',
        })
      }
    }
  }

  return flags
}

export function leadFlag(flags) {
  return flags.find((flag) => flag.level === 'watch') || flags.find((flag) => flag.level === 'good') || flags[0] || null
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
