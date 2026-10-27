import { Building } from './Building.jsx'
import { Icon } from './Icon.jsx'
import { LandingHero, LandingSteps } from './LandingHero.jsx'
import { ACCESS_HRA_URL, BOROUGHS, HOMEBASE_URL } from '../data.js'
import { VoucherReadyUnits } from './VoucherReadyUnits.jsx'
import { PROGRAMS, cardFlags, cardLabel, cardText, money, sizeLabel, utilityLabel } from '../fit.js'

const SORT_LABELS = {
  'rent-asc': 'Rent, low to high',
  'rent-desc': 'Rent, high to low',
  neighborhood: 'Neighborhood',
}

const APPLY_DOORS = [
  {
    href: ACCESS_HRA_URL,
    title: 'ACCESS HRA',
    detail: 'Cash Assistance and SNAP. Many rent supplements start here.',
  },
  {
    href: HOMEBASE_URL,
    title: 'Homebase',
    detail: 'A community application for CityFHEPS or FHEPS.',
  },
  {
    href: 'tel:718-557-1399',
    title: 'HASA ServiceLine',
    detail: '718-557-1399, weekdays 9am to 5pm. A new HASA application is by phone.',
  },
]

function activeChips(filters) {
  const chips = []
  if (filters.q.trim()) chips.push({ key: 'q', label: filters.q.trim(), patch: { q: '' } })
  if (filters.beds !== 'Any') chips.push({ key: 'beds', label: filters.beds === '1' || filters.beds === '2' || filters.beds === '3' ? `${filters.beds} bedroom` : filters.beds, patch: { beds: 'Any' } })
  if (filters.borough !== 'All') chips.push({ key: 'borough', label: filters.borough, patch: { borough: 'All' } })
  if (filters.maxRent) chips.push({ key: 'maxRent', label: `Up to ${money(filters.maxRent)}`, patch: { maxRent: '' } })
  if (filters.program !== 'All') chips.push({ key: 'program', label: filters.program, patch: { program: 'All' } })
  if (filters.sort !== 'rent-asc') chips.push({ key: 'sort', label: SORT_LABELS[filters.sort] || 'Sort', patch: { sort: 'rent-asc' } })
  if (filters.savedOnly) chips.push({ key: 'savedOnly', label: 'Saved only', patch: { savedOnly: false } })
  return chips
}

