import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  addVaultDocument,
  createVault,
  deleteVaultDocument,
  getVaultDocuments,
  lockVault as clearVaultKey,
  unlockVault,
  vaultExists,
  withVaultDocument,
} from './vault.js'

const NAV_ITEMS = [
  { id: 'homes', label: 'Find a home', icon: 'home' },
  { id: 'resources', label: 'Resources', icon: 'heart' },
  { id: 'assistant', label: 'Guide', icon: 'sparkle' },
  { id: 'vault', label: 'My vault', icon: 'lock' },
  { id: 'steps', label: 'Step guide', icon: 'steps' },
]

const LISTINGS = [
  { id: 1, neighborhood: 'Crown Heights', borough: 'Brooklyn', zip: '11225', address: 'Lefferts Ave near Nostrand Ave', beds: 1, price: 2180, tags: ['Elevator', 'Laundry'], color: 'rose', initials: 'CH' },
  { id: 2, neighborhood: 'Washington Heights', borough: 'Manhattan', zip: '10032', address: 'W 165th St near Broadway', beds: 2, price: 2650, tags: ['Pets allowed', 'Near A train'], color: 'blue', initials: 'WH' },
  { id: 3, neighborhood: 'Jackson Heights', borough: 'Queens', zip: '11372', address: '37th Ave near 82nd St', beds: 2, price: 2425, tags: ['Elevator', 'Near 7 train'], color: 'gold', initials: 'JH' },
  { id: 4, neighborhood: 'Flatbush', borough: 'Brooklyn', zip: '11226', address: 'Church Ave near Ocean Ave', beds: 3, price: 3150, tags: ['Laundry', 'Near Q train'], color: 'green', initials: 'FB' },
  { id: 5, neighborhood: 'Mott Haven', borough: 'Bronx', zip: '10454', address: 'E 138th St near Willis Ave', beds: 1, price: 1950, tags: ['Near 6 train', 'Updated'], color: 'lavender', initials: 'MH' },
  { id: 6, neighborhood: 'Elmhurst', borough: 'Queens', zip: '11373', address: 'Broadway near Elmhurst Ave', beds: 3, price: 2980, tags: ['Near M/R train', 'Laundry'], color: 'peach', initials: 'EL' },
]

const RESOURCES = [
  { category: 'Food & essentials', icon: 'basket', title: 'Find food near you', description: 'Search NYC food pantries, community kitchens, and meals by ZIP code.', action: 'Search food help', href: 'https://www.nyc.gov/site/dycd/services/food_pantries.page', tint: 'mint' },
  { category: 'Food & essentials', icon: 'bag', title: 'Project Foodbox', description: 'Learn about free grocery delivery for eligible New Yorkers.', action: 'Check the program', href: 'https://www.projectfoodbox.org/', tint: 'peach' },
  { category: 'Benefits', icon: 'card', title: 'SNAP & cash assistance', description: 'Apply for benefits, check a case, or manage your ACCESS HRA account.', action: 'Open ACCESS HRA', href: 'https://a069-access.nyc.gov/accesshra/', tint: 'lavender' },
  { category: 'Housing support', icon: 'scale', title: 'Housing legal help', description: 'Get free or low-cost help with a housing issue or possible discrimination.', action: 'Find legal help', href: 'https://www.nyc.gov/site/hra/help/legal-services-for-tenants.page', tint: 'sky' },
  { category: 'Housing support', icon: 'shield', title: 'Source of income rights', description: 'NYC law protects many lawful sources of income, including housing vouchers.', action: 'Read NYC guidance', href: 'https://www.nyc.gov/site/cchr/media/source-of-income.page', tint: 'butter' },
  { category: 'Emergency help', icon: 'phone', title: 'Get immediate support', description: 'Call 311 for city services. Call 911 for an immediate emergency.', action: 'Call 311', href: 'tel:311', tint: 'rose' },
]

const DEFAULT_STEPS = [
  { title: 'Know your program', detail: 'Confirm the name of your voucher or housing program and who to contact with questions.' },
  { title: 'Get your rent amount in writing', detail: 'Check your current shopping letter or ask your worker for the approved rent and utility allowance.' },
  { title: 'Gather your documents', detail: 'Keep copies of your shopping letter, photo ID, income records, and any forms your worker requests.' },
  { title: 'Search and reach out', detail: 'Compare asking rent and included utilities with your approved amount before scheduling a viewing.' },
  { title: 'Submit the apartment for review', detail: 'Ask your program contact which landlord forms, inspection, and approval steps apply.' },
  { title: 'Review before signing', detail: 'Do not move in or pay fees until you understand your program’s approval and lease requirements.' },
]

