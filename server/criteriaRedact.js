// Keeps criteria text that the app never shows out of the browser bundle.
// The section8-agencies rule in the housing specialist's file carries NYCHA voucher and owner counts.
// LeasePath does not show or tell Ruby those counts, so the client bundle drops that rule's text and notes.
// The copy in src/data/criteria/rules.json stays identical to her file.
export const REDACTED_RULE_IDS = ['section8-agencies']
export const COUNT_PATTERN = /107,?979|26,?933|vouchers and over|voucher\/owner counts/i

export function redactRules(rules) {
  return rules.map((rule) => (REDACTED_RULE_IDS.includes(rule.id) ? { ...rule, rule: '', notes: '' } : rule))
}

export function criteriaRedactPlugin() {
  return {
    name: 'leasepath-criteria-redact',
    enforce: 'pre',
    transform(code, id) {
      if (!id.replace(/\\/g, '/').endsWith('/src/data/criteria/rules.json')) return null
      return { code: JSON.stringify(redactRules(JSON.parse(code))), map: null }
    },
  }
}
