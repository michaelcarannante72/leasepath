import { useEffect } from 'react'
import { CAVEAT, CHAP, LAST_REVIEWED, PROGRAMS, RIGHTS, SOURCES, STEPS } from '../afterYouFind.js'
import { Icon } from './Icon.jsx'

function SourceLink({ id }) {
  const source = SOURCES[id]
  return (
    <a href={source.href} target="_blank" rel="noreferrer">{source.label} <Icon name="external" size={12} /></a>
  )
}

export function AfterYouFindPage() {
  useEffect(() => {
    if (window.location.hash.endsWith('#chap')) document.getElementById('chap')?.scrollIntoView()
  }, [])
  return (
    <div className="page after-page">
      <p className="eyebrow">Steps</p>
      <h1>After you find an apartment</h1>
      <p className="lede">What happens between “I like this place” and getting the keys, from your side. Your worker’s instructions come first.</p>

      <section className="panel" aria-labelledby="which-voucher">
        <h2 id="which-voucher">Which voucher do I have?</h2>
        <div className="table-scroll">
          <table className="voucher-table">
            <thead><tr><th scope="col">Program</th><th scope="col">Who runs it</th><th scope="col">Who it serves</th></tr></thead>
            <tbody>
              {PROGRAMS.map((row) => (
                <tr key={row.program}>
                  <th scope="row"><a href={SOURCES[row.source].href} target="_blank" rel="noreferrer">{row.program}</a></th>
                  <td>{row.agency}</td>
                  <td>{row.serves}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ol className="after-steps">
        {STEPS.map((step, index) => (
          <li key={step.id} id={`after-${step.id}`} className="panel">
            <h2><span className="step-mark" aria-hidden="true">{index + 1}</span> {step.title}</h2>
            <p className="after-tags" aria-label="Applies to">{step.applies.map((tag) => <span key={tag} className="after-tag">{tag}</span>)}</p>
            <p>{step.body}</p>
            {step.checklist && (
              <>
                <h3>{step.checklistTitle}</h3>
                <ul className="after-checklist">{step.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
              </>
            )}
            {step.tips && <ul className="after-tips">{step.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>}
            <p className="fine after-sources">Source: {step.sources.map((id, i) => <span key={id}>{i > 0 && ' · '}<SourceLink id={id} /></span>)}</p>
          </li>
        ))}
      </ol>

      <section className="panel after-rights" aria-labelledby="rights">
        <h2 id="rights">{RIGHTS.title}</h2>
        <p>{RIGHTS.body}</p>
        <p className="fine"><SourceLink id={RIGHTS.source} /></p>
      </section>

      <section id="chap" className="panel after-chap" aria-labelledby="chap-title">
        <h2 id="chap-title">{CHAP.title}</h2>
        <p className="after-chap-label">{CHAP.label}</p>
        <ul>{CHAP.points.map((point) => <li key={point}>{point}</li>)}</ul>
        <p className="fine">Source: <SourceLink id={CHAP.source} /></p>
      </section>

      <p className="fine after-caveat">{CAVEAT} Last reviewed {LAST_REVIEWED}.</p>
    </div>
  )
}
