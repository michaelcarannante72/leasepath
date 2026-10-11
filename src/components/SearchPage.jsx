import { Building } from './Building.jsx'
import { Icon } from './Icon.jsx'
import { BOROUGHS } from '../data.js'
import { PROGRAMS, leadFlag, money, sizeLabel, utilityLabel } from '../fit.js'

const SORT_LABELS = {
  'rent-asc': 'Rent, low to high',
  'rent-desc': 'Rent, high to low',
  neighborhood: 'Neighborhood',
}

const MATCH_LABEL = {
  good: 'Fits the letter',
  watch: 'Look closer',
  note: 'Worth a note',
}

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

export function SearchPage({ listings, total, filters, onChange, saved, onToggleSave, onOpen, planFlags }) {
  const chips = activeChips(filters)
  const savedCount = saved.length
  return (
    <div className="search-layout">
      <form className="search-panel" onSubmit={(event) => event.preventDefault()}>
        <div className="search-heading">
          <div>
            <span className="search-heading-icon"><Icon name="search" size={18} /></span>
            <span>Find your next neighborhood</span>
          </div>
          <span className="sample-label"><span /> Sample listings</span>
        </div>
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
          <label className={`search-field${filters.borough !== 'All' ? ' is-set' : ''}`}>
            <span>Borough</span>
            <select value={filters.borough} onChange={(event) => onChange({ borough: event.target.value })} aria-label="Borough">
              <option value="All">All boroughs</option>
              {BOROUGHS.map((borough) => (
                <option key={borough}>{borough}</option>
              ))}
            </select>
          </label>
          <label className={`search-field${filters.maxRent ? ' is-set' : ''}`}>
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
          <label className={`search-field${filters.program !== 'All' ? ' is-set' : ''}`}>
            <span>Voucher</span>
            <select value={filters.program} onChange={(event) => onChange({ program: event.target.value })} aria-label="Voucher">
              <option value="All">All three</option>
              {PROGRAMS.map((program) => (
                <option key={program}>{program}</option>
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
        <p className="search-note">Use the approved amount on your letter. Rent limits and utility rules vary.</p>
      </form>

      <div>
        <div className="results-bar">
          <p aria-live="polite">
            <strong>{listings.length}</strong> sample {listings.length === 1 ? 'apartment' : 'apartments'}
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
          <p className="fine">Asking rents on these cards are examples for practice.</p>
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
              const flag = leadFlag(planFlags(listing))
              const savedHere = saved.includes(listing.id)
              return (
                <li key={listing.id}>
                  <article className={`card${savedHere ? ' is-saved' : ''}`}>
                    <button type="button" className="card-open" onClick={() => onOpen(listing.id)}>
                      <Building tone={listing.facade} />
                      <div className="card-body">
                        {flag && (
                          <p className={`match match-${flag.level}`}>
                            <span>{MATCH_LABEL[flag.level] || 'Note'}</span>
                            {flag.text}
                          </p>
                        )}
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
                          <li className="pill pill-sample">Sample</li>
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
