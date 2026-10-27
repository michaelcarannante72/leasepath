import { useEffect, useState } from 'react'
import { HERO_PHOTO, LANDING_STEPS, landingSample, openAccount } from '../landing.js'
import { useLanguage } from './LanguageProvider.jsx'

function PhoneMockup() {
  const { t } = useLanguage()
  const s = landingSample()
  return (
    <figure className="phone-mock" aria-label={t('hero.mock.title')}>
      <div className="phone-screen">
        <span className="mock-tag">{t('hero.mock.tag')}</span>
        <p className="mock-title">{t('hero.mock.title')}</p>
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
  const { t } = useLanguage()
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
        <p className="eyebrow">{t("hero.eyebrow")}</p>
        <h1 id="hero-title">{t("hero.title")}</h1>
        <p className="hero-value">{t("hero.value")}</p>
        <button type="button" className="hero-cta" onClick={onCheck}>{t("hero.cta")}</button>
        <p className="hero-account"><a className="hero-account-link" href="#/" onClick={(event) => { event.preventDefault(); openAccount() }}>{t("hero.account")}</a></p>
        <p className="hero-any-phone">{t("hero.anyPhone")}</p>
        <p className="hero-quiz"><a className="hero-quiz-link" href="#/quiz">Not sure where to start? Three questions →</a></p>
        <p className="not-affiliated">{t("hero.notAffiliated")}</p>
      </div>
    </section>
  )
}

export function LandingSteps({ onFind, onAsk }) {
  const { t } = useLanguage()
  const steps = [
    { title: t('landing.step1.title'), detail: t('landing.step1.detail'), href: '#/plan' },
    { title: t('landing.step2.title'), detail: t('landing.step2.detail'), href: '#search-results' },
    { title: t('landing.step3.title'), detail: t('landing.step3.detail'), action: 'assistant' },
  ]
  return (
    <section className="landing-steps" aria-label={t('landing.stepsLabel')}>
      <ol>
        {steps.map((step, i) => (
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
