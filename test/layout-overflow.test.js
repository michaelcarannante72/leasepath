// Overflow guard: no route may scroll sideways at 390px (phone) or 1440px (desktop).
// Runs against the built app (npm run build first). Skips, with a note, when dist/ or Chromium is missing.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const ROUTES = ['/', '/resources', '/plan', '/match-alerts', '/income-check', '/housing-connect', '/install', '/rent-calculator', '/guides', '/scam-alerts', '/caseworker-pack', '/docs-tracker', '/know-your-rights', '/after-you-find', '/nope-not-a-page']
const WIDTHS = [[390, 844], [1440, 900]]
const PORT = 4791

async function loadPuppeteer() {
  try {
    return (await import('puppeteer')).default
  } catch {
    return null
  }
}

async function waitFor(url, ms = 15000) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).ok) return true
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200))
  }
  return false
}

test('no route scrolls sideways at 390 and 1440', { timeout: 180000 }, async (t) => {
  const puppeteer = await loadPuppeteer()
  if (!existsSync(new URL('../dist/index.html', import.meta.url))) return t.skip('run npm run build first')
  if (!puppeteer) return t.skip('puppeteer not installed')
  let browser
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  } catch (error) {
    return t.skip(`no Chromium: ${error.message}`)
  }
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'ignore' })
  try {
    assert.ok(await waitFor(`http://localhost:${PORT}/`), 'vite preview did not start')
    const page = await browser.newPage()
    await page.setRequestInterception(true)
    // Only the local app; third-party scripts are not under test.
    page.on('request', (req) => (req.url().startsWith(`http://localhost:${PORT}`) ? req.continue() : req.abort()))
    const problems = []
    for (const [width, height] of WIDTHS) {
      await page.setViewport({ width, height })
      for (const route of ROUTES) {
        await page.goto(`http://localhost:${PORT}/#${route}`, { waitUntil: 'domcontentloaded' })
        await new Promise((r) => setTimeout(r, 400))
        const result = await page.evaluate(() => {
          const out = []
          for (const el of [document.documentElement, document.body, document.querySelector('main.stage')]) {
            if (el && el.scrollWidth > el.clientWidth + 1) out.push(`${el.tagName.toLowerCase()}${el.className ? '.' + el.className : ''} ${el.scrollWidth}>${el.clientWidth}`)
          }
          return out
        })
        for (const line of result) problems.push(`${width}px #${route}: ${line}`)
      }
    }
    assert.deepEqual(problems, [])
  } finally {
    server.kill()
    await browser.close()
  }
})
