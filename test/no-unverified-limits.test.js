// State FHEPS 2025 and HASA dollar limits are unverified, so they must not be in the code or in the built site.
// Note: the NYCHA annual-recertification column is verified and has the same dollar values for 1 to 8 bedrooms
// ($2,646 ... $6,579), so a bare number cannot be searched for. These checks look for the HASA schedule id/date, the FHEPS table names, and HASA-labelled dollar figures.
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

const root = new URL('..', import.meta.url).pathname

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'criteria-sources') continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(js|jsx|json|html|css|xml|txt|mjs)$/.test(name)) out.push(path)
  }
  return out
}

// Things that only exist if the HASA schedule or the state FHEPS table is in the code.
const FORBIDDEN = [
  /hasa-2025-09-10/i,
  /2025-09-10|9\/10\/2025|September 10, 2025/,
  /cityfheps-2025/,
  /HASA_ROWS|hasaRow|HASA_SUPERSEDED/,
  /FHEPS_2025_LIMITS|(?<!City)FHEPS 2025|(?<!city)fheps:(studio|\dbr)/,
  /HASA maximum rent|HASA rent schedule/,
  /HASA[^.\n"']{0,60}\$\s?(2,?646|2,?762|3,?058|3,?811|4,?111)/,
  /\$2,?387/,
  /\b(7196|7812|7,196|7,812)\b/,
  /search\/fheps\//,
]

function scan(dir) {
  const hits = []
  for (const file of walk(dir)) {
    const text = readFileSync(file, 'utf8')
    for (const re of FORBIDDEN) if (re.test(text)) hits.push(`${file.replace(root, '')}: ${re}`)
  }
  return hits
}

test('no state FHEPS 2025 or HASA dollar figures, schedule date or schedule source in src/ or server/', () => {
  // This test file and the sync script mention the patterns on purpose.
  const hits = [...scan(join(root, 'src')), ...scan(join(root, 'server')), ...scan(join(root, 'worker'))]
  assert.deepEqual(hits, [])
  assert.deepEqual(JSON.parse(readFileSync(join(root, 'src/data/criteria/hasa.json'), 'utf8')), [])
})

test('no state FHEPS 2025 or HASA dollar figures, schedule date or schedule source in the built dist/ (run npm run build first)', { skip: !existsSync(join(root, 'dist')) }, () => {
  assert.deepEqual(scan(join(root, 'dist')), [])
})

test('the sitemap has no FHEPS search pages', () => {
  assert.doesNotMatch(readFileSync(join(root, 'public/sitemap.xml'), 'utf8'), /\/search\/fheps\//)
})
