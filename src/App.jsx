import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './index.css'
import { AssistantSheet } from './components/AssistantSheet.jsx'
import { DetailPage } from './components/DetailPage.jsx'
import { BlogList, BlogPost } from './components/BlogPage.jsx'
import { Dock } from './components/Dock.jsx'
import { Footer, InfoPage } from './components/Footer.jsx'
import { Header } from './components/Header.jsx'
import { Icon } from './components/Icon.jsx'
import { Onboarding } from './components/Onboarding.jsx'
import { Paywall } from './components/Paywall.jsx'
import { PlanPage } from './components/PlanPage.jsx'
import { ResourcesPage } from './components/ResourcesPage.jsx'
import { SearchPage } from './components/SearchPage.jsx'
import { StepsPage } from './components/StepsPage.jsx'
import { FREE_COACH_QUESTIONS } from './coachLimit.js'
import { POSTS } from './blog.js'
import { ACCESS_HRA_URL, LISTINGS } from './data.js'
import { SITE_PAGES } from './sitePages.js'
import { PROGRAMS, VOUCHER_PROGRAMS, assessListing, filterListings } from './fit.js'
import { onInstallAvailable, promptInstall } from './install.js'

const PLAN_KEY = 'leasepath.plan'
const SAVED_KEY = 'leasepath.saved'
const STEPS_KEY = 'leasepath.steps'
const ONBOARD_KEY = 'leasepath.onboarded'

