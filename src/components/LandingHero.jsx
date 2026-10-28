import { tx } from '../i18nAuto.js'
import { useEffect, useState } from 'react'
import { HERO_PHOTO, landingSample, openAccount } from '../landing.js'
import { useLanguage } from './languageContext.js'

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
          <span className="mock-label">{tx("Max rent")}</span>
          <span className="mock-rent">{s.usd(s.limit)}</span>
          <span className="mock-effective">{s.program} · {s.effective}</span>
        </div>
        <p className="mock-fit">{tx("✓ Fits ·")} {s.usd(s.rent)}{tx("/mo asking")}</p>
        <p className="mock-source">{tx("Source: DSS")} {s.sourceDocNumber}{tx(". Your worker still decides.")}</p>
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

/** A light inline brownstone-and-skyline silhouette for the phone hero (no image download). */
function HeroSkyline() {
  return (
    <svg className="hero-skyline" viewBox="0 0 390 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <path className="sky-far" d="M0 120V70h18V52h14v18h10V40h8v-8h6v8h8v30h12V58h22v62zM120 120V46h10V30h4V14h4v16h4v16h10v74zM200 120V60h16V44h20v16h14V36h8V24h6v12h8v84zM290 120V54h12V40h18v14h10V64h20V48h12v72z" />
      <path className="sky-near" d="M0 120V88l16-10 16 10v32zM40 120V84h34v36zM82 120V80l18-12 18 12v40zM126 120V86h40v34zM174 120V82l20-12 20 12v38zM222 120V84h38v36zM268 120V80l18-12 18 12v40zM312 120V86h36v34zM356 120V82l17-10 17 10v38z" />
      <g className="sky-windows">
        <rect x="48" y="92" width="6" height="8" /><rect x="60" y="92" width="6" height="8" /><rect x="94" y="90" width="5" height="8" /><rect x="134" y="94" width="6" height="8" /><rect x="150" y="94" width="6" height="8" /><rect x="188" y="90" width="5" height="8" /><rect x="232" y="94" width="6" height="8" /><rect x="282" y="90" width="5" height="8" /><rect x="322" y="94" width="6" height="8" />
      </g>
    </svg>
  )
}

/** One headline and one short line. The search sits right under it (SearchPage). */
export function LandingHero() {
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
      {!wide && <HeroSkyline />}
      <div className="hero-text">
        <p className="eyebrow">{t("hero.eyebrow")}</p>
        <h1 id="hero-title">{t("hero.title")}</h1>
        <p className="hero-value">{t("hero.value")}</p>
      </div>
    </section>
  )
}

/** Account creation, the any-phone note and the quiz: moved out of the hero, shown after the listings. */
export function LandingExtras() {
  const { t } = useLanguage()
  return (
    <section className="landing-extras" aria-label={tx("Get more from LeasePath")}>
      <p className="hero-account"><a className="hero-account-link" href="#/" onClick={(event) => { event.preventDefault(); openAccount() }}>{t("hero.account")}</a></p>
      <p className="hero-any-phone">{t("hero.anyPhone")}</p>
      <p className="hero-quiz"><a className="hero-quiz-link" href="#/quiz">{tx("Not sure where to start? Three questions →")}</a></p>
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
