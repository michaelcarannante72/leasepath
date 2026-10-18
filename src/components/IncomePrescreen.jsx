import { useEffect, useRef, useState } from 'react'
import {
  INCOME_HINT,
  INCOME_LABEL,
  PRESCREEN_EXPLAIN,
  PRESCREEN_NOTE,
  PRESCREEN_ORDER,
  PRESCREEN_TITLE,
  incomePeriod,
  incomePrescreen,
  isPrescreenProgram,
  storedIncome,
} from '../incomePrescreen.js'
import { povertySource } from '../data/poverty.js'
import { askFor } from '../rentCheck.js'
import { SourceLine } from './SourceLine.jsx'

// The wording is calm on purpose. No result is styled as a problem, and none hides a program or an apartment.
const TAGS = {
  under: { icon: '✓', label: 'Under the line' },
  at: { icon: '✓', label: 'At the line' },
  over: { icon: 'i', label: 'May not qualify' },
  missing: { icon: 'i', label: 'Needs details' },
  invalid: { icon: 'i', label: 'Check the amount' },
  ask: { icon: 'i', label: 'Ask' },
  unavailable: { icon: 'i', label: 'Ask' },
}

const INCOME_NOTE = 'Your income stays on this phone. It is not sent to your account or to the assistant.'
const ANNOUNCE_DELAY_MS = 1200

function ProgramResult({ result }) {
  const tag = TAGS[result.status] || TAGS.unavailable
  const title = result.program === 'HASA' ? 'HASA check (income only)' : 'CityFHEPS check (income only)'
  return (
    <div className={`prescreen-result prescreen-${result.status}`} data-program={result.program}>
      <h3>{title}</h3>
      <p className="prescreen-tag"><span aria-hidden="true">{tag.icon}</span> {tag.label}</p>
      <p className="prescreen-headline">{result.headline}</p>
      {result.details.map((text) => <p key={text} className="prescreen-detail">{text}</p>)}
      {result.sources.length > 0 && (
        <p className="prescreen-sources">
          <SourceLine source={povertySource()} />
          {result.sources.map((source) => <SourceLine key={source.document + source.url} source={source} />)}
        </p>
      )}
    </div>
  )
}

/**
 * Screen readers hear one short line, and only after the person stops typing. The result blocks themselves are not live
 * regions, so a keystroke does not read both blocks again.
 */
function useAnnouncement(text) {
  const [spoken, setSpoken] = useState('')
  const first = useRef(true)
  useEffect(() => {
    // Nothing is announced when the page opens, only after the person changes something.
    if (first.current) {
      first.current = false
      return undefined
    }
    const timer = setTimeout(() => setSpoken(text), ANNOUNCE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [text])
  return spoken
}

/** Income pre-screen. HASA and CityFHEPS each get their own result. Section 8, FHEPS, and others get no 200% check. */
export function IncomePrescreen({ plan, checks, onChecks, onClear }) {
  const program = plan.program
  const shown = isPrescreenProgram(program) ? [program] : program === '' ? PRESCREEN_ORDER : []
  const input = { household: plan.household, income: checks.incomeAmount, period: checks.incomePeriod }
  const results = shown.map((name) => incomePrescreen(name, input))
  // One short line per program, and nothing while an input is still missing.
  const announcement = results
    .filter((result) => result.status !== 'missing')
    .map((result) => `${result.program}: ${result.headline}`)
    .join(' ')
  const spoken = useAnnouncement(announcement)
  return (
    <section className="panel prescreen" aria-labelledby="prescreen-title">
      <h2 id="prescreen-title">{PRESCREEN_TITLE}</h2>
      <p>{PRESCREEN_NOTE}</p>
      <p className="fine">{PRESCREEN_EXPLAIN}</p>
      <p className="device-note">{INCOME_NOTE}</p>
      {shown.length === 0 ? (
        <p className="fine">
          The 200% of poverty pre-screen covers HASA and CityFHEPS only. For {program}, {askFor(program).toLowerCase()}.
        </p>
      ) : (
        <>
          <div className="stack">
            <label>
              <span>{INCOME_LABEL}</span>
              <input
                inputMode="decimal"
                autoComplete="off"
                value={checks.incomeAmount}
                aria-describedby="income-hint"
                onChange={(event) => onChecks({ incomeAmount: storedIncome(event.target.value) })}
                placeholder="Whole dollars"
              />
            </label>
            <p id="income-hint" className="fine">{INCOME_HINT}</p>
            <label>
              <span>Is that amount for a month or a year?</span>
              <select value={incomePeriod(checks.incomePeriod)} onChange={(event) => onChecks({ incomePeriod: event.target.value })}>
                <option value="month">A month</option>
                <option value="year">A year</option>
              </select>
            </label>
            {plan.household === '' && <p className="fine">The number of people comes from “People in the household” above.</p>}
            {checks.incomeAmount !== '' && (
              <button type="button" className="text-button" onClick={onClear}>Clear income</button>
            )}
          </div>
          <div className="prescreen-results">
            {results.map((result) => <ProgramResult key={result.program} result={result} />)}
          </div>
          <p className="sr-only" role="status" aria-live="polite">{spoken}</p>
        </>
      )}
    </section>
  )
}
