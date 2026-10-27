import { getTurnstileToken } from './turnstile.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './index.css'
import { AssistantSheet } from './components/AssistantSheet.jsx'
import { DetailPage } from './components/DetailPage.jsx'
import { BlogList, BlogPost } from './components/BlogPage.jsx'
import { Dock } from './components/Dock.jsx'
import { Footer, InfoPage } from './components/Footer.jsx'
import { Header } from './components/Header.jsx'
import { CookiePrompt } from './components/CookiePrompt.jsx'
import { AnalyticsConsent } from './components/AnalyticsConsent.jsx'
import { readConsent, trackView } from './analytics.js'
import { Onboarding } from './components/Onboarding.jsx'
import { Paywall } from './components/Paywall.jsx'
import { PlanPage } from './components/PlanPage.jsx'
import { DeleteAccountDialog } from './components/DeleteAccountDialog.jsx'
import { clearDeviceData } from './deviceData.js'
import { ResourcesPage } from './components/ResourcesPage.jsx'
import { SearchPage } from './components/SearchPage.jsx'
import { AfterYouFindPage } from './components/AfterYouFindPage.jsx'
import { MovingHelpPage } from './components/MovingHelpPage.jsx'
import { StepsPage } from './components/StepsPage.jsx'
import { FREE_COACH_QUESTIONS } from './coachLimit.js'
import { POSTS } from './blog.js'
import { LISTINGS } from './data.js'
import { SITE_PAGES } from './sitePages.js'
import { PROGRAMS, VOUCHER_PROGRAMS, assessListing, filterListings } from './fit.js'
import { onInstallAvailable, promptInstall } from './install.js'
import { readItem, readJson, writeItem } from './storage.js'
import { dayNumber } from './dates.js'
import { SECTION8_AGENCIES } from './data/section8.js'
import { cityfhepsAllowance, normalizeHousehold } from './rentCheck.js'
import { incomePeriod, storedIncome } from './incomePrescreen.js'

const PLAN_KEY = 'leasepath.plan'
const SAVED_KEY = 'leasepath.saved'
const STEPS_KEY = 'leasepath.steps'
const ONBOARD_KEY = 'leasepath.onboarded'
const INTENT_KEY = 'leasepath.intent'
const NEIGHBORHOOD_KEY = 'leasepath.neighborhood'
// Device-only answers for the rent checks and the income pre-screen (letter issue date, voucher agency and size,
// utility amounts, household income).
// Never sent to /api/account or /api/guide.
const CHECKS_KEY = 'leasepath.checks'
const SHARE_KEY = 'leasepath.shareWithRuby'

const WELCOME = {
  role: 'assistant',
  local: true,
  content:
    "Hi, I'm Ruby. I'm designed to assist you in your housing search and help you navigate the complex and fiercely competitive NYC rental market.\n\nI help you stay focused on finding that apartment with a housing voucher.\n\nI know it can be difficult, even exhausting, to search for an apartment with a voucher.\n\nFrom here on out, you don't have to do it alone. I will walk you through every step: from homeless to shelter, to SRO, to navigating the complexities of HRA's bureaucracy. I'll help you keep track of your documents and deadlines for your landlord, broker and caseworker.\n\nWelcome to LeasePath. Let's get you into an apartment.\n\nHave you been given a shopping letter yet by your caseworker?",
}

function loadJson(key, fallback) {
  return readJson(key, fallback)
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
    household: normalizeHousehold(stored.household),
    letterRent: stored.letterRent ? String(stored.letterRent).replace(/[^\d]/g, '') : '',
    utilities: typeof stored.utilities === 'string' ? stored.utilities : '',
    situation: typeof stored.situation === 'string' ? stored.situation : '',
    receiving,
  }
}

function emptyChecks() {
  return { letterDate: '', section8Agency: '', voucherBedrooms: '', hasaDeduction: '', cityfhepsAllowance: '', incomeAmount: '', incomePeriod: 'month' }
}

