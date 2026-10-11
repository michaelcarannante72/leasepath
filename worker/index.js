import { handleApi } from '../server/api.js'
import { UsageMeter, durableUsage } from './usageMeter.js'

export { UsageMeter }

function requestOrigin(url) {
  return new URL(url).origin
}

function jsonResponse(result) {
  const headers = new Headers({ 'content-type': 'application/json', 'cache-control': result.cacheControl || 'no-store' })
  for (const cookie of result.cookies || []) headers.append('Set-Cookie', cookie)
  if (result.status === 204) return new Response(null, { status: 204, headers })
  return new Response(JSON.stringify(result.json), { status: result.status, headers })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) {
      return Response.json({ error: 'not_found' }, { status: 404 })
    }

    let body = {}
    if (request.method === 'POST') {
      const size = Number(request.headers.get('content-length') || 0)
      if (size > 100_000) {
        return Response.json({ error: 'bad_request', message: 'That question could not be sent. Shorten it and try again.' }, { status: 413 })
      }
      try {
        body = await request.json()
      } catch {
        return Response.json({ error: 'bad_request', message: 'That question could not be sent. Shorten it and try again.' }, { status: 400 })
      }
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
      secure: url.protocol === 'https:',
    })
    return jsonResponse(result)
  },
}
