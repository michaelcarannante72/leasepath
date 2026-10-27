import { Icon } from './Icon.jsx'
import { NAV_TABS } from '../navTabs.js'
import { useLanguage } from './LanguageProvider.jsx'

export function Dock({ active, onSelect }) {
  const { t } = useLanguage()
  return (
    <nav className="dock" aria-label={t('nav.primary')}>
      {NAV_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`${tab.center ? 'dock-center ruby-dock' : 'dock-tab'} ${active === tab.id ? 'is-active' : ''}`}
          aria-current={active === tab.id ? 'page' : undefined}
          onClick={() => onSelect(tab.id)}
        >
          <span className="dock-icon">
            <Icon name={tab.icon} size={tab.center ? 22 : 18} />
          </span>
          <span className="dock-label">{t(`nav.${tab.id === "assistant" ? "ruby" : tab.id === "plan" ? "plan" : tab.id}`)}</span>
        </button>
      ))}
    </nav>
  )
}
