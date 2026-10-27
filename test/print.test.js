import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('print hides the real header, footer, dock and consent bar class names', () => {
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
  const header = readFileSync(new URL('../src/components/Header.jsx', import.meta.url), 'utf8')
  const footer = readFileSync(new URL('../src/components/Footer.jsx', import.meta.url), 'utf8')
  assert.match(header, /className="topbar"/)
  assert.match(footer, /className="site-footer"/)
  const print = [...css.matchAll(/@media print \{([\s\S]*?)\n\}/g)].map((m) => m[1]).join('\n')
  for (const cls of ['.topbar', '.site-footer', '.dock', '.consent-bar']) assert.ok(print.includes(cls), `${cls} not hidden in print`)
})
