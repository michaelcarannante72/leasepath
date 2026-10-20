import { RESOURCES } from '../data.js'
import { Icon } from './Icon.jsx'
import { PantryFinder } from './PantryFinder.jsx'

export function ResourcesPage() {
  const groups = [...new Set(RESOURCES.map((item) => item.group))]
  return (
    <div className="page">
      <p className="eyebrow">Resources</p>
      <h1>Open resources for a HASA voucher</h1>
      <p className="lede">No sign-in. This list is for a household that already has HASA rental assistance. It includes the food box, pantries, SNAP, and the other city programs next to that voucher. The agency site is where the rule lives.</p>
      <p className="after-link"><a href="#/after-you-find#chap">Coming 2027: CHAP, a new city voucher (press reporting)</a> · <a href="#/after-you-find">After you find an apartment</a></p>
      <PantryFinder />
      {groups.map((group) => (
        <section key={group} className="resource-group">
          <h2>{group}</h2>
          <ul className="resource-list">
            {RESOURCES.filter((item) => item.group === group).map((item) => (
              <li key={item.title}>
                <a href={item.href} target={item.href.startsWith('tel:') ? undefined : '_blank'} rel="noreferrer">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                  <em>{item.action} <Icon name="external" size={14} /></em>
                </a>
                {item.more && (
                  <a className="resource-more" href={item.more.href} target="_blank" rel="noreferrer">{item.more.label} <Icon name="external" size={14} /></a>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
