import { Icon } from './Icon.jsx'
import { NAV_TABS } from '../navTabs.js'

export function Dock({ active, onSelect }) {
  return (
    <nav className="dock" aria-label="Primary">
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
          <span className="dock-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
