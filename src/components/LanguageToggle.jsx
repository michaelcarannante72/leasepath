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
