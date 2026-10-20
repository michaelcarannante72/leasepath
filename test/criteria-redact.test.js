import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { COUNT_PATTERN, criteriaRedactPlugin, redactRules } from '../server/criteriaRedact.js'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('NYCHA voucher and owner counts never reach Ruby’s prompt', async () => {
  const { SYSTEM } = await import('../server/guide.js')
  const { programFiguresBlock } = await import('../server/figures.js')
  assert.doesNotMatch(SYSTEM, COUNT_PATTERN)
  assert.doesNotMatch(programFiguresBlock(), COUNT_PATTERN)
})

test('the client bundle gets the rules file with the counts removed, and every other rule unchanged', () => {
  const raw = read('src/data/criteria/rules.json')
  const out = criteriaRedactPlugin().transform(raw, '/x/src/data/criteria/rules.json')
  assert.doesNotMatch(out.code, COUNT_PATTERN)
  const before = JSON.parse(raw)
  const after = JSON.parse(out.code)
  assert.equal(after.length, before.length)
  for (let i = 0; i < before.length; i += 1) {
    if (before[i].id === 'section8-agencies') {
      assert.equal(after[i].rule, '')
      assert.equal(after[i].source_url, before[i].source_url)
    } else assert.deepEqual(after[i], before[i])
  }
  assert.deepEqual(redactRules([{ id: 'other', rule: 'x' }]), [{ id: 'other', rule: 'x' }])
  assert.match(read('vite.config.js'), /plugins: \[criteriaRedactPlugin\(\),/)
})

test('the page never prints rule text: the Section 8 agencies line is fixed copy', () => {
  const panels = read('src/components/ProgramPanels.jsx')
  assert.match(panels, /<Rule rule=\{SECTION8_RULES\.agencies\} program=\{SECTION8_PROGRAM\}>NYCHA runs the largest NYC program\./)
  assert.doesNotMatch(panels, /\.text\b|\.notes\b/)
  for (const file of ['src/components/AfterYouFindPage.jsx', 'src/afterYouFind.js', 'src/data.js', 'src/sitePages.js']) assert.doesNotMatch(read(file), COUNT_PATTERN, file)
})
