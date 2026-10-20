import { CITYFHEPS_2026_ROWS, CITYFHEPS_PROGRAM, CITYFHEPS_ROOM_MAX, CITYFHEPS_RULES, CITYFHEPS_UTILITY_ALLOWANCES_1BR } from '../data/cityfheps.js'
import { HASA_PROGRAM, HASA_ROWS, HASA_RULES } from '../data/hasa.js'
import { SECTION8_AGENCIES, SECTION8_NEW_RENTAL_ROWS, SECTION8_PROGRAM, SECTION8_RECERT_ROWS, SECTION8_RULES } from '../data/section8.js'
import { ALLOWANCE_DATE_NOTE, isDisplayable, sourceFor } from '../data/sourced.js'
import { askFor, money } from '../rentCheck.js'
import { LETTER_DAYS, shoppingLetterDetail, shoppingLetterHeadline, shoppingLetterSource, shoppingLetterStatus } from '../shoppingLetter.js'
import { RentTable } from './RentTable.jsx'
import { SourceLine } from './SourceLine.jsx'
import { NychaScamWarning } from './AfterYouFindPage.jsx'

const FAMILY_COLUMNS = [
  { key: 'household', label: 'People', render: (row) => row.householdSize },
  { key: 'size', label: 'Size', render: (row) => (row.unitKind === 'sro' ? 'SRO' : row.unitKind === 'studio' ? 'Studio' : `${row.bedrooms} bedroom${row.bedrooms === 1 ? '' : 's'}`) },
]
const VOUCHER_COLUMNS = [
  { key: 'size', label: 'Voucher size', render: (row) => (row.bedrooms === 0 ? 'Studio' : `${row.bedrooms} bedroom${row.bedrooms === 1 ? '' : 's'}`) },
]

/** A rule note. When the rule's row is not an official sourced row, it says who to ask and states nothing else. */
function Rule({ rule, program, children }) {
  const shown = isDisplayable(rule)
  return (
    <p className="fine">
      {shown ? children : `${askFor(program)}.`}
      {shown ? <SourceLine source={sourceFor(rule, program)} /> : null}
    </p>
  )
}

const DEVICE_NOTE = 'These answers stay on this phone. They are not sent to your account or to the assistant.'

export function HasaPanel({ checks, onChecks }) {
  return (
    <section className="panel">
      <h2>HASA rent schedule</h2>
      <p>HASA is its own program. These are HASA figures, not CityFHEPS figures. Your caseworker approves the rent and the bedroom count for your household.</p>
      <RentTable program={HASA_PROGRAM} rows={HASA_ROWS} columns={FAMILY_COLUMNS} caption="HASA maximum rent, every utility included" />
      <Rule rule={HASA_RULES.notCityfheps} program={HASA_PROGRAM}>HASA rental assistance is not CityFHEPS. LeasePath keeps the two separate.</Rule>
      <Rule rule={HASA_RULES.bedroomExceptions} program={HASA_PROGRAM}>The schedule has no SRO or room row. Bedroom exceptions are case by case.</Rule>
      <Rule rule={HASA_RULES.heatHotWater} program={HASA_PROGRAM}>HASA needs heat and hot water in the lease, with limited exceptions such as housing lottery apartments.</Rule>
      <p className="fine">HRA says its guidelines are not a guarantee and can change.</p>
      <div className="stack">
        <p className="device-note">{DEVICE_NOTE}</p>
        <label>
          <span>Monthly utility amount your caseworker gave you (optional)</span>
          <input
            inputMode="numeric"
            value={checks.hasaDeduction}
            onChange={(event) => onChecks({ hasaDeduction: event.target.value.replace(/[^\d]/g, '').slice(0, 5) })}
            placeholder="Leave blank if you do not know"
          />
        </label>
        <Rule rule={HASA_RULES.utilityDeduction} program={HASA_PROGRAM}>
          If you pay a utility, HASA subtracts it from the maximum. HASA’s deduction amounts are not in the public schedule, so LeasePath does not assume one. {askFor(HASA_PROGRAM)} or use the HRA Landlord Utility Calculator.
        </Rule>
      </div>
    </section>
  )
}

