/** Shelter → housing timeline with links to in-app tools. Official process language stays general. */

export const ROADMAP_STEPS = [
  {
    id: 'shelter',
    title: 'In shelter / with a caseworker',
    body: 'Work with your DHS or program caseworker on housing plans. Ask which voucher or shopping letter you may qualify for. Keep ID and paperwork together on this device until you share them with your worker.',
    links: [
      { href: '#/resources', label: 'Resources' },
      { href: '#/plan', label: 'My voucher' },
    ],
  },
  {
    id: 'shopping-letter',
    title: 'Shopping letter or voucher in hand',
    body: 'Your letter states the rent you can shop with and how utilities are counted. Confirm the program name (CityFHEPS, FHEPS, Section 8, HASA, or another). LeasePath does not issue letters.',
    links: [
      { href: '#/plan', label: 'Save letter details on My voucher' },
      { href: '#/steps', label: 'Steps checklist' },
    ],
  },
  {
    id: 'search',
    title: 'Apartment search',
    body: 'Look for units within the rent on your letter. Check listings against known scam patterns. Source-of-income discrimination is illegal in NYC — report it through official channels on Resources.',
    links: [
      { href: '#/', label: 'Search' },
      { href: '#/scam-alerts', label: 'Voucher scam alerts' },
      { href: '#/know-your-rights', label: 'Know your rights' },
    ],
  },
  {
    id: 'packet',
    title: 'Packet submission',
    body: 'When you find a place, your worker or broker packages landlord papers, the lease draft, and program forms. Ask which current forms apply — names change. Share a caseworker pack from this phone if it helps.',
    links: [
      { href: '#/after-you-find', label: 'After you find an apartment' },
      { href: '#/caseworker-pack', label: 'Caseworker share pack' },
    ],
  },
  {
    id: 'inspection',
    title: 'Inspection',
    body: 'CityFHEPS, Section 8, and other programs inspect before approval. Use the HQS prep list so the unit is ready. Failed items delay the lease.',
    links: [
      { href: '#/inspection-prep', label: 'HQS inspection prep' },
    ],
  },
  {
    id: 'lease',
    title: 'Lease signing and move-in',
    body: 'Wait for program approval before you move in or pay side fees above the lease rent. Moving help and rights pages stay useful after you get the keys.',
    links: [
      { href: '#/moving-help', label: 'Moving help' },
      { href: '#/know-your-rights', label: 'Know your rights' },
      { href: '#/after-you-find', label: 'After you find' },
    ],
  },
]
