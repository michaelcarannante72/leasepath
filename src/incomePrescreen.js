// Income pre-screen against 200% of the federal poverty level. A hint only. DSS/HRA decide.
// HASA and CityFHEPS are two separate checks. They use the same federal table but their own rule row, their own
// comparison (HASA: below, CityFHEPS: at or below), and their own wording. Neither result is ever used for the other.
import { HASA_PROGRAM, HASA_RULES } from './data/hasa.js'
import { CITYFHEPS_PROGRAM, CITYFHEPS_RULES } from './data/cityfheps.js'
import { monthlyMax, povertyLine, povertySource } from './data/poverty.js'
import { isDisplayable, sourceFor } from './data/sourced.js'
import { askFor, isLargeHousehold, money } from './rentCheck.js'

export const PRESCREEN_TITLE = 'Income pre-screen'
export const PRESCREEN_NOTE = 'This is a pre-screen only. LeasePath does not decide who qualifies. Your caseworker and DSS/HRA decide.'
export const PRESCREEN_EXPLAIN =
  'A pre-screen is a quick early look at one number. It is not an application and not an approval. Your caseworker and DSS/HRA look at your whole situation and make the decision.'
export const PRESCREEN_TWICE = 'About twice the federal poverty income for your household size.'
export const INCOME_LABEL = 'Enter your gross household income before deductions'
export const INCOME_HINT = 'Whole dollars only. Cents are not used, and the amount cannot be negative.'
export const PRESCREEN_PERIODS = ['month', 'year']
export const INCOME_MAX_DIGITS = 7

/** Each program's own rule rows and its own comparison. `inclusive` means income equal to the line still passes. */
export const PRESCREEN_PROGRAMS = {
  [HASA_PROGRAM]: {
    program: HASA_PROGRAM,
    inclusive: false,
    word: 'below',
    rules: [HASA_RULES.incomeLimit],
    also: HASA_RULES.hivDiagnosis,
  },
  [CITYFHEPS_PROGRAM]: {
    program: CITYFHEPS_PROGRAM,
    inclusive: true,
    word: 'at or below',
    rules: [CITYFHEPS_RULES.incomeCommunity, CITYFHEPS_RULES.incomeShelter],
  },
}

export const PRESCREEN_ORDER = [HASA_PROGRAM, CITYFHEPS_PROGRAM]

export function isPrescreenProgram(program) {
  return Object.hasOwn(PRESCREEN_PROGRAMS, program)
}

/**
 * Read what the person typed.
 *   { status: 'empty' }                nothing typed
 *   { status: 'invalid' }              a negative, letters, or a number that is not a plain amount
 *   { status: 'ok', dollars }          whole dollars. Cents are dropped ("2,660.50" is 2660, never 266050)
 */
export function parseIncome(value) {
  const text = String(value ?? '').replace(/[\s$,]/g, '')
  if (text === '') return { status: 'empty' }
  const match = /^(\d+)(?:\.(\d*))?$/.exec(text)
  if (!match) return { status: 'invalid' }
  const whole = match[1].replace(/^0+(?=\d)/, '')
  if (whole.length > INCOME_MAX_DIGITS) return { status: 'invalid' }
  return { status: 'ok', dollars: Number(whole) }
}

/** What is kept on the device for the income box: only the characters an amount can have. */
export function storedIncome(value) {
  return typeof value === 'string' ? value.replace(/[^\d.,$\s-]/g, '').slice(0, 14) : ''
}

export function incomePeriod(value) {
  return value === 'year' ? 'year' : 'month'
}

/** Yearly income for the comparison, or null when the amount is empty or not valid. The check always runs on yearly figures. */
export function annualIncome(amount, period) {
  const parsed = parseIncome(amount)
  if (parsed.status !== 'ok') return null
  return incomePeriod(period) === 'year' ? parsed.dollars : parsed.dollars * 12
}

const MIN_WAGE_NOTE =
  'DSS-7n says a single adult who earns minimum wage and works 35 or more hours a week may be over the line and still be eligible.'

function ruleSources(config) {
  return config.rules.filter(isDisplayable).map((rule) => sourceFor(rule, config.program))
}

