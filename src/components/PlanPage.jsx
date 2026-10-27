import { tx } from '../i18nAuto.js'
import { useLanguage } from './languageContext.js'
import { ACCESS_HRA_URL, HOMEBASE_URL } from '../data.js'
import { VOUCHER_PROGRAMS } from '../fit.js'
import { HOUSEHOLD_CHOICES, LARGE_HOUSEHOLD } from '../rentCheck.js'
import { CityfhepsPanel, HasaPanel, Section8Panel } from './ProgramPanels.jsx'

const SITUATIONS = [
  'Shelter or transitional housing',
  'Doubled up with someone else',
  'HASA SRO or supportive housing',
  'Renting now',
  'Unsure',
]

export function PlanPage({ plan, onChange, checks, onChecks, signedIn, onDeleteAccount }) {
  const { t } = useLanguage()
  return (
    <div className="page">
      <p className="eyebrow">{tx("My voucher")}</p>
      <h1>{tx("The figures on your letter")}</h1>
      <p className="lede">
        {tx("LeasePath keeps this on this phone so search can compare sample rents with it. The shopping letter date and the other check answers below stay on this phone only. If you sign in, the same figures stay on your account. It does not decide eligibility.")}
      </p>
      <p className="after-link"><a href="#/caseworker-pack">{tx("Build a caseworker share pack from this phone →")}</a></p>
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
          <h2>{tx("No voucher on file yet")}</h2>
          <p>{tx("Start at ACCESS HRA for Cash Assistance and SNAP. Homebase takes community applications for CityFHEPS and FHEPS. A new HASA application is HASA ServiceLine, 718-557-1399, weekdays 9am to 5pm.")}</p>
          <div className="button-row">
            <a className="button" href={ACCESS_HRA_URL} target="_blank" rel="noreferrer">{tx("Open ACCESS HRA")}</a>
            <a className="button button-quiet" href={HOMEBASE_URL} target="_blank" rel="noreferrer">{tx("Find a Homebase")}</a>
          </div>
        </section>
      )}
      <form className="plan-form" onSubmit={(event) => event.preventDefault()}>
        <fieldset>
          <legend>{tx("Which voucher are you shopping with?")}</legend>
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
              {tx("Not sure yet")}
            </label>
          </div>
        </fieldset>
        <label>
          <span>{tx("People in the household")}</span>
          <select value={plan.household} onChange={(event) => onChange({ household: event.target.value })}>
            <option value="">{tx("Select")}</option>
            {HOUSEHOLD_CHOICES.map((count) => (
              <option key={count} value={count}>{count === LARGE_HOUSEHOLD ? '9 or more' : count}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{tx("Where you are staying")}</span>
          <select value={plan.situation} onChange={(event) => onChange({ situation: event.target.value })}>
            <option value="">{tx("Skip for now")}</option>
            {SITUATIONS.map((situation) => (
              <option key={situation}>{situation}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{tx("Monthly amount on your letter")}</span>
          <input
            inputMode="numeric"
            value={plan.letterRent}
            onChange={(event) => onChange({ letterRent: event.target.value.replace(/[^\d]/g, '') })}
            placeholder={tx("From the shopping letter or voucher")}
          />
        </label>
        <label>
          <span>{tx("Utilities on that letter")}</span>
          <select value={plan.utilities} onChange={(event) => onChange({ utilities: event.target.value })}>
            <option value="">{tx("Not sure")}</option>
            <option value="All utilities are included">{tx("All utilities are included")}</option>
            <option value="I would pay one or more utilities">{tx("I would pay one or more utilities")}</option>
          </select>
        </label>
      </form>

      <nav className="plan-tools" aria-labelledby="plan-tools-title">
        <h2 id="plan-tools-title">{t('plan.tools')}</h2>
        <ul className="tool-links">
          <li><a href="#/match-alerts"><strong>{t('plan.tool.match')}</strong><span>{t('plan.tool.match.d')}</span></a></li>
          <li><a href="#/rent-share"><strong>{t('plan.tool.rent')}</strong><span>{t('plan.tool.rent.d')}</span></a></li>
          <li><a href="#/waitlist"><strong>{t('plan.tool.waitlist')}</strong><span>{t('plan.tool.waitlist.d')}</span></a></li>
          <li><a href="#/income-check"><strong>{t('plan.tool.income')}</strong><span>{t('plan.tool.income.d')}</span></a></li>
        </ul>
      </nav>

      {plan.program === 'CityFHEPS' && <CityfhepsPanel checks={checks} onChecks={onChecks} />}

      {plan.program === 'HASA' && <HasaPanel checks={checks} onChecks={onChecks} />}

      {plan.program === 'FHEPS' && (
        <section className="panel">
          <h2>{tx("Use the amount on your FHEPS letter")}</h2>
          <p>{tx("FHEPS is the state family supplement. LeasePath does not keep a FHEPS dollar chart. Type the figure from your paperwork above. Community applications go through Homebase.")}</p>
          <a className="button" href="https://www.nyc.gov/site/hra/help/fheps.page" target="_blank" rel="noreferrer">{tx("Open FHEPS")}</a>
        </section>
      )}

      {plan.program === 'Section 8' && <Section8Panel checks={checks} onChecks={onChecks} />}

      <section className="panel danger-zone" aria-labelledby="delete-heading">
        <h2 id="delete-heading">{tx("Delete my data")}</h2>
        <p>{signedIn ? 'Erase your LeasePath account and everything on this phone, including your voucher details and income.' : 'Erase everything LeasePath saved on this phone, including your voucher details and income.'}</p>
        <button type="button" className="button delete-open" onClick={onDeleteAccount}>{signedIn ? 'Delete my account' : 'Delete my data'}</button>
      </section>
    </div>
  )
}
