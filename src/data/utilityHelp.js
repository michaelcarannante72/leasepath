/** HEAP and utility help. Benefit ranges and phones only when published on the cited NY State / NYC pages. */

export const SOURCES = {
  nyHeapApply: {
    label: 'NY State — Apply for Heating Assistance (HEAP)',
    href: 'https://www.ny.gov/services/apply-heating-assistance-heap',
  },
  otdaHeap: {
    label: 'OTDA — Home Energy Assistance Program (HEAP)',
    href: 'https://otda.ny.gov/programs/heap/',
  },
  accessNyc: {
    label: 'ACCESS HRA',
    href: 'https://www.nyc.gov/accesshra',
  },
  hraEmergency: {
    label: 'ACCESS NYC — One Shot Deal',
    href: 'https://access.nyc.gov/programs/one-shot-deal/',
  },
  hpdHeat: {
    label: 'HPD — Heat and Hot Water (paying for heating)',
    href: 'https://www.nyc.gov/site/hpd/services-and-information/heat-and-hot-water-information.page',
  },
}

export const HEAP = {
  blurb:
    'HEAP (Home Energy Assistance Program) helps income-eligible New Yorkers with heating costs. You may qualify even if heat is included in your rent — OTDA and HRA decide. Regular benefits open on a seasonal schedule published by New York State; Emergency HEAP helps if you face a shutoff or are out of fuel.',
  applyNyc: 'https://access.nyc.gov/',
  applyRestOfState: 'https://myBenefits.ny.gov/',
  nycEmergencyPhone: '718-557-1399',
  otdaHotline: '1-800-342-3009',
  otdaEmail: 'nysheap@otda.ny.gov',
  nycMail: 'HRA/HEAP, PO Box 1401, Church Street Station, New York, NY 10008',
  // Amounts from ny.gov Apply for Heating Assistance page (Regular 2025–2026 table on that page).
  regularAmountsNote:
    'On the NY State HEAP apply page, regular base benefits are listed for households that pay heat directly (for example electricity/natural gas, oil/kerosene/propane, or other deliverable fuels) and smaller amounts when heat is included in rent or in certain subsidized settings. Add-ons may apply. Figures change by season — confirm on the official page before you apply.',
  incomeNote:
    'Monthly income limits by household size are published on the NY State HEAP apply page. You may also qualify if you receive SNAP, Temporary Assistance, or certain SSI. Bring proof of residency, income, ID, and a utility or landlord statement as listed on that page.',
}

export const SECTIONS = [
  {
    id: 'heap',
    title: 'HEAP — Home Energy Assistance Program',
    body: HEAP.blurb,
    links: [
      { href: SOURCES.nyHeapApply.href, label: 'NY State HEAP apply page', external: true },
      { href: SOURCES.otdaHeap.href, label: 'OTDA HEAP program page', external: true },
      { href: HEAP.applyNyc, label: 'ACCESS NYC (inside NYC)', external: true },
      { href: `tel:${HEAP.nycEmergencyPhone.replace(/\D/g, '')}`, label: `NYC Emergency HEAP ${HEAP.nycEmergencyPhone}` },
      { href: `tel:${HEAP.otdaHotline.replace(/\D/g, '')}`, label: `OTDA hotline ${HEAP.otdaHotline}` },
    ],
  },
  {
    id: 'amounts',
    title: 'What HEAP may pay (confirm on the State page)',
    body: `${HEAP.regularAmountsNote} ${HEAP.incomeNote}`,
    links: [
      { href: SOURCES.nyHeapApply.href, label: 'See current amounts on ny.gov', external: true },
    ],
  },
  {
    id: 'hra',
    title: 'HRA One Shot Deal (emergency cash)',
    body: 'ACCESS NYC describes the One Shot Deal as emergency cash assistance that can help with rent or utility arrears in a crisis. You may qualify — HRA decides after an interview. Apply through ACCESS HRA or a Benefits Access Center. LeasePath does not take applications.',
    links: [
      { href: SOURCES.hraEmergency.href, label: 'HRA Emergency Assistance', external: true },
      { href: SOURCES.accessNyc.href, label: 'ACCESS HRA', external: true },
      { href: 'tel:311', label: 'Call 311' },
    ],
  },
  {
    id: 'hpd',
    title: 'Trouble paying for heat',
    body: 'HPD’s heat page notes that HRA provides low-income heating help through HEAP. Call 311 if you are having difficulty paying for heat or repairing heating equipment.',
    links: [
      { href: SOURCES.hpdHeat.href, label: 'HPD heat page', external: true },
      { href: 'tel:311', label: 'Call 311' },
    ],
  },
]
