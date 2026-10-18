import { SITE_PAGES } from '../src/sitePages.js'

const PAGES = {
  '/privacy': 'privacy',
  '/terms': 'terms',
}

export function policySlug(pathname) {
  const path = String(pathname || '').replace(/\/+$/, '') || '/'
  return PAGES[path] || ''
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function policyHtml(slug) {
  const page = SITE_PAGES.find((item) => item.slug === slug)
  if (!page) return ''
  const other = slug === 'privacy'
    ? '<a href="/terms">Terms of Service</a>'
    : '<a href="/privacy">Privacy Notice</a>'
  const paragraphs = page.body.split(/\n\n+/).filter(Boolean).map((part) => `<p>${escapeHtml(part)}</p>`).join('\n')
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)} · LeasePath</title>
  <meta name="theme-color" content="#1C2D42">
  <meta name="description" content="${escapeHtml(page.title)} for LeasePath, a practice guide for people with a New York City housing voucher.">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="canonical" href="https://leasepath.app/${slug}">
  <style>
    body { margin: 0; font-family: Inter, system-ui, sans-serif; color: #1c2d42; background: #fff; }
    main { max-width: 40rem; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
    a { color: #1c2d42; }
    p { line-height: 1.55; }
  </style>
</head>
<body>
  <main>
    <p><a href="/">LeasePath</a></p>
    <h1>${escapeHtml(page.title)}</h1>
    ${paragraphs}
    <p>${other}</p>
  </main>
</body>
</html>`
}
