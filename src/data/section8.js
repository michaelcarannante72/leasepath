// Section 8 rent data. Section 8 is federal, run by a housing authority (NYCHA or HPD), not by HRA/DSS.
// Only NYCHA payment standards are loaded. HPD uses ZIP-code standards that are not in the criteria.
import schedule from './criteria/section8-nycha-2026.json' with { type: 'json' }
import { ruleRow, scheduleRows } from './sourced.js'

export const SECTION8_PROGRAM = 'Section 8'

export const SECTION8_NYCHA_ROWS = scheduleRows(SECTION8_PROGRAM, schedule)

export const SECTION8_NEW_RENTAL_ROWS = SECTION8_NYCHA_ROWS.filter((row) => row.rentType === 'new-rental-or-transfer')
export const SECTION8_RECERT_ROWS = SECTION8_NYCHA_ROWS.filter((row) => row.rentType === 'annual-recertification')

export const SECTION8_RULES = {
  agencies: ruleRow('section8-agencies', 'Section 8'),
  notHraRules: ruleRow('section8-not-hra-rules', 'Section 8'),
  nychaNew: ruleRow('section8-nycha-payment-standards-new-2026', 'Section 8'),
  nychaRecert: ruleRow('section8-nycha-payment-standards-recert-2026', 'Section 8'),
  nychaUtilityAllowance: ruleRow('section8-nycha-utility-allowance', 'Section 8'),
  hpdStandards: ruleRow('section8-hpd-payment-standards-zip', 'Section 8'),
  nychaEpsDiscontinued: ruleRow('section8-nycha-eps-discontinued', 'Section 8'),
}

export const SECTION8_AGENCIES = ['NYCHA', 'HPD']

/** NYCHA new-rental standard for a voucher bedroom size (0 = studio). The size comes from the voucher, not the household. */
export function nychaNewRentalRow(voucherBedrooms) {
  if (voucherBedrooms === '' || voucherBedrooms === null || voucherBedrooms === undefined) return null
  const bedrooms = Number(voucherBedrooms)
  if (!Number.isInteger(bedrooms)) return null
  return SECTION8_NEW_RENTAL_ROWS.find((row) => row.bedrooms === bedrooms) || null
}
