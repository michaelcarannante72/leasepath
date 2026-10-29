/**
 * Shared landlord listing form options. Kept free of Worker/KV code so the browser can import them.
 *
 * The field set mirrors what StreetEasy and Zillow ask a landlord that actually matters to a NYC
 * renter, and deliberately skips square footage, floor, year built, total rooms, half baths and every
 * broker/MLS field. Those are optional even on StreetEasy, which reads building facts from city records.
 */
export const VOUCHER_TYPES = ['Section 8', 'CityFHEPS', 'FHEPS', 'HASA', 'Other lawful subsidy']
export const BOROUGHS = ['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Staten Island']
/** Kept for older records and the size chips other pages use; bedrooms are the real filter now. */
export const UNIT_SIZES = ['Studio', '1 bedroom', '2 bedrooms', '3 bedrooms', '4+ bedrooms', 'SRO / room']
/** Pet policy options. Blank means "not stated" and is always allowed. */
export const PETS = ['Dogs OK', 'Cats OK', 'No pets', 'Case by case']

/** Zillow's exact three residential types, in the words a landlord would use. */
export const PROPERTY_TYPES = ['House', 'Condo or apartment unit', 'Townhouse']
/** Studio is 0 bedrooms, which is how every listing feed counts it. */
export const BEDROOM_COUNTS = [0, 1, 2, 3, 4, 5, 6]
export const BATHROOM_COUNTS = [1, 2, 3, 4, 5]
export const BROKER_FEES = ['None', 'One month', 'Half month', 'Other']
export const DOG_POLICIES = ['No', 'Small only', 'Large OK']
export const VOUCHER_CHOICES = ['Yes', 'No', 'Ask me']
export const AMENITIES = [
  'Laundry in unit',
  'Laundry in building',
  'Elevator',
  'Doorman',
  'Dishwasher',
  'Outdoor space',
  'Air conditioning',
  'Furnished',
  'Gym',
  'Parking',
  'Storage',
  'Hardwood floors',
]

export const MAX_DESCRIPTION = 1000
export const MAX_PHOTOS = 4
/** Per-photo ceiling, checked on the decoded bytes before anything is stored. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
/**
 * Total decoded budget for one submission, after the browser's resize. Photos travel as base64 inside
 * the listing JSON, so this is what keeps the request body small enough for a phone on a bad connection.
 * Each photo is then stored under its own KV key, well inside the 25 MB value limit.
 */
export const MAX_PHOTOS_TOTAL_BYTES = 2 * 1024 * 1024
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
/** Long edge the browser resizes to before upload. 1600px is sharp on a phone and stays small. */
export const PHOTO_MAX_EDGE = 1600
export const PHOTO_QUALITY = 0.8

/** A bedroom count as the label renters read. 0 is a studio, which is what the feeds call it. */
export function bedroomLabel(count) {
  if (count === 0) return 'Studio'
  if (count === 1) return '1 bedroom'
  return `${count} bedrooms`
}
