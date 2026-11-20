import { useEffect, useState } from 'react'
import { tx } from '../i18nAuto.js'
import { LanguageSwitch } from './LanguageToggle.jsx'
import { SPONSOR_CONTACT } from '../data/sponsors.js'
import {
  LEASEBOT_HEADLINE,
  LEASEBOT_PRIVACY,
  LEASEBOT_SUBHEAD,
  LeasebotHelpNow,
  LeasebotMascot,
} from './LeasebotBanner.jsx'

export {
  LEASEBOT_HASH,
  LEASEBOT_HEADLINE,
  LEASEBOT_PRIVACY,
  LEASEBOT_SUBHEAD,
} from './LeasebotBanner.jsx'

const STEPS = [
  {
    title: 'Finds voucher-friendly listings',
    detail: 'Looks across the web for units that may take HASA, CityFHEPS, or Section 8, then shows you ones that could fit.',
  },
  {
    title: 'Drafts inquiries you approve',
    detail: 'Leasebot writes the message. Nothing is sent until you tap Approve.',
  },
  {
    title: 'Texts, emails, and calls landlords',
    detail: 'When Leasebot contacts a landlord, it says up front that it is an AI assistant reaching out for a renter.',
  },
  {
    title: 'Books viewings on your calendar',
    detail: 'When a landlord offers times, Leasebot helps you pick one, adds it to your calendar, and sends a reminder.',
  },
  {
    title: 'One log of every reply',
    detail: 'Every message and reply stays in one place you can review.',
  },
]

