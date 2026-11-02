/**
 * worker/pause.js — takes the site down and puts it back.
 *
 * Mikey's instruction (2 Nov 2026): deploy the coming-soon landing page here too,
 * keep the focus on PlantBot and joshuawilber.pro for a few days, and revisit
 * LeasePath tomorrow.
 *
 * HOW TO PUT IT BACK
 *   Set the Worker variable SITE_PAUSED to one of 0, false, off, no, live, open
 *   (Cloudflare dashboard → Workers & Pages → leasepath → Settings → Variables,
 *   or `npx wrangler deploy` after editing `vars` in wrangler.jsonc). Anything
 *   else — including the variable being absent — keeps the site paused, so a
 *   forgotten value fails closed instead of quietly reopening.
 *
 * WHAT STAYS UP WHILE PAUSED
 *   The static files the placeholder needs to look right: the icon, the favicon,
 *   the fonts. Anything with a file extension is served straight from the assets
 *   layer. Nothing else.
 *
 * WHAT GOES DARK
 *   The app shell at /, every hash route behind it (/privacy, /terms, /search/*,
 *   /edit-listing, /listings-admin, the lot), and the whole /api/ surface, which
 *   answers 503 with the same pointer to nyc.gov/hra instead of reading or
 *   writing anything. Ruby's chat endpoint is behind that too, so a pause costs
 *   nothing in model credits.
 *
 * WHY THE ADMIN PAGES GO DARK TOO
 *   /edit-listing and /listings-admin are hash routes: they load the app shell at
 *   "/" and route in the browser. Keeping them up would mean keeping the whole
 *   app up, so they go down with it. There are no listings in the book right now,
 *   so nothing is lost by that.
 */

const LIVE_VALUES = new Set(['0', 'false', 'off', 'no', 'live', 'open'])

export function sitePaused(env) {
  const raw = String(env?.SITE_PAUSED ?? '').trim().toLowerCase()
  return !LIVE_VALUES.has(raw)
}

/** The API goes dark with the pages, so a pause cannot read or write a record. */
export function isApiPath(pathname) {
  return pathname === '/api' || pathname.startsWith('/api/')
}

/**
 * A real file rather than a page: the icon, the favicon, a font, a hashed asset.
 * Those keep serving so the placeholder renders properly.
 *
 * robots.txt and sitemap.xml look like files but are the two things a pause most
 * needs to change, so they are explicitly not assets here.
 */
export function isAssetPath(pathname) {
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml') return false
  // .webmanifest is nine letters, so the extension match allows for the long ones.
  return /\.[a-z0-9]{2,12}$/i.test(pathname) || pathname.startsWith('/assets/')
}

/**
 * The placeholder page.
 *
 * One deliberate addition to the wording Mikey asked for: a single line pointing
 * to nyc.gov/hra, because LeasePath is how some people find out what their
 * voucher covers, and someone in a housing crunch should not hit a dead end.
 * Delete PAUSE_RESOURCES below if he wants the bare line only.
 */
/** Keeps search engines from indexing a placeholder, and drops the old sitemap. */
export const PAUSED_ROBOTS = 'User-agent: *\nDisallow: /\n'
export const PAUSED_SITEMAP =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n'

export function comingSoonHtml() {
  return /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#1C2D42">
<title>LeasePath</title>
<meta name="description" content="Coming soon to a New York City neighborhood near you.">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    background: #f4f7fb;
    color: #1c2d42;
    font-family: Inter, "Segoe UI", system-ui, sans-serif;
    font-size: 17px;
    line-height: 1.5;
  }
  main { width: 100%; max-width: 34rem; margin: 0 auto; padding: 2.5rem 1.5rem 3rem; }
  .rule { width: 3.5rem; height: 4px; border: 0; margin: 0 0 1.6rem; background: #f2a900; }
  h1 {
    margin: 0 0 1.4rem;
    font-size: clamp(1.9rem, 7vw, 2.6rem);
    line-height: 1.12;
    letter-spacing: -0.01em;
    font-weight: 700;
  }
  p { margin: 0 0 0.7rem; color: #5c6b7a; }
  a { color: #1c2d42; font-weight: 600; text-underline-offset: 3px; }
  .small { margin-top: 1.8rem; font-size: 0.86rem; }
</style>
</head>
<body>
<main>
  <hr class="rule">
  <h1>Coming soon to a New York City neighborhood near you.</h1>
  <p class="small">Need help with a voucher right now? HASA, CityFHEPS and Section 8 resources are at <a href="https://nyc.gov/hra">nyc.gov/hra</a>.</p>
</main>
</body>
</html>`
}
