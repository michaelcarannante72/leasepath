import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import {
  clearQuiz,
  readQuiz,
  routeQuizAnswers,
  writeQuiz,
} from '../src/data/quickStartQuiz.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

function mem() {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  }
}

test('shopping CityFHEPS in Brooklyn routes to search page', () => {
  const r = routeQuizAnswers({ voucher: 'cityfheps', situation: 'shopping', borough: 'brooklyn' })
  assert.equal(r.href, '#/search/cityfheps/brooklyn/1br')
})

test('found apartment routes to after-you-find', () => {
  assert.equal(routeQuizAnswers({ voucher: 'section8', situation: 'found', borough: 'queens' }).href, '#/after-you-find')
})

test('HASA never asks for medical info and points to Resources', () => {
  const r = routeQuizAnswers({ voucher: 'hasa', situation: 'shopping', borough: 'manhattan' })
  assert.equal(r.href, '#/resources')
  assert.match(r.reason, /never collects HIV|medical/i)
})

test('no voucher / community go to Resources', () => {
  assert.equal(routeQuizAnswers({ voucher: 'none', situation: 'community', borough: 'bronx' }).href, '#/resources')
})

test('quiz answers persist only in the provided storage', () => {
  const s = mem()
  writeQuiz({ voucher: 'fheps', situation: 'shelter', borough: 'queens' }, s)
  assert.deepEqual(
    { voucher: readQuiz(s).voucher, situation: readQuiz(s).situation, borough: readQuiz(s).borough },
    { voucher: 'fheps', situation: 'shelter', borough: 'queens' },
  )
  clearQuiz(s)
  assert.equal(readQuiz(s), null)
})

test('App, landing, worker wire /quiz', () => {
  assert.match(read('src/App.jsx'), /QuickStartQuizPage/)
  assert.match(read('src/components/LandingHero.jsx'), /#\/quiz/)
  assert.match(read('src/components/QuickStartQuizPage.jsx'), /Answers stay on this device/)
  assert.match(read('worker/index.js'), /'quiz'/)
  assert.match(read('wrangler.jsonc'), /"\/quiz"/)
})
