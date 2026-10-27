import { useEffect, useMemo, useState } from 'react'
import {
  BOROUGH_CODES,
  HOUSING_CONNECT_HOME,
  OPEN_DATA_SOURCE,
  loadActiveLotteries,
  filterByBorough,
} from '../data/housingConnect.js'
import { Icon } from './Icon.jsx'
import { useLanguage } from './LanguageProvider.jsx'

function LotteryCard({ lottery }) {
  const { t } = useLanguage()
  return (
    <li className="hc-card">
      <div className="hc-card-main">
        <strong className="hc-card-name">{lottery.name}</strong>
        <p className="hc-card-meta">
          <Icon name="pin" size={14} />
          <span>{lottery.borough}</span>
          {lottery.unitCount != null && <span aria-hidden="true"> · </span>}
          {lottery.unitCount != null && <span>{lottery.unitCount} units</span>}
        </p>
        {lottery.addresses.length > 0 && (
          <p className="hc-card-address">{lottery.addresses.slice(0, 3).join(' · ')}{lottery.addresses.length > 3 ? ' · …' : ''}</p>
        )}
        {lottery.amiTiers.length > 0 && (
          <ul className="hc-ami" aria-label={t('hc.amiTiers')}>
            {lottery.amiTiers.map((tier) => (
              <li key={tier.label}>
                <span className="hc-ami-label">{tier.label}</span>
                <span className="hc-ami-count">{tier.units} {tier.units === 1 ? 'unit' : 'units'}</span>
              </li>
            ))}
          </ul>
        )}
        {lottery.unitSizes.length > 0 && (
          <p className="hc-sizes">
            Sizes:{' '}
            {lottery.unitSizes.map((s) => `${s.label} (${s.units})`).join(' · ')}
          </p>
        )}
        {lottery.deadlineLabel && (
          <p className="hc-deadline">
            {t('hc.applyBy')} <strong>{lottery.deadlineLabel}</strong>
          </p>
        )}
      </div>
      <div className="card-actions">
        <a className="card-link" href={lottery.applyUrl} target="_blank" rel="noopener noreferrer">
          {t('hc.applyOn')} <Icon name="external" size={14} />
        </a>
      </div>
    </li>
  )
}

export function HousingConnectPage() {
  const { t } = useLanguage()
  const [lotteries, setLotteries] = useState([])
  const [borough, setBorough] = useState('All')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setError('')
    loadActiveLotteries()
      .then((list) => {
        if (cancelled) return
        setLotteries(list)
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setError('hc.error')
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const shown = useMemo(() => filterByBorough(lotteries, borough), [lotteries, borough])

  return (
    <div className="page housing-connect-page">
      <p className="eyebrow">{t('hc.eyebrow')}</p>
      <h1>{t('hc.title')}</h1>
      <p className="lede">{t('hc.lede')}</p>

      <aside className="hc-scam-note" role="note">
        <p>
          <strong>{t('hc.scamStrong')}</strong> {t('hc.scamRest')}
        </p>
      </aside>

      <div className="borough-chips" role="group" aria-label={t('hc.filter')}>
        <button type="button" className="chip" aria-pressed={borough === 'All'} onClick={() => setBorough('All')}>{t('hc.all')}</button>
        {BOROUGH_CODES.map((b) => (
          <button
            key={b.code}
            type="button"
            className="chip"
            aria-pressed={borough === b.code}
            onClick={() => setBorough(b.code)}
          >
            {b.name}
          </button>
        ))}
      </div>

      <p className="resource-status" role="status" aria-live="polite">
        {status === 'loading' && t('hc.loading')}
        {status === 'error' && t(error)}
        {status === 'ready' && (
          <>
            {shown.length === 0
              ? borough === 'All'
                ? t('hc.none')
                : t('hc.noneIn', { borough: BOROUGH_CODES.find((b) => b.code === borough)?.name || borough })
              : `${shown.length === 1 ? t('hc.count1') : t('hc.countN', { n: shown.length })}${borough !== 'All' ? t('hc.in', { borough: BOROUGH_CODES.find((b) => b.code === borough)?.name }) : ''}.`}
          </>
        )}
      </p>

      {status === 'ready' && shown.length > 0 && (
        <ul className="hc-list">
          {shown.map((lottery) => (
            <LotteryCard key={lottery.id} lottery={lottery} />
          ))}
        </ul>
      )}

      <p className="hc-actions">
        <a className="button" href={HOUSING_CONNECT_HOME} target="_blank" rel="noopener noreferrer">
          {t('hc.openHc')}
        </a>
        <a className="button button-quiet" href="#/resources">
          {t('hc.back')}
        </a>
      </p>

      <p className="source-line">
        Source:{' '}
        <a href={OPEN_DATA_SOURCE.url} target="_blank" rel="noopener noreferrer">
          {OPEN_DATA_SOURCE.title}
        </a>
        . Dataset vy5i-a666 (lotteries) and nibs-na6y (addresses). No income dollar figures shown — only AMI tier names and unit counts.
      </p>
    </div>
  )
}
