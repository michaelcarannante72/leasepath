// Program rent figures for the assistant, built from the same separate data modules the app uses.
// Every figure carries its program, effective date, date copied, and source link.
// Nothing here is typed by hand, so the assistant cannot drift from the screens.
import { CITYFHEPS_2026_ROWS, CITYFHEPS_ROOM_MAX, CITYFHEPS_RULES, CITYFHEPS_UTILITY_ALLOWANCES_1BR, BROKER_FEE_PERCENT, SHOPPING_LETTER_DAYS } from '../src/data/cityfheps.js'
import { HASA_ROWS } from '../src/data/hasa.js'
import { SECTION8_NEW_RENTAL_ROWS, SECTION8_RECERT_ROWS, SECTION8_RULES } from '../src/data/section8.js'
import { ALLOWANCE_DATE_NOTE, COPIED_ON, isDisplayable, sourceFor } from '../src/data/sourced.js'
import { CONCURRENT_RULE, FARE_RULES, SECURITY_VOUCHER_RULES } from '../src/data/notices.js'
import { ASK, ASK_SPECIALIST, money, sourceText } from '../src/rentCheck.js'
import { HASA_RULES } from '../src/data/hasa.js'
import { POVERTY_LABEL, POVERTY_RECHECK_NOTE, POVERTY_ROWS, monthlyMax, povertySource } from '../src/data/poverty.js'

function cite(row, label, dateNote) {
  const source = sourceFor(row, label, dateNote)
  return `${sourceText(source)} · ${source.url}`
}

function sizeName(row) {
  if (row.unitKind === 'sro') return 'SRO'
  if (row.unitKind === 'studio') return 'studio'
  if (row.unitKind === 'voucher-bedroom') return row.bedrooms === 0 ? 'studio voucher' : `${row.bedrooms}-bedroom voucher`
  return `${row.bedrooms} bedroom${row.bedrooms === 1 ? '' : 's'}`
}

function list(rows, withPeople) {
  return rows
    .filter(isDisplayable)
    .map((row) => `${sizeName(row)}${withPeople ? ` (${row.householdSize} ${row.householdSize === '1' ? 'person' : 'people'})` : ''} ${money(row.maxRent)}`)
    .join('; ')
}

/**
 * The 200% of poverty income lines. This is the only place the assistant may take an income limit from.
 * HASA and CityFHEPS are separate: HASA says "below", CityFHEPS says "at or below".
 */
export function incomeLinesBlock() {
  const hasa = HASA_RULES.incomeLimit
  const cityCommunity = CITYFHEPS_RULES.incomeCommunity
  const cityShelter = CITYFHEPS_RULES.incomeShelter
  if (![hasa, cityCommunity, cityShelter].every(isDisplayable)) {
    return `INCOME PRE-SCREEN LINES: not available. If asked for an income limit, ${ASK.toLowerCase()} and give no number.`
  }
  const source = povertySource()
  const table = POVERTY_ROWS.map((row) => `${row.householdSize} ${row.householdSize === 1 ? 'person' : 'people'}: ${money(row.annual200)} a year (monthly: HASA ${money(monthlyMax(row.annual200, false))} or less, CityFHEPS ${money(monthlyMax(row.annual200, true))} or less)`).join('; ')
  return [
    `INCOME PRE-SCREEN LINES, ${POVERTY_LABEL}. These are federal figures, not DSS or HRA figures. DSS and HRA documents say "200% of the federal poverty level" and print no dollar amount or year, so never say DSS or HRA confirmed these dollars or that the 2026 table is the one a program uses. Say "the ${POVERTY_LABEL}".`,
    `200% of the poverty level, ${table}. For a household of 9 or more there is no figure here: do not add up or extend the table, and say ${ASK.toLowerCase()}. Lead with the yearly figure, which is exact. A monthly amount is the most that passes (rounded down, never up), and HASA needs income strictly below the line, so HASA’s monthly amount can be one dollar lower than CityFHEPS’s. ${sourceText(source)} · ${source.url}`,
    `- HASA says household income must be below 200% (strictly below, equal is not below). ${cite(hasa, 'HASA')}. HASA also requires a diagnosis of HIV illness or AIDS and living in New York City. Income is not the whole test.`,
    `- CityFHEPS says income at or below 200% (equal is allowed). ${cite(cityCommunity, 'CityFHEPS')} and ${cite(cityShelter, 'CityFHEPS')}. A single adult who earns minimum wage and works 35 or more hours a week may be over the line and still be eligible (DSS-7n). CityFHEPS has other requirements too.`,
    '- Give a line only for HASA or CityFHEPS, only from this block, and always with the program name, the year, the effective date, and the source link. Never use one program’s comparison word for the other.',
    '- There is no 200% line in this pack for Section 8, FHEPS, SOTA, Homebase, supportive housing, or any new or expanded program. Do not give an income limit for them, and do not use any area-median-income figure. Say you do not have it and point to the agency.',
    '- Never say a person qualifies. A person under the line is not approved. A person over the line may not qualify and should ask the caseworker. The app’s pre-screen keeps the person’s income on their phone, so you will not see it unless they type it to you.',
    `- ${POVERTY_RECHECK_NOTE}.`,
  ].join('\n')
}

