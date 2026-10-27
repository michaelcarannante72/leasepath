#!/usr/bin/env node
/**
 * Headless Chromium + axe-core audit across the main LeasePath hash routes.
 * Exit 0 when there are no violations; print a summary and exit 1 otherwise.
 * Usage: node scripts/axe-audit.mjs [baseUrl]
 */
import puppeteer from 'puppeteer'
import { createRequire } from 'module'
import { readFileSync } from 'fs'

const require = createRequire(import.meta.url)
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')

export const MAIN_ROUTES = ['#/', '#/steps', '#/resources', '#/plan', '#/blog', '#/after-you-find']

export async function auditRoutes(baseUrl = 'http://127.0.0.1:5183', { viewport = { width: 390, height: 844, deviceScaleFactor: 2 }, routes = MAIN_ROUTES } = {}) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
  try {
    const page = await browser.newPage()
    await page.setViewport(viewport)
    const report = []
    for (const hash of routes) {
      await page.goto(`${baseUrl}/${hash}`, { waitUntil: 'networkidle0', timeout: 45000 })
      await page.evaluate(() => {
        for (const btn of document.querySelectorAll('button')) {
          const t = btn.textContent.trim()
          if (t === 'OK' || t === 'Not now' || t === 'Deny' || t === 'No thanks') btn.click()
        }
      }).catch(() => {})
      await new Promise((r) => setTimeout(r, 250))
      await page.evaluate(axeSource)
      const results = await page.evaluate(async () =>
        axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        }),
      )
      report.push({
        route: hash,
        violations: results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.length,
          targets: v.nodes.slice(0, 8).map((n) => n.target),
        })),
      })
    }
    return report
  } finally {
    await browser.close()
  }
}

const isMain = process.argv[1] && process.argv[1].endsWith('axe-audit.mjs')
if (isMain) {
  const base = process.argv[2] || 'http://127.0.0.1:5183'
  const report = await auditRoutes(base)
  let failed = 0
  for (const row of report) {
    failed += row.violations.length
    console.log(`${row.route}: ${row.violations.length} violation(s)`)
    for (const v of row.violations) {
      console.log(`  [${v.impact}] ${v.id}: ${v.help} (${v.nodes}) ${JSON.stringify(v.targets)}`)
    }
  }
  process.exit(failed ? 1 : 0)
}
