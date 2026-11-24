// User-facing copy never promises: no "qualify", "calificar", "calificas" and no "eligible". Say who decides instead.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import test from 'node:test'

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = `${dir}/${name}`
  return statSync(path).isDirectory() ? walk(path) : [path]
})
const root = new URL('../', import.meta.url).pathname
const files = walk(`${root}src`).filter((f) => /\.jsx?$/.test(f))
// src/data/criteria/*.json mirrors the research file word for word (official wording, Ruby's rule notes), so it is not scanned.
// Official page names (links to NYCHA's Eligibility page) are citations, not claims.
const FORBIDDEN = /\bqualif|\bcalific(?:ar|as|a)\b|\bcalifiqu|\bincome-eligible|\byou(?:'re| are) eligible/i
const allowedLine = (line) => /NYCHA_ELIGIBILITY|nychaEligibility|eligibility\.page|cityfheps-eligibility|hasa-eligibility/i.test(line)

test('no source string under src/ says qualify, calificar or calificas', () => {
  const hits = []
  for (const file of files) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (FORBIDDEN.test(line) && !allowedLine(line)) hits.push(`${file.slice(root.length)}:${i + 1}`)
    })
  }
  assert.deepEqual(hits, [])
})

test('the built bundle has none of those words either', () => {
  let dist = []
  try { dist = walk(`${root}dist/assets`).filter((f) => f.endsWith('.js')) } catch { return }
  for (const file of dist) assert.doesNotMatch(readFileSync(file, 'utf8'), /\bmay qualify\b|\byou qualify\b|\bwho qualifies\b|\bcalificas\b|\bcalificar\b|\bpuede calificar\b/i, file)
})

test('the approved lines are on the pages', () => {
  const read = (p) => readFileSync(`${root}${p}`, 'utf8')
  assert.match(read('src/components/TenantRightsAfterMoveinPage.jsx'), /You might be able to get free legal help\. The provider decides\./)
  assert.match(read('src/components/PartnerDirectoryPage.jsx'), /You might be able to get free legal help\. The provider decides\./)
  assert.match(read('src/components/MovingHelpPage.jsx'), /See if this applies to you/)
  assert.match(read('src/data/boroughGuides.js'), /More than one program might apply to you\. Only your worker decides\./)
  assert.match(read('src/i18nUi.es.js'), /Podrías recibir ayuda legal gratis\. El proveedor decide\./)
  assert.match(read('src/i18nUi.es.js'), /Puede que te aplique más de un programa\. Solo tu trabajador decide\./)
})
