import { FOOTER_GROUPS, SITE_PAGES } from '../sitePages.js'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        {FOOTER_GROUPS.map((group) => (
          <section key={group}>
            <h2>{group}</h2>
            <ul>
              {SITE_PAGES.filter((page) => page.group === group).map((page) => (
                <li key={page.slug}>
                  <a href={`#/info/${page.slug}`}>{page.title}</a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </footer>
  )
}

export function InfoPage({ page }) {
  if (!page) {
    return (
      <div className="page">
        <h1>That page is not on this list.</h1>
        <a className="button" href="#/">Back to search</a>
      </div>
    )
  }
  return (
    <article className="page">
      <p className="eyebrow">{page.group}</p>
      <h1>{page.title}</h1>
      <p className="lede">{page.body}</p>
      <a className="button button-quiet" href="#/">Back to search</a>
    </article>
  )
}
