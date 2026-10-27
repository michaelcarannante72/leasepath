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
