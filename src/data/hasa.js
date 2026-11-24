// HASA rules (no dollar limits: the renter types their own limit). Never used for CityFHEPS or Section 8.
import { ruleRow } from './sourced.js'

export const HASA_PROGRAM = 'HASA'

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
  // Income: SPSVC-18 says "below 200%" of the federal poverty level (strictly below).
  incomeLimit: ruleRow('hasa-income-limit-200-fpl', 'HASA'),
  hivDiagnosis: ruleRow('hasa-eligibility-hiv-diagnosis', 'HASA'),
}

