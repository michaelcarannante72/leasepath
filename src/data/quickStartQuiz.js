/** Three-question onboarding quiz. Answers stay in localStorage only. */

export const QUIZ_STORAGE_KEY = 'leasepath.quickStartQuiz'

export const VOUCHER_OPTIONS = [
  { id: 'cityfheps', label: 'CityFHEPS', hint: 'City rent supplement (DSS / HRA)' },
  { id: 'fheps', label: 'FHEPS', hint: 'State Family Homelessness & Eviction Prevention Supplement' },
  { id: 'section8', label: 'Section 8 (NYCHA)', hint: 'Housing Choice Voucher through NYCHA' },
  { id: 'hasa', label: 'HASA housing help', hint: 'We never ask for medical details — go to official HASA pages' },
  { id: 'none', label: 'No voucher yet / not sure', hint: 'We’ll point you to Resources and Homebase' },
]

export const SITUATION_OPTIONS = [
  { id: 'shopping', label: 'I have a shopping letter or voucher and I’m looking', hint: 'Apartment search + rent limits' },
  { id: 'shelter', label: 'I’m in shelter or working with a caseworker', hint: 'Steps from shelter to lease' },
  { id: 'community', label: 'I’m in the community and need prevention help', hint: 'Homebase, benefits, legal aid' },
  { id: 'found', label: 'I found a place and need the packet / inspection', hint: 'After you find an apartment' },
]

export const BOROUGH_OPTIONS = [
  { id: 'bronx', label: 'Bronx', searchSlug: 'bronx' },
  { id: 'brooklyn', label: 'Brooklyn', searchSlug: 'brooklyn' },
  { id: 'manhattan', label: 'Manhattan', searchSlug: 'manhattan' },
  { id: 'queens', label: 'Queens', searchSlug: 'queens' },
  { id: 'staten-island', label: 'Staten Island', searchSlug: 'staten-island' },
]

const VOUCHER_TO_SEARCH = {
  cityfheps: 'cityfheps',
  fheps: 'fheps',
  section8: 'nycha-section-8',
  hasa: null,
  none: null,
}

/**
 * Route the three answers to an in-app path. Prefer /search pages when voucher + borough
 * can map; otherwise Steps, Resources, Plan, or After-you-find.
 */
export function routeQuizAnswers({ voucher, situation, borough } = {}) {
  const b = BOROUGH_OPTIONS.find((x) => x.id === borough)
  const searchProg = VOUCHER_TO_SEARCH[voucher]

  if (situation === 'found') {
    return {
      href: '#/after-you-find',
      title: 'After you find an apartment',
      reason: 'Packet, inspection, and lease steps come next. Keep your paperwork on this device until you share it with your worker.',
    }
  }

  if (voucher === 'hasa') {
    return {
      href: '#/resources',
      title: 'Resources — HASA and city help',
      reason: 'LeasePath never collects HIV or medical information. Official HASA links live on Resources; your caseworker decides what you may qualify for.',
    }
  }

  if (situation === 'community' || voucher === 'none') {
    return {
      href: '#/resources',
      title: 'Resources for everyone',
      reason: 'Homebase, benefits, legal aid, and city help. You may qualify for prevention help — a Homebase or HRA office decides.',
    }
  }

  if (situation === 'shelter' && !searchProg) {
    return {
      href: '#/steps',
      title: 'Steps from shelter to housing',
      reason: 'Walk the in-app steps with your caseworker. Ask them which shopping letter or voucher applies to you.',
    }
  }

  if (searchProg && b) {
    return {
      href: `/search/${searchProg}/${b.searchSlug}/1br`,
      title: `${b.label} ${searchProg === 'nycha-section-8' ? 'Section 8' : searchProg.toUpperCase()} rent search`,
      reason: 'Opens the verified rent-limit search for that voucher and borough. Limits come from the official charts linked on the page.',
    }
  }

  if (situation === 'shopping') {
    return {
      href: '#/plan',
      title: 'My voucher plan',
      reason: 'Save your program and borough on this device, then use Search and Steps.',
    }
  }

  return {
    href: '#/steps',
    title: 'Steps',
    reason: 'Start with the numbered steps. Your caseworker confirms what you may qualify for.',
  }
}

export function readQuiz(storage) {
  try {
    const raw = (storage || globalThis.localStorage)?.getItem(QUIZ_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      voucher: parsed.voucher || '',
      situation: parsed.situation || '',
      borough: parsed.borough || '',
      savedAt: parsed.savedAt || null,
    }
  } catch {
    return null
  }
}

export function writeQuiz(answers, storage) {
  const store = storage || globalThis.localStorage
  const payload = {
    voucher: answers.voucher || '',
    situation: answers.situation || '',
    borough: answers.borough || '',
    savedAt: new Date().toISOString(),
  }
  store?.setItem(QUIZ_STORAGE_KEY, JSON.stringify(payload))
  return payload
}

export function clearQuiz(storage) {
  try {
    (storage || globalThis.localStorage)?.removeItem(QUIZ_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
