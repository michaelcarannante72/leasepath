// Broker fee and security voucher notices, per program. No program here borrows another program's fee.
import { ASK, ASK_SPECIALIST, askFor, moneyExact, money, whoFor } from './rentCheck.js'
import { BROKER_FEE_PERCENT, CITYFHEPS_PROGRAM, CITYFHEPS_RULES } from './data/cityfheps.js'
import { HASA_PROGRAM, HASA_RULES } from './data/hasa.js'
import { SECTION8_PROGRAM } from './data/section8.js'
import { BROKER_STATEMENT_LABEL, FARE_LABEL, FARE_RULES, SECURITY_VOUCHER_LABEL, SECURITY_VOUCHER_RULES } from './data/notices.js'
import { isDisplayable, sourceFor } from './data/sourced.js'

function line(rule, label, text, level = 'note') {
  return isDisplayable(rule) ? { level, text, source: sourceFor(rule, label) } : { level: 'note', text: `${ASK}.` }
}

/** What HRA pays a broker at most under CityFHEPS: 15% of 12 months of rent. Null for a bad rent. */
export function cityfhepsBrokerFeeMax(monthlyRent) {
  const rent = Number(monthlyRent)
  if (!Number.isFinite(rent) || rent <= 0) return null
  return Math.round(rent * 12 * BROKER_FEE_PERCENT) / 100
}

/**
 * Broker fee notices for one program and (optionally) one monthly rent.
 * `tenantFee` is the dollar amount a listing asks the tenant to pay a broker or agent, or 0/undefined if none.
 */
export function brokerFeeNotices(program, monthlyRent, tenantFee = 0) {
  const notices = []
  if (program === CITYFHEPS_PROGRAM) {
    const rule = CITYFHEPS_RULES.brokerFee
    const max = cityfhepsBrokerFeeMax(monthlyRent)
    if (isDisplayable(rule)) {
      notices.push(
        line(
          rule,
          CITYFHEPS_PROGRAM,
          max === null
            ? `CityFHEPS: DSS pays the broker a fee of up to ${BROKER_FEE_PERCENT}% of the annual rent. Brokers should not ask you to pay any additional broker fee.`
            : `CityFHEPS: DSS pays the broker a fee of up to ${BROKER_FEE_PERCENT}% of the annual rent. On ${money(monthlyRent)} a month that is up to ${moneyExact(max)}. Brokers should not ask you to pay any additional broker fee.`,
        ),
      )
    } else notices.push({ level: 'note', text: `${ASK}.` })
    const lottery = CITYFHEPS_RULES.brokerNoFeeLottery
    if (isDisplayable(lottery)) {
      notices.push(line(lottery, CITYFHEPS_PROGRAM, 'CityFHEPS: no broker fee applies to HPD lottery units or centralized homeless-referral units.'))
    }
  } else if (program === HASA_PROGRAM) {
    // The criteria found no HASA fee amount or form, so no figure is shown.
    notices.push(line(HASA_RULES.brokerFee, HASA_PROGRAM, `HASA broker fee: LeasePath has no HASA fee amount. ${ASK}.`))
  } else if (program === SECTION8_PROGRAM) {
    notices.push({ level: 'note', text: `Section 8 broker fee: LeasePath has no figure for Section 8. ${ASK_SPECIALIST}.` })
  } else {
    notices.push({ level: 'note', text: `Pick your program under My voucher. Broker fee rules differ by program. ${ASK}.` })
  }

  if (Number(tenantFee) > 0) {
    notices.push({
      level: 'watch',
      text: `This listing asks you to pay a broker fee of ${money(tenantFee)}. Do not pay it before you check. Under the FARE Act a landlord’s agent may not charge you a fee for the rental, and a voucher program may already pay the broker. ${askFor(program)}.`,
      source: isDisplayable(FARE_RULES.noTenantFee) ? sourceFor(FARE_RULES.noTenantFee, FARE_LABEL) : undefined,
    })
  }
  return notices
}

