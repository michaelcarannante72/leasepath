import { matchSheetListing } from './data/sheetListings.js'
// On-device listing paste checker. Parses rent, beds, and borough from listing text,
// compares against verified NYCHA Section 8 / CityFHEPS / FHEPS limits only
// (no HPD, HCR, or HASA dollar checks), and flags common scam patterns.
// Nothing leaves the device.

import { VOUCHERS, SIZES } from './data/voucherSearches.js'

export const BOROUGH_NAMES = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island']

const BOROUGH_PATTERNS = [
  { name: 'Manhattan', re: /\b(manhattan|nyc\s*-\s*manhattan|upper\s+east|upper\s+west|lower\s+east|harlem|washington\s+heights|inwood|chelsea|midtown|east\s+village|west\s+village|financial\s+district|fi\s*di)\b/i },
  { name: 'Brooklyn', re: /\b(brooklyn|bklyn|bushwick|bedford[\s-]?stuy|bed[\s-]?stuy|williamsburg|park\s+slope|flatbush|crown\s+heights|bensonhurst|bay\s+ridge|greenpoint|dumbo|fort\s+greene)\b/i },
  { name: 'Queens', re: /\b(queens|astoria|long\s+island\s+city|lic\b|jackson\s+heights|flushing|jamaica|forest\s+hills|ridgewood|elmhurst|woodside|sunnyside)\b/i },
  { name: 'Bronx', re: /\b(bronx|the\s+bronx|fordham|riverdale|mott\s+haven|tremont|pelham|concourse)\b/i },
  { name: 'Staten Island', re: /\b(staten\s+island|\bst\s*\.?\s*island\b|\bsi\b)\b/i },
]

/** @returns {{ rent: number|null, beds: number|null, unitKind: string|null, sizeSlug: string|null, borough: string|null, addressHint: string|null }} */
export function parseListingText(raw) {
  const text = String(raw || '')
  const rent = parseRent(text)
  const size = parseSize(text)
  const borough = parseBorough(text)
  const addressHint = parseAddressHint(text)
  return {
    rent,
    beds: size.beds,
    unitKind: size.unitKind,
    sizeSlug: size.slug,
    borough,
    addressHint,
  }
}

function parseRent(text) {
  // Prefer explicit rent / month / mo markers, then a bare $amount.
  const patterns = [
    /(?:rent|asking|price|monthly)\s*[:=]?\s*\$?\s*([\d,]{3,5})(?:\.\d{2})?/i,
    /\$\s*([\d,]{3,5})(?:\.\d{2})?\s*(?:\/\s*|per\s+|a\s+)?(?:mo(?:nth)?|mth)\b/i,
    /\$\s*([\d,]{3,5})(?:\.\d{2})?(?!\s*(?:deposit|sec(?:urity)?|fee|broker|app(?:lication)?))/i,
    /\b([\d,]{3,5})\s*(?:\/\s*|per\s+|a\s+)?(?:mo(?:nth)?|mth)\b/i,
  ]
  for (const re of patterns) {
    const match = re.exec(text)
    if (!match) continue
    const value = Number(String(match[1]).replace(/,/g, ''))
    if (Number.isFinite(value) && value >= 400 && value <= 20000) return value
  }
  return null
}

function parseSize(text) {
  if (/\b(studio|studios|alcove\s+studio)\b/i.test(text)) {
    return { beds: 0, unitKind: 'studio', slug: 'studio' }
  }
  if (/\b(sro|single\s+room\s+occupancy)\b/i.test(text)) {
    return { beds: null, unitKind: 'sro', slug: 'sro' }
  }
  // "room for rent" without SRO/studio — treat as room, no apartment limit slug
  if (/\b(room\s+for\s+rent|private\s+room|shared\s+room)\b/i.test(text) && !/\b(bed(?:room)?s?|br)\b/i.test(text)) {
    return { beds: null, unitKind: 'room', slug: null }
  }
  const br = /\b([1-6])\s*(?:br|bed(?:room)?s?)\b/i.exec(text)
    || /\b(one|two|three|four|five|six)[\s-]*(?:br|bed(?:room)?s?)\b/i.exec(text)
  if (br) {
    const map = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 }
    const beds = map[String(br[1]).toLowerCase()] ?? Number(br[1])
    if (Number.isInteger(beds) && beds >= 1 && beds <= 6) {
      const slug = beds >= 4 ? '4br' : `${beds}br`
      return { beds: beds >= 4 ? 4 : beds, unitKind: 'apartment', slug }
    }
  }
  return { beds: null, unitKind: null, slug: null }
}

function parseBorough(text) {
  for (const item of BOROUGH_PATTERNS) {
    if (item.re.test(text)) return item.name
  }
  return null
}

