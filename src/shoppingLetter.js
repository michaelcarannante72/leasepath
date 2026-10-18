// CityFHEPS shopping letter timer. The letter is valid for the number of days in the criteria row (120).
// Dates are calendar dates (YYYY-MM-DD) on the device. The letter date is stored only on this device.
import { SHOPPING_LETTER_DAYS, CITYFHEPS_PROGRAM, CITYFHEPS_RULES } from './data/cityfheps.js'
import { dayNumber, formatDate, fromDayNumber, localToday } from './dates.js'
import { isDisplayable, sourceFor } from './data/sourced.js'

export const LETTER_DAYS = SHOPPING_LETTER_DAYS

/**
 * Counting rule: the issue date is day 0, so the letter is valid through issue date + 120 days.
 * The criteria say "valid 120 days" but not whether the issue date counts as day 1, so the screen tells the user to check the date on the letter.
 */
export function shoppingLetterStatus(issueDate, today = localToday()) {
  const issued = dayNumber(issueDate)
  const now = dayNumber(today)
  if (issued === null || now === null) return { state: 'invalid', days: LETTER_DAYS }
  const expires = issued + LETTER_DAYS
  const elapsed = now - issued
  const daysLeft = expires - now
  const base = { days: LETTER_DAYS, issueDate, expiresOn: fromDayNumber(expires), elapsed, daysLeft }
  if (elapsed < 0) return { ...base, state: 'future' }
  if (daysLeft < 0) return { ...base, state: 'expired', daysAgo: -daysLeft }
  if (daysLeft === 0) return { ...base, state: 'last-day' }
  return { ...base, state: 'active' }
}

export function shoppingLetterMessage(status) {
  switch (status.state) {
    case 'active':
      return `${status.daysLeft} day${status.daysLeft === 1 ? '' : 's'} left. The letter runs through ${formatDate(status.expiresOn)}.`
    case 'last-day':
      return `Today is the last day, ${formatDate(status.expiresOn)}. Ask your worker today about a new letter.`
    case 'expired':
      return `This letter ended ${status.daysAgo} day${status.daysAgo === 1 ? '' : 's'} ago, on ${formatDate(status.expiresOn)}. Ask your worker about a new one.`
    case 'future':
      return 'That date is in the future. Check the issue date on your letter.'
    default:
      return 'Enter the issue date printed on your letter.'
  }
}

/** Short heading for the timer card. */
export function shoppingLetterHeadline(status) {
  switch (status.state) {
    case 'active':
      return `${status.daysLeft} day${status.daysLeft === 1 ? '' : 's'} left`
    case 'last-day':
      return 'Last day'
    case 'expired':
      return 'Letter ended'
    case 'future':
      return 'Date is ahead'
    default:
      return 'Check the date'
  }
}

/** The line under the heading. It does not repeat the heading. */
export function shoppingLetterDetail(status) {
  switch (status.state) {
    case 'active':
      return `The letter runs through ${formatDate(status.expiresOn)}.`
    case 'last-day':
      return `It runs through ${formatDate(status.expiresOn)}. Ask your worker today about a new letter.`
    case 'expired':
      return `It ended on ${formatDate(status.expiresOn)}, ${status.daysAgo} day${status.daysAgo === 1 ? '' : 's'} ago. Ask your worker about a new one.`
    default:
      return shoppingLetterMessage(status)
  }
}

export function shoppingLetterSource() {
  const rule = CITYFHEPS_RULES.shoppingLetter
  return isDisplayable(rule) ? sourceFor(rule, CITYFHEPS_PROGRAM) : null
}
