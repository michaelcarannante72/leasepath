import {
  SEARCH_PAGES,
  parseSearchPath,
  HOUSING_CONNECT_URL,
} from '../src/data/voucherSearches.js'

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function money(n) {
  return `$${Number(n).toLocaleString('en-US')}`
}

const PAGE_STYLE = `
    body { margin: 0; font-family: Inter, system-ui, sans-serif; color: #1c2d42; background: #f4f7fb; }
    a { color: #1c2d42; }
    header, main, footer { max-width: 42rem; margin: 0 auto; padding: 1.25rem 1.25rem 0; }
    footer { padding-bottom: 3rem; }
    h1 { font-size: 1.65rem; letter-spacing: -0.03em; line-height: 1.2; margin: 0.5rem 0 1rem; }
    h2 { font-size: 1.05rem; margin: 1.75rem 0 0.6rem; }
    p, li { line-height: 1.55; }
    .eyebrow { color: #5c6b7a; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin: 0; }
    .lede { color: #5c6b7a; }
    .card { background: #fff; border: 1px solid #e3e8f0; border-radius: 16px; padding: 1rem 1.1rem; margin: 1rem 0; }
    .limit { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.03em; margin: 0.25rem 0; }
    .source { font-size: 0.9rem; color: #5c6b7a; }
    .links { display: grid; gap: 0.6rem; margin: 1rem 0; }
    .button {
      display: inline-flex; align-items: center; justify-content: center; min-height: 44px;
      padding: 0.55rem 1rem; border-radius: 999px; background: #1c2d42; color: #fff;
      font-weight: 700; text-decoration: none;
    }
    .button-quiet { background: #fff; color: #1c2d42; border: 1px solid #e3e8f0; }
    .tips { padding-left: 1.1rem; }
    .chips { display: flex; flex-wrap: wrap; gap: 0.45rem; margin: 0.75rem 0 0; }
    .chip {
      display: inline-flex; align-items: center; min-height: 36px; padding: 0.3rem 0.75rem;
      border-radius: 999px; border: 1px solid #e3e8f0; background: #fff;
      font-size: 0.82rem; font-weight: 700; text-decoration: none; color: #1c2d42;
    }
    .chip.is-current { background: #1c2d42; color: #fff; border-color: #1c2d42; }
    .index-groups { display: grid; gap: 1.5rem; }
    .cta { margin-top: 1.5rem; }
    nav.crumb { font-size: 0.9rem; margin-bottom: 0.5rem; }
    nav.crumb a { font-weight: 700; text-decoration: none; }
`

