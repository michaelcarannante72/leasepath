import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('every fixed hash page in App.jsx has a clean /path that 301s to it', () => {
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const parse = app.slice(app.indexOf('function parseHash'), app.indexOf('export default function App'))
  const pages = [...parse.matchAll(/'\/([a-z0-9-]+)'/g)].map((m) => m[1])
  // /search is the server-rendered SEO search index, not a redirect.
  const worker = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8')
  const list = worker.match(/const SHARE_PAGES = \[([^\]]*)\]/)[1]
  const shared = new Set([...list.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]))
  const missing = [...new Set(pages)].filter((page) => page !== 'search' && !shared.has(page))
  assert.deepEqual(missing, [])
})
