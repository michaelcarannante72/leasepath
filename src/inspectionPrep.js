/** HQS inspection prep — official NYCHA / HPD / HUD-aligned checklist only. */

export const LAST_REVIEWED = 'October 27, 2026'
export const PREP_ROUTE = '/inspection-prep'
export const PREP_TITLE = 'HQS inspection prep'

export const SOURCES = {
  nychaHqs: {
    label: 'NYCHA: HQS inspections',
    href: 'https://www.nyc.gov/site/nycha/section-8/HQS-inspections.page',
  },
  nychaHqsFaq: {
    label: 'NYCHA: Housing Quality Standards FAQ',
    href: 'https://www.nyc.gov/site/nycha/section-8/housing-quality-standards-faq.page',
  },
  hpdInspections: {
    label: 'HPD: Section 8 inspections',
    href: 'https://www.nyc.gov/site/hpd/services-and-information/inspections.page',
  },
  nychaPortal: {
    label: 'NYCHA Tenant Self-Service Portal',
    href: 'https://www.nyc.gov/site/nycha/section-8/self-service.page',
  },
}

/** Verified on NYCHA HQS inspections page (Customer Contact Center). */
export const NYCHA_CCC = {
  label: 'NYCHA Customer Contact Center',
  phone: '718-707-7771',
  hours: 'Monday through Friday, 8 a.m. to 4 p.m. (re-inspection requests per NYCHA FAQ)',
  source: 'nychaHqsFaq',
}

export const INTRO =
  'Section 8 and some other vouchers need the apartment to pass a Housing Quality Standards (HQS) inspection before you move in. Walk the unit with this list first. Ask the landlord to fix problems before the inspector comes. Your worker’s instructions come first.'

export const CAVEAT =
  'This is a prep checklist, not an official agency form. Rules can change. Confirm with NYCHA, HPD, or your worker.'

/**
 * Checklist items keyed to official NYCHA HQS and HPD Section 8 inspection pages.
 * tip text stays close to the official wording; no inventing temps or fees.
 */
export const CHECKLIST = [
  {
    id: 'smoke',
    title: 'Smoke detectors / alarms',
    tip: 'Working smoke alarms on every level of the property and unit, inside and outside each bedroom or sleeping area. By December 29, 2024 they must be hard-wired with battery backup or sealed 10-year battery models. Hearing-impaired households need an alarm designed for hearing-impaired persons.',
    sources: ['nychaHqs', 'hpdInspections'],
  },
  {
    id: 'co',
    title: 'Carbon monoxide (CO) detectors / alarms',
    tip: 'Required when the unit has a fuel-burning appliance or fireplace, is served by a forced-air furnace, or is next to an attached garage. Generally hard-wired with battery backup (battery-only only where the construction-era code allowed it). Hearing-impaired households need an alarm designed for hearing-impaired persons.',
    sources: ['nychaHqs', 'hpdInspections'],
  },
  {
    id: 'heat-hot-water',
    title: 'Heat and hot water',
    tip: 'The unit must have an adequate source of heat and hot water. Hot water must meet the agency’s established temperature range. Confirm any exact numbers with your inspector or worker — do not guess from memory.',
    sources: ['nychaHqs'],
  },
  {
    id: 'windows',
    title: 'Windows and locks',
    tip: 'Each bedroom needs at least one window that opens and closes (or a skylight) for air and light, with permanently attached, working locks.',
    sources: ['nychaHqs'],
  },
  {
    id: 'window-guards',
    title: 'Window guards (NYC)',
    tip: 'NYC law requires owners of multiple dwellings to install and maintain window guards where a child 10 or younger lives, in that unit and in public spaces.',
    sources: ['nychaHqs'],
  },
  {
    id: 'outlets',
    title: 'Outlets and light fixtures',
    tip: 'Each bedroom: two outlets, or one outlet plus one permanent light fixture. Kitchen outlets within 6 feet of water need GFCI if the unit was built or renovated after 1986. Bathroom outlets need GFCI if built or renovated after 1996. Bathrooms need a permanent light; kitchens need a permanent outlet.',
    sources: ['nychaHqs'],
  },
  {
    id: 'surfaces',
    title: 'Ceilings, walls, floors, peeling paint',
    tip: 'Ceilings, walls, windows, and floors must be in good condition — free of cracks, holes, and similar damage. Peeling paint and damaged surfaces are common fail items; ask the owner to repair before the visit. Federally assisted units have extra lead-paint rules when hazards are found.',
    sources: ['nychaHqs', 'hpdInspections'],
  },
  {
    id: 'rooms',
    title: 'Rooms and space',
    tip: 'At minimum: living room, kitchen, bathroom, and one living/sleeping room for every two family members. Bedrooms must be at least 80 square feet. The living room can count as a sleeping room.',
    sources: ['nychaHqs'],
  },
  {
    id: 'egress',
    title: 'Safe exits (no illegal gates)',
    tip: 'Life-threatening fails include illegal window gates on fire escapes and no secondary means of egress. Keep exit doors and fire-escape windows clear.',
    sources: ['nychaHqsFaq', 'hpdInspections'],
  },
  {
    id: 'life-threat',
    title: '24-hour / life-threatening hazards',
    tip: 'Examples NYCHA lists: missing or dead smoke/CO alarms, gas leak, sparking or exposed wiring, severe fire damage, building in danger of collapse. These need fast repair — tell the owner and your worker right away.',
    sources: ['nychaHqsFaq', 'hpdInspections'],
  },
]

export const BEFORE_VISIT = [
  'Walk the unit yourself (or with someone you trust) and write down what needs fixing. Tell the Section 8 owner or manager before the inspection.',
  'Someone 18 or older must be home to let the inspector in. The inspector will not enter without an adult present.',
  'If you cannot keep the appointment, reschedule with at least 48 hours’ notice. For NYCHA Section 8, the Tenant Self-Service Portal is the fastest way; you may also call the Customer Contact Center.',
]

export const AFTER_VISIT = [
  'For NYCHA Section 8, check the Tenant Self-Service Portal about 24 hours after the inspection for results. NYCHA also mails fail notices to you and the owner.',
  'If the unit fails, let the owner in to make repairs. Blocking access can put your voucher at risk.',
  'You are responsible for “tenant-caused” items (for example, dead batteries in alarms you control, or damage you or a guest caused).',
]

export function sourceList(ids) {
  return ids.map((id) => SOURCES[id]).filter(Boolean)
}
