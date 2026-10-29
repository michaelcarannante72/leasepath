// Browser-side mirror of the server's listing rules, kept out of the components so each file
// exports only what fast refresh expects (components export components; helpers export helpers).
import { tx } from './i18nAuto.js'
import {
  AMENITIES, BATHROOM_COUNTS, BEDROOM_COUNTS, BOROUGHS, BROKER_FEES, DOG_POLICIES, PROPERTY_TYPES, VOUCHER_CHOICES,
} from './data/listingForm.js'

/** The three steps. Each one is a single screen on a phone. */
export const STEPS = [
  { key: 'apartment', title: 'The apartment', hint: 'Address, size, rent, and when it is free.' },
  { key: 'terms', title: 'Costs and pets', hint: 'Deposit, fees, and who can live there.' },
  { key: 'details', title: 'Photos and contact', hint: 'One photo, a description, and how to reach you.' },
]

/** A blank listing, matching the shape the API accepts. */
export function emptyListingForm() {
  return {
    address: '',
    unit: '',
    borough: '',
    neighborhood: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    rent: '',
    availableDate: '',
    securityDeposit: '',
    applicationFee: '',
    brokerFee: '',
    catsAllowed: '',
    dogs: '',
    voucherAccepted: 'Yes',
    amenities: [],
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
    attestation: false,
  }
}

/** Today in the landlord's own time zone, so defaulting "available now" does not land on yesterday. */
export function todayIso(now = new Date()) {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

/** A dollar amount the landlord typed. '' means "not stated"; anything else must be whole dollars. */
function moneyProblem(value, label, max) {
  if (value === '' || value == null) return ''
  const digits = String(value).replace(/[^\d]/g, '')
  if (!digits) return tx("Enter {label} in dollars.", { label })
  const amount = Number(digits)
  if (!Number.isInteger(amount) || amount > max) {
    return tx("Enter {label} in dollars, up to {max}.", { label, max: `$${max.toLocaleString('en-US')}` })
  }
  return ''
}

/**
 * Mirrors the server's rules so a missing field is caught before a round trip. Returns '' when fine.
 * The server stays the authority: this is only here so the landlord does not wait on a request to
 * learn that the rent is blank.
 *
 * Photos are validated by the caller, because an edit can keep the photo it already has.
 */
export function listingProblem(form) {
  if (!form.address.trim()) return tx("Add the street address.")
  if (!BOROUGHS.includes(form.borough)) return tx("Pick a borough.")
  if (!PROPERTY_TYPES.includes(form.propertyType)) return tx("Pick the property type.")
  if (!BEDROOM_COUNTS.includes(Number(form.bedrooms))) return tx("Pick the number of bedrooms. A studio is 0 bedrooms.")
  if (!BATHROOM_COUNTS.includes(Number(form.bathrooms))) return tx("Pick the number of full bathrooms.")
  const rent = Number(String(form.rent).replace(/[^\d]/g, ''))
  if (!Number.isInteger(rent) || rent < 100 || rent > 20000) return tx("Enter a monthly rent between $100 and $20,000.")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(form.availableDate))) return tx("Pick the date the unit is available.")
  const deposit = moneyProblem(form.securityDeposit, tx("the security deposit"), 200000)
  if (deposit) return deposit
  const fee = moneyProblem(form.applicationFee, tx("the application fee"), 20000)
  if (fee) return fee
  if (form.brokerFee && !BROKER_FEES.includes(form.brokerFee)) return tx("Pick a broker fee from the list, or leave it blank.")
  if (form.dogs && !DOG_POLICIES.includes(form.dogs)) return tx("Pick a dog policy from the list, or leave it blank.")
  if (form.voucherAccepted && !VOUCHER_CHOICES.includes(form.voucherAccepted)) return tx("Answer whether you accept vouchers.")
  if (!form.contactName.trim()) return tx("Add a contact name.")
  const email = form.contactEmail.trim()
  const digits = String(form.contactPhone).replace(/\D/g, '')
  if (!email && digits.length < 10) return tx("Add a contact email or a phone with at least 10 digits.")
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return tx("That contact email does not look right. Fix it or leave it empty and give a phone.")
  if (!form.attestation) return tx("You must attest that you accept vouchers and charge no application fees.")
  return ''
}

/** Only the fields on one step, so "Continue" cannot fail on something the landlord has not seen yet. */
export function stepProblem(form, step) {
  if (step === 0) {
    if (!form.address.trim()) return tx("Add the street address.")
    if (!BOROUGHS.includes(form.borough)) return tx("Pick a borough.")
    if (!PROPERTY_TYPES.includes(form.propertyType)) return tx("Pick the property type.")
    if (!BEDROOM_COUNTS.includes(Number(form.bedrooms))) return tx("Pick the number of bedrooms. A studio is 0 bedrooms.")
    if (!BATHROOM_COUNTS.includes(Number(form.bathrooms))) return tx("Pick the number of full bathrooms.")
    const rent = Number(String(form.rent).replace(/[^\d]/g, ''))
    if (!Number.isInteger(rent) || rent < 100 || rent > 20000) return tx("Enter a monthly rent between $100 and $20,000.")
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(form.availableDate))) return tx("Pick the date the unit is available.")
    return ''
  }
  if (step === 1) {
    return (
      moneyProblem(form.securityDeposit, tx("the security deposit"), 200000) ||
      moneyProblem(form.applicationFee, tx("the application fee"), 20000) ||
      (form.brokerFee && !BROKER_FEES.includes(form.brokerFee) ? tx("Pick a broker fee from the list, or leave it blank.") : '') ||
      (form.dogs && !DOG_POLICIES.includes(form.dogs) ? tx("Pick a dog policy from the list, or leave it blank.") : '')
    )
  }
  return ''
}

/** The first step that still has a problem, so a failed save lands on the screen that needs fixing. */
export function firstProblemStep(form) {
  for (let step = 0; step < STEPS.length; step++) {
    if (stepProblem(form, step)) return step
  }
  return 0
}

/** Amenities as a stable, de-duplicated list of allowed values. */
export function cleanAmenities(list) {
  if (!Array.isArray(list)) return []
  return [...new Set(list.filter((a) => AMENITIES.includes(a)))]
}

/**
 * Reads ?t= out of the hash route. The token never reaches analytics, and it is capped so a giant
 * query string cannot be used to make the page do work.
 */
export function readEditToken(hash = globalThis.location?.hash || '') {
  const query = String(hash).replace(/^#/, '').split('?')[1] || ''
  const token = new URLSearchParams(query).get('t') || ''
  return token.length <= 200 ? token : ''
}
