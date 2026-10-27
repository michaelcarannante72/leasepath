import { useMemo, useState } from 'react'
import { PROGRAMS, estimateRentShare, parseMonthlyIncome } from '../data/rentShare.js'

export function RentCalculatorPage() {
  const [program, setProgram] = useState('section8')
  const [income, setIncome] = useState('')
  const result = useMemo(() => estimateRentShare({ program, monthlyIncome: income }), [program, income])
  const parsed = parseMonthlyIncome(income)

  return (
    <article className="page rent-calculator">
      <p className="eyebrow">Rent share</p>
      <h1>Estimate your part of the rent</h1>
      <p className="lede">
        Practice math on this device only. Nothing is sent to a server. You may qualify for a different share —
        your shopping letter and your worker control the real case. This is not an approval.
      </p>

      <form className="rent-share-form" onSubmit={(e) => e.preventDefault()}>
        <fieldset>
          <legend>Program</legend>
          <div className="borough-chips" role="radiogroup" aria-label="Program">
            {PROGRAMS.map((p) => (
              <label key={p.id} className={`chip${program === p.id ? ' is-pressed' : ''}`}>
                <input
                  type="radio"
                  name="program"
                  value={p.id}
                  checked={program === p.id}
                  onChange={() => setProgram(p.id)}
                  className="sr-only"
                />
                {p.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label htmlFor="rent-income">
          Gross monthly household income (whole dollars)
          <input
            id="rent-income"
            inputMode="numeric"
            autoComplete="off"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="e.g. 2400"
          />
        </label>
        {parsed.status === 'invalid' ? <p className="rent-share-hint" role="alert">Enter whole dollars only.</p> : null}
      </form>

      <section className="rent-share-result" aria-live="polite">
        <h2>{result.title}</h2>
        {result.estimateLabel ? <p className="rent-share-amount">{result.estimateLabel}</p> : null}
        {result.fortyCap != null ? (
          <p className="fine">40% of that income (initial lease-up cap when rent is above the payment standard): about {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(result.fortyCap)} / month.</p>
        ) : null}
        <p>{result.body}</p>
        {result.sources?.length ? (
          <ul className="source-list">
            {result.sources.map((s) => (
              <li key={s.href}>
                Source:{' '}
                <a href={s.href} target="_blank" rel="noreferrer">{s.label}</a>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <aside className="rent-share-disclaimer">
        <h2>Disclaimer</h2>
        <p>
          LeasePath does not decide who qualifies. Deductions, utilities, minimum rent, welfare rent, and payment
          standards change the real number. Confirm with NYCHA, HPD, HCR, HRA, or your caseworker before you sign a lease.
        </p>
      </aside>

      <p className="card-actions">
        <a className="button" href="#/plan">My voucher</a>
        <a className="button button-quiet" href="#/resources">Resources</a>
      </p>
    </article>
  )
}
