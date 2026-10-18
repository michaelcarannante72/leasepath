// Rules that apply across programs: the FARE Act (broker fees) and the HRA security voucher (W-147N).
// These are notices and checklists. They carry no rent figure.
// The state landlord-fee statute was not re-read by the housing specialist, so nothing here cites it as verified.
import { ruleRow } from './sourced.js'

export const FARE_LABEL = 'NYC FARE Act'
export const SECURITY_VOUCHER_LABEL = 'HRA security voucher (W-147N)'
export const BROKER_STATEMENT_LABEL = 'HRA broker statement (W-147M)'

export const FARE_RULES = {
  noTenantFee: ruleRow('fare-act-no-tenant-fee-landlord-agent'),
  noConditioning: ruleRow('fare-act-no-conditioning-on-agent'),
  interactionUnverified: ruleRow('hra-broker-fee-fare-interaction-unverified'),
}

export const SECURITY_VOUCHER_RULES = {
  capOneMonth: ruleRow('w147n-security-voucher-cap-one-month'),
  claimWindow: ruleRow('w147n-claim-window-3-months'),
  notarized: ruleRow('w147n-notarized-supervisor-authorized'),
  refusal: ruleRow('w147n-refusal-source-of-income'),
  brokerStatement: ruleRow('w147m-not-security-form'),
  cityfhepsLandlordAccepts: ruleRow('cityfheps-landlord-accepts-security-voucher', 'CityFHEPS'),
}

export const CONCURRENT_RULE = ruleRow('cross-hasa-vs-cityfheps-concurrent-unknown')
