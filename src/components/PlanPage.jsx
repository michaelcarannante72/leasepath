import { ACCESS_HRA_URL, HOMEBASE_URL } from '../data.js'
import { CITYFHEPS_2026, CITYFHEPS_ROOM_MAX, CITYFHEPS_SOURCE, VOUCHER_PROGRAMS, money } from '../fit.js'

const SITUATIONS = [
  'Shelter or transitional housing',
  'Doubled up with someone else',
  'HASA SRO or supportive housing',
  'Renting now',
  'Unsure',
]

export function PlanPage({ plan, onChange }) {
  return (
    <div className="page">
      <p className="eyebrow">My voucher</p>
      <h1>The figures on your letter</h1>
      <p className="lede">
        LeasePath stores this in this browser so search can compare sample rents with it. It does not decide eligibility, and it does not leave the phone unless you choose to include it in an assistant question.
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
            {Array.from({ length: 8 }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>{count}</option>
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

      {plan.program === 'CityFHEPS' && (
        <section className="panel">
          <h2>Published CityFHEPS maximums, 2026</h2>
          <p>These are maximum rents when every utility is in the lease. Your shopping letter can be lower. If you pay a utility, DSS subtracts an allowance.</p>
          <table>
            <thead>
              <tr><th>Household</th><th>Size</th><th>Maximum</th></tr>
            </thead>
            <tbody>
              {CITYFHEPS_2026.map((row) => (
                <tr key={row.label}>
                  <td>{row.family.join(' or ')}</td>
                  <td>{row.label}</td>
                  <td>{money(row.maxRentAllUtilities)}</td>
                </tr>
              ))}
              <tr>
                <td>Room, NYC</td>
                <td>Room</td>
                <td>{money(CITYFHEPS_ROOM_MAX)}</td>
              </tr>
            </tbody>
          </table>
          <p className="fine">Source: {CITYFHEPS_SOURCE}. New packages on or after March 1, 2026 use this column.</p>
        </section>
      )}

      {plan.program === 'HASA' && (
        <section className="panel">
          <h2>HASA sets the rent with you</h2>
          <p>LeasePath does not keep a HASA rent chart. Your caseworker has the amount for your household. HASA ServiceLine is 718-557-1399, weekdays 9am to 5pm. Food, the food box, and the other city programs are on Resources. That list does not ask you to sign in.</p>
        </section>
      )}

      {plan.program === 'FHEPS' && (
        <section className="panel">
          <h2>Use the amount on your FHEPS letter</h2>
          <p>FHEPS is the state family supplement. LeasePath does not keep a FHEPS dollar chart. Type the figure from your paperwork above. Community applications go through Homebase.</p>
          <a className="button" href="https://www.nyc.gov/site/hra/help/fheps.page" target="_blank" rel="noreferrer">Open FHEPS</a>
        </section>
      )}

      {plan.program === 'Section 8' && (
        <section className="panel">
          <h2>Use the payment standard on your voucher</h2>
          <p>NYCHA and HPD set Section 8 payment standards. LeasePath does not copy those dollar amounts into a chart. Type the figure from your paperwork above, and the cards will compare asking rent with it.</p>
        </section>
      )}
    </div>
  )
}
