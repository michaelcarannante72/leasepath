// CityFHEPS rent data. CityFHEPS is its own program: these rows are never used for HASA or Section 8,
// even where a dollar figure happens to match.
import schedule2026 from './criteria/cityfheps-2026.json' with { type: 'json' }
import schedule2025 from './criteria/cityfheps-2025.json' with { type: 'json' }
import { ruleRow, scheduleRows } from './sourced.js'

export const CITYFHEPS_PROGRAM = 'CityFHEPS'

/** DSS-8r payment standards, effective 2026-04-01. Maximum rent, all utilities included. */
export const CITYFHEPS_2026_ROWS = scheduleRows(CITYFHEPS_PROGRAM, schedule2026)

/**
 * Historical column, no effective date in the source. Only for packages submitted through 2026-02-28.
 * The app never uses it for a current check. It is exported so tests can prove that.
 */
export const CITYFHEPS_2025_HISTORICAL_ROWS = scheduleRows(CITYFHEPS_PROGRAM, schedule2025)

export const CITYFHEPS_RULES = {
  standards2026: ruleRow('cityfheps-payment-standards-2026', 'CityFHEPS'),
  standards2025: ruleRow('cityfheps-payment-standards-2025', 'CityFHEPS'),
  bedroomStandard: ruleRow('cityfheps-bedroom-standard', 'CityFHEPS'),
  // Income: DSS-7r (community) and DSS-7n (shelter) both say "at or below" 200% of the federal poverty level.
  incomeCommunity: ruleRow('cityfheps-eligibility-community-200fpl', 'CityFHEPS'),
  incomeShelter: ruleRow('cityfheps-eligibility-shelter-200fpl', 'CityFHEPS'),
  roomMax: ruleRow('cityfheps-room-max-rent-1100', 'CityFHEPS'),
  roomTwoAdults: ruleRow('cityfheps-room-max-two-adults', 'CityFHEPS'),
  sroOneAdult: ruleRow('cityfheps-sro-one-adult', 'CityFHEPS'),
  utilityAllowance: ruleRow('cityfheps-utility-allowance', 'CityFHEPS'),
  landlordDeclaresUtilities: ruleRow('cityfheps-landlord-declare-utilities', 'CityFHEPS'),
  brokerFee: ruleRow('cityfheps-broker-fee-15pct-annual', 'CityFHEPS'),
  brokerNoFeeLottery: ruleRow('cityfheps-broker-no-fee-lottery-referral', 'CityFHEPS'),
  acceptsSecurityVoucher: ruleRow('cityfheps-landlord-accepts-security-voucher', 'CityFHEPS'),
  shoppingLetter: ruleRow('cityfheps-shopping-letter-120-days', 'CityFHEPS'),
  householdShareLetter: ruleRow('cityfheps-household-share-letter', 'CityFHEPS'),
  householdShareDepends: ruleRow('cityfheps-household-share-depends-on-income', 'CityFHEPS'),
  // Press-only rows. Present so tests can prove the app does not hard-code them.
  householdShare30Press: ruleRow('cityfheps-household-share-30pct-press', 'CityFHEPS'),
  expansionPending: ruleRow('cityfheps-expansion-new-hpd-program-pending', 'CityFHEPS'),
}

/** Room maximum, from the criteria row. NYC only, utilities included. */
export const CITYFHEPS_ROOM_MAX = Number(CITYFHEPS_RULES.roomMax.figure)

/** Days a shopping letter is valid, from the criteria row. */
export const SHOPPING_LETTER_DAYS = Number(CITYFHEPS_RULES.shoppingLetter.figure)

/** Share of annual rent HRA pays a broker at most, from the criteria row (15). */
export const BROKER_FEE_PERCENT = Number(CITYFHEPS_RULES.brokerFee.figure)

/**
 * Utility allowance examples. The criteria only list six 1-bedroom examples (2026). They are parsed from the rule text,
 * so the numbers come from the criteria and are not typed in again. Every other bedroom size is not loaded.
 */
export const CITYFHEPS_UTILITY_ALLOWANCES_1BR = (() => {
  const rule = CITYFHEPS_RULES.utilityAllowance
  const list = /1BR\):\s*(.*\$\d+)/.exec(rule.text)?.[1] || ''
  return list
    .split(';')
    .map((part) => /^\s*(.+?)\s+\$(\d+)\s*$/.exec(part))
    .filter(Boolean)
    .map((match) => ({
      program: CITYFHEPS_PROGRAM,
      bedrooms: 1,
      label: match[1],
      amount: Number(match[2]),
      effectiveDate: rule.effectiveDate,
      sourceUrl: rule.sourceUrl,
      sourceDocNumber: rule.sourceDocNumber,
      sourceTitle: rule.sourceTitle,
      confidence: rule.confidence,
      copiedOn: rule.copiedOn,
      effectiveDateConfirmed: false,
    }))
})()
