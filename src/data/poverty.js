// 2026 HHS poverty guidelines (48 contiguous states and DC, which apply to New York), copied from the housing
// specialist's poverty-guidelines.json. These are federal figures. DSS and HRA do not print dollar figures or a year in
// the HASA or CityFHEPS documents, so the app never says DSS or HRA confirmed them.
// Only the 100% annual figures and the per-person step come from the notice. The 200% and monthly figures are
// computed from them (200% = 2 x the 100% annual; monthly = annual / 12) in the specialist's file.
import guidelines from './criteria/poverty-guidelines.json' with { type: 'json' }
import { COPIED_ON } from './sourced.js'

export const POVERTY_YEAR = guidelines.year
export const POVERTY_LABEL = `${guidelines.year} HHS poverty guidelines`
export const POVERTY_EFFECTIVE_DATE = guidelines.effective_date
export const POVERTY_PUBLISHED_DATE = guidelines.publication_date
export const POVERTY_SOURCE_URL = guidelines.source_url
export const POVERTY_RECHECK_NOTE = guidelines.app_note

/**
 * Household sizes 1 to 8. The yearly 200% figure is what the check uses. `monthlyFloor` is the monthly figure rounded
 * down, the only monthly figure ever shown ("or less"). `monthlyRounded` rounds to the nearest dollar, overstates the
 * line for sizes 2, 5 and 8, and is never shown or used in a check.
 */
export const POVERTY_ROWS = guidelines.rows.map((row) => ({
  householdSize: row.household_size,
  annual100: row.fpl_100_annual,
  annual200: row.fpl_200_annual,
  monthlyFloor: row.fpl_200_monthly_floor,
  monthlyRounded: row.fpl_200_monthly,
}))

export const POVERTY_PER_ADDITIONAL = {
  annual200: guidelines.per_additional_person.fpl_200_annual,
}

export const POVERTY_NOTES = guidelines.notes

/** The source block the screens print next to every poverty figure. */
export function povertySource() {
  return {
    program: POVERTY_LABEL,
    document: '91 FR 1797 (FR Doc. 2026-00755)',
    effectiveDate: POVERTY_EFFECTIVE_DATE,
    dateNote: 'published January 15, 2026. A program office may set a different effective date. DSS and HRA have not confirmed these dollar figures or the year',
    copiedOn: COPIED_ON,
    url: POVERTY_SOURCE_URL,
    confidence: guidelines.confidence,
  }
}

/**
 * The 200% line for one household size, 1 to 8 only. Returns null for any other size, including 9 or more.
 * No screen and no assistant text shows a figure for 9 or more.
 */
export function povertyLine(size) {
  const count = Number(size)
  if (!Number.isInteger(count) || count < 1) return null
  const row = POVERTY_ROWS.find((item) => item.householdSize === count)
  return row ? { householdSize: count, annual: row.annual200, monthlyFloor: row.monthlyFloor } : null
}

/**
 * The largest whole-dollar monthly income that passes at a yearly line. Monthly x 12 is compared with the yearly line, so
 * this is exact. HASA needs income strictly below the line, so a monthly income whose year equals the line does not pass.
 * CityFHEPS allows income at or below the line. For sizes 1, 4 and 7 the two differ by one dollar.
 */
export function monthlyMax(annual, inclusive) {
  return Math.floor((inclusive ? annual : annual - 1) / 12)
}

/**
 * The size-8 figure plus the per-person step, as the notice describes for larger households.
 * NOT used by any screen or by the assistant, because a household of 9 or more is sent to the caseworker.
 * Kept only so tests can pin the step in the data file.
 */
export function extendedPovertyLine(size) {
  const count = Number(size)
  if (!Number.isInteger(count) || count < 9) return null
  const last = POVERTY_ROWS[POVERTY_ROWS.length - 1]
  const extra = count - last.householdSize
  const annual = last.annual200 + extra * POVERTY_PER_ADDITIONAL.annual200
  return { householdSize: count, annual, monthlyFloor: Math.floor(annual / 12), extraPeople: extra }
}
