/** Spanish UI is switched off for now (English only). The Spanish strings and the toggle stay in the code; set true to bring them back. */
export const SPANISH_UI_ENABLED = false

/** Sample/practice listings are archived (src/data/sampleListings.archive.js). */
export const SHOW_SAMPLE_LISTINGS = false

/**
 * When true, '/' shows the Leasebot launch page as home, and product links
 * (Search, Steps, Resources, Blog, My voucher, Housing Connect, landlord pitch,
 * popular searches, etc.) are hidden from the top nav, bottom dock, home, and
 * the live sitemap. Routes stay in the code — type a hash like #/search to open
 * them. Footer still shows privacy, terms, and cookies.
 *
 * Flip this to false to restore the full site in nav, dock, home, and sitemap.
 */
export const LEASEBOT_ONLY = true

/** Paths listed on the live /sitemap.xml while LEASEBOT_ONLY is on. */
export const LEASEBOT_SITEMAP_PATHS = [
  'https://leasepath.app/',
  'https://leasepath.app/leasebot',
  'https://leasepath.app/privacy',
  'https://leasepath.app/terms',
]

export function leasebotSitemapXml() {
  const urls = LEASEBOT_SITEMAP_PATHS.map((loc) => `  <url><loc>${loc}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}
