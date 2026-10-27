import {
  APP_URL,
  installSteps,
  QR_SRC,
  shareText,
  mailtoShareHref,
  smsShareHref,
  whatsappShareHref,
} from '../data/installAndShare.js'
import { Icon } from './Icon.jsx'
import { promptInstall } from '../install.js'
import { useLanguage } from './languageContext.js'

export function InstallAndSharePage() {
  const { t, lang } = useLanguage()
  const share = shareText(lang)
  return (
    <article className="page install-share">
      <p className="eyebrow">{t('install.eyebrow')}</p>
      <h1>{t('install.title')}</h1>
      <p className="lede">{t('install.lede')}</p>

      <section className="install-block" aria-labelledby="install-heading">
        <h2 id="install-heading">{t('install.addTitle')}</h2>
        <p>
          <button type="button" className="button" onClick={() => promptInstall()}>{t('install.button')}</button>
        </p>
        {Object.entries(installSteps(lang)).map(([key, guide]) => (
          <div key={key} className="install-guide">
            <h3>{guide.title}</h3>
            <ol>
              {guide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </section>

      <section className="share-block" aria-labelledby="share-heading">
        <h2 id="share-heading">{t('install.shareTitle')}</h2>
        <p>{t('install.shareLede')}</p>
        <p className="share-preview">{share}</p>
        <div className="card-actions">
          <a className="button" href={smsShareHref(share)}>{t('install.text')}</a>
          <a className="button button-quiet" href={whatsappShareHref(share)} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a className="button button-quiet" href={mailtoShareHref(share)}>{t('install.email')}</a>
          <a className="button button-quiet" href={APP_URL} target="_blank" rel="noreferrer">
            {t('install.open')} <Icon name="external" size={14} />
          </a>
        </div>
      </section>

      <section className="flyer-block" aria-labelledby="flyer-heading">
        <h2 id="flyer-heading">{t('install.flyerTitle')}</h2>
        <p>{t('install.flyerLede', { url: APP_URL })}</p>
        <div className="flyer print-flyer">
          <p className="flyer-brand">LeasePath</p>
          <p className="flyer-tag">{t('install.flyerTag')}</p>
          <img
            className="flyer-qr"
            src={QR_SRC}
            width={220}
            height={220}
            alt={t('install.qrAlt')}
          />
          <p className="flyer-url">{APP_URL}</p>
          <p className="flyer-note">{t('install.flyerNote')}</p>
        </div>
        <p className="card-actions">
          <button type="button" className="button" onClick={() => window.print()}>{t('install.print')}</button>
        </p>
      </section>
    </article>
  )
}
