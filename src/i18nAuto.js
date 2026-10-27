// Spanish for UI text written in English in the components. The English text is the key, so
// source stays readable: {tx("Back to Resources")}. LanguageProvider sets the active language on
// every render; App re-renders the tree when the language toggles.
import { UI_ES } from './i18nUi.es.js'
import { readLang } from './i18n.js'

let active = readLang()

export function setTxLang(lang) {
  active = lang === 'es' ? 'es' : 'en'
}

export function txLang() {
  return active
}

/** Translate an English UI string; {name} placeholders are filled from vars. */
export function tx(en, vars) {
  const text = active === 'es' && UI_ES[en] ? UI_ES[en] : en
  return vars ? text.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`)) : text
}

export { UI_ES }