const TRUST = [
  'You approve every message before it goes out.',
  'Leasebot never shares HIV status, HASA, or medical details unless you turn that on. By default it only says you have a rental subsidy.',
  'Leasebot never signs a lease or sends documents without your approval.',
  'Everything that is free on LeasePath stays free. Leasebot is a planned paid add-on.',
  "Leasebot does not charge you a broker fee, and it does not ask you to pay a landlord's broker.",
]

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function waitlistMailto(email) {
  const subject = tx('Leasebot waitlist')
  const body = `${tx('Please add this email to the Leasebot waitlist:')}\n\n${email}`
  return `mailto:${SPONSOR_CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function useReveal() {
  useEffect(() => {
    const nodes = [...document.querySelectorAll('.leasebot-reveal')]
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (reduce) {
      nodes.forEach((node) => node.classList.add('is-in'))
      return undefined
    }
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in')
          io.unobserve(entry.target)
        }
      }
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' })
    nodes.forEach((node) => io.observe(node))
    return () => io.disconnect()
  }, [])
}

function ChatPreview() {
  return (
    <figure className="leasebot-chat" aria-labelledby="leasebot-chat-label">
      <figcaption id="leasebot-chat-label" className="leasebot-chat-label">{tx('Preview')}</figcaption>
      <div className="leasebot-chat-window">
        <header className="leasebot-chat-head">
          <LeasebotMascot size={36} className="leasebot-mascot leasebot-mascot-mini" />
          <div>
            <strong>Leasebot</strong>
            <span>{tx('Just now')}</span>
          </div>
        </header>
        <ol className="leasebot-chat-log">
          <li className="leasebot-bubble">
            <p>{tx('Found 4 new 1BRs under your limit in the Bronx')}</p>
          </li>
          <li className="leasebot-bubble is-flag">
            <p>{tx("Flagged 1 ad: says 'no programs'")}</p>
          </li>
          <li className="leasebot-bubble">
            <p>{tx('Drafted a message to Jordan at Cedar Place at 2:10 PM. Approve?')}</p>
            <span className="leasebot-approve" aria-hidden="true">{tx('Approve')}</span>
          </li>
          <li className="leasebot-bubble is-booked">
            <p>{tx('Viewing booked Sat 11am')}</p>
          </li>
        </ol>
      </div>
    </figure>
  )
}

function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const value = email.trim()
    if (!isEmail(value)) {
      setError(tx('Enter an email address.'))
      return
    }
    setError('')
    window.location.href = waitlistMailto(value)
  }

  return (
    <form className="leasebot-waitlist" onSubmit={submit} noValidate aria-labelledby="leasebot-waitlist-title">
      <h2 id="leasebot-waitlist-title">{tx('Join the waitlist')}</h2>
      <p>{tx('Leasebot is coming soon. Leave your email and we will tell you when it is ready. LeasePath is a new startup, and this is not a government service.')}</p>
      <label htmlFor="leasebot-email">{tx('Your email')}</label>
      <div className="leasebot-waitlist-row">
        <input
          id="leasebot-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (error) setError('')
          }}
          required
        />
        <button type="submit" className="button">{tx('Join the waitlist')}</button>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <p className="fine">{tx('This opens an email to LeasePath. We only use the address to tell you when Leasebot is ready. We do not store it on this page.')}</p>
    </form>
  )
}

function StickyWaitlistCta() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const hero = document.getElementById('leasebot-hero-cta')
    const wait = document.getElementById('leasebot-waitlist-title')
    if (!hero || !wait) return undefined
    let heroIn = true
    let waitIn = false
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target.id === 'leasebot-hero-cta') {
          // Below the fold still counts as "in the hero"; only hide once it has scrolled off the top.
          heroIn = entry.isIntersecting || entry.boundingClientRect.top > 0
        }
        if (entry.target.id === 'leasebot-waitlist-title') waitIn = entry.isIntersecting
      }
      setShow(!heroIn && !waitIn)
    }, { threshold: 0.2 })
    io.observe(hero)
    io.observe(wait)
    return () => io.disconnect()
  }, [])
  if (!show) return null
  return (
    <div className="leasebot-sticky">
      <a className="button" href="#leasebot-waitlist-title">{tx('Join the waitlist')}</a>
    </div>
  )
}

export function LeasebotPage() {
  useReveal()
  return (
    <div className="leasebot-page">
      <div className="leasebot-lang-bar">
        <LanguageSwitch className="leasebot-lang-switch" />
      </div>
      <header className="leasebot-hero" aria-labelledby="leasebot-title">
        <div className="leasebot-hero-copy">
          <LeasebotMascot size={112} />
          <p className="eyebrow">{tx('Coming soon')}</p>
          <h1 id="leasebot-title">{tx(LEASEBOT_HEADLINE)}</h1>
          <p className="leasebot-subhead">{tx(LEASEBOT_SUBHEAD)}</p>
          <p className="leasebot-privacy">{tx(LEASEBOT_PRIVACY)}</p>
          <div className="button-row">
            <a id="leasebot-hero-cta" className="button" href="#leasebot-waitlist-title">{tx('Join the waitlist')}</a>
          </div>
        </div>
        <ChatPreview />
      </header>

      <div className="leasebot-body">
        <LeasebotHelpNow headingId="leasebot-page-help-now" />

        <section className="leasebot-steps leasebot-reveal" aria-labelledby="leasebot-steps-title">
          <h2 id="leasebot-steps-title">{tx('How Leasebot works')}</h2>
          <ol className="leasebot-tiles">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="how-num" aria-hidden="true">{index + 1}</span>
                <strong>{tx(step.title)}</strong>
                <p>{tx(step.detail)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="leasebot-trust leasebot-reveal" aria-labelledby="leasebot-trust-title">
          <h2 id="leasebot-trust-title">{tx('You stay in control')}</h2>
          <ul>
            {TRUST.map((line) => (
              <li key={line}>{tx(line)}</li>
            ))}
          </ul>
        </section>

        <section className="leasebot-pricing leasebot-reveal" aria-labelledby="leasebot-pricing-title">
          <p className="eyebrow">{tx('Coming soon')}</p>
          <h2 id="leasebot-pricing-title">{tx('A short hunt pass, and seats for agencies')}</h2>
          <p>{tx('We plan a short apartment-hunt pass, plus sponsored seats that nonprofits and agencies can buy for their clients. Prices are not set yet.')}</p>
        </section>

        <WaitlistForm />
      </div>
      <StickyWaitlistCta />
    </div>
  )
}
