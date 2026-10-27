import { useLanguage } from './LanguageProvider.jsx'

export function LanguageToggle({ className = '' }) {
  const { lang, setLang, t } = useLanguage()
  const next = lang === 'es' ? 'en' : 'es'
  return (
    <button
      type="button"
      className={`lang-toggle ${className}`.trim()}
      onClick={() => setLang(next)}
      aria-label={t('lang.label')}
      title={t('lang.label')}
    >
      {t(next === 'es' ? 'lang.es' : 'lang.en')}
    </button>
  )
}
