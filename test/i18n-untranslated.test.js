// Catches English left in the Spanish UI: every page key needs its own es string,
// and the pages that read from i18nPages.js may not hard-code English text in JSX.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PAGE_EN, PAGE_ES } from '../src/i18nPages.js'
import { t } from '../src/i18n.js'

// Strings that are the same in both languages (names, numbers).
const SAME_OK = new Set(['Housing Connect', 'LeasePath', 'Ruby', 'NYC', 'HASA', 'CityFHEPS', 'NYCHA', 'OK', 'WhatsApp'])
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('every page key has a Spanish string that is not the English one', () => {
  const missing = []
  const same = []
  for (const [key, en] of Object.entries(PAGE_EN)) {
    const es = PAGE_ES[key]
    if (typeof es !== 'string' || !es.trim()) missing.push(key)
    else if (es === en && !SAME_OK.has(en.trim())) same.push(key)
  }
  assert.deepEqual(missing, [], `missing es: ${missing.join(', ')}`)
  assert.deepEqual(same, [], `es is still English: ${same.join(', ')}`)
  for (const key of Object.keys(PAGE_ES)) assert.ok(key in PAGE_EN, `es-only key ${key}`)
})

test('t() returns Spanish for page keys, and keeps {vars} the same in both', () => {
  for (const [key, en] of Object.entries(PAGE_EN)) {
    const vars = [...en.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
    const esVars = [...PAGE_ES[key].matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
    assert.deepEqual(esVars, vars, key)
    if (!SAME_OK.has(en.trim())) assert.notEqual(t('es', key), t('en', key), key)
  }
})

test('translated pages carry no hard-coded English text between JSX tags', () => {
  const files = ['src/components/PlanToolPages.jsx', 'src/components/ConsentBar.jsx', 'src/components/InstallAndSharePage.jsx', 'src/components/HousingConnectPage.jsx']
  for (const file of files) {
    const src = read(file).replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    const hits = [...src.matchAll(/>([^<>{}]*[A-Za-z]{3,}[^<>{}]*)</g)]
      .map((m) => m[1].trim())
      .filter((text) => text && !/^[\s\w.-]*=>/.test(text) && !/[=;()]/.test(text) && !SAME_OK.has(text))
    assert.deepEqual(hits, [], `${file} has untranslated text: ${hits.join(' | ')}`)
    for (const m of src.matchAll(/(?:aria-label|placeholder|title|alt)="([^"]*[A-Za-z]{3,}[^"]*)"/g)) assert.fail(`${file}: hard-coded ${m[0]}`)
  }
})

// ---- Every route: parse each component with espree and look at the real JSX tree. ----
import { readdirSync } from 'node:fs'
import * as espree from 'espree'
import { UI_ES } from '../src/i18nUi.es.js'

const BRAND_OK = new Set([...SAME_OK, 'Section 8', 'FHEPS', 'ACCESS HRA', 'HRA', 'HPD', 'DSS', 'SNAP', 'HEAP', 'PDF', 'Email', 'SMS', 'Blog', 'Homebase', 'Lease', 'Path', 'access.nyc.gov', 'iPhone (Safari)', '· HPD:'])
const ATTRS = new Set(['aria-label', 'placeholder', 'title', 'alt', 'label', 'aria-description'])
const componentFiles = ['src/App.jsx', ...readdirSync(new URL('../src/components', import.meta.url)).filter((f) => f.endsWith('.jsx')).map((f) => `src/components/${f}`)]
const norm = (s) => s.replace(/\s*\n\s*/g, ' ').trim()

function walk(node, fn) {
  if (!node || typeof node.type !== 'string') return
  fn(node)
  for (const key of Object.keys(node)) {
    const value = node[key]
    if (Array.isArray(value)) value.forEach((child) => walk(child, fn))
    else if (value && typeof value.type === 'string') walk(value, fn)
  }
}
const parse = (file) => espree.parse(read(file), { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } })

test('no route component hard-codes English text or labels in JSX', () => {
  const hits = []
  for (const file of componentFiles) {
    walk(parse(file), (node) => {
      if (node.type === 'JSXText') {
        const text = norm(node.value)
        if (/[A-Za-z]{2,}/.test(text) && !BRAND_OK.has(text)) hits.push(`${file}: "${text}"`)
      } else if (node.type === 'JSXAttribute' && ATTRS.has(node.name.name) && node.value?.type === 'Literal') {
        const text = norm(String(node.value.value))
        if (/[A-Za-z]{2,}/.test(text) && !BRAND_OK.has(text)) hits.push(`${file}: ${node.name.name}="${text}"`)
      }
    })
  }
  assert.deepEqual(hits, [], `untranslated JSX text:\n${hits.join('\n')}`)
})

test('every tx("…") string used by a component has its own Spanish', () => {
  const missing = []
  for (const file of componentFiles) {
    walk(parse(file), (node) => {
      if (node.type === 'CallExpression' && node.callee.name === 'tx' && node.arguments[0]?.type === 'Literal') {
        const en = node.arguments[0].value
        const es = UI_ES[en]
        if (!es || (es === en && !BRAND_OK.has(en))) missing.push(`${file}: ${en}`)
        else {
          const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join()
          if (vars(es) !== vars(en)) missing.push(`${file}: {vars} differ in ${en}`)
        }
      }
    })
  }
  assert.deepEqual(missing, [], missing.join('\n'))
})

test('install steps and share text have Spanish versions', async () => {
  const data = await import('../src/data/installAndShare.js')
  assert.notEqual(data.shareText('es'), data.shareText('en'))
  assert.match(data.shareText('es'), /https:\/\/leasepath\.app/)
  for (const [key, guide] of Object.entries(data.installSteps('en'))) {
    const es = data.installSteps('es')[key]
    assert.equal(es.steps.length, guide.steps.length, key)
    es.steps.forEach((step, i) => assert.notEqual(step, guide.steps[i], `${key} step ${i + 1}`))
  }
})
