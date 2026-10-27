import { useLanguage } from './languageContext.js'
import { IncomePrescreen } from './IncomePrescreen.jsx'
import { MatchAlertsCard } from './MatchAlertsCard.jsx'

function BackToPlan() {
  const { t } = useLanguage()
  return <p className="page-back"><a href="#/plan">{t('plan.back')}</a></p>
}

/** Match alerts moved out of My voucher into its own page; same card, same props. */
export function MatchAlertsPage({ prefs, onPrefs, seed }) {
  const { t } = useLanguage()
  return (
    <article className="page">
      <BackToPlan />
      <p className="eyebrow">{t('plan.eyebrow')}</p>
      <h1>{t('plan.tool.match')}</h1>
      {prefs && onPrefs ? <MatchAlertsCard prefs={prefs} onPrefs={onPrefs} seed={seed} /> : null}
    </article>
  )
}

/** Income pre-screen moved out of My voucher into its own page; same component, same props. */
export function IncomeCheckPage({ plan, checks, onChecks, onClear }) {
  const { t } = useLanguage()
  return (
    <article className="page">
      <BackToPlan />
      <p className="eyebrow">{t('plan.eyebrow')}</p>
      <h1>{t('plan.tool.income')}</h1>
      <IncomePrescreen plan={plan} checks={checks} onChecks={onChecks} onClear={onClear} />
    </article>
  )
}