const WELCOME = {
  role: 'assistant',
  local: true,
  content:
    'I can help you use a voucher, or take the next step to qualify for one. I can’t approve an apartment.',
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function emptyPlan() {
  return { program: '', household: '', letterRent: '', utilities: '', situation: '', receiving: '' }
}

function loadPlan() {
  const stored = loadJson(PLAN_KEY, {})
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return emptyPlan()
  const receiving = ['has', 'none', 'unsure'].includes(stored.receiving) ? stored.receiving : ''
  return {
    program: VOUCHER_PROGRAMS.includes(stored.program) ? stored.program : '',
    household: stored.household ? String(stored.household) : '',
    letterRent: stored.letterRent ? String(stored.letterRent).replace(/[^\d]/g, '') : '',
    utilities: typeof stored.utilities === 'string' ? stored.utilities : '',
    situation: typeof stored.situation === 'string' ? stored.situation : '',
    receiving,
  }
}

function parseHash() {
  const hash = window.location.hash.replace(/^#/, '') || '/'
  const match = hash.match(/^\/listing\/([a-z0-9-]+)$/)
  if (match) return { name: 'detail', id: match[1] }
  const post = hash.match(/^\/blog\/([a-z0-9-]+)$/)
  if (post) return { name: 'post', id: post[1] }
  const info = hash.match(/^\/info\/([a-z0-9-]+)$/)
  if (info) return { name: 'info', id: info[1] }
  if (hash === '/steps' || hash === '/resources' || hash === '/plan' || hash === '/blog') {
    return { name: hash.slice(1) }
  }
  return { name: 'search' }
}

function nextStep(plan) {
  if (plan.receiving === 'none') {
    return { href: ACCESS_HRA_URL, label: 'Apply on ACCESS HRA', external: true }
  }
  if (VOUCHER_PROGRAMS.includes(plan.program) && Number(plan.letterRent)) {
    return { href: '#/steps', label: 'Open the step guide' }
  }
  return { action: 'onboard', label: 'Add your voucher details' }
}

export default function App() {
  const [route, setRoute] = useState(parseHash)
  const [plan, setPlan] = useState(loadPlan)
  const [saved, setSaved] = useState(() => {
    const stored = loadJson(SAVED_KEY, [])
    return Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : []
  })
  const [checked, setChecked] = useState(() => {
    const stored = loadJson(STEPS_KEY, [])
    return Array.isArray(stored) ? stored.filter((index) => Number.isInteger(index)) : []
  })
  const [filters, setFilters] = useState(() => {
    const initial = loadPlan()
    return {
      q: '',
      program: PROGRAMS.includes(initial.program) ? initial.program : 'All',
      borough: 'All',
      beds: 'Any',
      maxRent: '',
      savedOnly: false,
      sort: 'rent-asc',
    }
  })
  const [onboardingOpen, setOnboardingOpen] = useState(() => {
    if (localStorage.getItem(ONBOARD_KEY) === '1') return false
    const initial = loadPlan()
    return !initial.receiving && !VOUCHER_PROGRAMS.includes(initial.program)
  })
  const [paywall, setPaywall] = useState(null)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantListingId, setAssistantListingId] = useState(null)
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [includePlan, setIncludePlan] = useState(true)
  const [configured, setConfigured] = useState(null)
  const [canInstall, setCanInstall] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [signInError, setSignInError] = useState('')
  const [session, setSession] = useState({
    loaded: false,
    signedIn: false,
    email: '',
    anonymousRemaining: FREE_COACH_QUESTIONS,
    accountRemaining: null,
    googleClientId: '',
    secretReady: true,
    authReady: false,
  })

  const applyAccess = (data) => {
    setSession((current) => ({
      loaded: true,
      signedIn: Boolean(data.signedIn),
      email: data.email || '',
      anonymousRemaining: Number.isInteger(data.anonymousRemaining) ? data.anonymousRemaining : current.anonymousRemaining,
      accountRemaining: Number.isInteger(data.accountRemaining) ? data.accountRemaining : data.signedIn ? current.accountRemaining : null,
      googleClientId: typeof data.googleClientId === 'string' ? data.googleClientId : current.googleClientId,
      secretReady: data.secretReady !== false,
      authReady: Boolean(data.authReady),
    }))
    if (typeof data.configured === 'boolean') setConfigured(data.configured)
  }

  const stageRef = useRef(null)
  const scrollStage = () => stageRef.current?.scrollTo({ top: 0 })

  useEffect(() => onInstallAvailable(setCanInstall), [])

  useEffect(() => {
    const sync = () => {
      setRoute(parseHash())
      scrollStage()
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  useEffect(() => {
    let cancel = false
    fetch('/api/guide', { credentials: 'same-origin' })
      .then((response) => response.json())
      .then((data) => {
        if (!cancel) applyAccess(data)
      })
      .catch(() => {
        if (!cancel) setConfigured(false)
      })
    return () => {
      cancel = true
    }
  }, [])

  useEffect(() => {
    if (!assistantOpen) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [assistantOpen])

  const closeAssistant = useCallback(() => setAssistantOpen(false), [])

  const go = (hash) => {
    if (`#${window.location.hash.replace(/^#/, '')}` === hash || (hash === '#/' && !window.location.hash)) {
      stageRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    window.location.hash = hash
  }

  const listings = useMemo(
    () => filterListings(LISTINGS, filters, saved),
    [filters, saved],
  )

  const updatePlan = (patch) => {
    setPlan((current) => {
      const next = { ...current, ...patch }
      localStorage.setItem(PLAN_KEY, JSON.stringify(next))
      return next
    })
  }

  const closeOnboarding = () => {
    localStorage.setItem(ONBOARD_KEY, '1')
    setOnboardingOpen(false)
  }

  const saveOnboarding = (draft) => {
    const receiving = ['has', 'none', 'unsure'].includes(draft.receiving) ? draft.receiving : ''
    const program = receiving === 'none' || !VOUCHER_PROGRAMS.includes(draft.program) ? '' : draft.program
    updatePlan({
      receiving,
      program,
      household: draft.household || '',
      letterRent: receiving === 'none' ? '' : String(draft.letterRent || '').replace(/[^\d]/g, ''),
      utilities: receiving === 'none' ? '' : draft.utilities || '',
    })
    setFilters((current) => ({ ...current, program: PROGRAMS.includes(program) ? program : 'All' }))
    closeOnboarding()
  }

  const toggleSaved = (id) => {
    setSaved((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      localStorage.setItem(SAVED_KEY, JSON.stringify(next))
      return next
    })
  }

  const toggleStep = (index) => {
    setChecked((current) => {
      const next = current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
      localStorage.setItem(STEPS_KEY, JSON.stringify(next))
      return next
    })
  }

  const signIn = useCallback(async (credential) => {
    setSignInError('')
    setSigningIn(true)
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })
      const data = await response.json().catch(() => ({}))
      applyAccess(data)
      if (!response.ok) setSignInError(data.message || 'Google sign-in did not finish. Try again.')
    } catch {
      setSignInError('LeasePath could not reach sign-in. Check your connection and try again.')
    } finally {
      setSigningIn(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setSignInError('')
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
      const data = await response.json().catch(() => ({}))
      applyAccess(data)
    } catch {
      setSignInError('LeasePath could not sign you out. Try again.')
    }
  }, [])

  const openResources = useCallback(() => {
    setAssistantOpen(false)
    window.location.hash = '#/resources'
  }, [])

  const send = useCallback(async (text, listingId = assistantListingId) => {
    const clean = text.trim()
    if (!clean || pending) return
    if (!session.signedIn && session.anonymousRemaining <= 0) {
      setAssistantOpen(true)
      return
    }
    if (session.loaded && session.secretReady === false) {
      setAssistantOpen(true)
      return
    }
    const nextMessages = [...messages, { role: 'user', content: clean }]
    setMessages(nextMessages)
    setInput('')
    setPending(true)
    setAssistantOpen(true)
    const listing = LISTINGS.find((item) => item.id === listingId) || null
    try {
      const response = await fetch('/api/guide', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.filter((message) => !message.local).slice(-8),
          includePlan,
          plan: {
            program: plan.program,
            household: plan.household,
            letterRent: plan.letterRent,
            utilities: plan.utilities,
          },
          listing,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (data && typeof data === 'object') applyAccess(data)
      if (response.status === 503 && data.error === 'missing_key') setConfigured(false)
      if (data.error === 'sign_in_required') return
      const reply = data.reply || data.message || 'The assistant did not answer. Try again in a moment.'
      setMessages((current) => [...current, { role: 'assistant', content: reply }])
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'LeasePath could not reach the assistant. Check your connection and try again.' },
      ])
    } finally {
      setPending(false)
    }
  }, [assistantListingId, includePlan, messages, pending, plan, session])

  const askAboutListing = (listingId, prompt) => {
    setAssistantListingId(listingId)
    send(prompt, listingId)
  }

  const listing = route.name === 'detail' ? LISTINGS.find((item) => item.id === route.id) : null
  const post = route.name === 'post' ? POSTS.find((item) => item.slug === route.id) : null
  const infoPage = route.name === 'info' ? SITE_PAGES.find((item) => item.slug === route.id) : null
  const step = nextStep(plan)
  const dockActive = assistantOpen
    ? 'assistant'
    : route.name === 'detail'
      ? 'search'
      : route.name === 'post'
        ? 'blog'
        : route.name

  return (
    <div className="app">
      <Header canInstall={canInstall} onInstall={() => promptInstall()} planCurrent={route.name === 'plan'} />
      <p className="sample-banner">Sample apartments for practice. A real apartment still has to be confirmed with the broker and your worker.</p>
      <main className="stage" ref={stageRef}>
        <div className="view" key={route.id ? `${route.name}-${route.id}` : route.name}>
        {route.name === 'search' && (
          <>
            <div className="welcome-row">
              <div>
                <p className="eyebrow">The search starts here</p>
                <h1>Actual “voucher-friendly” units.</h1>
                <p className="pitch">
                  No more “Let me give you a call back.” No more “I’ll transfer you to that department. Just a sec.” No more bullshit.<br />
                  Apartments ready to take HASA, CityFHEPS, or Section{'\u00A0'}8.
                </p>
              </div>
              {step.external ? (
                <a className="setup-cta" href={step.href} target="_blank" rel="noreferrer">
                  <Icon name="external" size={17} /> {step.label}
                </a>
              ) : step.action === 'onboard' ? (
                <button type="button" className="setup-cta" onClick={() => setOnboardingOpen(true)}>
                  <Icon name="plus" size={17} /> {step.label}
                </button>
              ) : (
                <a className="setup-cta" href={step.href}>
                  <Icon name="plus" size={17} /> {step.label}
                </a>
              )}
            </div>
            <SearchPage
              listings={listings}
              total={LISTINGS.length}
              filters={filters}
              onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
              saved={saved}
              onToggleSave={toggleSaved}
              onOpen={(id) => go(`#/listing/${id}`)}
              planFlags={(item) => assessListing(item, plan)}
            />
          </>
        )}
        {route.name === 'detail' && listing && (
          <DetailPage
            listing={listing}
            flags={assessListing(listing, plan)}
            plan={plan}
            saved={saved.includes(listing.id)}
            onToggleSave={() => toggleSaved(listing.id)}
            onBack={() => go('#/')}
            onAsk={(prompt) => askAboutListing(listing.id, prompt)}
            onDraft={() => setPaywall('drafts')}
          />
        )}
        {route.name === 'detail' && !listing && (
          <div className="empty">
            <h1>That sample is not on this list.</h1>
            <button type="button" className="button" onClick={() => go('#/')}>Back to search</button>
          </div>
        )}
        {route.name === 'steps' && <StepsPage checked={checked} onToggle={toggleStep} />}
        {route.name === 'resources' && <ResourcesPage />}
        {route.name === 'plan' && <PlanPage plan={plan} onChange={updatePlan} />}
        {route.name === 'blog' && <BlogList />}
        {route.name === 'post' && <BlogPost post={post} />}
        {route.name === 'info' && <InfoPage page={infoPage} />}
        </div>
        <Footer />
      </main>
      <Dock
        active={dockActive}
        onSelect={(id) => {
          if (id === 'assistant') {
            setAssistantListingId(route.name === 'detail' ? route.id : null)
            setAssistantOpen(true)
            return
          }
          setAssistantOpen(false)
          go(id === 'search' ? '#/' : `#/${id}`)
        }}
      />
      {assistantOpen && (
        <AssistantSheet
          messages={messages}
          pending={pending}
          input={input}
          includePlan={includePlan}
          configured={configured}
          access={{ ...session, signingIn, signInError }}
          onInput={setInput}
          onIncludePlan={setIncludePlan}
          onSend={send}
          onClose={closeAssistant}
          onGoogleCredential={signIn}
          onSignOut={signOut}
          onOpenResources={openResources}
        />
      )}
      {onboardingOpen && (
        <Onboarding plan={plan} onSave={saveOnboarding} onSkip={closeOnboarding} />
      )}
      {paywall && <Paywall feature={paywall} onClose={() => setPaywall(null)} />}
    </div>
  )
}
