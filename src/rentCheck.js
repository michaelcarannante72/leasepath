// Rent checks, one separate code path per program. A figure is only ever produced from that program's own rows,
// and every figure comes back with a `source` (program, document, effective date, date copied, link).
// A row without a source link, or one that is not an official source, produces "Ask your caseworker" instead
// ("Ask your housing specialist" for Section 8, which is not run by HRA).
import { formatDate } from './dates.js'
import { HASA_PROGRAM, HASA_RULES, hasaRow } from './data/hasa.js'
import {
  CITYFHEPS_2026_ROWS,
  CITYFHEPS_PROGRAM,
  CITYFHEPS_ROOM_MAX,
  CITYFHEPS_RULES,
  CITYFHEPS_UTILITY_ALLOWANCES_1BR,
} from './data/cityfheps.js'
import { SECTION8_PROGRAM, SECTION8_RULES, nychaNewRentalRow } from './data/section8.js'
import { ALLOWANCE_DATE_NOTE, isDisplayable, sourceFor } from './data/sourced.js'

export const ASK = 'Ask your caseworker'
export const ASK_SPECIALIST = 'Ask your housing specialist'

/** Who to ask, by program. Section 8 is run by a housing authority, so there is no HRA caseworker to ask. */
export function askFor(program) {
  return program === SECTION8_PROGRAM ? ASK_SPECIALIST : ASK
}

export function money(value) {
  return `$${Number(value).toLocaleString('en-US')}`
}

