// Age confirmation at sign-up: one checkbox, kept on this device only.
// Nothing is sent to the server and nothing is added to the account record. "Delete my data"
// clears the key with every other leasepath.* value. LeasePath does not ask for a date of birth,
// and no medical information is collected at sign-up or anywhere else in the app.

export const AGE_CONFIRM_KEY = 'leasepath.age18'

// What the person chose in this page load, so a browser that blocks localStorage still works.
let sessionChoice = null

/** Record the checkbox answer for this page load, and keep "yes" on the device. */
export function setAgeConfirmed(value, storage = globalThis.localStorage) {
  sessionChoice = Boolean(value)
  if (value) {
    try {
      storage?.setItem(AGE_CONFIRM_KEY, 'yes')
    } catch {
      // Storage blocked: the page-load answer above still counts.
    }
  }
  return sessionChoice
}

/** True once someone on this device, or in this page load, confirmed they are 18 or older. */
export function readAgeConfirmed(storage = globalThis.localStorage) {
  if (sessionChoice !== null) return sessionChoice
  try {
    return storage?.getItem(AGE_CONFIRM_KEY) === 'yes'
  } catch {
    return false
  }
}
