import { useCallback, useEffect, useMemo, useState } from 'react'
import { LanguageContext } from './languageContext.js'
import { applyDocumentLang, readLang, t as translate, writeLang } from '../i18n.js'
import { setTxLang } from '../i18nAuto.js'


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

  // Set before children render so tx() in any component matches this render's language.
  setTxLang(lang)
  const t = useCallback((key, vars) => translate(lang, key, vars), [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

