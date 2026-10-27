import { tx } from '../i18nAuto.js'
import { useState } from 'react'
import { choosePantries, relation, whenLabel } from '../pantrySchedule.js'

let listRequest = null

function loadPantries() {
  if (!listRequest) {
    listRequest = fetch('/api/pantries')
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'The Food Help NYC list did not load.')
        return data
      })
      .catch((error) => {
        listRequest = null
        throw error
      })
  }
  return listRequest
}

function phoneHref(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : ''
}

function PantryCard({ eyebrow, place, now }) {
  const { pantry, miles, direction, opening } = place
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${pantry.lat},${pantry.lon}`
  const call = phoneHref(pantry.phone)
  return (
    <article className="pantry-card">
      <p className="eyebrow">{eyebrow}</p>
      <h3>{pantry.name}</h3>
      <p>{relation(miles, direction)}</p>
      <p>{whenLabel(opening, now)}</p>
      <p>{pantry.address}</p>
      {pantry.placeNote && <p>{pantry.placeNote}</p>}
      {pantry.note && <p>{pantry.note}</p>}
      <p className="pantry-actions">
        {call && <a href={call}>{tx("Call")} {pantry.phone}</a>}
        <a href={directions} target="_blank" rel="noreferrer">{tx("Directions")}</a>
      </p>
    </article>
  )
}

export function PantryFinder() {
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [checked, setChecked] = useState('')

  async function showOrigin(origin) {
    setStatus('loading')
    setError('')
    try {
      const list = await loadPantries()
      const choice = choosePantries(origin, list.pantries)
      if (!choice.nearest) {
        setResult(null)
        setError('Food Help NYC did not return a pantry with a location.')
        setStatus('ready')
        return
      }
      setResult({ ...choice, now: Date.now(), placeLabel: origin.label })
      setChecked(list.fetchedAt || '')
      setStatus('ready')
    } catch (loadError) {
      setResult(null)
      setError(loadError.message || 'The Food Help NYC list did not load.')
      setStatus('ready')
    }
  }

  function useLocation() {
    if (!navigator.geolocation) {
      setError('This browser cannot share a location. Type an address instead.')
      return
    }
    setStatus('locating')
    setError('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        showOrigin({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          label: 'your location',
        })
      },
      () => {
        setStatus('idle')
        setError('This browser did not share a location. Type an address instead.')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  }

  async function searchAddress(event) {
    event.preventDefault()
    const query = address.trim()
    if (query.length < 4) {
      setError('Type a street and a borough, or an intersection.')
      return
    }
    setStatus('locating')
    setError('')
    try {
      const response = await fetch(`https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(query)}`)
      const data = await response.json()
      const feature = data?.features?.[0]
      const [lon, lat] = feature?.geometry?.coordinates || []
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        setStatus('idle')
        setError('No New York City address matched that. Try the street and borough.')
        return
      }
      showOrigin({ lat, lon, label: query })
    } catch {
      setStatus('idle')
      setError('The address search did not answer. Try again, or use your location.')
    }
  }

  const checkedLabel = checked
    ? new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(checked))
    : ''
  const now = result ? new Date(result.now) : new Date()

  return (
    <section className="pantry-finder" aria-labelledby="pantry-finder-title">
      <h2 id="pantry-finder-title">{tx("Pantries near you")}</h2>
      <p className="lede">{tx("No sign-in. This uses the Food Help NYC list. A location you share stays on this phone and is used to measure distance. An address you type is sent to the NYC Planning Labs address search to find the spot. LeasePath does not save either one.")}</p>
      <form className="finder-form" onSubmit={searchAddress}>
        <label>
          <span>{tx("Address or intersection")}</span>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder={tx("Street and borough")}
            autoComplete="street-address"
            aria-label={tx("Address or intersection")}
          />
        </label>
        <div className="finder-buttons">
          <button type="submit" className="button" disabled={status === 'loading' || status === 'locating'}>{tx("Find pantries")}</button>
          <button type="button" className="button button-quiet" onClick={useLocation} disabled={status === 'loading' || status === 'locating'}>
            {tx("Use my location")}
          </button>
        </div>
      </form>
      <div aria-live="polite">
        {status === 'locating' && <p>{tx("Finding that spot…")}</p>}
        {status === 'loading' && <p>{tx("Checking the Food Help NYC list…")}</p>}
        {error && <p className="form-error">{error}</p>}
        {result?.nearest && (
          <div className="pantry-results">
            <PantryCard eyebrow="Nearest pantry" place={result.nearest} now={now} />
            {result.next ? (
              <PantryCard eyebrow="Next one happening near you" place={result.next} now={now} />
            ) : (
              <p>{tx("No other pantry with listed hours is near this spot.")}</p>
            )}
            <p className="fine">
              {tx("Hours come from")} {checkedLabel ? `Food Help NYC, checked ${checkedLabel}` : 'Food Help NYC'}{tx(". They can change. Call before you go.")}
              {' '}{tx("Measured from")} {result.placeLabel}.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
