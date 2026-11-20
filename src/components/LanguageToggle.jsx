import { useLanguage } from './languageContext.js'

export function LanguageToggle({ className = '' }) {
  const { lang, setLang, t } = useLanguage()
  const next = lang === 'es' ? 'en' : 'es'
  const label = t(next === 'es' ? 'lang.es' : 'lang.en')
  return (
    <button
      type="button"
      className={`lang-toggle ${className}`.trim()}
      onClick={() => setLang(next)}
      aria-label={label}
      title={t('lang.label')}
    >
      {label}
    </button>
  )
}

/** Visible English / Español switch. Works even when the header toggle is off. */
export function LanguageSwitch({ className = '' }) {
  const { lang, setLang, t } = useLanguage()
  return (
    <div className={`lang-switch ${className}`.trim()} role="group">
      <span className="sr-only">{t('lang.label')}</span>
      <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>{t('lang.en')}</button>
      <button type="button" aria-pressed={lang === 'es'} onClick={() => setLang('es')}>{t('lang.es')}</button>
    </div>
  )
}
