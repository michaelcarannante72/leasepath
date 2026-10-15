import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { loadEnv } from 'vite'
import { handleApi } from './api.js'
import { policyHtml, policySlug } from './policyPages.js'
import { createFileAccounts } from './accounts.js'
import { createFileUsage } from './usage.js'

function serverEnv(config) {
  const loaded = loadEnv(config.mode, config.envDir || process.cwd(), '')
  return {
    key: process.env.XAI_API_KEY || loaded.XAI_API_KEY || '',
    secret: process.env.LEASEPATH_AUTH_SECRET || loaded.LEASEPATH_AUTH_SECRET || '',
    googleClientId: process.env.GOOGLE_CLIENT_ID || loaded.GOOGLE_CLIENT_ID || '',
  }
}

async function authSecret(config) {
  const env = serverEnv(config)
  if (env.secret) return env.secret
  const file = join(config.root || process.cwd(), '.data', 'auth-secret')
  try {
    const existing = (await readFile(file, 'utf8')).trim()
    if (existing) return existing
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
  const secret = randomBytes(32).toString('hex')
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, secret)
  return secret
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 100_000) {
        reject(Object.assign(new Error('body too large'), { status: 413 }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(Object.assign(new Error('invalid json'), { status: 400 }))
      }
    })
    req.on('error', reject)
  })
}

function send(res, result) {
  res.statusCode = result.status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', result.cacheControl || 'no-store')
  if (result.cookies?.length) res.setHeader('Set-Cookie', result.cookies)
  res.end(result.status === 204 ? '' : JSON.stringify(result.json))
}

export function guidePlugin() {
  const attach = (server) => {
    const root = server.config.root || process.cwd()
    const io = { readFile, writeFile, mkdir, dirname }
    const usage = createFileUsage(join(root, '.data', 'usage.json'), io)
    const accounts = createFileAccounts(join(root, '.data', 'accounts.json'), io)
    let secretPromise
    server.middlewares.use(async (req, res, next) => {
      const path = (req.url || '').split('?')[0]
      const slug = policySlug(path)
      if (slug) {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.statusCode = 405
          res.setHeader('allow', 'GET, HEAD')
          res.end()
          return
        }
        const html = policyHtml(slug)
        res.statusCode = 200
        res.setHeader('content-type', 'text/html; charset=utf-8')
        res.setHeader('cache-control', 'public, max-age=300')
        res.end(req.method === 'HEAD' ? undefined : html)
        return
      }
      if (!path.startsWith('/api/')) {
        next()
        return
      }
      try {
        if (!secretPromise) secretPromise = authSecret(server.config)
        const env = serverEnv(server.config)
        const secret = await secretPromise
        const body = req.method === 'POST' || req.method === 'PUT' ? await readBody(req) : {}
        const host = req.headers.host || 'localhost'
        const proto = req.headers['x-forwarded-proto'] || 'http'
        const result = await handleApi({
          method: req.method,
          pathname: path,
          body,
          cookieHeader: req.headers.cookie || '',
          origin: req.headers.origin || '',
          requestOrigin: `${proto}://${host}`,
          ip: req.socket?.remoteAddress || '',
          key: env.key,
          secret,
          googleClientId: env.googleClientId,
          usage,
          accounts,
          secure: proto === 'https',
        })
        send(res, result)
      } catch (error) {
        const status = error?.status
        if (status === 400 || status === 413) {
          send(res, { status, json: { error: 'bad_request', message: 'That question could not be sent. Shorten it and try again.' }, cookies: [] })
          return
        }
        send(res, { status: 502, json: { error: 'upstream', message: 'The assistant did not answer. Try again in a moment.' }, cookies: [] })
      }
    })
  }

  return {
    name: 'leasepath-guide',
    configureServer: attach,
    configurePreviewServer: attach,
  }
}