function loadChecks() {
  const stored = loadJson(CHECKS_KEY, {})
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return emptyChecks()
  const empty = emptyChecks()
  return {
    letterDate: typeof stored.letterDate === 'string' && dayNumber(stored.letterDate) !== null ? stored.letterDate : empty.letterDate,
    section8Agency: SECTION8_AGENCIES.includes(stored.section8Agency) ? stored.section8Agency : empty.section8Agency,
    voucherBedrooms: ['0', '1', '2', '3', '4', '5', '6', '7', '8'].includes(String(stored.voucherBedrooms)) ? String(stored.voucherBedrooms) : empty.voucherBedrooms,
    hasaDeduction: stored.hasaDeduction ? String(stored.hasaDeduction).replace(/[^\d]/g, '').slice(0, 5) : empty.hasaDeduction,
    cityfhepsAllowance: typeof stored.cityfhepsAllowance === 'string' && cityfhepsAllowance(stored.cityfhepsAllowance) ? stored.cityfhepsAllowance : empty.cityfhepsAllowance,
    incomeAmount: storedIncome(stored.incomeAmount),
    incomePeriod: incomePeriod(stored.incomePeriod),
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
  if (hash === '/after-you-find' || hash === '/after-you-find#chap') return { name: 'after' }
  if (hash === '/moving-help') return { name: 'moving' }
  if (hash === '/steps' || hash === '/resources' || hash === '/plan' || hash === '/blog') {
    return { name: hash.slice(1) }
  }
  return { name: 'search' }
}

export default function App() {
  const [route, setRoute] = useState(parseHash)
  const [plan, setPlan] = useState(loadPlan)
  const [checks, setChecks] = useState(loadChecks)
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
      q: readItem(NEIGHBORHOOD_KEY) || '',
      program: PROGRAMS.includes(initial.program) ? initial.program : 'All',
      borough: 'All',
      beds: 'Any',
      maxRent: '',
      savedOnly: false,
      sort: 'rent-asc',
    }
  })
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [onboardingPreset, setOnboardingPreset] = useState(null)
  const [intent, setIntent] = useState(() => {
    const stored = readItem(INTENT_KEY)
    return stored === 'letter' || stored === 'apply' ? stored : ''
  })
  const [paywall, setPaywall] = useState(null)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [analyticsConsent, setAnalyticsConsent] = useState(readConsent)

  // Analytics: nothing loads or is pushed without consent, and HASA views and Ruby's chat send nothing.
  useEffect(() => {
    trackView(window, document, { hashPath: window.location.hash.replace(/^#/, '') || '/', assistantOpen, consent: analyticsConsent })
  }, [route, assistantOpen, analyticsConsent])
  const [assistantListingId, setAssistantListingId] = useState(null)
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  // Off by default. The choice is saved on this device for this person, and cleared by Delete my data.
  const [includePlan, setIncludePlanState] = useState(() => readItem(SHARE_KEY) === 'on')
  const setIncludePlan = useCallback((on) => {
    setIncludePlanState(Boolean(on))
    writeItem(SHARE_KEY, on ? 'on' : 'off')
  }, [])
  const [configured, setConfigured] = useState(null)
  const [canInstall, setCanInstall] = useState(false)
  const [accountLive, setAccountLive] = useState(false)
  const [accountTracksSignIn, setAccountTracksSignIn] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [signInError, setSignInError] = useState('')
  const [session, setSession] = useState({
    loaded: false,
    signedIn: false,
    email: '',
    anonymousRemaining: FREE_COACH_QUESTIONS,
    accountRemaining: null,
    googleClientId: '',
    googleNonce: '',
    secretReady: true,
    authReady: false,
  })

  if (session.signedIn !== accountTracksSignIn) {
    setAccountTracksSignIn(session.signedIn)
    setAccountLive(false)
  }

  const applyAccess = useCallback((data) => {
    setSession((current) => ({
      loaded: true,
      signedIn: Boolean(data.signedIn),
      email: data.email || '',
      anonymousRemaining: Number.isInteger(data.anonymousRemaining) ? data.anonymousRemaining : current.anonymousRemaining,
      accountRemaining: Number.isInteger(data.accountRemaining) ? data.accountRemaining : data.signedIn ? current.accountRemaining : null,
      googleClientId: typeof data.googleClientId === 'string' ? data.googleClientId : current.googleClientId,
      googleNonce: typeof data.googleNonce === 'string' ? data.googleNonce : current.googleNonce,
      secretReady: data.secretReady !== false,
      authReady: Boolean(data.authReady),
    }))
    if (typeof data.configured === 'boolean') setConfigured(data.configured)
  }, [])

  const writeAccountPlace = useCallback((place) => {
    setPlan((current) => {
      const next = {
        ...current,
        program: place.program || '',
        household: normalizeHousehold(place.household),
        letterRent: place.letterRent || '',
        utilities: place.utilities || '',
        receiving: place.receiving || '',
        situation: place.situation || '',
      }
      writeItem(PLAN_KEY, JSON.stringify(next))
      return next
    })
    const savedIds = Array.isArray(place.savedIds) ? place.savedIds.filter((id) => typeof id === 'string') : []
    const steps = Array.isArray(place.steps) ? place.steps.filter((index) => Number.isInteger(index)) : []
    writeItem(SAVED_KEY, JSON.stringify(savedIds))
    writeItem(STEPS_KEY, JSON.stringify(steps))
    writeItem(NEIGHBORHOOD_KEY, place.neighborhood || '')
    setSaved(savedIds)
    setChecked(steps)
    setFilters((current) => ({
      ...current,
      q: place.neighborhood || '',
      program: PROGRAMS.includes(place.program) ? place.program : 'All',
    }))
  }, [])

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
  }, [applyAccess])

  useEffect(() => {
    writeItem(NEIGHBORHOOD_KEY, filters.q)
  }, [filters.q])

  useEffect(() => {
    if (!session.loaded || !session.signedIn) return undefined
    const controller = new AbortController()
    const storedPlan = loadPlan()
    const storedSaved = loadJson(SAVED_KEY, [])
    const storedSteps = loadJson(STEPS_KEY, [])
    const place = {
      program: storedPlan.program,
      neighborhood: readItem(NEIGHBORHOOD_KEY) || '',
      letterRent: storedPlan.letterRent,
      utilities: storedPlan.utilities,
      household: storedPlan.household,
      receiving: storedPlan.receiving,
      situation: storedPlan.situation,
      savedIds: Array.isArray(storedSaved) ? storedSaved : [],
      steps: Array.isArray(storedSteps) ? storedSteps : [],
    }
    fetch('/api/account', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ place }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (controller.signal.aborted) return
        applyAccess(data)
        if (!response.ok || !data.place) {
          setSignInError(data.message || 'Your account did not load. Your letter stays on this phone.')
          return
        }
        setSignInError('')
        if (data.adopted === false) writeAccountPlace(data.place)
        setAccountLive(true)
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return
        setSignInError('LeasePath could not reach your account. Your letter stays on this phone.')
      })
    return () => controller.abort()
  }, [session.loaded, session.signedIn, applyAccess, writeAccountPlace])

  useEffect(() => {
    if (!accountLive || !session.signedIn) return undefined
    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetch('/api/account', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          place: {
            program: plan.program,
            neighborhood: filters.q,
            letterRent: plan.letterRent,
            utilities: plan.utilities,
            household: plan.household,
            receiving: plan.receiving,
            situation: plan.situation,
            savedIds: saved,
            steps: checked,
          },
        }),
      })
        .then(async (response) => {
          if (response.status !== 401) return
          const data = await response.json().catch(() => ({}))
          applyAccess(data)
        })
        .catch(() => {})
    }, 400)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [accountLive, session.signedIn, plan, saved, checked, filters.q, applyAccess])

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
      writeItem(PLAN_KEY, JSON.stringify(next))
      return next
    })
  }

  const updateChecks = (patch) => {
    setChecks((current) => {
      const next = { ...current, ...patch }
      writeItem(CHECKS_KEY, JSON.stringify(next))
      return next
    })
  }

  const closeOnboarding = () => {
    writeItem(ONBOARD_KEY, '1')
    setOnboardingOpen(false)
    setOnboardingPreset(null)
  }

  const chooseIntent = (next) => {
    writeItem(INTENT_KEY, next)
    writeItem(ONBOARD_KEY, '1')
    setIntent(next)
    if (next === 'letter') {
      updatePlan({ receiving: 'has' })
      setOnboardingPreset('letter')
      setOnboardingOpen(true)
      return
    }
    if (next === 'apply') {
      updatePlan({ receiving: 'none' })
      setOnboardingOpen(false)
      setOnboardingPreset(null)
    }
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
      writeItem(SAVED_KEY, JSON.stringify(next))
      return next
    })
  }

  const toggleStep = (index) => {
    setChecked((current) => {
      const next = current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
      writeItem(STEPS_KEY, JSON.stringify(next))
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
  }, [applyAccess])

  const signUpWithEmail = useCallback(async ({ email, password, mode }) => {
    setSignInError('')
    setSigningIn(true)
    try {
      const response = await fetch('/api/auth/email', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, mode }),
      })
      const data = await response.json().catch(() => ({}))
      applyAccess(data)
      if (!response.ok) {
        setSignInError(data.message || 'That email sign-up did not finish. Try again.')
        return
      }
      if (data.created) {
        setOnboardingPreset('account')
        setOnboardingOpen(true)
      }
    } catch {
      setSignInError('LeasePath could not reach sign-in. Check your connection and try again.')
    } finally {
      setSigningIn(false)
    }
  }, [applyAccess])

  // Income typed into the pre-screen lives only on this device. It is cleared on sign-out and when the account is deleted,
  // so the next person on a shared phone does not see it.
  const clearIncome = useCallback(() => {
    setChecks((current) => {
      const next = { ...current, incomeAmount: '', incomePeriod: 'month' }
      writeItem(CHECKS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const [deleteOpen, setDeleteOpen] = useState(false)
  const openDelete = useCallback(() => setDeleteOpen(true), [])

  // Server first (account row + counters + session cookie), then this device. If the server call fails, nothing is cleared.
  const deleteAccount = useCallback(async () => {
    // Income never leaves the device, so it is cleared first, even if the server call fails.
    clearIncome()
    setSignInError('')
    if (session.signedIn) {
      try {
        const response = await fetch('/api/account', { method: 'DELETE', credentials: 'same-origin' })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) return { ok: false, message: data.message }
        applyAccess(data)
      } catch {
        return { ok: false, message: 'LeasePath could not reach your account. Check your connection and try again. Nothing was deleted.' }
      }
    }
    await clearDeviceData()
    setPlan(emptyPlan())
    setChecks(emptyChecks())
    setSaved([])
    setChecked([])
    setMessages([WELCOME])
    return { ok: true }
  }, [applyAccess, clearIncome, session.signedIn])

  const finishDelete = useCallback(async () => {
    setDeleteOpen(false)
    // State effects may have re-written empty values after the first clear; clear once more before reloading.
    await clearDeviceData()
    window.location.hash = '#/'
    window.location.reload()
  }, [])

  // Signed-in sign-out: save the latest details to the account, then clear this phone. They come back on the next sign-in.
  const signOut = useCallback(async () => {
    if (!window.confirm("Sign out of LeasePath?\n\nSigning out clears your voucher details from this phone. Income you typed won't be saved.")) return
    clearIncome()
    setSignInError('')
    let savedToAccount = true
    if (accountLive) {
      try {
        const response = await fetch('/api/account', {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            place: {
              program: plan.program,
              neighborhood: filters.q,
              letterRent: plan.letterRent,
              utilities: plan.utilities,
              household: plan.household,
              receiving: plan.receiving,
              situation: plan.situation,
              savedIds: saved,
              steps: checked,
            },
          }),
        })
        savedToAccount = response.ok
      } catch {
        savedToAccount = false
      }
    }
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
      const data = await response.json().catch(() => ({}))
      applyAccess(data)
    } catch {
      setSignInError('LeasePath could not sign you out. Try again.')
      return
    }
    setAccountLive(false)
    await clearDeviceData()
    setPlan(emptyPlan())
    setChecks(emptyChecks())
    setSaved([])
    setChecked([])
    setFilters((current) => ({ ...current, q: '', program: 'All' }))
    setMessages([WELCOME])
    if (!savedToAccount) {
      window.alert('You are signed out and this phone is cleared, but your latest voucher details could not be saved to your account. When you sign in again, check them in My voucher.')
    }
  }, [accountLive, applyAccess, checked, clearIncome, filters.q, plan, saved])

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
      const post = (extra = {}) => fetch('/api/guide', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...extra,
          messages: nextMessages.filter((message) => !message.local).slice(-8),
          includePlan,
          // Voucher details leave the phone only when the person has turned sharing on.
          plan: includePlan
            ? {
                program: plan.program,
                household: plan.household,
                letterRent: plan.letterRent,
                utilities: plan.utilities,
              }
            : undefined,
          listing,
        }),
      })
      let response = await post()
      let data = await response.json().catch(() => ({}))
      if (response.status === 403 && data?.error === 'challenge_required') {
        // One quick Cloudflare check, then the Worker remembers it for a while.
        let turnstileToken = ''
        try {
          turnstileToken = await getTurnstileToken()
        } catch {
          turnstileToken = ''
        }
        if (turnstileToken) {
          response = await post({ turnstileToken })
          data = await response.json().catch(() => ({}))
        }
      }
      if (data && typeof data === 'object') applyAccess(data)
      if (response.status === 503 && data.error === 'missing_key') setConfigured(false)
      if (data.error === 'sign_in_required') return
      const reply = data.reply || data.message || 'The assistant did not answer. Try again in a moment.'
      setMessages((current) => [...current, { role: 'assistant', content: reply }])
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'LeasePath could not reach Ruby. Check your connection and try again.' },
      ])
    } finally {
      setPending(false)
    }
  }, [assistantListingId, includePlan, messages, pending, plan, session, applyAccess])

  const askAboutListing = (listingId, prompt) => {
    setAssistantListingId(listingId)
    send(prompt, listingId)
  }

  const listing = route.name === 'detail' ? LISTINGS.find((item) => item.id === route.id) : null
  const post = route.name === 'post' ? POSTS.find((item) => item.slug === route.id) : null
  const infoPage = route.name === 'info' ? SITE_PAGES.find((item) => item.slug === route.id) : null
  const dockActive = assistantOpen
    ? 'assistant'
    : route.name === 'detail'
      ? 'search'
      : route.name === 'post'
        ? 'blog'
        : route.name === 'after'
          ? 'steps'
          : route.name === 'moving'
            ? 'resources'
            : route.name
  const navSelect = (id) => {
    if (id === 'assistant') {
      setAssistantListingId(route.name === 'detail' ? route.id : null)
      setAssistantOpen(true)
      return
    }
    setAssistantOpen(false)
    go(id === 'search' ? '#/' : `#/${id}`)
  }

  return (
    <div className="app">
      <Header
        navActive={dockActive}
        onNav={navSelect}
        canInstall={canInstall}
        onInstall={() => promptInstall()}
        planCurrent={route.name === 'plan'}
        session={session}
        signingIn={signingIn}
        signInError={signInError}
        onGoogleCredential={signIn}
        onEmailAuth={signUpWithEmail}
        onSignOut={signOut}
      />
      <main className="stage" ref={stageRef}>
        <div className="view" key={route.id ? `${route.name}-${route.id}` : route.name}>
        {route.name === 'search' && (
            <SearchPage
              listings={listings}
              total={LISTINGS.length}
              filters={filters}
              onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
              saved={saved}
              onToggleSave={toggleSaved}
              onOpen={(id) => go(`#/listing/${id}`)}
              planFlags={(item) => assessListing(item, plan, checks)}
              intent={intent}
              onIntent={chooseIntent}
              onAsk={() => { setAssistantListingId(null); setAssistantOpen(true) }}
            />
        )}
        {route.name === 'detail' && listing && (
          <DetailPage
            listing={listing}
            flags={assessListing(listing, plan, checks)}
            plan={plan}
            checks={checks}
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
        {route.name === 'after' && <AfterYouFindPage />}
        {route.name === 'resources' && <ResourcesPage />}
        {route.name === 'moving' && <MovingHelpPage />}
        {route.name === 'plan' && <PlanPage plan={plan} onChange={updatePlan} checks={checks} onChecks={updateChecks} onClearIncome={clearIncome} signedIn={session.signedIn} onDeleteAccount={openDelete} />}
        {route.name === 'blog' && <BlogList />}
        {route.name === 'post' && <BlogPost post={post} />}
        {route.name === 'info' && <InfoPage page={infoPage} />}
        </div>
        <Footer compact={route.name === 'search'} />
      </main>
      <CookiePrompt />
      <AnalyticsConsent onChange={setAnalyticsConsent} />
      <DeleteAccountDialog
        open={deleteOpen}
        signedIn={session.signedIn}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={deleteAccount}
        onDone={finishDelete}
      />
      <Dock active={dockActive} onSelect={navSelect} />
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
          onOpenResources={openResources}
        />
      )}
      {onboardingOpen && (
        <Onboarding plan={plan} onSave={saveOnboarding} onSkip={closeOnboarding} preset={onboardingPreset} />
      )}
      {paywall && <Paywall feature={paywall} onClose={() => setPaywall(null)} />}
    </div>
  )
}