const SAMPLE_CHAT = [
  { from: 'guide', text: 'Hi, I’m your LeasePath Guide. I can help you understand the next step, learn about housing rights, or draft a message to a broker. I’m an informational guide—not a lawyer or your HRA/HASA worker.' },
]

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
    heart: <><path d="M20.8 8.8c0 5.5-8.8 11-8.8 11s-8.8-5.5-8.8-11A4.8 4.8 0 0 1 12 6.5a4.8 4.8 0 0 1 8.8 2.3Z" /></>,
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3" /></>,
    steps: <><path d="M4 19h5v-5h5V9h6" /><path d="m16 5 4 4-4 4" /><path d="M4 5h4v4H4zM4 14h4v5H4z" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    bed: <><path d="M3 20v-8m0 4h18v4M5 16V9h5a4 4 0 0 1 4 4v3M14 16v-3a4 4 0 0 1 4-4h3v7" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    basket: <><path d="m3 10 2 10h14l2-10H3Z" /><path d="m8 10 4-7 4 7M8 14v2m4-2v2m4-2v2" /></>,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18m-14 5h3" /></>,
    scale: <><path d="M12 3v18m-7-2h14M5 7h14" /><path d="m5 7-3 6h6L5 7Zm14 0-3 6h6l-3-6Z" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    phone: <><path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    upload: <><path d="M12 16V4m-5 5 5-5 5 5" /><path d="M4 16v4h16v-4" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6m-10 5h6m-6 4h6" /></>,
    trash: <><path d="M3 6h18m-2 0-1 14H6L5 6m3 0V4h8v2m-5 4v6m4-6v6" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    plus: <><path d="M12 5v14m-7-7h14" /></>,
    message: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    external: <><path d="M14 3h7v7m-11 4L21 3" /><path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" /></>,
  }
  return <svg {...common}>{paths[name] || paths.file}</svg>
}

function readStoredJson(key, legacyKey, fallback) {
  try {
    const current = localStorage.getItem(key)
    if (current != null) return JSON.parse(current)
    const legacy = localStorage.getItem(legacyKey)
    if (legacy != null) return JSON.parse(legacy)
  } catch {
    return fallback
  }
  return fallback
}

function readProfile() {
  const profile = readStoredJson('leasepath-profile', 'stoop-profile', {})
  return profile && typeof profile === 'object' && !Array.isArray(profile) ? profile : {}
}