export function programFiguresBlock() {
  const hasa = HASA_ROWS.find(isDisplayable)
  const city = CITYFHEPS_2026_ROWS.find(isDisplayable)
  const nycha = SECTION8_NEW_RENTAL_ROWS.find(isDisplayable)
  const nychaRecert = SECTION8_RECERT_ROWS.find(isDisplayable)
  const lines = [
    `PROGRAM RENT FIGURES, figures copied on ${COPIED_ON}. HASA, CityFHEPS, and Section 8 are three separate programs with three separate tables. Never use one program's row for another, even when two dollar figures match.`,
    `A household of 9 or more has no HASA or CityFHEPS rent comparison in this pack. For that size, give no rent figure or verdict and say ${ASK.toLowerCase()}.`,
    `Every time you give a rent figure: name the program, give its effective date, and give its source link. If a figure is not below, or the person's program is not chosen, or a line below says "${ASK}", say "${ASK.toLowerCase()}" (for Section 8, "${ASK_SPECIALIST.toLowerCase()}") and do not guess a number.`,
    '',
  ]
  if (hasa) {
    lines.push(
      `HASA rent schedule. Maximum rent, all utilities included. ${cite(hasa, 'HASA')}:`,
      `- ${list(HASA_ROWS, true)}.`,
      '- The public HASA schedule page has no SRO or room row. The caseworker decides the approved bedroom count, and exceptions are case by case.',
      `- HASA needs heat and hot water in the lease, with exceptions such as housing lottery apartments. If the tenant pays a utility, HASA subtracts it, but HASA deduction amounts are not in the public schedule. Use only an amount the person typed or their caseworker gave, never a CityFHEPS allowance. HRA says the guidelines are not a guarantee and can change.`,
      `- HASA broker fee: no HASA fee amount or form was found. ${ASK}. Do not quote any older HASA broker percentage.`,
      `- HASA security voucher: nothing is confirmed for HASA. Do not say the W-147N applies to HASA. ${ASK}.`,
      `- Whether a HASA client can also hold CityFHEPS has not been confirmed${isDisplayable(CONCURRENT_RULE) ? '' : '. Do not say they can or cannot'}. ${ASK}.`,
      `- The 1/1/2023 HASA schedule is out of date. A letter showing a different figure than the table needs a caseworker check.`,
    )
  }
  if (city) {
    lines.push(
      '',
      `CityFHEPS payment standards, maximum rent with all utilities included, for a move inside New York City. ${cite(city, 'CityFHEPS')}:`,
      `- ${list(CITYFHEPS_2026_ROWS, true)}.`,
    )
    if (isDisplayable(CITYFHEPS_RULES.roomMax)) {
      lines.push(`- Room, NYC only: ${money(CITYFHEPS_ROOM_MAX)} a month with utilities included, for no more than two adults. ${cite(CITYFHEPS_RULES.roomMax, 'CityFHEPS')}`)
    }
    lines.push(
      '- This is the current table, effective April 1, 2026. An older package may use the 2025 table, which LeasePath does not use. Ask the caseworker which table a package uses.',
      '- An SRO is for one-adult households only. A smaller unit is paid at its own row. A larger unit is allowed only if the rent is within the row for the household’s own size.',
    )
    const allowances = CITYFHEPS_UTILITY_ALLOWANCES_1BR.filter(isDisplayable)
    if (allowances.length) {
      lines.push(
        `- Utility allowance examples for a 1-bedroom only: ${allowances.map((item) => `${item.label} ${money(item.amount)}`).join('; ')}. ${cite(CITYFHEPS_RULES.utilityAllowance, 'CityFHEPS', ALLOWANCE_DATE_NOTE)}.`,
        `- Utility allowances for studios and for 2 bedrooms and larger are not yet loaded. ${ASK}. Do not invent one.`,
      )
    }
    lines.push(
      `- Broker fee: DSS pays the broker up to ${BROKER_FEE_PERCENT}% of the annual rent, and the broker should not ask the tenant for any additional fee. ${cite(CITYFHEPS_RULES.brokerFee, 'CityFHEPS')}. A broker fee is not charged for HPD lottery or centralized homeless-referral units.`,
      `- Shopping letter: valid ${SHOPPING_LETTER_DAYS} days. ${cite(CITYFHEPS_RULES.shoppingLetter, 'CityFHEPS')}. The app counts down from the issue date the person types on their own phone; the date is not sent to you, so ask them for the date if it matters.`,
      '- The household share depends on household size and each member’s income and is in the Approval Letter. Do not quote a percentage.',
      '- The CityFHEPS expansion that has been reported is not in effect in this pack. Do not describe it as open.',
    )
  }
  if (nycha) {
    lines.push(
      '',
      `Section 8 NYCHA payment standards, maximum rent, all utilities included, by the bedroom size printed on the voucher (not the household size). ${cite(nycha, 'Section 8')}:`,
      `- New rentals and transfers: ${list(SECTION8_NEW_RENTAL_ROWS, false)}.`,
    )
    if (nychaRecert) lines.push(`- Annual recertifications, a different column: ${list(SECTION8_RECERT_ROWS, false)}. ${cite(nychaRecert, 'Section 8')}`)
    lines.push(
      `- NYCHA utility allowances are not yet loaded. ${ASK_SPECIALIST} or NYCHA.`,
      '- NYCHA has no SRO or room row, so for an SRO or a room do not give a Section 8 figure. Say to ask the housing specialist.',
      '- NYCHA standards are by voucher bedroom size. Whether a unit smaller or larger than the voucher size changes the limit has not been confirmed. Do not say it does or does not. Say to ask the housing specialist.',
      `- HPD uses ZIP-code payment standards that are not loaded. For HPD, the figure must be one the person typed from their own voucher. ${ASK_SPECIALIST}.`,
    )
    if (isDisplayable(SECTION8_RULES.nychaEpsDiscontinued)) lines.push('- NYCHA discontinued its ZIP-code exception payment standards on July 1, 2026.')
  }
  if (isDisplayable(FARE_RULES.noTenantFee)) {
    lines.push(
      '',
      `Broker fees and the FARE Act (NYC, effective June 11, 2025): a landlord’s agent or listing agent may not charge the tenant a fee for the rental, except a background or credit check, and no one may require the tenant to hire an agent. ${cite(FARE_RULES.noTenantFee, 'NYC FARE Act')}`,
      `- How HRA broker-fee payments work with the FARE Act has not been confirmed. Do not say it has. ${ASK}. If a listing asks the tenant to pay a broker fee, tell them not to pay before they check with the caseworker.`,
      '- Do not cite the state Real Property Law section on landlord fees. It has not been verified in this pack.',
    )
  }
  if (isDisplayable(SECURITY_VOUCHER_RULES.capOneMonth)) {
    lines.push(
      '',
      `HRA security voucher (form W-147N, current version dated 2025-05-07), used for CityFHEPS: HRA does not issue cash deposits. The voucher guarantees up to one month’s rent for unpaid rent or damage, and the landlord has three months after the tenant leaves to claim. It is not honored until it is notarized and authorized by an HRA supervisor. Refusing it in favor of cash may be source-of-income discrimination. ${cite(SECURITY_VOUCHER_RULES.capOneMonth, 'HRA security voucher (W-147N)')}`,
      '- Only this version of the W-147N is verified. Do not name any other form number for broker or security paperwork. The W-147M is the landlord’s broker statement, not a security form.',
    )
  }
  lines.push('', incomeLinesBlock())
  return lines.join('\n')
}
