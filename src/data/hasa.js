// HASA rent data. HASA is its own program: these rows are never used for CityFHEPS or Section 8.
import schedule from './criteria/hasa.json' with { type: 'json' }
import { ruleRow, scheduleRows } from './sourced.js'

export const HASA_PROGRAM = 'HASA'

/** HRA Special Services guidelines, effective 2025-09-10 (SPSVC-17). Maximum rent, all utilities included. */
export const HASA_ROWS = scheduleRows(HASA_PROGRAM, schedule)

export const HASA_RULES = {
  rentCap: ruleRow('hasa-rent-cap-by-bedroom', 'HASA'),
  heatHotWater: ruleRow('hasa-heat-hot-water-in-lease', 'HASA'),
  utilityDeduction: ruleRow('hasa-utility-deduction', 'HASA'),
  bedroomExceptions: ruleRow('hasa-bedroom-size-exceptions', 'HASA'),
  notCityfheps: ruleRow('hasa-not-cityfheps', 'HASA'),
  brokerFee: ruleRow('hasa-broker-fee-city-pays-brokers', 'HASA'),
  // Historical press release (2013). Kept only so a test can prove the app does not use it.
  brokerFee2013: ruleRow('hasa-broker-fee-2013-historical-50pct', 'HASA'),
  securityVoucher: ruleRow('hasa-security-voucher-use-not-found', 'HASA'),
  superseded2023: ruleRow('hasa-superseded-2023-schedule-1br', 'HASA'),
  // Income: SPSVC-18 says "below 200%" of the federal poverty level (strictly below).
  incomeLimit: ruleRow('hasa-income-limit-200-fpl', 'HASA'),
  hivDiagnosis: ruleRow('hasa-eligibility-hiv-diagnosis', 'HASA'),
}

/** The 1BR amount on the superseded 1/1/2023 HASA letter, read from the criteria row. */
export const HASA_SUPERSEDED_1BR = Number(HASA_RULES.superseded2023.figure)

export function hasaRow(listing) {
  if (!listing) return null
  if (listing.unitKind === 'studio') return HASA_ROWS.find((row) => row.unitKind === 'studio') || null
  if (listing.unitKind !== 'apartment') return null
  return HASA_ROWS.find((row) => row.unitKind === 'apartment' && row.bedrooms === listing.bedrooms) || null
}
