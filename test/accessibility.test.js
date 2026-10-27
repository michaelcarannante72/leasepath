import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { auditRoutes, MAIN_ROUTES } from '../scripts/axe-audit.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path) => readFileSync(join(root, path), 'utf8')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
}

async function ensureDist() {
  if (existsSync(join(root, 'dist/index.html'))) return
  await new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', env: process.env })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`build failed: ${code}`))))
  })
}

function serveDist() {
  const dist = join(root, 'dist')
  const server = createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    let path = url.pathname === '/' ? '/index.html' : url.pathname
    const file = join(dist, path)
    if (!file.startsWith(dist) || !existsSync(file)) {
      // SPA shell for unknown paths
      const shell = join(dist, 'index.html')
      res.writeHead(200, { 'content-type': TYPES['.html'] })
      res.end(readFileSync(shell))
      return
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' })
    res.end(readFileSync(file))
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` })
    })
  })
}

test('skip link, landmarks, and labeled controls are in the source', () => {
  const app = read('src/App.jsx')
  assert.match(app, /className="skip-link"/)
  assert.match(app, /href="#main-content"/)
  assert.match(app, /id="main-content"/)
  const header = read('src/components/Header.jsx')
  assert.match(header, /aria-label="My voucher"/)
  assert.match(header, /aria-label="LeasePath home"/)
  assert.match(header, /aria-label="Main"/)
  const dock = read('src/components/Dock.jsx')
  assert.match(dock, /aria-label="Primary"/)
  const css = read('src/index.css')
  assert.match(css, /\.skip-link/)
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
  assert.match(css, /animation-duration:\s*0\.01ms/)
  assert.match(css, /\.program-chip \{[\s\S]*?min-height:\s*44px/)
  assert.match(css, /\.save, \.icon-button \{[\s\S]*?min-width:\s*44px/)
})

test('axe-core finds no WCAG A/AA violations on the main routes', async () => {
  await ensureDist()
  const { server, baseUrl } = await serveDist()
  try {
    const report = await auditRoutes(baseUrl)
    assert.equal(report.length, MAIN_ROUTES.length)
    const problems = report.flatMap((row) => row.violations.map((v) => `${row.route} ${v.id}: ${v.help}`))
    assert.deepEqual(problems, [], problems.join('\n'))
  } finally {
    server.close()
  }
})