/** The FARE Act tenant notice. Shown for every program. A rule whose row is not an official sourced row becomes an ask notice. */
export function fareNotices(program = '') {
  const { noTenantFee, noConditioning } = FARE_RULES
  const ask = { level: 'note', text: `${askFor(program)}.` }
  const out = []
  out.push(
    isDisplayable(noTenantFee)
      ? {
          level: 'note',
          text: `If a landlord’s agent or listing agent asks you for a fee for the rental, say so to ${whoFor(program)} and to NYC Consumer and Worker Protection before you pay. The one fee they may still charge is a background or credit check.`,
          source: sourceFor(noTenantFee, FARE_LABEL),
        }
      : ask,
  )
  out.push(
    isDisplayable(noConditioning)
      ? {
          level: 'note',
          text: 'No one may make a rental depend on you hiring an agent. You may still choose to hire your own broker and pay them.',
          source: sourceFor(noConditioning, FARE_LABEL),
        }
      : ask,
  )
  // HRA has not published how its broker fee works with the FARE Act, so there is no definitive claim.
  out.push({
    level: 'note',
    text: `How HRA’s broker fee payments work with the FARE Act has not been confirmed. ${askFor(program)}.`,
  })
  return out
}

/** Security voucher (W-147N). HASA gets no specifics: its use for HASA was not found in official sources. */
export function securityVoucherNotices(program) {
  const r = SECURITY_VOUCHER_RULES
  if (program === HASA_PROGRAM) {
    return [{ level: 'note', text: `HASA security deposit: LeasePath has no HASA security voucher rules. ${ASK}.` }]
  }
  if (program !== CITYFHEPS_PROGRAM) {
    return [{ level: 'note', text: `Security deposit: LeasePath only has the HRA security voucher rules for CityFHEPS. ${program ? `For ${program}, ${askFor(program).toLowerCase()}.` : 'Pick your program under My voucher, then ask your caseworker or housing specialist.'}` }]
  }
  const out = []
  let missing = false
  const add = (rule, label, text, level = 'note') => {
    if (isDisplayable(rule)) out.push({ level, text, source: sourceFor(rule, label) })
    else missing = true
  }
  add(r.cityfhepsLandlordAccepts, CITYFHEPS_PROGRAM, 'CityFHEPS: a landlord must accept the HRA security voucher instead of a cash deposit, with no additional security. The landlord receives the voucher at the key and check exchange.')
  add(r.capOneMonth, SECURITY_VOUCHER_LABEL, 'HRA does not give cash deposits. The security voucher guarantees up to one month’s rent for unpaid rent or damage. A claim cannot be more than the monthly rent on the voucher.')
  add(r.notarized, SECURITY_VOUCHER_LABEL, 'The voucher is not honored until the landlord completes, signs and notarizes both pages and returns them to HRA, and an HRA supervisor authorizes it.')
  add(r.claimWindow, SECURITY_VOUCHER_LABEL, 'The landlord has three months after you move out to send HRA proof and the claim.')
  add(r.refusal, SECURITY_VOUCHER_LABEL, 'If a landlord refuses the security voucher and asks for cash, that may be source-of-income discrimination under the NYC Human Rights Law. Save the message and tell your caseworker or the NYC Commission on Human Rights.', 'watch')
  add(r.brokerStatement, BROKER_STATEMENT_LABEL, 'The W-147M is the landlord’s statement about the broker, used only when a broker fee is requested. It is not the security form.')
  if (missing) out.push({ level: 'note', text: `Some security voucher details could not be shown. ${ASK}.` })
  return out
}

/**
 * The notice shown when the person says a listing asks for a cash deposit. Every program gets one.
 * Only CityFHEPS has sourced security voucher rules. The others get an ask notice with no rule stated.
 */
export function cashDepositNotice(program) {
  if (program === CITYFHEPS_PROGRAM) {
    const rule = SECURITY_VOUCHER_RULES.refusal
    if (!isDisplayable(rule)) return { level: 'note', text: `${ASK}.` }
    return { level: 'watch', text: 'If this listing asks for a cash security deposit, point to the HRA security voucher.', source: sourceFor(rule, SECURITY_VOUCHER_LABEL) }
  }
  if (program === HASA_PROGRAM) {
    return { level: 'note', text: `This listing asks for a cash deposit. LeasePath has no HASA rule on security deposits or vouchers. ${ASK}.` }
  }
  if (program === SECTION8_PROGRAM) {
    return { level: 'note', text: `This listing asks for a cash deposit. LeasePath has no Section 8 deposit rule. ${ASK_SPECIALIST}.` }
  }
  return { level: 'note', text: 'This listing asks for a cash deposit. Pick your program under My voucher. Deposit rules differ by program. Ask your caseworker or housing specialist before you pay.' }
}
