import { tx } from '../i18nAuto.js'
import { useMemo, useState } from 'react'
import {
  LAST_REVIEWED,
  PACK_TITLE,
  buildPackPdf,
  loadPackSnapshot,
  packFilename,
  packLines,
  shareOrDownloadPack,
} from '../caseworkerPack.js'
import { Icon } from './Icon.jsx'

export function CaseworkerPackPage() {
  const snapshot = useMemo(() => loadPackSnapshot(), [])
  const lines = useMemo(() => packLines(snapshot), [snapshot])
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  const doneCount = snapshot.steps.filter((s) => s.done).length

  const runShare = async () => {
    setBusy(true)
    setStatus('')
    try {
      const pdf = buildPackPdf(snapshot, lines)
      const result = await shareOrDownloadPack(pdf, { filename: packFilename() })
      if (result.aborted) setStatus(tx('Share canceled. Nothing left this phone.'))
      else if (result.method === 'share') setStatus(tx('Shared from your share sheet. LeasePath did not upload the PDF.'))
      else setStatus(tx('Downloaded to this device. LeasePath did not upload the PDF.'))
    } catch {
      setStatus(tx('Could not build the PDF on this device. Try again, or screenshot the preview.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page pack-page">
      <p className="eyebrow">{tx("Steps")}</p>
      <h1>{PACK_TITLE}</h1>
      <p className="lede">
        {tx("Build a PDF of your checklist and unit notes on this phone. Share it with your caseworker yourself — LeasePath never uploads this pack.")}
      </p>

      <aside className="notice-card" aria-labelledby="pack-privacy">
        <h2 id="pack-privacy">{tx("Stays on this device")}</h2>
        <p>
          {tx("The PDF is built in your browser from what you already saved here. Nothing goes to LeasePath servers. Use your phone’s share sheet or download. Skip anything you do not want your worker to see.")}
        </p>
      </aside>

      <section className="panel" aria-labelledby="pack-summary">
        <h2 id="pack-summary">{tx("What’s in this pack")}</h2>
        <ul className="pack-summary">
          <li>{tx("Steps checklist:")} {doneCount} {tx("of")} {snapshot.steps.length} {tx("checked")}</li>
          <li>{tx("Voucher details from My voucher")}{snapshot.plan?.program ? ` (${snapshot.plan.program})` : ''}</li>
          <li>
            {tx("Paste-a-listing check:")}{' '}
            {snapshot.listingCheck ? 'included from this phone' : 'none saved yet'}
          </li>
          <li>
            {tx("Docs tracker:")}{' '}
            {snapshot.docsTracker ? 'included from this phone' : 'none saved yet'}
          </li>
        </ul>
        <div className="pack-actions">
          <button type="button" className="button" onClick={runShare} disabled={busy}>
            {busy ? 'Building…' : 'Share or download PDF'}
          </button>
          <a className="button button-quiet" href="#/steps">{tx("Back to Steps")}</a>
        </div>
        {status && <p className="pack-status" role="status">{status}</p>}
      </section>

      <section className="panel pack-preview" aria-labelledby="pack-preview-title">
        <h2 id="pack-preview-title">{tx("Preview")}</h2>
        <pre className="pack-pre">{lines.join('\n')}</pre>
      </section>

      <p className="fine after-caveat">
        {tx("Not an official HRA, NYCHA, or HPD form. Last reviewed")} {LAST_REVIEWED}.{' '}
        <Icon name="external" size={12} />
      </p>
    </div>
  )
}