function ApplyPanel() {
  return (
    <section className="apply-panel">
      <h2>Start the application in the right place</h2>
      <p>LeasePath cannot tell you whether you qualify. These are the city doors for a new case.</p>
      <ul className="apply-doors">
        {APPLY_DOORS.map((door) => (
          <li key={door.href}>
            <a className="apply-card" href={door.href} target={door.href.startsWith('tel:') ? undefined : '_blank'} rel={door.href.startsWith('tel:') ? undefined : 'noreferrer'}>
              <strong>{door.title}</strong>
              <span>{door.detail}</span>
              <em>{door.href.startsWith('tel:') ? 'Call' : 'Open'} <Icon name="external" size={14} /></em>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function SearchPage({
  listings,
  total,
  filters,
  onChange,
  saved,
  onToggleSave,
  onOpen,
  planFlags,
  intent,
  onIntent,
  onAsk,
}) {
  const chips = activeChips(filters)
  const savedCount = saved.length

  const showApartments = (event) => {
    event.preventDefault()
    const results = document.getElementById('search-results')
    const stage = results?.closest('.stage')
    if (!results || !stage) return
    const top = results.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 8
    stage.scrollTo({ top, behavior: 'smooth' })
  }

  const scrollToSearch = () => {
    const panel = document.querySelector('.landing-hero')
    const stage = panel?.closest('.stage')
    if (!panel || !stage) return
    const top = panel.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 8
    stage.scrollTo({ top, behavior: 'smooth' })
    panel.querySelector('input')?.focus({ preventScroll: true })
  }

  return (
    <div className="landing">
      <LandingHero onCheck={scrollToSearch} />
      <LandingSteps onFind={scrollToSearch} onAsk={onAsk} />
      <VoucherReadyUnits compact />
      <section className="landing-hero" aria-labelledby="search-title">
        <div className="hero-copy">
          <h2 id="search-title" className="search-title">Search apartments</h2>
          <p className="pitch">Brokers who say “I’ll call you back” and then transfer you are the reason this exists.</p>
          <div className="program-chips" role="group" aria-label="Filter by voucher">
            {PROGRAMS.map((program) => (
              <button
                key={program}
                type="button"
                className={`program-chip${filters.program === program ? ' is-on' : ''}`}
                aria-pressed={filters.program === program}
                onClick={() => onChange({ program: filters.program === program ? 'All' : program })}
              >
                {program}
              </button>
            ))}
          </div>
          <div className="audience" role="group" aria-label="Do you have a shopping letter?">
            <button
              type="button"
              className={intent === 'letter' ? 'is-on' : ''}
              aria-pressed={intent === 'letter'}
              aria-label="I have a shopping letter from HRA and am looking for an apartment"
              onClick={() => onIntent('letter')}
            >
              I have a shopping letter
              <span>from HRA, looking for a place</span>
            </button>
            <button
              type="button"
              className={intent === 'apply' ? 'is-on' : ''}
              aria-pressed={intent === 'apply'}
              onClick={() => onIntent('apply')}
            >
              I need to apply
            </button>
          </div>
        </div>

        {intent === 'apply' ? (
          <ApplyPanel />
        ) : (
        <form className="search-panel hero-search" onSubmit={showApartments}>
          <div className="search-controls">
            <label className={`search-field neighborhood-field${filters.q.trim() ? ' is-set' : ''}`}>
              <span>Neighborhood or ZIP</span>
              <span className="input-with-icon">
                <Icon name="pin" size={16} />
                <input
                  value={filters.q}
                  onChange={(event) => onChange({ q: event.target.value })}
                  placeholder="Try Crown Heights"
                  aria-label="Neighborhood or ZIP"
                />
              </span>
            </label>
            <label className={`search-field${filters.beds !== 'Any' ? ' is-set' : ''}`}>
              <span>Bedrooms</span>
              <select value={filters.beds} onChange={(event) => onChange({ beds: event.target.value })} aria-label="Bedrooms">
                {['Any', 'Room', 'SRO', 'Studio', '1', '2', '3', '4+'].map((size) => (
                  <option key={size} value={size}>
                    {size === 'Any' ? 'Any size' : size === '1' || size === '2' || size === '3' ? `${size} bedroom` : size === '4+' ? '4+ bedrooms' : size}
                  </option>
                ))}
              </select>
            </label>
            <label className={`search-field${filters.program !== 'All' ? ' is-set' : ''}`}>
              <span>Voucher</span>
              <select value={filters.program} onChange={(event) => onChange({ program: event.target.value })} aria-label="Voucher">
                <option value="All">All three</option>
                {PROGRAMS.map((program) => (
                  <option key={program}>{program}</option>
                ))}
              </select>
            </label>
            <label className={`search-field rent-field${filters.maxRent ? ' is-set' : ''}`}>
              <span>Max monthly rent</span>
              <span className="rent-input">
                <span>$</span>
                <input
                  inputMode="numeric"
                  value={filters.maxRent}
                  onChange={(event) => onChange({ maxRent: event.target.value.replace(/[^\d]/g, '') })}
                  placeholder="No limit"
                  aria-label="Maximum monthly rent"
                />
              </span>
            </label>
          </div>
          <div className="search-controls search-controls-extra">
            <label className={`search-field${filters.borough !== 'All' ? ' is-set' : ''}`}>
              <span>Borough</span>
              <select value={filters.borough} onChange={(event) => onChange({ borough: event.target.value })} aria-label="Borough">
                <option value="All">All boroughs</option>
                {BOROUGHS.map((borough) => (
                  <option key={borough}>{borough}</option>
                ))}
              </select>
            </label>
            <label className={`search-field${filters.sort !== 'rent-asc' ? ' is-set' : ''}`}>
              <span>Sort</span>
              <select value={filters.sort} onChange={(event) => onChange({ sort: event.target.value })} aria-label="Sort">
                <option value="rent-asc">Rent, low to high</option>
                <option value="rent-desc">Rent, high to low</option>
                <option value="neighborhood">Neighborhood</option>
              </select>
            </label>
            <label className={`check-line${filters.savedOnly ? ' is-set' : ''}`}>
              <input
                type="checkbox"
                checked={filters.savedOnly}
                onChange={(event) => onChange({ savedOnly: event.target.checked })}
              />
              Saved only
            </label>
          </div>
          {chips.length > 0 && (
            <div className="filter-chips">
              {chips.map((chip) => (
                <button key={chip.key} type="button" className="filter-chip" onClick={() => onChange(chip.patch)} aria-label={`Remove ${chip.label}`}>
                  {chip.label}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
              {chips.length > 1 && (
                <button type="button" className="filter-chip filter-chip-clear" onClick={() => onChange({ q: '', program: 'All', borough: 'All', beds: 'Any', maxRent: '', savedOnly: false, sort: 'rent-asc' })}>
                  Clear all
                </button>
              )}
            </div>
          )}
          <button className="show-apartments" type="submit">Show apartments</button>
        </form>
        )}
      </section>

      <div id="search-results">
        <div className="results-bar">
          <p aria-live="polite">
            <strong>{listings.length}</strong> practice {listings.length === 1 ? 'apartment' : 'apartments'}
            {listings.length !== total ? ` of ${total}` : ''}
          </p>
          <button
            type="button"
            className={`saved-count${filters.savedOnly ? ' is-on' : ''}`}
            aria-pressed={filters.savedOnly}
            onClick={() => onChange({ savedOnly: !filters.savedOnly })}
          >
            <Icon name={savedCount ? 'heartFill' : 'heart'} size={15} />
            {savedCount} saved
          </button>
          <p className="fine">Practice listings. A worker still has to confirm a real unit.</p>
        </div>
        {listings.length === 0 ? (
          <div className="empty">
            <h2>Nothing matches these filters.</h2>
            <p>Clear the rent ceiling or switch the voucher to all three.</p>
            <button type="button" className="button" onClick={() => onChange({ q: '', program: 'All', borough: 'All', beds: 'Any', maxRent: '', savedOnly: false, sort: 'rent-asc' })}>
              Reset filters
            </button>
          </div>
        ) : (
          <ul className="cards">
            {listings.map((listing) => {
              const lines = cardFlags(planFlags(listing))
              const savedHere = saved.includes(listing.id)
              return (
                <li key={listing.id}>
                  <article className={`card${savedHere ? ' is-saved' : ''}`}>
                    <button type="button" className="card-open" onClick={() => onOpen(listing.id)}>
                      <Building tone={listing.facade} />
                      <div className="card-body">
                        {lines.map((line) => (
                          <p key={`${line.kind}-${line.text}`} className={`match match-${line.level}`}>
                            <span>{cardLabel(line)}</span>
                            {cardText(line)}
                          </p>
                        ))}
                        <div className="card-top">
                          <p className="rent">{money(listing.rent)}<span>/mo</span></p>
                          <p className="size">{sizeLabel(listing)} · {listing.baths} bath</p>
                        </div>
                        <h2>{listing.neighborhood}</h2>
                        <p className="where">
                          <Icon name="pin" size={15} /> {listing.borough} · {listing.crossStreets}
                        </p>
                        <p className="utilities">{utilityLabel(listing.utilities)}</p>
                        <ul className="pills">
                          {listing.programs.map((program) => (
                            <li key={program} className={`pill pill-${program.replace(/\s/g, '').toLowerCase()}${filters.program === program ? ' is-match' : ''}`}>{program}</li>
                          ))}
                        </ul>
                      </div>
                    </button>
                    <button
                      type="button"
                      className={`save ${savedHere ? 'is-saved' : ''}`}
                      aria-pressed={savedHere}
                      aria-label={savedHere ? 'Remove from saved apartments' : 'Save this apartment'}
                      onClick={() => onToggleSave(listing.id)}
                    >
                      <Icon name={savedHere ? 'heartFill' : 'heart'} size={18} />
                    </button>
                  </article>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
