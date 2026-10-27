import { createContext, useContext } from 'react'
import { t as translate } from '../i18n.js'

/** Language context; LanguageProvider.jsx supplies the value. Kept apart so that file only exports a component. */
export const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key, vars) => translate('en', key, vars),
})

export function useLanguage() {
  return useContext(LanguageContext)
}
