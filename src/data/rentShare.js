/** On-device rent-share estimate. Only HUD Section 8 30% rule is computed; CityFHEPS share stays letter-based. */

export const RENT_SHARE_SOURCES = {
  hudFamilyPayment: {
    label: 'HUD — family payment (24 CFR Part 5 Subpart F)',
    href: 'https://www.ecfr.gov/current/title-24/subtitle-A/part-5/subpart-F/subject-group-ECFR76c4c145ebf8cc2',
  },
  hudGuidebook: {
    label: 'HUD HCV Guidebook — Calculating Rent and HAP Payments',
    href: 'https://www.hud.gov/sites/dfiles/PIH/documents/HCV_Guidebook_Calculating_Rent_and_HAP_Payments.pdf',
  },
  dss7r: {
    label: 'DSS CityFHEPS client FAQ (DSS-7r)',
    href: 'https://www.nyc.gov/assets/hra/downloads/pdf/cityfheps-documents/DSS-7r-(E).pdf',
  },
  hasaFaq: {
    label: 'HASA questions and answers (HRA)',
    href: 'https://www.nyc.gov/assets/hra/HASA/SPSVC-18-E.pdf',
  },
}

export const PROGRAMS = [
  { id: 'section8', label: 'Section 8 / Housing Choice Voucher' },
  { id: 'cityfheps', label: 'CityFHEPS' },
  { id: 'hasa', label: 'HASA housing help' },
]

/** Parse whole-dollar monthly income. */
export function parseMonthlyIncome(value) {
  const text = String(value ?? '').replace(/[\s$,]/g, '')
  if (text === '') return { status: 'empty' }
  const match = /^(\d+)(?:\.(\d*))?$/.exec(text)
  if (!match) return { status: 'invalid' }
  const whole = match[1].replace(/^0+(?=\d)/, '') || '0'
  if (whole.length > 7) return { status: 'invalid' }
  return { status: 'ok', dollars: Number(whole) }
}

export function money(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

/**
 * Estimate tenant share. Section 8 uses HUD’s roughly 30% of monthly adjusted income
 * (actual TTP is the greatest of several HUD formulas). the city program uses the shopping letter, not a flat percent.
 */
export function estimateRentShare({ program, monthlyIncome } = {}) {
  const parsed = parseMonthlyIncome(monthlyIncome)
  if (program === 'cityfheps') {
    return {
      kind: 'letter',
      title: 'Use your CityFHEPS shopping letter',
      body: 'DSS says the household share depends on household size and each member’s income (DSS-7r). LeasePath does not invent a flat percent for that program. Read the share on your shopping letter or ask your worker.',
      estimate: null,
      sources: [RENT_SHARE_SOURCES.dss7r],
    }
  }
  if (parsed.status !== 'ok') {
    return {
      kind: 'need-income',
      title: 'Enter a monthly income to see an estimate',
      body: 'Whole dollars only. Nothing is sent to a server — the math runs on this device.',
      estimate: null,
      sources: [],
    }
  }
  const thirty = Math.floor(parsed.dollars * 0.3)
  if (program === 'section8') {
    return {
      kind: 'hud-estimate',
      title: 'Section 8 estimate (practice only)',
      body: `HUD’s Housing Choice Voucher rules generally set the family’s minimum payment around 30% of monthly adjusted income (the Total Tenant Payment is the greatest of several HUD formulas). At first lease-up, your total share usually cannot go over 40% of monthly adjusted income if the rent is above the payment standard. You may qualify for a different share — NYCHA, HPD, or HCR decides from your paperwork.`,
      estimate: thirty,
      estimateLabel: `About ${money(thirty)} / month (30% of ${money(parsed.dollars)})`,
      fortyCap: Math.floor(parsed.dollars * 0.4),
      sources: [RENT_SHARE_SOURCES.hudFamilyPayment, RENT_SHARE_SOURCES.hudGuidebook],
    }
  }
  if (program === 'hasa') {
    return {
      kind: 'hasa-estimate',
      title: 'HASA rent share (about 30%)',
      body: `In most HASA rental help, you pay about 30% of your income and HASA pays the rest. That is general information from HRA materials — your HASA worker sets the real share. LeasePath never asks for or stores HIV or other medical information.`,
      estimate: thirty,
      estimateLabel: `About ${money(thirty)} / month (≈30% of ${money(parsed.dollars)})`,
      sources: [RENT_SHARE_SOURCES.hasaFaq],
    }
  }
  return {
    kind: 'pick',
    title: 'Pick a program',
    body: 'Choose Section 8, CityFHEPS, or HASA. Estimates stay on this device.',
    estimate: null,
    sources: [],
  }
}
