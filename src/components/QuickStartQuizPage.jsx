import { tx } from '../i18nAuto.js'
import { useMemo, useState } from 'react'
import {
  BOROUGH_OPTIONS,
  SITUATION_OPTIONS,
  VOUCHER_OPTIONS,
  clearQuiz,
  readQuiz,
  routeQuizAnswers,
  writeQuiz,
} from '../data/quickStartQuiz.js'

function OptionList({ name, options, value, onChange }) {
  return (
    <fieldset className="quiz-options">
      <legend className="sr-only">{name}</legend>
      {options.map((opt) => (
        <label key={opt.id} className={`quiz-option${value === opt.id ? ' is-selected' : ''}`}>
          <input
            type="radio"
            name={name}
            value={opt.id}
            checked={value === opt.id}
            onChange={() => onChange(opt.id)}
          />
          <span className="quiz-option-text">
            <strong>{opt.label}</strong>
            {opt.hint ? <span className="fine">{opt.hint}</span> : null}
          </span>
        </label>
      ))}
    </fieldset>
  )
}

export function QuickStartQuizPage() {
  const saved = useMemo(() => readQuiz(), [])
  const [step, setStep] = useState(0)
  const [voucher, setVoucher] = useState(saved?.voucher || '')
  const [situation, setSituation] = useState(saved?.situation || '')
  const [borough, setBorough] = useState(saved?.borough || '')
  const [done, setDone] = useState(Boolean(saved?.voucher && saved?.situation && saved?.borough))

  const result = useMemo(
    () => (done ? routeQuizAnswers({ voucher, situation, borough }) : null),
    [done, voucher, situation, borough],
  )

  function finish() {
    writeQuiz({ voucher, situation, borough })
    setDone(true)
  }

  function reset() {
    clearQuiz()
    setVoucher('')
    setSituation('')
    setBorough('')
    setDone(false)
    setStep(0)
  }

  return (
    <article className="page quick-start-quiz">
      <p className="eyebrow">{tx("Quick start")}</p>
      <h1>{tx("Three questions. Right path.")}</h1>
      <p className="lede">
        {tx("Answers stay on this device only. We never send them to a server. You may qualify for help — a caseworker or program office decides.")}
      </p>

      {done && result ? (
        <section className="quiz-result" aria-live="polite">
          <h2>{tx("Your next stop")}</h2>
          <p className="quiz-result-title">{result.title}</p>
          <p>{result.reason}</p>
          <p className="card-actions">
            <a className="button" href={result.href}>{tx("Open")} {result.title}</a>
            <button type="button" className="button button-quiet" onClick={reset}>
              {tx("Retake quiz")}
            </button>
          </p>
          <p className="fine">{tx("Saved on this phone or computer. Clear it anytime with Retake quiz or your browser settings.")}</p>
        </section>
      ) : (
        <>
          <p className="fine" aria-live="polite">{tx("Question")} {step + 1} {tx("of 3")}</p>
          {step === 0 ? (
            <section>
              <h2>{tx("What voucher or program are you working with?")}</h2>
              <OptionList name="voucher" options={VOUCHER_OPTIONS} value={voucher} onChange={setVoucher} />
              <p className="card-actions">
                <button type="button" className="button" disabled={!voucher} onClick={() => setStep(1)}>
                  {tx("Next")}
                </button>
              </p>
            </section>
          ) : null}
          {step === 1 ? (
            <section>
              <h2>{tx("What’s your situation right now?")}</h2>
              <OptionList name="situation" options={SITUATION_OPTIONS} value={situation} onChange={setSituation} />
              <p className="card-actions">
                <button type="button" className="button button-quiet" onClick={() => setStep(0)}>{tx("Back")}</button>
                <button type="button" className="button" disabled={!situation} onClick={() => setStep(2)}>
                  {tx("Next")}
                </button>
              </p>
            </section>
          ) : null}
          {step === 2 ? (
            <section>
              <h2>{tx("Which borough are you shopping or staying in?")}</h2>
              <OptionList name="borough" options={BOROUGH_OPTIONS} value={borough} onChange={setBorough} />
              <p className="card-actions">
                <button type="button" className="button button-quiet" onClick={() => setStep(1)}>{tx("Back")}</button>
                <button type="button" className="button" disabled={!borough} onClick={finish}>
                  {tx("See my path")}
                </button>
              </p>
            </section>
          ) : null}
        </>
      )}

      <p className="quiz-nav">
        <a className="button button-quiet" href="#/">{tx("Back home")}</a>
        <a className="button button-quiet" href="#/resources">{tx("Resources")}</a>
      </p>
    </article>
  )
}
