import { ACCESS_HRA_URL, HOMEBASE_URL } from '../data.js'
import { VOUCHER_PROGRAMS } from '../fit.js'
import { HOUSEHOLD_CHOICES, LARGE_HOUSEHOLD } from '../rentCheck.js'
import { IncomePrescreen } from './IncomePrescreen.jsx'
import { CityfhepsPanel, HasaPanel, Section8Panel } from './ProgramPanels.jsx'

const SITUATIONS = [
  'Shelter or transitional housing',
  'Doubled up with someone else',
  'HASA SRO or supportive housing',
  'Renting now',
  'Unsure',
]

export function PlanPage({ plan, onChange, checks, onChecks, onClearIncome }) {
  return (
    <div className="page">
      <p className="eyebrow">My voucher</p>
      <h1>The figures on your letter</h1>
      <p className="lede">
        LeasePath keeps this on this phone so search can compare sample rents with it. The shopping letter date and the other check answers below stay on this phone only. If you sign in, the same figures stay on your account. It does not decide eligibility.
      </p>
      <p className="next-action">
        {plan.receiving === 'none'
          ? 'Apply first. Search stays open while you do.'
          : !plan.program
            ? 'Next: pick the voucher named on your letter. Search can then mark which samples fit it.'
            : !Number(plan.letterRent)
              ? 'Next: add the monthly amount from your letter. Each card will say if the asking rent is inside it.'
              : 'Next: go back to Search. The cards compare these figures with the sample rents.'}
      </p>
      {plan.receiving === 'none' && (
        <section className="panel">
          <h2>No voucher on file yet</h2>
          <p>Start at ACCESS HRA for Cash Assistance and SNAP. Homebase takes community applications for CityFHEPS and FHEPS. A new HASA application is HASA ServiceLine, 718-557-1399, weekdays 9am to 5pm.</p>
          <div className="button-row">
            <a className="button" href={ACCESS_HRA_URL} target="_blank" rel="noreferrer">Open ACCESS HRA</a>
            <a className="button button-quiet" href={HOMEBASE_URL} target="_blank" rel="noreferrer">Find a Homebase</a>
          </div>
        </section>
      )}
      <form className="plan-form" onSubmit={(event) => event.preventDefault()}>
        <fieldset>
          <legend>Which voucher are you shopping with?</legend>
          <div className="choice-grid">
            {VOUCHER_PROGRAMS.map((program) => (
              <label key={program} className={plan.program === program ? 'choice is-on' : 'choice'}>
                <input
                  type="radio"
                  name="program"
                  value={program}
                  checked={plan.program === program}
                  onChange={() => onChange({ program, receiving: 'has' })}
                />
                {program}
              </label>
            ))}
            <label className={plan.program === '' && plan.receiving !== 'none' ? 'choice is-on' : 'choice'}>
              <input
                type="radio"
                name="program"
                value=""
                checked={plan.program === '' && plan.receiving !== 'none'}
                onChange={() => onChange({ program: '', receiving: plan.receiving === 'has' ? 'unsure' : plan.receiving })}
              />
              Not sure yet
            </label>
          </div>
        </fieldset>
        <label>
          <span>People in the household</span>
          <select value={plan.household} onChange={(event) => onChange({ household: event.target.value })}>
            <option value="">Select</option>
            {HOUSEHOLD_CHOICES.map((count) => (
              <option key={count} value={count}>{count === LARGE_HOUSEHOLD ? '9 or more' : count}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Where you are staying</span>
          <select value={plan.situation} onChange={(event) => onChange({ situation: event.target.value })}>
            <option value="">Skip for now</option>
            {SITUATIONS.map((situation) => (
              <option key={situation}>{situation}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Monthly amount on your letter</span>
          <input
            inputMode="numeric"
            value={plan.letterRent}
            onChange={(event) => onChange({ letterRent: event.target.value.replace(/[^\d]/g, '') })}
            placeholder="From the shopping letter or voucher"
          />
        </label>
        <label>
          <span>Utilities on that letter</span>
          <select value={plan.utilities} onChange={(event) => onChange({ utilities: event.target.value })}>
            <option value="">Not sure</option>
            <option value="All utilities are included">All utilities are included</option>
            <option value="I would pay one or more utilities">I would pay one or more utilities</option>
          </select>
        </label>
      </form>

      <IncomePrescreen plan={plan} checks={checks} onChecks={onChecks} onClear={onClearIncome} />

      {plan.program === 'CityFHEPS' && <CityfhepsPanel checks={checks} onChecks={onChecks} />}

      {plan.program === 'HASA' && <HasaPanel checks={checks} onChecks={onChecks} />}

      {plan.program === 'FHEPS' && (
        <section className="panel">
          <h2>Use the amount on your FHEPS letter</h2>
          <p>FHEPS is the state family supplement. LeasePath does not keep a FHEPS dollar chart. Type the figure from your paperwork above. Community applications go through Homebase.</p>
          <a className="button" href="https://www.nyc.gov/site/hra/help/fheps.page" target="_blank" rel="noreferrer">Open FHEPS</a>
        </section>
      )}

      {plan.program === 'Section 8' && <Section8Panel checks={checks} onChecks={onChecks} />}
    </div>
  )
}
