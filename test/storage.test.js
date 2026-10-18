import assert from 'node:assert/strict'
import test from 'node:test'
import { readItem, readJson, writeItem } from '../src/storage.js'

function withStorage(storage, run) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true })
  try {
    return run()
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original)
    else delete globalThis.localStorage
  }
}

test('storage helpers work like localStorage when it is available', () => {
  const map = new Map()
  withStorage({ getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) }, () => {
    assert.equal(writeItem('a', '1'), true)
    assert.equal(readItem('a'), '1')
    assert.equal(readItem('missing'), null)
    writeItem('j', '{"x":2}')
    assert.deepEqual(readJson('j', {}), { x: 2 })
    writeItem('bad', '{nope')
    assert.deepEqual(readJson('bad', { fallback: true }), { fallback: true })
    writeItem('nul', 'null')
    assert.deepEqual(readJson('nul', []), [])
  })
})

test('blocked or full storage never throws into the app', () => {
  const boom = () => {
    throw new DOMException('blocked', 'SecurityError')
  }
  withStorage({ getItem: boom, setItem: boom }, () => {
    assert.equal(readItem('a'), null)
    assert.equal(writeItem('a', '1'), false)
    assert.deepEqual(readJson('a', [1]), [1])
  })
  withStorage(undefined, () => {
    assert.equal(readItem('a'), null)
    assert.equal(writeItem('a', '1'), false)
  })
})
