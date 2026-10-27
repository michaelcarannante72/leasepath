/** After move-in tenant rights. Heat rules copied from HPD’s heat and hot water page. */

export const SOURCES = {
  hpdHeat: {
    label: 'HPD — Heat and Hot Water',
    href: 'https://www.nyc.gov/site/hpd/services-and-information/heat-and-hot-water-information.page',
  },
  hpdOnline: {
    label: 'HPD Online',
    href: 'https://hpdonline.nyc.gov/',
  },
  nyc311: {
    label: 'NYC 311',
    href: 'https://portal.311.nyc.gov/',
  },
  housingCourt: {
    label: 'NYC Housing Court (NYCourts)',
    href: 'https://ww2.nycourts.gov/courts/nyc/housing/index.shtml',
  },
  tenantHelpline: {
    label: 'Tenant Helpline (Mayor’s PEU)',
    href: 'https://www.nyc.gov/site/mayorspeu/resources/tenant-helpline.page',
  },
  hraLegal: {
    label: 'HRA Legal Services for Tenants',
    href: 'https://www.nyc.gov/site/hra/help/legal-services-for-tenants.page',
  },
}

export const HEAT_RULES = {
  season: 'October 1 through May 31',
  day: {
    hours: '6:00 a.m. to 10:00 p.m.',
    outsideBelow: 55,
    insideAtLeast: 68,
  },
  night: {
    hours: '10:00 p.m. to 6:00 a.m.',
    insideAtLeast: 62,
    note: 'Required regardless of the outdoor temperature',
  },
  hotWater: {
    days: '365 days a year',
    minF: 120,
  },
  complaint: {
    first: 'Contact your landlord first.',
    then: 'If the landlord does not fix it, call 311 (TTY 212-504-4115) or use 311ONLINE / 311MOBILE. You can file anonymously.',
  },
  sourceId: 'hpdHeat',
}

export const SECTIONS = [
  {
    id: 'repairs',
    title: 'Repairs',
    body: 'Landlords must keep the apartment and building in good repair. Put requests in writing when you can. If nothing happens, call 311 to file an HPD complaint. Check open violations on HPD Online.',
    links: [
      { href: 'https://portal.311.nyc.gov/', label: 'File or check a 311 complaint', external: true },
      { href: 'https://hpdonline.nyc.gov/', label: 'HPD Online', external: true },
    ],
  },
  {
    id: 'heat',
    title: 'Heat and hot water (Heat Season)',
    body: `Heat Season is ${HEAT_RULES.season} (HPD). Daytime (${HEAT_RULES.day.hours}): when it is below ${HEAT_RULES.day.outsideBelow}°F outside, the apartment must be at least ${HEAT_RULES.day.insideAtLeast}°F. Night (${HEAT_RULES.night.hours}): at least ${HEAT_RULES.night.insideAtLeast}°F inside, ${HEAT_RULES.night.note.toLowerCase()}. Hot water must be at least ${HEAT_RULES.hotWater.minF}°F ${HEAT_RULES.hotWater.days}.`,
    links: [
      { href: SOURCES.hpdHeat.href, label: 'HPD heat and hot water rules', external: true },
      { href: 'tel:311', label: 'Call 311' },
    ],
  },
  {
    id: '311',
    title: 'HPD complaints via 311',
    body: `${HEAT_RULES.complaint.first} ${HEAT_RULES.complaint.then} HPD may notify the owner and try to inspect. This is general information — HPD decides the case.`,
    links: [
      { href: 'https://portal.311.nyc.gov/', label: '311ONLINE', external: true },
      { href: SOURCES.hpdOnline.href, label: 'HPD Online', external: true },
    ],
  },
  {
    id: 'court',
    title: 'Housing Court help',
    body: 'If you get court papers, go to your hearing date. You may qualify for free legal help under Right to Counsel. Call 311 and ask for the Tenant Helpline, or use HRA’s legal-services page. LeasePath is not a law firm.',
    links: [
      { href: SOURCES.housingCourt.href, label: 'NYC Housing Court', external: true },
      { href: SOURCES.hraLegal.href, label: 'HRA legal services for tenants', external: true },
      { href: SOURCES.tenantHelpline.href, label: 'Tenant Helpline', external: true },
      { href: '#/know-your-rights', label: 'Know your rights (in app)' },
    ],
  },
]
