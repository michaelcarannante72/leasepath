import { handleApi } from '../server/api.js'
import { policyHtml, policySlug } from '../server/policyPages.js'
import { searchHtmlForPath, parseSearchPath } from '../server/searchPages.js'
import { AccountBook, durableAccounts } from './accountBook.js'
import { UsageMeter, durableUsage } from './usageMeter.js'
import { SECURITY_HEADERS } from './security.js'
import { guardChat } from './chatGuard.js'

export { UsageMeter, AccountBook }

function requestOrigin(url) {
  return new URL(url).origin
}

const MAX_BODY = 100_000

// Static files get the same headers from public/_headers (generated from worker/security.js).
// The Worker answers /api and the policy pages itself.
export { SECURITY_HEADERS }

function withSecurity(response) {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value)
  return response
}

function jsonResponse(result) {
  const headers = new Headers({ 'content-type': 'application/json', 'cache-control': result.cacheControl || 'no-store' })
  for (const cookie of result.cookies || []) headers.append('Set-Cookie', cookie)
  if (result.status === 204) return withSecurity(new Response(null, { status: 204, headers }))
  return withSecurity(new Response(JSON.stringify(result.json), { status: result.status, headers }))
}

function badRequest(status) {
  return jsonResponse({
    status,
    json: { error: 'bad_request', message: 'That question could not be sent. Shorten it and try again.' },
    cookies: [],
  })
}

// Clean shareable paths for hash-routed app pages. Each one 301s to the app route.
const SHARE_PAGES = ['after-you-find', 'steps', 'resources', 'plan', 'blog', 'housing-connect']
export const SHARE_PATHS = Object.fromEntries(
  SHARE_PAGES.flatMap((page) => [[`/${page}`, `/#/${page}`], [`/${page}/`, `/#/${page}`]]),
)

async function route(request, env) {
  const url = new URL(request.url)
  if (Object.hasOwn(SHARE_PATHS, url.pathname)) {
    return withSecurity(new Response(null, { status: 301, headers: { location: new URL(SHARE_PATHS[url.pathname], url.origin).toString(), 'cache-control': 'public, max-age=3600' } }))
  }
  const slug = policySlug(url.pathname)
  if (slug) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return withSecurity(new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } }))
    }
    return withSecurity(new Response(request.method === 'HEAD' ? null : policyHtml(slug), {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    }))
  }
  const search = parseSearchPath(url.pathname)
  if (search) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return withSecurity(new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } }))
    }
    return withSecurity(new Response(request.method === 'HEAD' ? null : searchHtmlForPath(url.pathname), {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    }))
  }
  if (!url.pathname.startsWith('/api/')) {
    return jsonResponse({ status: 404, json: { error: 'not_found' }, cookies: [] })
  }

  let body = {}
  if (request.method === 'POST' || request.method === 'PUT') {
    // Content-Length can be missing or wrong, so the size is checked on what was actually read.
    if (Number(request.headers.get('content-length') || 0) > MAX_BODY) return badRequest(413)
    let text
    try {
      text = await request.text()
    } catch {
      return badRequest(400)
    }
    if (text.length > MAX_BODY) return badRequest(413)
    if (text) {
      try {
        body = JSON.parse(text)
      } catch {
        return badRequest(400)
      }
    }
  }

  let guardCookie = null
  if (url.pathname === '/api/guide' && request.method === 'POST') {
    const token = typeof body?.turnstileToken === 'string' ? body.turnstileToken : ''
    if (body && typeof body === 'object') delete body.turnstileToken
    const guard = await guardChat({
      env,
      ip: request.headers.get('cf-connecting-ip') || '',
      cookieHeader: request.headers.get('cookie') || '',
      token,
      secure: url.protocol === 'https:',
    })
    if (!guard.ok) return jsonResponse({ status: guard.status, json: guard.json, cookies: [] })
    guardCookie = guard.cookie || null
  }

  const result = await handleApi({
    method: request.method,
    pathname: url.pathname,
    body,
    cookieHeader: request.headers.get('cookie') || '',
    origin: request.headers.get('origin') || '',
    requestOrigin: requestOrigin(request.url),
    ip: request.headers.get('cf-connecting-ip') || '',
    key: env.XAI_API_KEY || '',
    secret: env.LEASEPATH_AUTH_SECRET || '',
    googleClientId: env.GOOGLE_CLIENT_ID || '',
    usage: env.USAGE_METER ? durableUsage(env.USAGE_METER) : null,
    accounts: env.ACCOUNT_BOOK ? durableAccounts(env.ACCOUNT_BOOK) : null,
    secure: url.protocol === 'https:',
  })
  if (guardCookie) result.cookies = [...(result.cookies || []), guardCookie]
  return jsonResponse(result)
}

export default {
  async fetch(request, env) {
    try {
      return await route(request, env)
    } catch (error) {
      console.error(JSON.stringify({ message: 'leasepath worker failed', detail: error?.name || 'Error' }))
      return jsonResponse({
        status: 500,
        json: { error: 'server', message: 'LeasePath hit a problem. Try again in a moment. Search and resources still work.' },
        cookies: [],
      })
    }
  },
}
