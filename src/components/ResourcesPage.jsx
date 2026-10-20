import { RESOURCES } from '../data.js'
import { Icon } from './Icon.jsx'
import { PantryFinder } from './PantryFinder.jsx'
import { FREE_FOOD, FREE_FOOD_CAUTION, FREE_FOOD_LABEL, FREE_FOOD_TITLE, LAST_CHECKED } from '../freeFood.js'

export function ResourcesPage() {
  const groups = [...new Set(RESOURCES.map((item) => item.group))]
  return (
    <div className="page">
      <p className="eyebrow">Resources</p>
      <h1>Open resources for a HASA voucher</h1>
      <p className="lede">No sign-in. This list is for a household that already has HASA rental assistance. It includes the food box, pantries, SNAP, and the other city programs next to that voucher. The agency site is where the rule lives.</p>
      <p className="after-link"><a href="#/after-you-find#chap">Coming 2027: CHAP, a new city voucher (press reporting)</a> · <a href="#/after-you-find">After you find an apartment</a></p>
      <PantryFinder />
      <section className="resource-group free-food" aria-labelledby="free-food-title">
        <h2 id="free-food-title">{FREE_FOOD_TITLE}</h2>
        <p className="free-food-label">{FREE_FOOD_LABEL}</p>
        <ul className="resource-list">
          {FREE_FOOD.map((item) => (
            <li key={item.name} className="free-food-card">
              <strong>{item.name}</strong>
              {item.group !== item.name && <span>Run by {item.group}</span>}
              <dl>
                <div><dt>When</dt><dd>{item.when}</dd></div>
                <div><dt>Where</dt><dd>{item.where}</dd></div>
                <div><dt>What</dt><dd>{item.offers}</dd></div>
                {item.centers && <div><dt>Centers</dt><dd>{item.centers}</dd></div>}
              </dl>
              {item.note && <p className="free-food-note">{item.note}</p>}
              <p className="free-food-caution">{FREE_FOOD_CAUTION} Last checked {LAST_CHECKED}.</p>
            </li>
          ))}
        </ul>
      </section>
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
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
