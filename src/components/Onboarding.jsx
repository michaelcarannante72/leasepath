import { tx } from '../i18nAuto.js'
import { useEffect, useRef, useState } from 'react'
import { ACCESS_HRA_URL, HOMEBASE_URL } from '../data.js'
import { VOUCHER_PROGRAMS } from '../fit.js'
import { HOUSEHOLD_CHOICES, LARGE_HOUSEHOLD } from '../rentCheck.js'
import { Icon } from './Icon.jsx'

const RECEIVING = [
  ['has', 'I have one now'],
  ['none', 'I do not have one yet'],
  ['unsure', 'Not sure'],
]

const UTILITIES = [
  ['', 'Not sure'],
  ['All utilities are included', 'All utilities are included'],
  ['I would pay one or more utilities', 'I would pay one or more utilities'],
]

export function Onboarding({ plan, onSave, onSkip, preset }) {
  const closeButton = useRef(null)
  const [draft, setDraft] = useState(() => ({
    ...plan,
    receiving: preset === 'letter' ? 'has' : plan.receiving || (VOUCHER_PROGRAMS.includes(plan.program) ? 'has' : ''),
  }))

  useEffect(() => {
    closeButton.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') onSkip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSkip])

  const set = (patch) => setDraft((current) => ({ ...current, ...patch }))
  const showProgram = draft.receiving === 'has' || draft.receiving === 'unsure'
  const showLetter = draft.receiving === 'has' || (draft.receiving === 'unsure' && draft.program)

  return (
    <div className="sheet-backdrop modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onSkip() }}>
      <section className="setup-modal" role="dialog" aria-modal="true" aria-labelledby="onboard-title">
        <button ref={closeButton} type="button" className="icon-button modal-close" aria-label={tx("Close")} onClick={onSkip}>
          <Icon name="close" size={18} />
        </button>
        <p className="eyebrow">{tx("Your voucher")}</p>
        <h2 id="onboard-title">{preset === 'account' ? 'Save your letter on this account' : preset === 'letter' || draft.receiving === 'has' ? 'What’s on your shopping letter?' : 'Which voucher do you have?'}</h2>
        <p className="setup-intro">{preset === 'account' ? 'You signed up without Google. This account can open the same letter on another phone. It does not decide whether you qualify.' : 'This stays on this phone. If you sign in, it also stays on your account. It does not decide whether you qualify.'}</p>
        <form
          className="setup-fields"
          onSubmit={(event) => {
            event.preventDefault()
            onSave(draft)
          }}
        >
          <div className="setup-scroll">
          {preset !== 'letter' && (
          <fieldset>
            <legend>{tx("Are you receiving a housing voucher?")}</legend>
            <div className="choice-grid">
              {RECEIVING.map(([value, label]) => (
                <label key={value} className={draft.receiving === value ? 'choice is-on' : 'choice'}>
                  <input
                    type="radio"
                    name="receiving"
                    checked={draft.receiving === value}
                    onChange={() => set({ receiving: value, program: value === 'none' ? '' : draft.program })}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          )}

          {draft.receiving === 'none' && (
            <div className="apply-note">
              <p>{tx("Start at ACCESS HRA. That is where New York City takes applications for Cash Assistance and SNAP. Many rent supplements start there. A community application for CityFHEPS or FHEPS can go through")} <a href={HOMEBASE_URL} target="_blank" rel="noreferrer">{tx("Homebase")}</a>{tx(". A new HASA application is by phone: HASA ServiceLine, 718-557-1399, weekdays 9am to 5pm.")}</p>
              <div className="apply-links">
                <a className="button" href={ACCESS_HRA_URL} target="_blank" rel="noreferrer">{tx("Open ACCESS HRA")}</a>
              </div>
            </div>
          )}

          {draft.receiving === 'unsure' && (
            <p className="setup-note">{tx("If a letter already names a program, pick it below. If you do not have one, use ACCESS HRA. LeasePath cannot tell you whether you qualify.")}</p>
          )}

          {showProgram && (
            <fieldset>
              <legend>{tx("Which program is on your letter?")}</legend>
              <div className="choice-grid">
                {VOUCHER_PROGRAMS.map((program) => (
                  <label key={program} className={draft.program === program ? 'choice is-on' : 'choice'}>
                    <input type="radio" name="program" checked={draft.program === program} onChange={() => set({ program })} />
                    {program}
                  </label>
                ))}
                <label className={draft.program === '' ? 'choice is-on' : 'choice'}>
                  <input type="radio" name="program" checked={draft.program === ''} onChange={() => set({ program: '' })} />
                  {tx("Not sure which one")}
                </label>
              </div>
            </fieldset>
          )}

          {draft.receiving === 'unsure' && !draft.program && (
            <div className="apply-links">
              <a className="button" href={ACCESS_HRA_URL} target="_blank" rel="noreferrer">{tx("Open ACCESS HRA")}</a>
            </div>
          )}

          {draft.program === 'HASA' && (
            <p className="setup-note">{tx("LeasePath has the HASA rent schedule on My voucher, as HASA’s own figures. Your caseworker sets the rent that applies to you. You can still save the amount on your letter.")}</p>
          )}
          {draft.program === 'FHEPS' && (
            <p className="setup-note">{tx("LeasePath does not keep a FHEPS rent chart. Save the amount on your letter if you have it.")}</p>
          )}

          {showLetter && (
            <>
              <label>
                <span>{tx("People in the household")}</span>
                <select value={draft.household} onChange={(event) => set({ household: event.target.value })}>
                  <option value="">{tx("Select")}</option>
                  {HOUSEHOLD_CHOICES.map((count) => (
                    <option key={count} value={count}>{count === LARGE_HOUSEHOLD ? '9 or more' : count}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>{tx("Monthly amount on your letter")}</span>
                <input
                  inputMode="numeric"
                  value={draft.letterRent}
                  onChange={(event) => set({ letterRent: event.target.value.replace(/[^\d]/g, '') })}
                  placeholder={tx("Skip if you do not have it yet")}
                />
              </label>
              <label>
                <span>{tx("Utilities on that letter")}</span>
                <select value={draft.utilities} onChange={(event) => set({ utilities: event.target.value })}>
                  {UTILITIES.map(([value, label]) => (
                    <option key={value || 'unsure'} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </>
          )}

          </div>
          <div className="setup-actions">
            <button type="button" className="button button-quiet" onClick={onSkip}>{tx("Skip for now")}</button>
            <button type="submit" className="button">{tx("Save details")}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
