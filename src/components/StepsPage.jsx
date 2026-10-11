import { STEPS } from '../data.js'
import { Icon } from './Icon.jsx'

export function StepsPage({ checked, onToggle }) {
  const done = checked.length
  return (
    <div className="page">
      <p className="eyebrow">Steps</p>
      <h1>From the letter to the lease</h1>
      <p className="lede">{done} of {STEPS.length} checked. Your worker’s instructions come first if they differ.</p>
      <div className="step-progress" role="presentation">
        <span style={{ width: `${STEPS.length ? Math.round((done / STEPS.length) * 100) : 0}%` }} />
      </div>
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
