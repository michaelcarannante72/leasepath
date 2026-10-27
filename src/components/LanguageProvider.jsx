import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { applyDocumentLang, readLang, t as translate, writeLang } from '../i18n.js'

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key, vars) => translate('en', key, vars),
})

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => readLang())

  useEffect(() => {
    applyDocumentLang(lang)
  }, [lang])

  const setLang = useCallback((next) => {
    const value = writeLang(next)
    setLangState(value)
    applyDocumentLang(value)
  }, [])

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  return useContext(LanguageContext)
}
