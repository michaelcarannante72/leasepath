import { useEffect, useState } from 'react'
import { HERO_PHOTO, LANDING_STEPS, NOT_AFFILIATED, landingSample, openAccount } from '../landing.js'

function PhoneMockup() {
  const s = landingSample()
  return (
    <figure className="phone-mock" aria-label="Example of a rent check">
      <div className="phone-screen">
        <span className="mock-tag">Example</span>
        <p className="mock-title">Rent check</p>
        <p className="mock-line">{s.line}</p>
        <div className="mock-figure">
          <span className="mock-label">Max rent</span>
          <span className="mock-rent">{s.usd(s.limit)}</span>
          <span className="mock-effective">{s.program} · {s.effective}</span>
        </div>
        <p className="mock-fit">✓ Fits · {s.usd(s.rent)}/mo asking</p>
        <p className="mock-source">Source: DSS {s.sourceDocNumber}. Your worker still decides.</p>
      </div>
    </figure>
  )
}

const WIDE = '(min-width: 900px)'

/** Phones never download the photo: it is only rendered on wide screens. */
function useWide() {
  const query = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(WIDE) : null
  const [wide, setWide] = useState(() => Boolean(query?.matches))
  useEffect(() => {
    if (!query) return undefined
    const update = () => setWide(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [query])
  return wide
}

export function LandingHero({ onCheck }) {
  const wide = useWide()
  return (
    <section className="hero-split" aria-labelledby="hero-title">
      {wide && (
      <div className="hero-photo">
        <picture>
          <source type="image/avif" srcSet="/images/brownstone-desktop.avif" />
          <source type="image/webp" srcSet="/images/brownstone-desktop.webp" />
          <img
            src="/images/brownstone-desktop.jpg"
            alt={HERO_PHOTO.alt}
            width="960"
            height="1079"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />
        </picture>
        <PhoneMockup />
        <a className="photo-by" href={HERO_PHOTO.sourceUrl} target="_blank" rel="noreferrer">{HERO_PHOTO.credit}</a>
      </div>
      )}
      <div className="hero-text">
        <p className="eyebrow">NYC housing search</p>
        <h1 id="hero-title">NYC apartments that take HASA, CityFHEPS, and Section{'\u00A0'}8.</h1>
        <p className="hero-value">See if a listing fits your voucher before you call the broker.</p>
        <button type="button" className="hero-cta" onClick={onCheck}>Check a listing</button>
        <p className="hero-account"><a className="hero-account-link" href="#/" onClick={(event) => { event.preventDefault(); openAccount() }}>Create a free account</a></p>
        <p className="hero-any-phone">Works on any phone, no download needed.</p>
        <p className="not-affiliated">{NOT_AFFILIATED}</p>
      </div>
    </section>
  )
}

export function LandingSteps({ onFind, onAsk }) {
  return (
    <section className="landing-steps" aria-label="How LeasePath helps">
      <ol>
        {LANDING_STEPS.map((step, i) => (
          <li key={step.title}>
            <a
              href={step.href || '#/'}
              onClick={(event) => {
                if (step.action === 'assistant') { event.preventDefault(); onAsk?.() }
                else if (step.href === '#search-results') { event.preventDefault(); onFind?.() }
              }}
            >
              <span className="how-num">{i + 1}</span>
              <strong>{step.title}</strong>
              <span>{step.detail}</span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  )
}
