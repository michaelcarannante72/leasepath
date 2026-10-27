import assert from 'node:assert/strict'
import test from 'node:test'
import { buildDeadlineIcs, icsFold } from '../src/docsTracker.js'

test('calendar export folds lines over 75 octets (RFC 5545), so strict calendar apps import it', () => {
  const ics = buildDeadlineIcs({ deadlines: { letterExpires: '2026-12-01', inspection: '2026-12-02', leaseSigning: '2026-12-03' } })
  assert.ok(ics)
  for (const line of ics.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75, line)
  const unfolded = ics.replace(/\r\n /g, '')
  assert.match(unfolded, /DESCRIPTION:Your shopping letter or voucher paperwork may expire on this date\./)
  assert.equal(icsFold('short'), 'short')
  assert.equal(icsFold('ñ'.repeat(60)).replace(/\r\n /g, ''), 'ñ'.repeat(60))
})

test('calendar export follows the Spanish toggle', async () => {
  const { setTxLang } = await import('../src/i18nAuto.js')
  setTxLang('es')
  try {
    const ics = buildDeadlineIcs({ deadlines: { leaseSigning: '2026-12-03' } }).replace(/\r\n /g, '')
    assert.match(ics, /SUMMARY:LeasePath: firma del contrato/)
  } finally {
    setTxLang('en')
  }
})
