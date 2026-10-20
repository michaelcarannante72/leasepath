import { useEffect } from 'react'
import { CAVEAT, CHAP, EHV_NOTICE, HAVP, MOVING_NOTICE, TABLE_NOTE, LAST_REVIEWED, PROGRAMS, RIGHTS, SOURCES, STEPS } from '../afterYouFind.js'
import { Icon } from './Icon.jsx'

function SourceLink({ id }) {
  const source = SOURCES[id]
  return (
    <a href={source.href} target="_blank" rel="noreferrer">{source.label} <Icon name="external" size={12} /></a>
  )
}

/** NYCHA Section 8 only. Used on this page and under a listing's rent check. */
export function MovingNotice() {
  return (
    <aside className="notice-card moving-notice" aria-labelledby="moving-title">
      <p className="after-tags"><span className="after-tag">NYCHA Section 8 only</span></p>
      <h3 id="moving-title">{MOVING_NOTICE.title}</h3>
      <p>{MOVING_NOTICE.body}</p>
      <p className="fine"><SourceLink id={MOVING_NOTICE.source} /></p>
    </aside>
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
                  <th scope="row">{row.source ? <a href={SOURCES[row.source].href} target="_blank" rel="noreferrer">{row.program}</a> : row.program}</th>
                  <td>{row.agency}</td>
                  <td>{row.serves}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="table-note">{TABLE_NOTE.body}</p>
        <p className="fine">Source: <a href={SOURCES[TABLE_NOTE.source].href} target="_blank" rel="noreferrer">{TABLE_NOTE.sourceLabel} <Icon name="external" size={12} /></a></p>
      </section>

      <section id="ehv" className="panel notice-card" aria-labelledby="ehv-title">
        <h2 id="ehv-title">{EHV_NOTICE.title}</h2>
        <p>{EHV_NOTICE.body}</p>
        <p className="fine"><SourceLink id={EHV_NOTICE.source} /></p>
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
            {step.id === 'ceiling' && <MovingNotice />}
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

      <section id="havp" className="panel after-chap" aria-labelledby="havp-title">
        <h2 id="havp-title">{HAVP.title}</h2>
        <p className="after-chap-label">{HAVP.label}</p>
        <ul>{HAVP.points.map((point) => <li key={point}>{point}</li>)}</ul>
        <p className="fine">Source: {HAVP.sources.map((id, i) => <span key={id}>{i > 0 && ' · '}<SourceLink id={id} /></span>)}</p>
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
