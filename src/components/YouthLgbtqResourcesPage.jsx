import { RESOURCES, SOURCES } from '../data/youthLgbtqResources.js'
import { Icon } from './Icon.jsx'

function telHref(phone) {
  return `tel:${String(phone).replace(/\D/g, '')}`
}

export function YouthLgbtqResourcesPage() {
  return (
    <article className="page youth-lgbtq">
      <p className="eyebrow">Youth</p>
      <h1>Youth and LGBTQ+ housing help</h1>
      <p className="lede">
        Runaway and homeless youth shelters (DYCD), LGBTQ+-affirming programs listed by the city, and ACS housing help for youth leaving foster care.
        Phones are copied from the official pages named on each card. You may qualify — the agency or provider decides. LeasePath never collects medical information.
      </p>

      <ul className="youth-list">
        {RESOURCES.map((item) => {
          const source = SOURCES[item.sourceId]
          return (
            <li key={item.id} className="youth-card">
              <h2>{item.title}</h2>
              <p>{item.body}</p>
              <div className="card-actions">
                {(item.phones || []).map((phone) => (
                  <a key={phone.number} className="card-call" href={telHref(phone.number)}>
                    Call {phone.number}
                  </a>
                ))}
                <a className="card-link" href={item.href} target="_blank" rel="noreferrer">
                  Official page <Icon name="external" size={14} />
                </a>
              </div>
              {source ? (
                <p className="fine">
                  Source:{' '}
                  <a href={source.href} target="_blank" rel="noreferrer">{source.label}</a>
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>

      <p className="fine">
        If you are in immediate danger, call 911. For city services, call 311. Resources tab stays open for everyone.
      </p>
      <p className="card-actions">
        <a className="button" href="#/resources">Resources</a>
        <a className="button button-quiet" href="#/know-your-rights">Know your rights</a>
      </p>
    </article>
  )
}