/** The yearly line first, then the largest monthly amount that passes, rounded down and never up. */
function lineSentence(config, line) {
  const people = `${line.householdSize} ${line.householdSize === 1 ? 'person' : 'people'}`
  const yearly = money(line.annual)
  const monthly = `${money(monthlyMax(line.annual, config.inclusive))} a month or less`
  const limit = config.inclusive ? `${yearly} a year (${monthly})` : `${yearly} a year, and your income must be under it (${monthly})`
  return `${config.program} says ${config.word} 200% of the federal poverty level. For ${people}, the ${povertySource().program} put that line at ${limit}. LeasePath compares your income for the year with the yearly figure.`
}

/**
 * One program's income pre-screen.
 * input: { household, income, period }. `income` is what the person typed, "" when not entered.
 * status: 'ask' (a household of 9 or more: no line, no result), 'missing' (an input is not entered),
 *         'invalid' (the income is not a valid amount), 'unavailable' (the program rule is not an official sourced row),
 *         'under', 'at' (equal to the line, allowed only for CityFHEPS), or 'over'.
 * No status is ever a rejection. 'over' always says to ask the caseworker.
 */
export function incomePrescreen(program, input = {}) {
  const config = PRESCREEN_PROGRAMS[program]
  if (!config) return { program, status: 'unavailable', headline: `${askFor(program)}.`, details: [], sources: [] }
  const sources = ruleSources(config)
  if (sources.length !== config.rules.length) {
    return { program, status: 'unavailable', headline: `${askFor(program)}.`, details: [], sources: [] }
  }

  // A household of 9 or more is not in the table the app copied. Show no line and no result.
  if (isLargeHousehold(input.household)) {
    return { program, status: 'ask', headline: `LeasePath shows no income pre-screen for a household of 9 or more. ${askFor(program)}.`, details: [], sources: [] }
  }

  const parsed = parseIncome(input.income)
  const line = povertyLine(input.household)
  if (parsed.status === 'invalid') {
    return { program, status: 'invalid', headline: 'Enter a valid amount in whole dollars, with no minus sign and no letters. For example 2660.', details: [], sources: [] }
  }
  const missing = []
  if (!line) missing.push('the number of people in your household')
  if (parsed.status === 'empty') missing.push('your gross household income before deductions')
  if (missing.length) {
    return { program, status: 'missing', headline: `To see the ${program} pre-screen, enter ${missing.join(' and ')}.`, missing, details: [], sources: [] }
  }

  const annual = annualIncome(input.income, input.period)
  const limit = line.annual
  const equal = annual === limit
  const passes = config.inclusive ? annual <= limit : annual < limit
  const status = passes ? (equal ? 'at' : 'under') : 'over'

  let headline
  if (status === 'under') {
    headline = 'Your income is under the 200% pre-screen line. This is not an approval; DSS/HRA decides.'
  } else if (status === 'at') {
    headline = `Your income is exactly at the 200% pre-screen line. ${program} says at or below the line, so this is within it. This is not an approval; DSS/HRA decides.`
  } else if (equal) {
    headline = `Your income is exactly at the 200% pre-screen line. ${program} says below the line, so you may not qualify. ${askFor(program)}.`
  } else {
    headline = `Your income is over the 200% pre-screen line, so you may not qualify. ${askFor(program)}.`
  }

  const details = [PRESCREEN_TWICE, lineSentence(config, line)]
  if (program === HASA_PROGRAM) {
    // The diagnosis and residence rule is stated only when its own row is an official sourced row.
    const also = isDisplayable(config.also)
    details.push(
      also
        ? 'This checks income only. HASA also requires a diagnosis of HIV illness or AIDS and living in New York City, and the HASA caseworker decides. LeasePath does not ask about health.'
        : 'This checks income only. HASA has other requirements, and the HASA caseworker decides.',
    )
    if (also) sources.push(sourceFor(config.also, config.program))
  } else {
    details.push('This checks income only. CityFHEPS has other requirements, and DSS decides which situation applies to you.')
    if (status === 'over') details.push(MIN_WAGE_NOTE)
  }
  return { program, status, headline, details, line, annual, passes, sources, inclusive: config.inclusive }
}