function parseAddressHint(text) {
  // Street number + street name, or "near X and Y"
  const street = /\b(\d{1,5}\s+(?:[NSEW]\.?\s+)?(?:\d{1,3}(?:st|nd|rd|th)|[A-Za-z]+)\s+(?:street|st|avenue|ave|road|rd|boulevard|blvd|place|pl|drive|dr|lane|ln|court|ct)\.?)\b/i.exec(text)
  if (street) return street[1].replace(/\s+/g, ' ').trim()
  const near = /\bnear\s+([A-Za-z0-9 .'-]{3,40})\b/i.exec(text)
  if (near) return `near ${near[1].trim()}`
  return null
}

const RED_FLAG_RULES = [
  {
    id: 'upfront-fee',
    level: 'watch',
    re: /\b(application\s+fee|app\s+fee|broker\s+fee|holding\s+fee|finders?\s+fee|admin(?:istrative)?\s+fee|processing\s+fee)\b.*\b(up\s*front|upfront|before|due\s+now|required|must\s+pay|pay\s+(?:first|now|to\s+apply))\b|\b(pay|send|wire).{0,40}\b(application\s+fee|broker\s+fee|holding\s+fee)\b|\b(application\s+fee|broker\s+fee|holding\s+fee).{0,40}\b(pay|send|wire|\$\d+)/i,
    label: 'Upfront fee demanded',
    detail: 'This listing asks for an application, broker, or holding fee up front. Applying is always free. Under the NYC FARE Act a landlord’s agent generally may not charge you a broker fee. Do not pay before you check with your worker.',
  },
  {
    id: 'no-programs',
    level: 'watch',
    re: /\b(no\s+(?:programs?|vouchers?|section\s*8|cityfheps|fheps|hasa|subsid(?:y|ies)|housing\s+assistance)|(?:programs?|vouchers?|section\s*8)\s+(?:not\s+(?:accepted|allowed|welcome)|ok\b|sorry)|(?:does\s+not|doesn't|dont|don't)\s+take\s+(?:programs?|vouchers?|section\s*8))\b/i,
    label: 'Says no programs / no vouchers',
    detail: 'Refusing a lawful housing voucher is source-of-income discrimination and is illegal in NYC. You can report it to the NYC Commission on Human Rights at 212-416-0197.',
  },
  {
    id: 'wire-crypto',
    level: 'watch',
    re: /\b(wire\s+transfer|western\s+union|moneygram|zelle|venmo|cash\s*app|crypto(?:currency)?|bitcoin|btc|ethereum|eth|gift\s+card|itunes\s+card)\b/i,
    label: 'Wire, app, crypto, or gift-card pay',
    detail: 'Real NYC landlords and agencies do not ask for rent or deposits by wire, crypto, Zelle, Venmo, Cash App, or gift cards before a lease is approved. Treat this as a scam signal.',
  },
  {
    id: 'cash-security',
    level: 'watch',
    re: /\b(cash\s+(?:security|deposit|only)|security\s+deposit\s+in\s+cash|no\s+security\s+voucher)\b/i,
    label: 'Cash security demanded',
    detail: 'CityFHEPS and related programs often use a security voucher instead of cash. Do not hand over a cash security deposit until your worker says it is required.',
  },
]

/**
 * Compare a parsed listing against verified rent limits.
 * Skips HPD, HCR, and HASA dollar checks on purpose.
 */
export function compareRentLimits(parsed) {
  const comparisons = []
  if (parsed.rent == null || !parsed.sizeSlug) {
    return comparisons
  }
  for (const voucher of VOUCHERS) {
    if (!voucher.sizes.includes(parsed.sizeSlug)) {
      comparisons.push({
        program: voucher.name,
        limit: null,
        rent: parsed.rent,
        status: 'skipped',
        summary: `${voucher.name}: no verified limit in LeasePath for this unit size.`,
        source: voucher.source,
      })
      continue
    }
    const limit = voucher.limitFor(parsed.sizeSlug)
    if (limit == null) {
      comparisons.push({
        program: voucher.name,
        limit: null,
        rent: parsed.rent,
        status: 'skipped',
        summary: `${voucher.name}: no verified limit loaded for this size.`,
        source: voucher.source,
      })
      continue
    }
    const within = parsed.rent <= limit
    comparisons.push({
      program: voucher.name,
      limit,
      rent: parsed.rent,
      status: within ? 'within' : 'over',
      summary: within
        ? `${voucher.name}: asking rent $${parsed.rent.toLocaleString('en-US')} may fit the $${limit.toLocaleString('en-US')} max (utilities included). This is not an approval.`
        : `${voucher.name}: asking rent $${parsed.rent.toLocaleString('en-US')} is over the $${limit.toLocaleString('en-US')} max (utilities included). Ask your worker before viewing.`,
      source: voucher.source,
    })
  }
  return comparisons
}

function tooGoodToBeTrue(parsed) {
  if (parsed.rent == null || !parsed.sizeSlug) return null
  // Use CityFHEPS limit when available; otherwise the lowest available verified limit.
  let reference = null
  for (const voucher of VOUCHERS) {
    if (!voucher.sizes.includes(parsed.sizeSlug)) continue
    const limit = voucher.limitFor(parsed.sizeSlug)
    if (limit == null) continue
    if (reference == null || limit < reference) reference = limit
  }
  if (reference == null) {
    if (parsed.unitKind === 'apartment' && parsed.rent < 900) {
      return {
        id: 'too-good',
        level: 'watch',
        label: 'Rent looks too good to be true',
        detail: `Asking rent $${parsed.rent.toLocaleString('en-US')} is far below typical NYC apartment rents. Confirm the address and never pay before a lease is approved.`,
      }
    }
    return null
  }
  if (parsed.rent <= reference * 0.4) {
    return {
      id: 'too-good',
      level: 'watch',
      label: 'Rent looks too good to be true',
      detail: `Asking rent $${parsed.rent.toLocaleString('en-US')} is under 40% of the lowest verified voucher max for this size (about $${reference.toLocaleString('en-US')}). Confirm the address in person and never pay before a lease is approved.`,
    }
  }
  return null
}

export function findRedFlags(raw, parsed) {
  const text = String(raw || '')
  const flags = []
  for (const rule of RED_FLAG_RULES) {
    if (rule.re.test(text)) {
      flags.push({ id: rule.id, level: rule.level, label: rule.label, detail: rule.detail })
    }
  }
  if (!parsed.addressHint) {
    flags.push({
      id: 'no-address',
      level: 'note',
      label: 'No street address found',
      detail: 'The paste has no clear street address. Ask for the exact building address before you visit or send anything.',
    })
  }
  const tgtbt = tooGoodToBeTrue(parsed)
  if (tgtbt) flags.push(tgtbt)
  return flags
}

export const SUGGESTED_QUESTIONS = [
  'Do you accept CityFHEPS, FHEPS, HASA, or Section 8 vouchers?',
  'What is the exact monthly rent, and which utilities are included (heat, hot water, cooking gas, electricity)?',
  'What is the full building address and apartment number?',
  'Is there any application fee, broker fee, or holding fee? (Applying should be free.)',
  'When can I view the unit, and who will be there?',
  'Will you accept an HRA security voucher instead of a cash security deposit?',
  'What is the next step after I view it — forms for my caseworker, or something else?',
]

export const CHECKLIST_ITEMS = [
  { id: 'rent', label: 'Rent amount is clear' },
  { id: 'size', label: 'Bedroom size / unit type is clear' },
  { id: 'borough', label: 'Borough is clear' },
  { id: 'address', label: 'Street address is clear' },
  { id: 'no-upfront-fee', label: 'No upfront application or broker fee demanded' },
  { id: 'accepts-voucher', label: 'Does not say “no programs” / “no vouchers”' },
  { id: 'no-wire', label: 'No wire, crypto, Zelle, or gift-card payment ask' },
  { id: 'rent-vs-limit', label: 'Asking rent checked against your voucher max' },
]

/**
 * Full on-device check. Returns parsed fields, rent comparisons, flags, checklist, and questions.
 */
export function checkListing(raw) {
  const text = String(raw || '').trim()
  const parsed = parseListingText(text)
  const empty = !text
  const comparisons = empty ? [] : compareRentLimits(parsed)
  const flags = empty ? [] : findRedFlags(text, parsed)
  const checklist = CHECKLIST_ITEMS.map((item) => {
    let pass = null
    if (empty) return { ...item, pass }
    if (item.id === 'rent') pass = parsed.rent != null
    else if (item.id === 'size') pass = parsed.sizeSlug != null || parsed.unitKind != null
    else if (item.id === 'borough') pass = parsed.borough != null
    else if (item.id === 'address') pass = parsed.addressHint != null
    else if (item.id === 'no-upfront-fee') pass = !flags.some((f) => f.id === 'upfront-fee')
    else if (item.id === 'accepts-voucher') pass = !flags.some((f) => f.id === 'no-programs')
    else if (item.id === 'no-wire') pass = !flags.some((f) => f.id === 'wire-crypto')
    else if (item.id === 'rent-vs-limit') {
      pass = comparisons.some((c) => c.status === 'within' || c.status === 'over')
    }
    return { ...item, pass }
  })
  return {
    empty,
    parsed,
    comparisons,
    flags,
    checklist,
    sheetMatches: empty ? [] : matchSheetListing(text),
    questions: SUGGESTED_QUESTIONS,
    sizeLabel: sizeLabel(parsed),
  }
}

function sizeLabel(parsed) {
  if (parsed.unitKind === 'studio') return 'Studio'
  if (parsed.unitKind === 'sro') return 'SRO'
  if (parsed.unitKind === 'room') return 'Room'
  if (parsed.beds != null) return parsed.beds === 1 ? '1 bedroom' : `${parsed.beds} bedrooms`
  return null
}

/** Exported for tests: size slug helpers stay aligned with voucherSearches. */
export function sizeSlugForBeds(beds) {
  const size = SIZES.find((item) => item.beds === beds)
  return size ? size.slug : null
}
