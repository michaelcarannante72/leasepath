import { STEPS } from '../data.js'
import { Icon } from './Icon.jsx'

export function StepsPage({ checked, onToggle }) {
  const done = checked.length
  return (
    <div className="page">
      <p className="eyebrow">Steps</p>
      <h1>From the letter to the lease</h1>
      <p className="lede">{done} of {STEPS.length} checked. Your worker’s instructions come first if they differ.</p>
      <div className="step-progress" role="progressbar" aria-label="Steps checked" aria-valuemin={0} aria-valuemax={STEPS.length} aria-valuenow={done}>
        <span style={{ width: `${STEPS.length ? Math.round((done / STEPS.length) * 100) : 0}%` }} />
      </div>
      <p className="after-link"><a href="#/after-you-find">After you find an apartment: rent review, inspection, and move-in →</a></p>
      <p className="after-link"><a href="#/moving-help">Moving help: One Shot Deal and special grants →</a></p>
      <ol className="steps">
        {STEPS.map((step, index) => {
          const on = checked.includes(index)
          return (
            <li key={step.title}>
              <label className={on ? 'step is-on' : 'step'}>
                <input type="checkbox" checked={on} onChange={() => onToggle(index)} />
                <span className="step-mark" aria-hidden="true">{on ? <Icon name="check" size={16} /> : index + 1}</span>
                <span>
                  <strong>{step.title}</strong>
                  <span>{step.detail}</span>
                </span>
              </label>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