/** Dollars with cents only when needed, for a calculated fee. */
export function moneyExact(value) {
  const rounded = Math.round(Number(value) * 100) / 100
  return Number.isInteger(rounded) ? money(rounded) : `$${rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function bedroomLabel(row) {
  if (row.unitKind === 'sro') return 'SRO'
  if (row.unitKind === 'studio') return 'studio'
  return `${row.bedrooms} bedroom${row.bedrooms === 1 ? '' : 's'}`
}

function unitName(listing) {
  if (listing.unitKind === 'sro') return 'an SRO'
  if (listing.unitKind === 'studio') return 'a studio'
  if (listing.unitKind === 'room') return 'a room'
  return `a ${listing.bedrooms}-bedroom apartment`
}

/** "HASA · SPSVC-17 (E) · effective September 10, 2025 · figures copied on October 18, 2026" */
export function sourceText(source) {
  if (!source) return ''
  const parts = [source.program]
  if (source.document) parts.push(source.document)
  if (source.effectiveDate) parts.push(`effective ${formatDate(source.effectiveDate)}${source.dateNote ? ` (${source.dateNote})` : ''}`)
  else if (source.documentDate) parts.push(`effective date not stated, document dated ${formatDate(source.documentDate)}`)
  else parts.push('effective date not stated by the source')
  parts.push(`figures copied on ${formatDate(source.copiedOn)}`)
  return parts.join(' · ')
}

function flag(level, text, source = null) {
  return source ? { level, text, source } : { level, text }
}

/** Lower-case form for use inside a sentence. */
export function whoFor(program) {
  return program === SECTION8_PROGRAM ? 'your housing specialist' : 'your caseworker'
}

/** A rule note. It states the rule only when its row is an official, sourced row. Otherwise it says who to ask. */
function ruleFlag(rule, program, text, level = 'note') {
  if (!isDisplayable(rule)) return flag('note', `${askFor(program)}.`)
  return flag(level, text, sourceFor(rule, program))
}

/**
 * The main comparison. `summary` has no dollar figure, so a search card can show it without a source link.
 * A "note" verdict means within the limit but with a caveat (a tenant-paid utility is not subtracted yet).
 */
function verdict(level, text, source, summary = '') {
  const program = source?.program || 'program'
  const fallback =
    level === 'watch'
      ? `Asking rent is above the ${program} limit. Open it for the figure and source.`
      : level === 'good'
        ? `Asking rent is within the ${program} limit. Open it for the figure and source.`
        : `Asking rent is within the ${program} limit before any utility is subtracted. Open it for the figure and source.`
  return { level, text, source, summary: summary || fallback }
}

function askFlag(row, detail, programLabel) {
  // A row with no link, or an unverified one, never gives a number or a specific claim.
  const source = row?.sourceUrl ? sourceFor(row, programLabel) : null
  return flag('note', `${detail} ${askFor(programLabel)}.`, source && isDisplayable(row) ? source : null)
}

/** The household-size choice for a household of nine or more. No program table covers it, so no figure is shown for it. */
export const LARGE_HOUSEHOLD = '9+'
export const HOUSEHOLD_CHOICES = ['1', '2', '3', '4', '5', '6', '7', '8', LARGE_HOUSEHOLD]
export function isLargeHousehold(value) {
  return value === LARGE_HOUSEHOLD
}

/**
 * The household size the app keeps, from anything stored or received: "1" to "8", "9+", or "". A number of 9 or more
 * (an older saved value, or one sent by another client) becomes "9+", so it is always ask-only.
 */
export function normalizeHousehold(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return ''
  const text = String(value).trim()
  if (HOUSEHOLD_CHOICES.includes(text)) return text
  const count = Number(text)
  return Number.isInteger(count) && count >= 9 ? LARGE_HOUSEHOLD : ''
}

/** A plain "not available" note. It makes no claim about the program, so it cites nothing. */
function unavailable(program, detail) {
  return flag('note', `${detail} ${askFor(program)}.`)
}

function inRange(size, range) {
  const text = String(range ?? '')
  const match = /^(\d+)(?:-(\d+))?$/.exec(text)
  if (!match) return false
  const low = Number(match[1])
  const high = Number(match[2] || match[1])
  return size >= low && size <= high
}

function utilitiesNote(listing) {
  return listing.utilities && listing.utilities !== 'all'
}

// ---------------------------------------------------------------- HASA

function checkHasa(listing, plan, options) {
  const flags = []
  const row = hasaRow(listing)
  if (listing.unitKind === 'sro' || listing.unitKind === 'room') {
    // Only the public schedule page was read. Say that page has no SRO row, not that the whole document has none.
    const what = listing.unitKind === 'sro' ? 'SRO row' : 'room row'
    flags.push(askFlag(HASA_RULES.rentCap, `The public HASA schedule page has no ${what}.`, HASA_PROGRAM))
    return flags
  }
  if (!row || !isDisplayable(row)) {
    flags.push(unavailable(HASA_PROGRAM, 'LeasePath cannot show a HASA figure for this size.'))
    return flags
  }
  const source = sourceFor(row, HASA_PROGRAM)
  const size = Number(plan?.household)
  const label = bedroomLabel(row)
  const head = `HASA schedule, ${label}, all utilities included: ${money(row.maxRent)}.`
  const deduction = Number(options.hasaDeduction)
  const hasDeduction = Number.isFinite(deduction) && deduction > 0

  if (listing.rent > row.maxRent) {
    flags.push(verdict('watch', `${head} This asking rent is ${money(listing.rent - row.maxRent)} higher, even before any utility is subtracted.`, source))
  } else if (utilitiesNote(listing) && hasDeduction) {
    const adjusted = row.maxRent - deduction
    flags.push(
      listing.rent > adjusted
        ? verdict('watch', `${head} With the ${money(deduction)} utility amount you entered, the limit is ${money(adjusted)}. This asking rent is higher.`, source)
        : verdict('good', `${head} With the ${money(deduction)} utility amount you entered, the limit is ${money(adjusted)}. This asking rent is within it.`, source),
    )
  } else if (utilitiesNote(listing)) {
    flags.push(verdict('note', `${head} This asking rent is within it before any utility is subtracted. You would pay a utility here, and HASA subtracts that amount. LeasePath does not know your amount: enter the one your caseworker gives you.`, source))
  } else {
    flags.push(verdict('good', `${head} This asking rent is within it.`, source))
  }

  if (utilitiesNote(listing)) {
    const ded = HASA_RULES.utilityDeduction
    flags.push(ruleFlag(ded, HASA_PROGRAM, 'HASA utility deductions are not in the public schedule. Use the amount from your caseworker or the HRA Landlord Utility Calculator.'))
  }
  if (size && !inRange(size, row.householdSize)) {
    flags.push(
      ruleFlag(
        HASA_RULES.bedroomExceptions,
        HASA_PROGRAM,
        `HASA lists the ${label} row for ${row.householdSize} ${row.householdSize === '1' ? 'person' : 'people'}. Your caseworker decides the approved bedroom count.`,
      ),
    )
  }
  const heat = HASA_RULES.heatHotWater
  flags.push(ruleFlag(heat, HASA_PROGRAM, 'HASA needs heat and hot water in the lease, except for NYC Housing Connect and other housing lottery apartments.'))
  return flags
}

// ---------------------------------------------------------------- CityFHEPS

function cityfhepsRows(kind, bedrooms) {
  return CITYFHEPS_2026_ROWS.find((row) => row.unitKind === kind && (kind !== 'apartment' || row.bedrooms === bedrooms)) || null
}

function ownApartmentRow(size) {
  return CITYFHEPS_2026_ROWS.find((row) => row.unitKind === 'apartment' && inRange(size, row.householdSize)) || null
}

/**
 * Which row caps this listing for this household, by the CityFHEPS bedroom standard:
 * a smaller unit is paid at that unit's own row, a larger unit only up to the row for the household's own size.
 */
export function cityfhepsCap(listing, size) {
  const kind = listing.unitKind
  const unitRow = kind === 'apartment' ? cityfhepsRows('apartment', listing.bedrooms) : cityfhepsRows(kind, 0)
  if (!unitRow) return { row: null, reason: 'no-row' }
  if (kind === 'sro') return size > 1 ? { row: null, reason: 'sro-one-adult' } : { row: unitRow, reason: 'unit' }
  const own = ownApartmentRow(size)
  if (!own) return { row: null, reason: 'no-row' }
  if (kind === 'studio') return { row: unitRow, reason: size === 1 ? 'unit' : 'smaller-unit' }
  if (listing.bedrooms > own.bedrooms) return { row: own, reason: 'larger-unit', unitRow }
  return { row: unitRow, reason: listing.bedrooms === own.bedrooms ? 'unit' : 'smaller-unit' }
}

export function cityfhepsAllowance(label) {
  return CITYFHEPS_UTILITY_ALLOWANCES_1BR.find((item) => item.label === label) || null
}

function checkCityfheps(listing, plan, options) {
  const flags = []
  const size = Number(plan?.household)

  if (listing.unitKind === 'room') {
    const rule = CITYFHEPS_RULES.roomMax
    if (!isDisplayable(rule)) return [askFlag(rule, 'A CityFHEPS room maximum is not available.', CITYFHEPS_PROGRAM)]
    const source = sourceFor(rule, CITYFHEPS_PROGRAM)
    const head = `CityFHEPS room maximum in NYC: ${money(CITYFHEPS_ROOM_MAX)} a month, with heat, hot water, electricity, and cooking gas (if the stove is not electric) included.`
    flags.push(
      listing.rent > CITYFHEPS_ROOM_MAX
        ? verdict('watch', `${head} This asking rent is higher.`, source)
        : // Not "Check utilities": the room maximum already includes utilities. The open question is whether a room works.
          { ...verdict('note', `${head} This asking rent is within it. Ask your worker whether a room works for your household.`, source, 'Asking rent is within the CityFHEPS room maximum. Ask whether a room works for your household.'), label: 'Room: ask' },
    )
    if (listing.utilities !== 'all') {
      flags.push(flag('watch', 'This room does not include every utility. The CityFHEPS room rule requires those utilities in the rent.', source))
    }
    if (size > 2) {
      flags.push(ruleFlag(CITYFHEPS_RULES.roomTwoAdults, CITYFHEPS_PROGRAM, 'A CityFHEPS room is for a household of no more than two adults.', 'watch'))
    }
    return flags
  }

  if (!size) {
    flags.push(flag('note', 'Add your household size under My voucher to compare this with the CityFHEPS payment standards.'))
    return flags
  }

  const { row, reason } = cityfhepsCap(listing, size)
  if (reason === 'sro-one-adult') {
    const sro = CITYFHEPS_RULES.sroOneAdult
    flags.push(askFlag(sro, 'CityFHEPS SROs are for one-adult households only.', CITYFHEPS_PROGRAM))
    return flags
  }
  if (!row || !isDisplayable(row)) {
    flags.push(unavailable(CITYFHEPS_PROGRAM, `LeasePath cannot show a CityFHEPS payment standard for this size and a household of ${size}.`))
    return flags
  }

  const source = sourceFor(row, CITYFHEPS_PROGRAM)
  const label = bedroomLabel(row)
  const why =
    reason === 'larger-unit'
      ? ` This unit has more bedrooms than a household of ${size} gets, so CityFHEPS allows it only up to the ${label} figure.`
      : reason === 'smaller-unit'
        ? ' A smaller unit is paid at that unit’s own figure.'
        : ''
  const head = `CityFHEPS 2026 payment standard, ${label}, all utilities included: ${money(row.maxRent)}.`
  const allowance = options.cityfhepsAllowance ? cityfhepsAllowance(options.cityfhepsAllowance) : null

  if (listing.rent > row.maxRent) {
    flags.push(verdict('watch', `${head} This asking rent is ${money(listing.rent - row.maxRent)} higher.${why}`, source))
  } else if (utilitiesNote(listing) && allowance && listing.unitKind === 'apartment' && listing.bedrooms === 1) {
    const adjusted = row.maxRent - allowance.amount
    const allowanceText = `${money(allowance.amount)} allowance for ${allowance.label}`
    const allowanceSource = sourceFor(CITYFHEPS_RULES.utilityAllowance, CITYFHEPS_PROGRAM, ALLOWANCE_DATE_NOTE)
    const result =
      listing.rent > adjusted
        ? verdict('watch', `${head} After the ${allowanceText}, the limit is ${money(adjusted)}. This asking rent is higher.${why}`, source)
        : verdict('good', `${head} After the ${allowanceText}, the limit is ${money(adjusted)}. This asking rent is within it.${why}`, source)
    flags.push({ ...result, extraSources: [allowanceSource] })
  } else if (utilitiesNote(listing)) {
    flags.push(verdict('note', `${head} This asking rent is within it before the utility allowance.${why}`, source))
  } else {
    flags.push(verdict('good', `${head} This asking rent is within it.${why}`, source))
  }

  if (utilitiesNote(listing)) {
    const oneBed = listing.unitKind === 'apartment' && listing.bedrooms === 1
    const rule = CITYFHEPS_RULES.utilityAllowance
    flags.push(
      isDisplayable(rule)
        ? flag(
            'note',
            oneBed
              ? 'You would pay a utility here, and DSS subtracts an allowance. LeasePath has six 1-bedroom examples. Pick yours on My voucher. The full schedule is not yet loaded.'
              : `You would pay a utility here, and DSS subtracts an allowance. The allowance for ${unitName(listing)} is not yet loaded in LeasePath. ${ASK}.`,
            sourceFor(rule, CITYFHEPS_PROGRAM, ALLOWANCE_DATE_NOTE),
          )
        : flag('note', `${ASK}.`),
    )
  }
  return flags
}

// ---------------------------------------------------------------- Section 8

function checkSection8(listing, plan, options) {
  const agency = options.section8Agency
  if (agency === 'HPD') {
    // HPD standards depend on the ZIP code and are not loaded, for any unit type.
    return [askFlag(SECTION8_RULES.hpdStandards, 'HPD payment standards depend on the ZIP code. LeasePath has no HPD figures. Type the amount from your HPD voucher into the "Monthly amount on your letter" box on My voucher.', SECTION8_PROGRAM)]
  }
  if (agency !== 'NYCHA') {
    return [flag('note', 'Pick NYCHA or HPD under My voucher. Section 8 payment standards depend on the housing authority, and LeasePath does not use another program’s chart.')]
  }
  if (listing.unitKind === 'sro' || listing.unitKind === 'room') {
    const what = listing.unitKind === 'sro' ? 'an SRO' : 'a room'
    return [askFlag(SECTION8_RULES.nychaNew, `The NYCHA payment standards list voucher sizes from studio to 8 bedrooms. They have no row for ${what}.`, SECTION8_PROGRAM)]
  }
  const row = nychaNewRentalRow(options.voucherBedrooms)
  if (!row) return [flag('note', 'Add the bedroom size printed on your NYCHA voucher under My voucher to compare this with the NYCHA payment standard.')]
  if (!isDisplayable(row)) return [unavailable(SECTION8_PROGRAM, 'LeasePath cannot show the NYCHA payment standard for this voucher size.')]
  const voucher = row.bedrooms === 0 ? 'studio voucher' : `${row.bedrooms}-bedroom voucher`
  const unitBeds = listing.unitKind === 'studio' ? 0 : listing.bedrooms
  if (unitBeds !== row.bedrooms) {
    // Pending verification with the housing specialist: whether the standard follows the voucher size or the
    // smaller of voucher size and unit size is not confirmed. No comparison and no figure is shown.
    return [
      flag(
        'note',
        `This sample is ${unitName(listing)}, but your voucher is a ${voucher}. LeasePath has not confirmed whether a smaller or larger unit changes the NYCHA limit, so it shows no comparison. ${ASK_SPECIALIST}.`,
      ),
    ]
  }
  const source = sourceFor(row, SECTION8_PROGRAM)
  const head = `NYCHA Section 8 payment standard for a ${voucher}, new rental or transfer, all utilities included: ${money(row.maxRent)}.`
  const flags = []
  if (listing.rent > row.maxRent) flags.push(verdict('watch', `${head} This asking rent is ${money(listing.rent - row.maxRent)} higher.`, source))
  else if (utilitiesNote(listing)) flags.push(verdict('note', `${head} This asking rent is within it before the utility allowance.`, source))
  else flags.push(verdict('good', `${head} This asking rent is within it.`, source))
  if (utilitiesNote(listing)) {
    flags.push(ruleFlag(SECTION8_RULES.nychaUtilityAllowance, SECTION8_PROGRAM, `NYCHA subtracts a utility allowance for tenant-paid utilities. That table is not yet loaded in LeasePath. ${ASK_SPECIALIST}.`))
  }
  return flags
}

/**
 * Flags for one listing and one program. `options`:
 *   hasaDeduction      user-entered monthly utility amount for HASA (never assumed)
 *   cityfhepsAllowance label of one of the six 1-bedroom allowance examples
 *   section8Agency     'NYCHA' | 'HPD'
 *   voucherBedrooms    bedroom size printed on the voucher, 0 for a studio
 */
export function rentFlags(listing, plan, options = {}) {
  const program = plan?.program
  // A household of 9 or more has no row to compare with. Show no figure and no verdict, only who to ask.
  if (isLargeHousehold(plan?.household) && (program === HASA_PROGRAM || program === CITYFHEPS_PROGRAM)) {
    return [unavailable(program, `LeasePath shows no ${program} rent comparison for a household of 9 or more.`)]
  }
  if (program === HASA_PROGRAM) return checkHasa(listing, plan, options)
  if (program === CITYFHEPS_PROGRAM) return checkCityfheps(listing, plan, options)
  if (program === SECTION8_PROGRAM) return checkSection8(listing, plan, options)
  return []
}
