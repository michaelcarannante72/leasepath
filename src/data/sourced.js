// Shared helpers for the program data modules (hasa.js, cityfheps.js, section8.js).
// These helpers hold no rows. Each program module owns its own rows, and a row is never shared across programs.
import meta from './criteria/meta.json' with { type: 'json' }
import rulesFile from './criteria/rules.json' with { type: 'json' }

export const COPIED_ON = meta.checked

const RULES = new Map(rulesFile.map((rule) => [rule.id, rule]))

/** The date printed on a source document, when the criteria notes give one ("Doc date 2026-01-28"). */
export function documentDate(notes) {
  const match = /doc date (\d{4}-\d{2}-\d{2})/i.exec(String(notes || ''))
  return match ? match[1] : null
}

/** A row can show a number or a specific claim only when it has a source link and is an official source. */
export function isDisplayable(row) {
  return Boolean(row && row.sourceUrl && row.confidence === 'official')
}

function sourceOf(row) {
  return {
    program: row.program,
    document: row.sourceDocNumber || row.sourceTitle || '',
    title: row.sourceTitle || '',
    effectiveDate: row.effectiveDate || null,
    documentDate: row.documentDate || null,
    copiedOn: COPIED_ON,
    url: row.sourceUrl || '',
    confidence: row.confidence,
  }
}

/** Turn a criteria rent-schedule file into rows. Throws if a row belongs to another program. */
export function scheduleRows(program, rows) {
  return rows.map((row) => {
    if (row.program !== program) throw new Error(`${row.scheduleId} row is ${row.program}, not ${program}`)
    return {
      program,
      scheduleId: row.scheduleId,
      unitKind: row.unitKind,
      bedrooms: row.bedrooms,
      householdSize: row.householdSize,
      rentType: row.rentType || null,
      maxRent: row.maxRentAllUtilities,
      allUtilitiesIncluded: true,
      effectiveDate: row.effectiveDate,
      appliesTo: row.appliesTo,
      sourceUrl: row.sourceUrl || '',
      sourceTitle: row.sourceTitle,
      sourceDocNumber: row.sourceDocNumber,
      confidence: row.confidence,
      copiedOn: COPIED_ON,
      notes: row.notes,
    }
  })
}

/** One rule row from rules.json with the fields the UI needs. Throws on an unknown id. */
export function ruleRow(id, program) {
  const rule = RULES.get(id)
  if (!rule) throw new Error(`Unknown criteria rule: ${id}`)
  if (program && rule.program !== program && rule.program !== 'Cross-program') {
    throw new Error(`${id} belongs to ${rule.program}, not ${program}`)
  }
  return {
    id: rule.id,
    program: rule.program,
    text: rule.rule,
    figure: rule.figure,
    unit: rule.unit,
    effectiveDate: rule.effective_date,
    documentDate: documentDate(rule.notes),
    sourceUrl: rule.source_url || '',
    sourceTitle: rule.source_title,
    sourceDocNumber: rule.source_doc_number,
    confidence: rule.confidence,
    copiedOn: COPIED_ON,
    appCheck: rule.app_check,
    notes: rule.notes,
  }
}

/** Source block for the UI. `dateNote` explains an effective date that the criteria mark as not fully confirmed. */
export function sourceFor(row, programLabel, dateNote = '') {
  return { ...sourceOf(row), program: programLabel || row.program, ...(dateNote ? { dateNote } : {}) }
}

export const ALLOWANCE_DATE_NOTE = 'date of the 2026 standards, not confirmed for the allowance schedule'

export function allRuleIds() {
  return [...RULES.keys()]
}