function App() {
  const [page, setPage] = useState('homes')
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [profile, setProfile] = useState(readProfile)
  const [showSetup, setShowSetup] = useState(false)
  const [query, setQuery] = useState('')
  const [borough, setBorough] = useState('All boroughs')
  const [bedrooms, setBedrooms] = useState('Any size')
  const [maxRent, setMaxRent] = useState(() => readProfile().rentCap || '')
  const [savedHomes, setSavedHomes] = useState([])
  const [checkedSteps, setCheckedSteps] = useState(() => {
    const storedSteps = readStoredJson('leasepath-steps', 'stoop-steps', [])
    return Array.isArray(storedSteps) ? storedSteps : []
  })
  const [chat, setChat] = useState(SAMPLE_CHAT)
  const [chatInput, setChatInput] = useState('')
  const [brokerDraft, setBrokerDraft] = useState('')
  const [draftCopied, setDraftCopied] = useState(false)
  const [draftCopyError, setDraftCopyError] = useState('')
  const [vaultAvailable, setVaultAvailable] = useState(false)
  const [vaultUnlocked, setVaultUnlocked] = useState(false)
  const [vaultDocs, setVaultDocs] = useState([])
  const [vaultError, setVaultError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const fileInput = useRef(null)
  const assistantCloseButton = useRef(null)

  useEffect(() => {
    const savedProfile = { ...profile }
    delete savedProfile.income
    localStorage.setItem('leasepath-profile', JSON.stringify(savedProfile))
  }, [profile])

  useEffect(() => {
    localStorage.setItem('leasepath-steps', JSON.stringify(checkedSteps))
  }, [checkedSteps])

  useEffect(() => {
    vaultExists().then(setVaultAvailable).catch((error) => setVaultError(error.message))
  }, [])

  useEffect(() => {
    if (!assistantOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setAssistantOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    assistantCloseButton.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [assistantOpen])

  const filteredHomes = useMemo(() => LISTINGS.filter((home) => {
    const text = `${home.neighborhood} ${home.borough} ${home.address} ${home.zip}`.toLowerCase()
    const matchesQuery = !query || text.includes(query.toLowerCase())
    const matchesBorough = borough === 'All boroughs' || home.borough === borough
    const matchesBeds = bedrooms === 'Any size' || (bedrooms === '3+' ? home.beds >= 3 : home.beds === Number(bedrooms))
    const matchesRent = !maxRent || home.price <= Number(maxRent)
    return matchesQuery && matchesBorough && matchesBeds && matchesRent
  }), [borough, bedrooms, maxRent, query])

  const navigate = (id) => {
    if (id === 'assistant') {
      setAssistantOpen(true)
      return
    }
    setPage(id)
    setVaultError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateProfile = (key, value) => setProfile((current) => ({ ...current, [key]: value }))

  const submitChat = (text = chatInput) => {
    const clean = text.trim()
    if (!clean) return
    const answer = getGuideResponse(clean, profile)
    setChat((current) => [...current, { from: 'you', text: clean }, { from: 'guide', text: answer }])
    setChatInput('')
  }

  const createBrokerDraft = () => {
    const program = profile.program || 'housing voucher'
    const rent = profile.rentCap ? ` My approved rent amount is $${Number(profile.rentCap).toLocaleString()} per month${profile.utilities ? `, with ${profile.utilities} included` : ''}.` : ''
    setBrokerDraft(`Hello, I’m interested in the apartment. I have a ${program} and would like to confirm whether you accept applicants using a housing voucher. The listed rent is $____ per month.${rent} Could you let me know what documents or next steps you require? Thank you.`)
    setAssistantOpen(true)
  }

  const toggleSaved = (id) => setSavedHomes((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])

  const onUnlock = async (event) => {
    event.preventDefault()
    setBusy(true)
    setVaultError('')
    try {
      if (vaultAvailable) await unlockVault(password)
      else {
        if (password.length < 10) throw new Error('Choose a passphrase with at least 10 characters.')
        if (password !== confirmPassword) throw new Error('Those passphrases do not match.')
        await createVault(password)
        setVaultAvailable(true)
      }
      setVaultUnlocked(true)
      setPassword('')
      setConfirmPassword('')
      await refreshVault()
    } catch (error) {
      setVaultError(error.message || 'The vault could not be opened.')
    } finally {
      setBusy(false)
    }
  }

  const refreshVault = async () => setVaultDocs(await getVaultDocuments())

  const uploadDocument = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      setVaultError('Files must be 8 MB or smaller.')
      return
    }
    setBusy(true)
    setVaultError('')
    try {
      await addVaultDocument(file)
      await refreshVault()
    } catch (error) {
      setVaultError(error.message || 'This document could not be encrypted and saved.')
    } finally {
      setBusy(false)
    }
  }

  const downloadDocument = async (id, name) => {
    setVaultError('')
    try {
      const { blob } = await withVaultDocument(id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = name
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      setVaultError(error.message || 'This document could not be opened.')
    }
  }

  const removeDocument = async (id) => {
    try {
      await deleteVaultDocument(id)
      await refreshVault()
    } catch (error) {
      setVaultError(error.message || 'This document could not be deleted.')
    }
  }

  const lockVault = useCallback(() => {
    clearVaultKey()
    setVaultUnlocked(false)
    setVaultDocs([])
    setPassword('')
    setConfirmPassword('')
  }, [])

  useEffect(() => {
    if (!vaultUnlocked) return undefined
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') lockVault()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', lockVault)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', lockVault)
    }
  }, [lockVault, vaultUnlocked])

  const completeCount = checkedSteps.length

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); navigate('homes') }} aria-label="LeasePath home">
          <span className="brand-mark"><span /><span /><span /></span>
          <span className="brand-name">Lease<span>Path</span></span>
        </a>
        <div className="topbar-note"><span className="status-dot" /> Your housing journey, one step at a time</div>
        <button className="profile-button" type="button" onClick={() => setShowSetup(true)}>
          <span className="avatar">{profile.firstName ? profile.firstName[0].toUpperCase() : '♡'}</span>
          <span>{profile.firstName || 'My plan'}</span>
          <Icon name="chevron" size={16} />
        </button>
      </header>

      <main className="main-content">
        <div className="mobile-welcome">
          <p className="eyebrow">A little help finding home</p>
          <h1>Make room for<br />what’s next.</h1>
          <p>Find a place, understand your options, and keep your housing steps in one spot.</p>
        </div>

        {page === 'homes' && (
          <section className="page-section">
            <div className="welcome-row">
              <div>
                <p className="eyebrow">THE SEARCH STARTS HERE</p>
                <h1>Find a place to call home.</h1>
                <p className="section-subtitle">Searching for an apartment with a housing voucher doesn’t have to be so exhausting.</p>
              </div>
              <button className="button button-secondary setup-cta" onClick={() => setShowSetup(true)} type="button">
                <Icon name="plus" size={17} /> Add your voucher details
              </button>
            </div>

            <div className="search-panel">
              <div className="search-heading">
                <div><span className="search-heading-icon"><Icon name="search" size={18} /></span><span>Find your next neighborhood</span></div>
                <span className="sample-label"><span /> Sample listings</span>
              </div>
              <div className="search-controls">
                <label className="search-field neighborhood-field">
                  <span>NEIGHBORHOOD OR ZIP</span>
                  <span className="input-with-icon"><Icon name="pin" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Crown Heights" aria-label="Neighborhood or borough" /></span>
                </label>
                <label className="search-field">
                  <span>BEDROOMS</span>
                  <select value={bedrooms} onChange={(event) => setBedrooms(event.target.value)}><option>Any size</option><option value="0">Studio</option><option value="1">1 bedroom</option><option value="2">2 bedrooms</option><option value="3+">3+ bedrooms</option></select>
                </label>
                <label className="search-field">
                  <span>BOROUGH</span>
                  <select value={borough} onChange={(event) => setBorough(event.target.value)}>{['All boroughs', 'Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Staten Island'].map((item) => <option key={item}>{item}</option>)}</select>
                </label>
                <label className="search-field rent-field">
                  <span>MAX MONTHLY RENT</span>
                  <span className="rent-input"><span>$</span><input inputMode="numeric" value={maxRent} onChange={(event) => setMaxRent(event.target.value.replace(/\D/g, ''))} placeholder={profile.rentCap || 'No limit'} aria-label="Maximum monthly rent" /></span>
                </label>
              </div>
              <p className="search-note"><Icon name="shield" size={14} /> Use the approved amount in your current program paperwork. Rent limits and utility rules vary.</p>
            </div>

            <div className="results-heading">
              <div><h2>Places to explore <span>{filteredHomes.length}</span></h2><p>Examples to help you get started—not live listings or offers.</p></div>
              {profile.rentCap && <span className="voucher-pill"><Icon name="check" size={14} /> Your plan: up to ${Number(profile.rentCap).toLocaleString()}</span>}
            </div>

            {filteredHomes.length ? (
              <div className="listing-grid">
                {filteredHomes.map((home, index) => (
                  <article className="listing-card" key={home.id}>
                    <div className={`listing-art art-${home.color}`}>
                      <div className="art-skyline" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /></div>
                      <span className="art-label">NYC · EXAMPLE {String(index + 1).padStart(2, '0')}</span>
                      <button className={`save-button ${savedHomes.includes(home.id) ? 'is-saved' : ''}`} type="button" aria-label={savedHomes.includes(home.id) ? 'Remove saved apartment' : 'Save apartment'} onClick={() => toggleSaved(home.id)}><span>{savedHomes.includes(home.id) ? '♥' : '♡'}</span></button>
                      <span className="art-building"><span className="building-windows" /></span>
                    </div>
                    <div className="listing-details">
                      <div className="listing-title-row"><div><p className="listing-neighborhood">{home.neighborhood}</p><p className="listing-address">{home.address}, {home.borough}</p></div><div className="listing-price">${home.price.toLocaleString()}<small>/mo</small></div></div>
                      <div className="listing-meta"><span><Icon name="bed" size={16} /> {home.beds === 0 ? 'Studio' : `${home.beds} bed${home.beds > 1 ? 's' : ''}`}</span>{home.tags.slice(0, 1).map((tag) => <span key={tag} className="tag">{tag}</span>)}</div>
                      <button className="text-button listing-message" type="button" onClick={createBrokerDraft}>Draft a message <Icon name="arrow" size={15} /></button>
                    </div>
                  </article>
                ))}
              </div>
            ) : <div className="empty-state"><span className="empty-icon"><Icon name="search" size={23} /></span><h3>No examples match those filters</h3><p>Try a different borough, bedroom count, or rent amount.</p><button className="text-button" onClick={() => { setQuery(''); setBorough('All boroughs'); setBedrooms('Any size'); setMaxRent('') }} type="button">Clear filters <Icon name="arrow" size={15} /></button></div>}

            <p className="disclaimer-line"><Icon name="clock" size={15} /> These illustrative examples are not verified vacancies, current prices, or program-approved units. Always confirm details directly and with your program worker.</p>
          </section>
        )}

        {page === 'resources' && <section className="page-section">
          <div className="page-header"><p className="eyebrow">SUPPORT BEYOND THE SEARCH</p><h1>Resources for real life.</h1><p className="section-subtitle">Housing is one part of the picture. Find city services and trusted starting points.</p></div>
          <div className="resource-callout"><span className="callout-icon"><Icon name="heart" size={22} /></span><div><strong>Taking care of today matters, too.</strong><p>Browse support for food, benefits, housing questions, and urgent needs.</p></div><span className="callout-spark">✳</span></div>
          <div className="resource-grid">{RESOURCES.map((resource) => <article className="resource-card" key={resource.title}><div className={`resource-icon tint-${resource.tint}`}><Icon name={resource.icon} size={20} /></div><p className="resource-category">{resource.category}</p><h2>{resource.title}</h2><p className="resource-description">{resource.description}</p><a className="text-button" href={resource.href} target={resource.href.startsWith('tel:') ? undefined : '_blank'} rel="noreferrer">{resource.action}<Icon name={resource.href.startsWith('tel:') ? 'phone' : 'external'} size={15} /></a></article>)}</div>
          <p className="disclaimer-line"><Icon name="shield" size={15} /> External programs have their own eligibility rules and may change. Check the linked agency for current information.</p>
        </section>}

        {assistantOpen && <div className="assistant-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAssistantOpen(false) }}><section className="assistant-modal" role="dialog" aria-modal="true" aria-labelledby="assistant-title">
          <div className="assistant-modal-heading"><div><p className="eyebrow">A HELPFUL PLACE TO START</p><h2 id="assistant-title">Let’s figure it out together.</h2><p>Ask a question or get help writing a message. No personal documents needed.</p></div><button ref={assistantCloseButton} className="icon-button assistant-close" type="button" aria-label="Close LeasePath Guide" onClick={() => setAssistantOpen(false)}><Icon name="close" size={20} /></button></div>
          <div className="assistant-layout">
            <div className="chat-card">
              <div className="chat-header"><div className="guide-avatar"><Icon name="sparkle" size={19} /></div><div><strong>Your LeasePath Guide</strong><span><i /> Ready to help</span></div><span className="private-chip"><Icon name="lock" size={13} /> Private</span></div>
              <div className="chat-messages" aria-live="polite">{chat.map((message, index) => <div className={`chat-row ${message.from === 'you' ? 'from-you' : ''}`} key={`${index}-${message.from}`}><div className="chat-avatar">{message.from === 'you' ? 'Y' : <Icon name="sparkle" size={15} />}</div><div className="chat-bubble">{message.text}</div></div>)}</div>
              <div className="prompt-chips"><button type="button" onClick={() => submitChat('What should I ask a broker about my voucher?')}>Questions for a broker</button><button type="button" onClick={() => submitChat('What are my source of income rights in NYC?')}>Know my rights</button><button type="button" onClick={() => submitChat('What does my next housing step look like?')}>My next step</button></div>
              <form className="chat-compose" onSubmit={(event) => { event.preventDefault(); submitChat() }}><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Ask about your housing journey…" aria-label="Message the LeasePath Guide" /><button type="submit" aria-label="Send message" disabled={!chatInput.trim()}><Icon name="arrow" size={18} /></button></form>
              <p className="chat-disclaimer">Informational only—not legal, financial, or case-specific advice. Don’t share Social Security numbers or private documents here.</p>
            </div>
            <aside className="draft-card"><div className="draft-card-top"><span className="draft-icon"><Icon name="message" size={18} /></span><span className="draft-label">MESSAGE HELPER</span></div><h2>Say hello to a broker.</h2><p>Start with a short message. Share only the voucher details you’re comfortable sharing.</p>{brokerDraft ? <div className="draft-result"><textarea value={brokerDraft} onChange={(event) => setBrokerDraft(event.target.value)} aria-label="Editable broker message" /><button className="button button-primary full-button" onClick={async () => { try { await navigator.clipboard.writeText(brokerDraft); setDraftCopyError(''); setDraftCopied(true); setTimeout(() => setDraftCopied(false), 1800) } catch { setDraftCopied(false); setDraftCopyError('Could not copy automatically. Select the message above and copy it instead.') } }} type="button">{draftCopied ? <><Icon name="check" size={16} /> Copied</> : 'Copy message'}</button>{draftCopyError && <p className="copy-error" role="alert">{draftCopyError}</p>}</div> : <button className="button button-primary full-button" onClick={createBrokerDraft} type="button">Create a draft <Icon name="arrow" size={16} /></button>}<div className="draft-footnote"><Icon name="shield" size={15} /> Your draft stays on this device. Review it before sending.</div></aside>
          </div>
        </section></div>}

        {page === 'vault' && <section className="page-section">
          <div className="page-header"><p className="eyebrow">YOUR DOCUMENTS, YOUR DEVICE</p><h1>A little room for paperwork.</h1><p className="section-subtitle">Keep housing documents in a private vault that only you can unlock.</p></div>
          <div className="vault-notice"><span className="vault-notice-icon"><Icon name="lock" size={20} /></span><div><strong>Encrypted before they’re saved.</strong><p>Your passphrase encrypts files on this device. LeasePath cannot recover it. If you forget it, your saved documents cannot be unlocked.</p></div></div>
          {vaultError && <div className="inline-error" role="alert">{vaultError}</div>}
          {!vaultUnlocked ? <div className="vault-lock-card"><div className="vault-emblem"><Icon name="lock" size={27} /></div><p className="eyebrow">{vaultAvailable ? 'WELCOME BACK' : 'SET UP YOUR PRIVATE VAULT'}</p><h2>{vaultAvailable ? 'Unlock your vault' : 'Create a passphrase'}</h2><p>{vaultAvailable ? 'Your documents are encrypted on this device.' : 'Use 10 or more characters. Keep this passphrase somewhere safe.'}</p><form className="vault-form" onSubmit={onUnlock}><label><span>Passphrase</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={vaultAvailable ? 'current-password' : 'new-password'} required minLength={vaultAvailable ? undefined : 10} /></label>{!vaultAvailable && <label><span>Confirm passphrase</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required minLength={10} /></label>}<button className="button button-primary full-button" disabled={busy} type="submit">{busy ? 'Opening…' : vaultAvailable ? 'Unlock vault' : 'Create my vault'} <Icon name="arrow" size={16} /></button></form><p className="vault-local-note"><Icon name="lock" size={13} /> Encrypted locally using AES-GCM</p></div> : <div className="vault-open-card"><div className="vault-open-heading"><div><span className="eyebrow">PRIVATE & UNLOCKED</span><h2>Your documents</h2></div><button className="button button-secondary" type="button" onClick={lockVault}><Icon name="lock" size={15} /> Lock vault</button></div><div className="vault-dropzone"><div className="upload-icon"><Icon name="upload" size={22} /></div><div><strong>Add a document</strong><p>PDF, photo, or other file · up to 8 MB</p></div><button className="button button-primary" type="button" disabled={busy} onClick={() => fileInput.current?.click()}><Icon name="plus" size={16} /> Choose file</button><input ref={fileInput} className="visually-hidden" type="file" onChange={uploadDocument} /></div>{vaultDocs.length ? <div className="vault-file-list">{vaultDocs.map((doc) => <div className="vault-file" key={doc.id}><span className="file-icon"><Icon name="file" size={18} /></span><button type="button" className="file-name" onClick={() => downloadDocument(doc.id, doc.name)}>{doc.name}<small>{doc.type || 'Document'} · {new Date(doc.createdAt).toLocaleDateString()}</small></button><button className="icon-button" type="button" aria-label={`Delete ${doc.name}`} onClick={() => removeDocument(doc.id)}><Icon name="trash" size={17} /></button></div>)}</div> : <div className="vault-empty"><Icon name="file" size={22} /><p>No documents yet. Add a file to keep it encrypted here.</p></div>}</div>}
          <div className="form-reference"><strong>Common housing forms</strong><p>CAS-517 (Broker’s Declaration), W-147M (Landlord Statement), and W-147N-a (Security Deposit Voucher) may come up in some CityFHEPS workflows. Confirm the current form and process with your worker—requirements can vary.</p></div>
        </section>}

        {page === 'steps' && <section className="page-section">
          <div className="page-header"><p className="eyebrow">YOUR HOUSING ROADMAP</p><h1>One step at a time.</h1><p className="section-subtitle">A flexible checklist to help keep the process feeling manageable.</p></div>
          <div className="roadmap-banner"><div className="roadmap-banner-icon"><Icon name="steps" size={22} /></div><div><strong>You’re making progress.</strong><p>{completeCount === 0 ? 'Start wherever you are. Every housing journey is a little different.' : `${completeCount} of ${DEFAULT_STEPS.length} steps marked complete. Keep moving at your own pace.`}</p></div><div className="progress-ring"><span>{Math.round(completeCount / DEFAULT_STEPS.length * 100)}<small>%</small></span></div></div>
          <div className="roadmap-list">{DEFAULT_STEPS.map((step, index) => { const done = checkedSteps.includes(index); return <article className={`roadmap-step ${done ? 'step-done' : ''}`} key={step.title}><button className="step-check" type="button" aria-label={`${done ? 'Mark incomplete' : 'Mark complete'}: ${step.title}`} onClick={() => setCheckedSteps((current) => done ? current.filter((item) => item !== index) : [...current, index])}>{done && <Icon name="check" size={16} />}</button><div className="step-number">{String(index + 1).padStart(2, '0')}</div><div className="step-copy"><h2>{step.title}</h2><p>{step.detail}</p></div><Icon name="chevron" size={18} /></article>})}</div>
          <div className="roadmap-help"><span><Icon name="heart" size={18} /></span><div><strong>Need a hand with a step?</strong><p>Ask the LeasePath Guide for questions to bring to your program worker.</p></div><button className="text-button" type="button" onClick={() => navigate('assistant')}>Ask the guide <Icon name="arrow" size={15} /></button></div>
          <p className="disclaimer-line"><Icon name="shield" size={15} /> General checklist only. Your program worker’s instructions and current program rules take precedence.</p>
        </section>}
      </main>

      <nav className="bottom-dock" aria-label="Main navigation">{NAV_ITEMS.map((item) => { const active = item.id === 'assistant' ? assistantOpen : page === item.id; return <button className={`dock-item ${active ? 'dock-active' : ''} ${item.id === 'assistant' ? 'dock-guide' : ''}`} key={item.id} type="button" onClick={() => navigate(item.id)} aria-current={item.id !== 'assistant' && active ? 'page' : undefined} aria-haspopup={item.id === 'assistant' ? 'dialog' : undefined} aria-expanded={item.id === 'assistant' ? assistantOpen : undefined}><span className="dock-icon"><Icon name={item.icon} size={item.id === 'assistant' ? 22 : 19} /></span><span className="dock-label">{item.label}</span></button> })}</nav>

      {showSetup && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowSetup(false) }}><section className="setup-modal" role="dialog" aria-modal="true" aria-labelledby="setup-title"><button className="modal-close icon-button" type="button" aria-label="Close" onClick={() => setShowSetup(false)}><Icon name="close" size={19} /></button><span className="modal-mark"><Icon name="home" size={20} /></span><p className="eyebrow">YOUR PLAN, YOUR PACE</p><h2 id="setup-title">A few details can help.</h2><p className="setup-intro">Planner details are stored in this browser and are not encrypted; approximate income is session-only. Avoid entering account numbers or other highly sensitive information. You can skip anything, change it later, and this does not determine official eligibility.</p>      <div className="setup-fields"><label><span>What should we call you? <small>Optional</small></span><input value={profile.firstName || ''} onChange={(event) => updateProfile('firstName', event.target.value)} placeholder="First name" /></label><label><span>Which program are you working with?</span><select value={profile.program || ''} onChange={(event) => updateProfile('program', event.target.value)}><option value="">Choose if you know</option><option>CityFHEPS</option><option>Section 8</option><option>HASA</option><option>HASA SRO / Independent</option><option>HASA Special Services</option><option>HUD / other HUD program</option><option>HUD-VASH</option><option>Other housing voucher</option><option>Not sure yet</option></select></label><div className="setup-split"><label><span>Cash assistance status</span><select value={profile.cashAssistance || ''} onChange={(event) => updateProfile('cashAssistance', event.target.value)}><option value="">Choose if you know</option><option>Currently receiving</option><option>Applied</option><option>Not receiving</option><option>Not sure</option><option>Prefer not to say</option></select></label><label><span>HASA status</span><select value={profile.hasaStatus || ''} onChange={(event) => updateProfile('hasaStatus', event.target.value)}><option value="">Choose if you know</option><option>Currently receiving HASA</option><option>Applied to HASA</option><option>Not receiving HASA</option><option>Not sure</option><option>Prefer not to say</option></select></label></div><div className="eligibility-nudge"><Icon name="sparkle" size={16} /><p>{getEligibilityNudge(profile)}</p></div><div className="setup-split"><label><span>Household size</span><select value={profile.household || ''} onChange={(event) => updateProfile('household', event.target.value)}><option value="">Choose</option>{[1, 2, 3, 4, 5, 6, 7, 8].map((size) => <option key={size}>{size}</option>)}</select></label><label><span>Monthly income <small>Session only</small></span><input inputMode="numeric" value={profile.income || ''} onChange={(event) => updateProfile('income', event.target.value.replace(/\D/g, ''))} placeholder="$ amount" /></label></div><label><span>Approved monthly rent amount <small>From your current paperwork</small></span><input inputMode="numeric" value={profile.rentCap || ''} onChange={(event) => updateProfile('rentCap', event.target.value.replace(/\D/g, ''))} placeholder="$ amount" /></label><label><span>Utilities included in that amount? <small>Optional</small></span><select value={profile.utilities || ''} onChange={(event) => updateProfile('utilities', event.target.value)}><option value="">Not sure / not listed</option><option>Heat</option><option>Heat and hot water</option><option>All utilities</option><option>Utilities are separate</option></select></label></div><div className="setup-footer"><span><Icon name="lock" size={14} /> Stored in this browser</span><button className="button button-primary" type="button" onClick={() => { setShowSetup(false); setMaxRent(profile.rentCap || '') }}>Save details <Icon name="check" size={16} /></button></div></section></div>}
    </div>
  )
}

