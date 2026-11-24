import { useEffect, useState } from 'react'
import { tx } from '../i18nAuto.js'
import { LanguageSwitch } from './LanguageToggle.jsx'
import { useLanguage } from './languageContext.js'
import { SPONSOR_CONTACT } from '../data/sponsors.js'
import {
  LEASEBOT_HEADLINE,
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

const HUGE_STEPS = [
  'Tell it what you need.',
  'It searches and follows up.',
  'You approve every message.',
]

const TRUST_STRIP = [
  'Never shares your health or HASA info.',
  'Free to chat.',
  'Not a city agency.',
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
      <p className="sr-only">
        {tx('I need a 2 bedroom in the Bronx, CityFHEPS')}
        {' '}
        {tx('Found 3 that fit your limit. 1 looks like a scam, so I skipped it.')}
        {' '}
        {tx('Drafted a message to Jordan at Cedar Place.')}
        {' '}
        {tx('Approve & send')}
        {' '}
        {tx('Viewing booked Sat 11am')}
      </p>
      <div className="leasebot-chat-window">
        <header className="leasebot-chat-head">
          <LeasebotMascot size={36} className="leasebot-mascot leasebot-mascot-mini" />
          <div>
            <strong>Leasebot</strong>
            <span>{tx('Just now')}</span>
          </div>
        </header>
        <ol className="leasebot-chat-log" aria-hidden="true">
          <li className="leasebot-dotline is-renter step-dots-1">
            <span /><span /><span />
          </li>
          <li className="leasebot-bubble is-renter step-1">
            <p>{tx('I need a 2 bedroom in the Bronx, CityFHEPS')}</p>
          </li>
          <li className="leasebot-dotline step-dots-2">
            <span /><span /><span />
          </li>
          <li className="leasebot-bubble step-2">
            <p>{tx('Found 3 that fit your limit. 1 looks like a scam, so I skipped it.')}</p>
          </li>
          <li className="leasebot-dotline step-dots-3">
            <span /><span /><span />
          </li>
          <li className="leasebot-bubble step-3">
            <p>{tx('Drafted a message to Jordan at Cedar Place.')}</p>
            <span className="leasebot-approve">{tx('Approve & send')}</span>
          </li>
          <li className="leasebot-bubble is-booked step-4">
            <p>{tx('Viewing booked Sat 11am')}</p>
          </li>
        </ol>
      </div>
    </figure>
  )
}

function WaitlistForm({ variant = 'hero' } = {}) {
  const { lang } = useLanguage()
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [error, setError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const hero = variant === 'hero'

  const submit = async (event) => {
    event.preventDefault()
    if (sending) return
    const value = email.trim()
    if (!isEmail(value)) {
      setError(tx('Enter an email address.'))
      return
    }
    setError('')
    setUnavailable(false)
    setSending(true)
    try {
      // The address goes only to our own /api/waitlist.
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: value, lang: lang === 'es' ? 'es' : 'en', website }),
      })
      if (response.ok) {
        setDone(true)
      } else if (response.status === 400) {
        setError(tx('Enter an email address.'))
      } else if (response.status === 429) {
        setError(tx('Too many tries. Wait a minute and try again.'))
      } else {
        setUnavailable(true)
        setError(tx('The waitlist is not working right now.'))
      }
    } catch {
      setUnavailable(true)
      setError(tx('The waitlist is not working right now.'))
    } finally {
      setSending(false)
    }
  }

  return (
    <form
      className={hero ? 'leasebot-waitlist leasebot-hero-form' : 'leasebot-waitlist'}
      id={hero ? 'leasebot-hero-cta' : undefined}
      onSubmit={submit}
      noValidate
      aria-labelledby={hero ? 'leasebot-hero-form-label' : 'leasebot-waitlist-title'}
    >
      {hero ? (
        <p id="leasebot-hero-form-label" className="sr-only">{tx('Get early access')}</p>
      ) : (
        <h2 id="leasebot-waitlist-title">{tx('Join the waitlist')}</h2>
      )}
      <div aria-live="polite">
        {done ? <p className="form-success" role="status">{tx("You're on the list. We'll email you when Leasebot is ready.")}</p> : null}
      </div>
      {done ? null : (
        <>
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
            <button type="submit" className="button" disabled={sending}>{tx(hero ? 'Get early access' : 'Join the waitlist')}</button>
          </div>
          {/* Honeypot: hidden from people and screen readers; bots tend to fill it. */}
          <div className="leasebot-hp" aria-hidden="true">
            <label htmlFor="leasebot-website">{'Website'}</label>
            <input id="leasebot-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {unavailable ? (
            <p className="fine"><a href={waitlistMailto(email.trim())}>{tx('Email us instead')}</a></p>
          ) : null}
          <p className="fine">{tx("We'll only use your email to tell you when Leasebot is ready.")}</p>
        </>
      )}
    </form>
  )
}

function StickyWaitlistCta() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const hero = document.getElementById('leasebot-hero-cta')
    if (!hero) return undefined
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0]
      const heroIn = entry.isIntersecting || entry.boundingClientRect.top > 0
      setShow(!heroIn)
    }, { threshold: 0.2 })
    io.observe(hero)
    return () => io.disconnect()
  }, [])
  if (!show) return null
  return (
    <div className="leasebot-sticky">
      <a className="button" href="#leasebot-hero-cta">{tx('Get early access')}</a>
    </div>
  )
}

export function LeasebotPage() {
  useReveal()
  return (
    <div className="leasebot-page">
      <header className="leasebot-hero" aria-labelledby="leasebot-title">
        <div className="leasebot-hero-copy">
          <div className="leasebot-hero-top">
            <p className="leasebot-wordmark">
              <LeasebotMascot size={44} className="leasebot-mascot leasebot-mascot-mini" />
              <span>Leasebot</span>
            </p>
            <LanguageSwitch className="leasebot-lang-switch" />
          </div>
          <p className="eyebrow">{tx('Coming soon')}</p>
          <h1 id="leasebot-title">{tx(LEASEBOT_HEADLINE)}</h1>
          <p className="leasebot-subhead">{tx(LEASEBOT_SUBHEAD)}</p>
          <WaitlistForm variant="hero" />
        </div>
        <ChatPreview />
      </header>

      <div className="leasebot-body">
        <section className="leasebot-huge-steps leasebot-reveal" aria-labelledby="leasebot-steps-title">
          <h2 id="leasebot-steps-title" className="sr-only">{tx('How Leasebot works')}</h2>
          <ol>
            {HUGE_STEPS.map((step, index) => (
              <li key={step}>
                <span className="leasebot-step-index" aria-hidden="true">{index + 1}</span>
                <p>{tx(step)}</p>
              </li>
            ))}
          </ol>
        </section>

        <p className="leasebot-trust-strip leasebot-reveal">
          {TRUST_STRIP.map((line) => (
            <span key={line}>{tx(line)}</span>
          ))}
        </p>

        <LeasebotHelpNow headingId="leasebot-page-help-now" />
      </div>
      <StickyWaitlistCta />
    </div>
  )
}