function shell({ title, description, canonical, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="theme-color" content="#1C2D42">
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:type" content="website">
  <style>${PAGE_STYLE}</style>
</head>
<body>
${body}
</body>
</html>`
}

function relatedChips(page, limit = 12) {
  const sameVoucher = SEARCH_PAGES.filter((item) => item.voucherSlug === page.voucherSlug && item.path !== page.path)
  const sameBorough = sameVoucher.filter((item) => item.boroughSlug === page.boroughSlug)
  const rest = sameVoucher.filter((item) => item.boroughSlug !== page.boroughSlug)
  const picks = [...sameBorough, ...rest].slice(0, limit)
  return picks.map((item) => `<a class="chip" href="${escapeHtml(item.path)}">${escapeHtml(item.chipLabel)}</a>`).join('\n')
}

export function searchIndexHtml() {
  const byVoucher = new Map()
  for (const page of SEARCH_PAGES) {
    if (!byVoucher.has(page.voucherSlug)) byVoucher.set(page.voucherSlug, { name: page.voucher.name, pages: [] })
    byVoucher.get(page.voucherSlug).pages.push(page)
  }
  const groups = [...byVoucher.values()].map((group) => {
    const chips = group.pages.map((page) => `<a class="chip" href="${escapeHtml(page.path)}">${escapeHtml(page.chipLabel)}</a>`).join('\n')
    return `<section>
      <h2>${escapeHtml(group.name)}</h2>
      <div class="chips">${chips}</div>
    </section>`
  }).join('\n')

  const body = `  <header>
    <p class="eyebrow"><a href="/">LeasePath</a></p>
    <h1>Popular voucher searches</h1>
    <p class="lede">CityFHEPS, NYCHA Section 8, and FHEPS rent limits by borough and bedroom size. Every figure includes utilities. Your letter and the agency still control the real case.</p>
  </header>
  <main>
    <div class="index-groups">
${groups}
    </div>
    <p class="cta"><a class="button" href="/#/">Consult our Resource Navigator</a></p>
    <p class="source">LeasePath is a practice guide. Not affiliated with HRA, NYCHA, or any government agency. Never pay anyone to apply for housing.</p>
  </main>
  <footer>
    <p><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/">Search apartments</a></p>
  </footer>`

  return shell({
    title: 'Popular voucher searches · LeasePath',
    description: 'Browse CityFHEPS, NYCHA Section 8, and FHEPS max rents by NYC borough and bedroom size, with prefilled Craigslist and StreetEasy searches.',
    canonical: 'https://leasepath.app/search',
    body,
  })
}

export function searchPageHtml(page) {
  const tips = page.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join('\n')
  const body = `  <header>
    <nav class="crumb" aria-label="Breadcrumb"><a href="/">LeasePath</a> · <a href="/search">Popular searches</a></nav>
    <p class="eyebrow">${escapeHtml(page.voucher.name)} · ${escapeHtml(page.borough.name)}</p>
    <h1>${escapeHtml(page.h1)}</h1>
  </header>
  <main>
    <section class="card" aria-labelledby="limit-heading">
      <h2 id="limit-heading">Max rent</h2>
      <p class="limit">${escapeHtml(money(page.limit))}<span class="source"> / month</span></p>
      <p>Includes utilities (heat, hot water, cooking gas, and electricity). ${escapeHtml(page.note)}</p>
      <p class="source">Source: <a href="${escapeHtml(page.source.url)}" rel="noopener noreferrer">${escapeHtml(page.source.title)}</a> (${escapeHtml(page.source.name)}).</p>
    </section>

    <section aria-labelledby="search-heading">
      <h2 id="search-heading">Search listings at this limit</h2>
      <p>These links open Craigslist or StreetEasy with the max rent and bedroom size already set. Listings change. Confirm rent, utilities, and voucher acceptance yourself.</p>
      <div class="links">
        <a class="button" href="${escapeHtml(page.craigslist)}" rel="noopener noreferrer">Craigslist · ${escapeHtml(page.borough.name)}</a>
        <a class="button button-quiet" href="${escapeHtml(page.streeteasy)}" rel="noopener noreferrer">StreetEasy · ${escapeHtml(page.borough.name)}</a>
      </div>
    </section>

    <section aria-labelledby="lottery-heading">
      <h2 id="lottery-heading">Housing Connect lotteries</h2>
      <p>NYC Housing Connect posts affordable lotteries across the five boroughs. You may qualify for openings in ${escapeHtml(page.borough.the)}. Applying is always free. Anyone who asks for a fee is a scam.</p>
      <p><a href="${escapeHtml(HOUSING_CONNECT_URL)}" rel="noopener noreferrer">Open NYC Housing Connect</a></p>
    </section>

    <section aria-labelledby="tips-heading">
      <h2 id="tips-heading">Quick tips</h2>
      <ul class="tips">
${tips}
      </ul>
    </section>

    <p class="cta"><a class="button" href="/#/">Consult our Resource Navigator</a></p>
    <p class="source">Ruby is LeasePath’s AI assistant. Not a caseworker. Do not send case numbers, Social Security numbers, or medical details.</p>

    <section aria-labelledby="more-heading">
      <h2 id="more-heading">More ${escapeHtml(page.voucher.name)} searches</h2>
      <div class="chips">
        <a class="chip is-current" href="${escapeHtml(page.path)}" aria-current="page">${escapeHtml(page.chipLabel)}</a>
${relatedChips(page)}
      </div>
      <p><a href="/search">See all popular voucher searches</a></p>
    </section>
  </main>
  <footer>
    <p><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/">Search apartments</a></p>
  </footer>`

  return shell({
    title: page.title,
    description: page.description,
    canonical: `https://leasepath.app${page.path}`,
    body,
  })
}

export function searchHtmlForPath(pathname) {
  const parsed = parseSearchPath(pathname)
  if (!parsed) return null
  if (parsed.kind === 'index') return searchIndexHtml()
  return searchPageHtml(parsed.page)
}

export function sitemapXml(origin = 'https://leasepath.app') {
  const urls = [`${origin}/search`, ...SEARCH_PAGES.map((page) => `${origin}${page.path}`)]
  const body = urls.map((loc) => `  <url><loc>${escapeHtml(loc)}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`
}

export { SEARCH_PAGES, parseSearchPath }