function getGuideResponse(message, profile) {
  const text = message.toLowerCase()
  if (/(discriminat|source of income|voucher.*refus|refus.*voucher)/.test(text)) {
    return 'NYC Human Rights Law § 8-107 generally protects lawful sources of income, including many housing vouchers. A landlord or broker generally may not refuse someone just because they use a voucher, though specific rules and exceptions can apply. Write down what happened and save messages. For advice about your situation, contact NYC Commission on Human Rights (311) or a tenant legal services provider. This is general information, not legal advice.'
  }
  if (/(broker|landlord|message|text|email)/.test(text)) {
    const program = profile.program || 'housing voucher'
    return `A simple opener can keep your private details private: “Hello, I’m interested in the apartment. I have a ${program} and would like to confirm whether you consider voucher applicants. Could you share the rent, utilities included, and next steps?” You don’t need to send a Social Security number, benefit case number, or documents in an initial message.`
  }
  if (/(rent|amount|utility|utilities|limit|voucher)/.test(text)) {
    return profile.rentCap
      ? `You noted an approved monthly amount of $${Number(profile.rentCap).toLocaleString()}${profile.utilities ? ` (${profile.utilities})` : ''}. Check your current shopping letter and ask your program contact whether utilities are included and whether this specific unit can be approved. The examples in LeasePath are not official rent determinations.`
      : 'Rent amounts depend on your program, household details, utility allowance, and current paperwork. Check your shopping letter or ask your worker for the approved rent amount and which utilities it covers. I don’t want to guess at a cap that could lead you to the wrong apartment.'
  }
  if (/(form|cas-517|w-147|paperwork|document)/.test(text)) {
    return 'Some CityFHEPS housing workflows may use forms such as CAS-517 (Broker’s Declaration), W-147M (Landlord Statement), and W-147N-a (Security Deposit Voucher). Forms and requirements may change or depend on your case. Ask your HRA/HASA contact which current forms apply before you or a broker fills them out.'
  }
  if (/(eligible|eligibility|qualif)/.test(text)) {
    return 'I can help you organize questions, but I can’t determine eligibility. Voucher rules depend on your situation and program. A good next step is to confirm your program name with your caseworker and ask what written eligibility or shopping documents you should have. The Step Guide can help you keep track.'
  }
  if (/(next step|where.*start|start|roadmap)/.test(text)) {
    return 'A useful first step is confirming your program name and getting your current approved rent amount in writing, including how utilities are counted. Then gather the documents your worker requests and ask which landlord forms and approval steps apply. You can track the general checklist in the Step Guide.'
  }
  return 'I can help with NYC voucher basics, source-of-income rights, questions to ask your caseworker, and broker message drafts. For advice about a specific case, confirm details with your program worker or a housing legal services provider. What would be most useful right now?'
}

function getEligibilityNudge(profile) {
  if (profile.hasaStatus === 'Currently receiving HASA' || profile.program === 'HASA') {
    return 'Ask your HASA case manager which housing options and current requirements apply to your situation.'
  }
  if (profile.cashAssistance === 'Currently receiving') {
    return 'Ask your HRA worker whether your situation can be screened for CityFHEPS and which current documents they need.'
  }
  if (profile.cashAssistance === 'Applied') {
    return 'Ask your HRA worker what to do while your cash assistance application is pending and whether any housing screening applies.'
  }
  return 'These answers do not determine eligibility. Your HRA/HASA worker can confirm which programs and next steps fit your situation.'
}

export default App
