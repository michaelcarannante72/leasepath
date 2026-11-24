import { tx } from '../i18nAuto.js'

/**
 * "Type your own limit". Used where LeasePath has no verified limit for the renter's program (HASA, state FHEPS, anything else).
 * The number is the renter's own and is kept on this device only (leasepath.checks). It never goes in an API call or analytics event.
 * Digits only, up to 5. No program name is asked for or kept here.
 */
export function RentLimitField({ value, onChange, id = 'rent-limit' }) {
  return (
    <div className="stack rent-limit-field">
      <label htmlFor={id}>
        <span>{tx("Your monthly rent limit")}</span>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          value={value || ''}
          onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, '').slice(0, 5))}
        />
      </label>
      <p className="fine" id={`${id}-help`}>{tx("Type the amount from your shopping letter or voucher paperwork. Not sure? Ask your case manager or housing specialist.")}</p>
      <p className="fine">{tx("This stays on your device.")}</p>
    </div>
  )
}
