import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { estimateRentShare, parseMonthlyIncome } from '../src/data/rentShare.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

test('Section 8 estimate is 30% of monthly income with HUD sources', () => {
  const r = estimateRentShare({ program: 'section8', monthlyIncome: '2000' })
  assert.equal(r.kind, 'hud-estimate')
  assert.equal(r.estimate, 600)
  assert.equal(r.fortyCap, 800)
  assert.ok(r.sources.some((s) => /hud\.gov|ecfr\.gov/i.test(s.href)))
  assert.match(r.body, /you may qualify/i)
})

test('CityFHEPS never hard-codes 30%', () => {
  const r = estimateRentShare({ program: 'cityfheps', monthlyIncome: '2000' })
  assert.equal(r.kind, 'letter')
  assert.equal(r.estimate, null)
  assert.match(r.body, /shopping letter|DSS-7r/i)
  assert.ok(!/30% of \$2/.test(r.body))
})

test('HASA estimate mentions no medical collection', () => {
  const r = estimateRentShare({ program: 'hasa', monthlyIncome: '1000' })
  assert.equal(r.estimate, 300)
  assert.match(r.body, /never asks for or stores HIV|medical/i)
})

test('income parser rejects junk', () => {
  assert.equal(parseMonthlyIncome('').status, 'empty')
  assert.equal(parseMonthlyIncome('-12').status, 'invalid')
  assert.equal(parseMonthlyIncome('2,400.99').status, 'ok')
  assert.equal(parseMonthlyIncome('2,400.99').dollars, 2400)
})

test('App and worker wire /rent-share', () => {
  assert.match(read('src/App.jsx'), /RentCalculatorPage/)
  assert.match(read('src/components/PlanPage.jsx'), /#\/rent-share/)
  assert.match(read('worker/index.js'), /'rent-share'/)
})
