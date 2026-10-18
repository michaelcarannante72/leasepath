// Copies the housing specialist's criteria into the app. Usage:
//   node scripts/sync-criteria.mjs [/workspace/criteria] [--checked YYYY-MM-DD]
// The app never reads /workspace at runtime. It reads only src/data/criteria/.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const checkedAt = args.includes('--checked') ? args[args.indexOf('--checked') + 1] : new Date().toISOString().slice(0, 10)
const from = args.find((arg, index) => !arg.startsWith('--') && args[index - 1] !== '--checked') || '/workspace/criteria'
const to = new URL('../src/data/criteria/', import.meta.url).pathname

// Rule rows the app reads. Every id must exist in rules.json, and test/criteria.test.js checks that.
// Left out on purpose: nys-rpl-238a-landlord-fees (statute not re-read), cas-517-form-not-found and
// w147n-prior-versions-not-found (unverified form names). The app does not cite them.
// Rows that are press-only or have no source_url are kept so the app can say "ask your caseworker".
export const USED_RULE_IDS = [
  'hasa-rent-cap-by-bedroom', 'hasa-heat-hot-water-in-lease', 'hasa-utility-deduction', 'hasa-bedroom-size-exceptions',
  'hasa-not-cityfheps', 'hasa-broker-fee-city-pays-brokers', 'hasa-broker-fee-2013-historical-50pct',
  'hasa-security-voucher-use-not-found', 'hasa-superseded-2023-schedule-1br',
  'cityfheps-payment-standards-2026', 'cityfheps-payment-standards-2025', 'cityfheps-bedroom-standard',
  'cityfheps-room-max-rent-1100', 'cityfheps-room-max-two-adults', 'cityfheps-sro-one-adult',
  'cityfheps-utility-allowance', 'cityfheps-landlord-declare-utilities', 'cityfheps-broker-fee-15pct-annual',
  'cityfheps-broker-no-fee-lottery-referral', 'cityfheps-landlord-accepts-security-voucher',
  'cityfheps-shopping-letter-120-days', 'cityfheps-household-share-letter', 'cityfheps-household-share-depends-on-income',
  'cityfheps-household-share-30pct-press', 'cityfheps-expansion-new-hpd-program-pending',
  'section8-agencies', 'section8-not-hra-rules', 'section8-nycha-payment-standards-new-2026',
  'section8-nycha-payment-standards-recert-2026', 'section8-nycha-utility-allowance',
  'section8-hpd-payment-standards-zip', 'section8-nycha-eps-discontinued',
  'w147n-security-voucher-cap-one-month', 'w147n-claim-window-3-months', 'w147n-notarized-supervisor-authorized',
  'w147n-refusal-source-of-income', 'w147m-not-security-form',
  'fare-act-no-tenant-fee-landlord-agent', 'fare-act-no-conditioning-on-agent',
  'hra-broker-fee-fare-interaction-unverified', 'cross-hasa-vs-cityfheps-concurrent-unknown',
  // Income pre-screen: the two 200% of poverty rules are separate rows, with different comparison words.
  'hasa-income-limit-200-fpl', 'hasa-eligibility-hiv-diagnosis',
  'cityfheps-eligibility-community-200fpl', 'cityfheps-eligibility-shelter-200fpl',
]

const rules = JSON.parse(readFileSync(join(from, 'rules.json'), 'utf8'))
const byId = new Map(rules.map((rule) => [rule.id, rule]))
const missing = USED_RULE_IDS.filter((id) => !byId.has(id))
if (missing.length) throw new Error(`rules.json is missing: ${missing.join(', ')}`)

mkdirSync(to, { recursive: true })
for (const file of ['hasa', 'cityfheps-2026', 'cityfheps-2025', 'section8-nycha-2026']) {
  copyFileSync(join(from, 'rent-schedules', `${file}.json`), join(to, `${file}.json`))
}
// HHS poverty guidelines. The file is copied as is, plus one app note so the re-check date travels with the data.
export const POVERTY_RECHECK_NOTE = 'Re-check in January 2027 when new HHS guidelines are published'
const poverty = JSON.parse(readFileSync(join(from, 'poverty-guidelines.json'), 'utf8'))
writeFileSync(join(to, 'poverty-guidelines.json'), `${JSON.stringify({ app_note: POVERTY_RECHECK_NOTE, ...poverty }, null, 2)}\n`)
writeFileSync(join(to, 'rules.json'), `${JSON.stringify(USED_RULE_IDS.map((id) => byId.get(id)), null, 2)}\n`)
writeFileSync(
  join(to, 'meta.json'),
  `${JSON.stringify({ checked: checkedAt, rulesInSource: rules.length, rulesCopied: USED_RULE_IDS.length, note: 'Copied from the housing specialist criteria. The app prints this date as "figures copied on".' }, null, 2)}\n`,
)
console.log(`Copied ${USED_RULE_IDS.length} of ${rules.length} rules, 4 rent schedules, and the poverty guidelines to ${to} (checked ${checkedAt}).`)
