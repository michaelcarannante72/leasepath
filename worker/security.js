// One source of truth for security headers. public/_headers carries the same values for static files
// (test/security-headers.test.js checks the two stay in sync).
export const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com'

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", 'https://www.googletagmanager.com', 'https://*.googletagmanager.com', 'https://accounts.google.com/gsi/client', TURNSTILE_ORIGIN],
  'style-src': ["'self'", "'unsafe-inline'", 'https://accounts.google.com/gsi/style'],
  'img-src': ["'self'", 'data:', 'blob:', 'https://www.googletagmanager.com', 'https://*.google-analytics.com', 'https://*.googleusercontent.com'],
  'font-src': ["'self'"],
  'connect-src': [
    "'self'",
    'https://geosearch.planninglabs.nyc',
    'https://data.cityofnewyork.us',
    'https://www.googletagmanager.com',
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://accounts.google.com/gsi/',
    TURNSTILE_ORIGIN,
  ],
  'frame-src': ['https://accounts.google.com/gsi/', TURNSTILE_ORIGIN, 'https://www.googletagmanager.com'],
  'worker-src': ["'self'"],
  'manifest-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
}

export const CSP = Object.entries(CSP_DIRECTIVES).map(([name, values]) => [name, ...values].join(' ')).join('; ')

export const SECURITY_HEADERS = {
  'content-security-policy': CSP,
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'cross-origin-opener-policy': 'same-origin-allow-popups',
  'permissions-policy':
    'geolocation=(self), camera=(), microphone=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), magnetometer=(), gyroscope=(), accelerometer=(), display-capture=(), browsing-topics=()',
}

export function headersFile() {
  const names = { 'content-security-policy': 'Content-Security-Policy', 'strict-transport-security': 'Strict-Transport-Security', 'x-content-type-options': 'X-Content-Type-Options', 'referrer-policy': 'Referrer-Policy', 'x-frame-options': 'X-Frame-Options', 'cross-origin-opener-policy': 'Cross-Origin-Opener-Policy', 'permissions-policy': 'Permissions-Policy' }
  const lines = Object.entries(SECURITY_HEADERS).map(([key, value]) => `  ${names[key]}: ${value}`)
  return `# Applied by Workers static assets. Generated from worker/security.js by scripts/write-headers.js; do not edit by hand.\n/*\n${lines.join('\n')}\n`
}
