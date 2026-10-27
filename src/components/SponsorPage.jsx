import { SPONSOR_CONTACT } from '../data/sponsors.js'

export function SponsorPage() {
  return (
    <div className="page sponsor-page">
      <p className="eyebrow">For landlords and partners</p>
      <h1>Sponsor LeasePath</h1>
      <p className="lede">
        LeasePath can show a clearly labeled Sponsored slot on Resources and Search.
        Nothing is tracked. No pixels. No third-party scripts. A sponsor is a plain link
        Michael puts in a config file.
      </p>

      <section aria-labelledby="sponsor-rules-title">
        <h2 id="sponsor-rules-title">Sponsor rules</h2>
        <ul className="sponsor-rules">
          <li>You must accept housing vouchers (CityFHEPS, FHEPS, HASA, Section 8, or other lawful subsidies).</li>
          <li>No fee scams. Applying for housing or a lottery is always free. Anyone who asks for an application fee to “guarantee” a spot is a scam — we will not sponsor that.</li>
          <li>LeasePath can refuse any sponsor, any time, with or without a reason.</li>
          <li>Sponsorship never affects Ruby, the Resource Navigator, or apartment rankings. Paid placement is labeled Sponsored and sits apart from organic results.</li>
          <li>No tracking pixels, no advertising cookies, no sale of personal information.</li>
        </ul>
      </section>

      <section aria-labelledby="sponsor-contact-title">
        <h2 id="sponsor-contact-title">Contact</h2>
        <p>
          Email <a href={`mailto:${SPONSOR_CONTACT}`}>{SPONSOR_CONTACT}</a> with your name, site,
          and which voucher programs you accept. Michael reviews every request by hand.
        </p>
      </section>

      <p className="sponsor-actions">
        <a className="button" href={`mailto:${SPONSOR_CONTACT}`}>Email about sponsorship</a>
        <a className="button button-quiet" href="#/resources">Back to Resources</a>
      </p>
    </div>
  )
}
