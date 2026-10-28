import { tx } from '../i18nAuto.js'
import { setAgeConfirmed } from '../ageGate.js'

/**
 * The one checkbox between sign-up and the Google button or the Create account button. Ticking it
 * keeps the answer on this device only; the parent decides what stays disabled until then.
 */
export function AgeConfirm({ id = 'age-confirm', checked, onChange }) {
  return (
    <label className="age-confirm" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          const next = event.target.checked
          setAgeConfirmed(next)
          onChange(next)
        }}
        required
      />
      <span>{tx("I am 18 or older.")}</span>
    </label>
  )
}
