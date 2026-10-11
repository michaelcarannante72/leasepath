import { Icon } from './Icon.jsx'

const TABS = [
  { id: 'search', label: 'Search', icon: 'search' },
  { id: 'steps', label: 'Steps', icon: 'steps' },
  { id: 'assistant', label: 'Assistant', icon: 'spark', center: true },
  { id: 'resources', label: 'Resources', icon: 'heart' },
  { id: 'blog', label: 'Blog', icon: 'blog' },
  { id: 'plan', label: 'My voucher', icon: 'card' },
]

export function Dock({ active, onSelect }) {
  return (
    <nav className="dock" aria-label="Primary">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`${tab.center ? 'dock-center' : 'dock-tab'} ${active === tab.id ? 'is-active' : ''}`}
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