export function CityfhepsPanel({ checks, onChecks }) {
  const roomSource = isDisplayable(CITYFHEPS_RULES.roomMax) ? sourceFor(CITYFHEPS_RULES.roomMax, CITYFHEPS_PROGRAM) : null
  const letterSource = shoppingLetterSource()
  const status = checks.letterDate ? shoppingLetterStatus(checks.letterDate) : null
  return (
    <>
      <section className="panel">
        <h2>CityFHEPS payment standards</h2>
        <p>These are CityFHEPS figures. They are maximum rents when every utility is in the lease. Your shopping letter states the highest rent for your household. If you pay a utility, DSS subtracts an allowance.</p>
        <RentTable program={CITYFHEPS_PROGRAM} rows={CITYFHEPS_2026_ROWS} columns={FAMILY_COLUMNS} caption="CityFHEPS maximum rent, every utility included" />
        <p className="fine">This is the current table (DSS-8r), effective April 1, 2026. An older package may use the 2025 table. LeasePath does not use the 2025 table. Ask your caseworker which table your package uses.</p>
        {roomSource && (
          <p className="fine">
            Room, NYC: {CITYFHEPS_PROGRAM} room maximum {money(CITYFHEPS_ROOM_MAX)}, with heat, hot water, electricity, and cooking gas (if the stove is not electric) included.
            <SourceLine source={roomSource} />
          </p>
        )}
        <Rule rule={CITYFHEPS_RULES.sroOneAdult} program={CITYFHEPS_PROGRAM}>An SRO is for one-adult households only.</Rule>
        <Rule rule={CITYFHEPS_RULES.bedroomStandard} program={CITYFHEPS_PROGRAM}>One bedroom or sleeping area per two people. A unit with fewer bedrooms than your letter is paid at its own figure. A unit with more is allowed only if the rent is within the figure for your household’s own size.</Rule>
        <Rule rule={CITYFHEPS_RULES.householdShareDepends} program={CITYFHEPS_PROGRAM}>Your own share of the rent depends on household size and each person’s income. It is in your Approval Letter.</Rule>
        <Rule rule={CITYFHEPS_RULES.householdShareLetter} program={CITYFHEPS_PROGRAM}>Do not give your Household Share Letter to a landlord. It is for you only.</Rule>
      </section>

      <section className="panel">
        <h2>CityFHEPS utility allowances</h2>
        <p>Only six 1-bedroom examples are loaded. For every other size the allowance is not yet loaded. {askFor(CITYFHEPS_PROGRAM)}.</p>
        <table>
          <caption>CityFHEPS utility allowance, 1 bedroom</caption>
          <thead><tr><th scope="col">Tenant pays</th><th scope="col">Allowance</th></tr></thead>
          <tbody>
            {CITYFHEPS_UTILITY_ALLOWANCES_1BR.map((item) => (
              <tr key={item.label}><td>{item.label}</td><td>{isDisplayable(item) ? `${money(item.amount)} a month` : askFor(CITYFHEPS_PROGRAM)}</td></tr>
            ))}
            <tr><td>Studio, 2 bedrooms and larger</td><td>Not yet loaded</td></tr>
          </tbody>
        </table>
        <p className="fine"><SourceLine source={sourceFor(CITYFHEPS_RULES.utilityAllowance, CITYFHEPS_PROGRAM, ALLOWANCE_DATE_NOTE)} /></p>
        <Rule rule={CITYFHEPS_RULES.landlordDeclaresUtilities} program={CITYFHEPS_PROGRAM}>The landlord must declare which utilities the rent includes. A landlord who does not provide utilities cannot be paid the all-utilities amount.</Rule>
        <div className="stack">
          <p className="device-note">{DEVICE_NOTE}</p>
          <label>
            <span>1-bedroom utility example that fits you (optional)</span>
            <select value={checks.cityfhepsAllowance} onChange={(event) => onChecks({ cityfhepsAllowance: event.target.value })}>
              <option value="">Not chosen</option>
              {CITYFHEPS_UTILITY_ALLOWANCES_1BR.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        <h2>CityFHEPS shopping letter timer</h2>
        {letterSource && (
          <p>
            A CityFHEPS shopping letter is valid for {LETTER_DAYS} days. The letter can be shown to landlords and brokers.
            <SourceLine source={letterSource} />
          </p>
        )}
        <div className="stack">
          <p className="device-note">{DEVICE_NOTE}</p>
          <label>
            <span>Issue date printed on your letter</span>
            <input type="date" value={checks.letterDate} onChange={(event) => onChecks({ letterDate: event.target.value })} />
          </label>
        </div>
        {/* The live region stays in the page so a screen reader announces each change in the timer. */}
        <div
          className={`timer${status ? '' : ' timer-empty'}${status?.state === 'expired' ? ' timer-expired' : ''}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {status && (
            <>
              <strong>{shoppingLetterHeadline(status)}</strong>
              {shoppingLetterDetail(status)}
            </>
          )}
        </div>
        {checks.letterDate && (
          <div className="button-row">
            <button type="button" className="button button-quiet" onClick={() => onChecks({ letterDate: '' })}>Clear date</button>
          </div>
        )}
        <p className="fine">LeasePath counts the issue date as day 0. If your letter says otherwise, follow the letter.</p>
      </section>
    </>
  )
}

export function Section8Panel({ checks, onChecks }) {
  const agency = checks.section8Agency
  return (
    <>
      <section className="panel">
        <h2>Section 8 payment standards</h2>
        <p>Section 8 is a federal program run by a housing authority, not by HRA or DSS. These are not CityFHEPS or HASA figures.</p>
        <Rule rule={SECTION8_RULES.agencies} program={SECTION8_PROGRAM}>NYCHA runs the largest NYC program. HPD and NYS Homes and Community Renewal also run Section 8 in NYC.</Rule>
        <NychaScamWarning />
        <Rule rule={SECTION8_RULES.notHraRules} program={SECTION8_PROGRAM}>Do not use HRA or DSS charts for Section 8. The voucher size comes from the housing authority’s occupancy standards.</Rule>
        <div className="stack">
          <p className="device-note">{DEVICE_NOTE}</p>
          <label>
            <span>Who issued your voucher?</span>
            <select value={agency} onChange={(event) => onChecks({ section8Agency: event.target.value })}>
              <option value="">Not chosen</option>
              {SECTION8_AGENCIES.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          {agency === 'NYCHA' && (
            <label>
              <span>Bedroom size printed on your voucher</span>
              <select value={checks.voucherBedrooms} onChange={(event) => onChecks({ voucherBedrooms: event.target.value })}>
                <option value="">Not chosen</option>
                <option value="0">Studio</option>
                {Array.from({ length: 8 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} bedroom{count === 1 ? '' : 's'}</option>)}
              </select>
            </label>
          )}
        </div>
      </section>

      {agency === 'HPD' && (
        <section className="panel">
          <h2>HPD Section 8</h2>
          <p>HPD payment standards depend on the ZIP code. LeasePath has no HPD figures. {askFor(SECTION8_PROGRAM)}, and type the amount on your HPD voucher into the “Monthly amount on your letter” box above.</p>
          <Rule rule={SECTION8_RULES.hpdStandards} program={SECTION8_PROGRAM}>HPD’s published standards may be out of date.</Rule>
        </section>
      )}

      {agency === 'NYCHA' && (
        <section className="panel">
          <h2>NYCHA Section 8 payment standards</h2>
          <p>NYCHA maximum rents when every utility is included, by the bedroom size on the voucher.</p>
          <RentTable program={SECTION8_PROGRAM} rows={SECTION8_NEW_RENTAL_ROWS} columns={VOUCHER_COLUMNS} caption="NYCHA Section 8, new rentals and transfers" />
          <RentTable program={SECTION8_PROGRAM} rows={SECTION8_RECERT_ROWS} columns={VOUCHER_COLUMNS} caption="NYCHA Section 8, annual recertifications" />
          <Rule rule={SECTION8_RULES.nychaUtilityAllowance} program={SECTION8_PROGRAM}>NYCHA subtracts a utility allowance for tenant-paid utilities. The allowance amounts are not yet loaded in LeasePath. {askFor(SECTION8_PROGRAM)}.</Rule>
          <Rule rule={SECTION8_RULES.nychaEpsDiscontinued} program={SECTION8_PROGRAM}>NYCHA stopped its ZIP-code exception standards on July 1, 2026.</Rule>
        </section>
      )}
    </>
  )
}
