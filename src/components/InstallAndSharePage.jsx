import {
  APP_URL,
  INSTALL_STEPS,
  QR_SRC,
  SHARE_TEXT,
  mailtoShareHref,
  smsShareHref,
  whatsappShareHref,
} from '../data/installAndShare.js'
import { Icon } from './Icon.jsx'
import { promptInstall } from '../install.js'

export function InstallAndSharePage() {
  return (
    <article className="page install-share">
      <p className="eyebrow">Install</p>
      <h1>Install and share LeasePath</h1>
      <p className="lede">
        Add LeasePath to your home screen so it works like an app. Share the link by text or WhatsApp.
        Print the flyer with the QR code. Nothing here sends your info to a server.
      </p>

      <section className="install-block" aria-labelledby="install-heading">
        <h2 id="install-heading">Add to Home Screen</h2>
        <p>
          <button type="button" className="button" onClick={() => promptInstall()}>
            Install when your browser offers it
          </button>
        </p>
        {Object.entries(INSTALL_STEPS).map(([key, guide]) => (
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
        <h2 id="share-heading">Share by text or WhatsApp</h2>
        <p>Opens your phone’s Messages or WhatsApp with this text ready to send:</p>
        <p className="share-preview">{SHARE_TEXT}</p>
        <div className="card-actions">
          <a className="button" href={smsShareHref()}>Text message</a>
          <a className="button button-quiet" href={whatsappShareHref()} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a className="button button-quiet" href={mailtoShareHref()}>Email</a>
          <a className="button button-quiet" href={APP_URL} target="_blank" rel="noreferrer">
            Open leasepath.app <Icon name="external" size={14} />
          </a>
        </div>
      </section>

      <section className="flyer-block" aria-labelledby="flyer-heading">
        <h2 id="flyer-heading">Printable QR flyer</h2>
        <p>
          Print this page or save as PDF. Scan the code to open {APP_URL}. Navy and gold match the app;
          no third-party tracker on the flyer.
        </p>
        <div className="flyer print-flyer">
          <p className="flyer-brand">LeasePath</p>
          <p className="flyer-tag">NYC voucher housing help</p>
          <img
            className="flyer-qr"
            src={QR_SRC}
            width={220}
            height={220}
            alt="QR code that opens https://leasepath.app"
          />
          <p className="flyer-url">{APP_URL}</p>
          <p className="flyer-note">Free. No account required. Your notes stay on your phone.</p>
        </div>
        <p className="card-actions">
          <button type="button" className="button" onClick={() => window.print()}>
            Print flyer
          </button>
        </p>
      </section>
    </article>
  )
}
