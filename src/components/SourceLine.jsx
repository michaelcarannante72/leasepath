import { tx } from '../i18nAuto.js'
import { cardLabel } from '../fit.js'
import { sourceText } from '../rentCheck.js'

/** Program, document, effective date, the date the figures were copied, and the source link. Shown next to every rent figure. */
export function SourceLine({ source }) {
  if (!source) return null
  return (
    <span className="source-line">
      {sourceText(source)}
      {source.url ? (
        <>
          {' · '}
          <a href={source.url} target="_blank" rel="noreferrer">
            {tx("Source")}<span className="sr-only"> {tx("for")} {source.program}</span>
          </a>
        </>
      ) : null}
    </span>
  )
}

const ICONS = { good: '✓', watch: '!', note: 'i' }

export function FlagList({ flags }) {
  return (
    <ul className="flag-list">
      {flags.map((flag, index) => (
        <li key={`${index}-${flag.text}`} className={`flag flag-${flag.level}`}>
          <span className="flag-tag"><span aria-hidden="true">{ICONS[flag.level] || ICONS.note}</span> {cardLabel(flag)}</span>
          <span>{flag.text}</span>
          <SourceLine source={flag.source} />
          {(flag.extraSources || []).map((extra) => <SourceLine key={extra.document + extra.url} source={extra} />)}
        </li>
      ))}
    </ul>
  )
}
