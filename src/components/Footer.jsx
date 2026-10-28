import { tx } from '../i18nAuto.js'
import { useLanguage } from './languageContext.js'
import { FOOTER_GROUPS, SITE_PAGES } from '../sitePages.js'
import { SEARCH_PAGES } from '../data/voucherSearches.js'
import { OPEN_ANALYTICS_CHOICE } from './AnalyticsConsent.jsx'

function AnalyticsChoiceLink() {
  return <button type="button" className="text-button footer-analytics" onClick={() => window.dispatchEvent(new Event(OPEN_ANALYTICS_CHOICE))}>{tx("Analytics choice")}</button>
}

const COMPACT_SLUGS = ['help', 'privacy', 'terms', 'submit-listings']

function pageHref(slug) {
  if (slug === 'privacy' || slug === 'terms') return `/${slug}`
  if (slug === 'submit-listings') return '#/list-unit'
  return `#/info/${slug}`
}

/** About a dozen chips; the full list lives on /search (See all). */
export const POPULAR_CHIP_LIMIT = 12

function PopularSearchChips() {
  const { t } = useLanguage()
  const chips = SEARCH_PAGES.slice(0, POPULAR_CHIP_LIMIT)
  return (
    <section className="popular-searches" aria-labelledby="popular-searches-heading">
      <h2 id="popular-searches-heading">{t('popular.title')}</h2>
      <div className="popular-search-chips">
        {chips.map((page) => (
          <a key={page.path} className="popular-search-chip" href={page.path}>{page.chipLabel}</a>
        ))}
      </div>
      <p className="popular-searches-more"><a href="/search">{t('popular.more')}</a></p>
    </section>
  )
}

function NotAffiliated() {
  const { t } = useLanguage()
  return <p className="not-affiliated">{t("hero.notAffiliated")}</p>
}

export function Footer({ compact = false }) {
  if (compact) {
    return (
      <footer className="site-footer site-footer-compact">
        <PopularSearchChips />
        <nav aria-label={tx("Footer")}>
          {COMPACT_SLUGS.map((slug) => {
            const page = SITE_PAGES.find((item) => item.slug === slug)
            return page ? (
              <a key={page.slug} href={pageHref(page.slug)}>{page.title}</a>
            ) : null
          })}
          <a href="#/blog">{tx("Blog")}</a>
          <a href="#/install">{tx("Install the app")}</a>
          <a href="#/sponsor">{tx("Sponsor LeasePath")}</a>
          <AnalyticsChoiceLink />
        </nav>
        <NotAffiliated />
      </footer>
    )
  }

  return (
    <footer className="site-footer">
      <PopularSearchChips />
      <div className="footer-grid">
        {FOOTER_GROUPS.map((group) => (
          <section key={group}>
            <h2>{group}</h2>
            <ul>
              {SITE_PAGES.filter((page) => page.group === group).map((page) => (
                <li key={page.slug}>
                  <a href={pageHref(page.slug)}>{page.title}</a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="footer-analytics-row"><a href="#/sponsor">{tx("Sponsor LeasePath")}</a> · <AnalyticsChoiceLink /></p>
      <NotAffiliated />
    </footer>
  )
}

export function InfoPage({ page }) {
  if (!page) {
    return (
      <div className="page">
        <h1>{tx("That page is not on this list.")}</h1>
        <a className="button" href="#/">{tx("Back to search")}</a>
      </div>
    )
  }
  return (
    <article className="page">
      <p className="eyebrow">{page.group}</p>
      <h1>{page.title}</h1>
      {String(page.body || '').split(/\n\n+/).filter(Boolean).map((part) => (
        <p className="lede" key={part}>{part}</p>
      ))}
      <a className="button button-quiet" href="#/">{tx("Back to search")}</a>
    </article>
  )
}
