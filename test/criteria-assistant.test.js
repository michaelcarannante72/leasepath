import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { prepareGuide } from '../server/guide.js'
import { programFiguresBlock } from '../server/figures.js'
import { HRA_KNOWLEDGE } from '../server/hraKnowledge.js'
import { sanitizePlace } from '../server/accounts.js'

const SAMPLE = { id: 'x', neighborhood: 'Test', borough: 'Bronx', crossStreets: 'A and B', unitKind: 'apartment', bedrooms: 1, rent: 2750, utilities: 'all', programs: ['HASA'] }

function content(body) {
  const { input, error } = prepareGuide(body)
  assert.equal(error, undefined)
  return input.map((message) => message.content).join('\n---\n')
}

/** Only the last user turn: the part the app builds from the plan and the listing. */
function turn(body) {
  const { input, error } = prepareGuide(body)
  assert.equal(error, undefined)
  return input[input.length - 1].content
}

const ask = { messages: [{ role: 'user', content: 'Is this rent OK?' }], includePlan: true }

test('the assistant prompt tells it to cite program, effective date and source, and to refuse unsourced figures', () => {
  const text = content({ ...ask, plan: { program: '' }, listing: null })
  assert.match(text, /always with the program name, its effective date, and the source link/)
  assert.match(text, /say "ask your caseworker" \(for Section 8, "ask your housing specialist"\) and do not estimate/)
  assert.match(text, /Keep HASA, CityFHEPS, and Section 8 apart/)
  assert.match(text, /Never use a CityFHEPS or Section 8 figure for a HASA voucher/)
})

test('the policy pack lists each program’s figures separately with effective date, date copied, and source link', () => {
  const block = programFiguresBlock()
  assert.ok(HRA_KNOWLEDGE.includes(block))
  const parts = block.split('\n\n')
  const hasa = parts.find((part) => part.startsWith('HASA rent schedule'))
  const city = parts.find((part) => part.startsWith('CityFHEPS payment standards'))
  const s8 = parts.find((part) => part.startsWith('Section 8 NYCHA'))
  assert.ok(hasa && city && s8)
  assert.match(hasa, /HASA · SPSVC-17 \(E\) · effective September 10, 2025 · figures copied on October 18, 2026 · https:\/\//)
  assert.match(city, /CityFHEPS · DSS-8r \(E\) · effective April 1, 2026 · figures copied on October 18, 2026 · https:\/\//)
  assert.match(s8, /Section 8 · .* · effective January 1, 2026 · figures copied on October 18, 2026 · https:\/\//)
  assert.match(hasa, /1 bedroom \(1-2 people\) \$2,762/)
  assert.match(city, /1 bedroom \(1-2 people\) \$2,734/)
  assert.doesNotMatch(hasa, /\$2,734|\$2,997|\$1,953/)
  assert.doesNotMatch(city, /\$2,762|\$3,058|\$1,985/)
  assert.match(hasa, /no SRO or room row/)
  assert.match(hasa, /never a CityFHEPS allowance/)
  assert.match(hasa, /also hold CityFHEPS has not been confirmed\. Do not say they can or cannot\. Ask your caseworker\./)
  assert.match(city, /\$1,100/)
  assert.match(city, /up to 15% of the annual rent/)
  assert.match(city, /valid 120 days/)
  assert.match(city, /not yet loaded\. Ask your caseworker/)
  assert.match(s8, /NYCHA has no SRO or room row/)
  assert.match(s8, /Ask your housing specialist/)
  assert.match(s8, /smaller or larger than the voucher size changes the limit has not been confirmed/)
  assert.match(city, /effective April 1, 2026\. An older package may use the 2025 table/)
  assert.doesNotMatch(HRA_KNOWLEDGE, /March 1/)
})

test('the policy pack leaves out what the criteria say not to hard-code or cite', () => {
  const text = HRA_KNOWLEDGE
  assert.doesNotMatch(text, /CityFHEPS[^.\n]{0,80}30 percent|30 percent[^.\n]{0,60}CityFHEPS/i)
  assert.doesNotMatch(text, /HASA[^.\n]{0,80}broker[^.\n]{0,40}50/i)
  assert.doesNotMatch(text, /CAS-517|W-147N-a|238-a/)
  assert.doesNotMatch(text, /\$2,387|\$1,985/, 'the 2023 HASA 1BR figure and the 2025 CityFHEPS SRO figure are not current')
  assert.doesNotMatch(text, /There is no HASA rent chart/)
  assert.match(text, /expansion that has been reported is not in effect/)
})

test('a HASA rent check goes to the assistant from HASA data only, with program, date and source', () => {
  const text = turn({ ...ask, plan: { program: 'HASA', household: '1' }, listing: SAMPLE })
  const check = text.slice(Math.max(0, text.indexOf('RENT CHECK')))
  assert.match(check, /^RENT CHECK \(HASA, from the app’s separate HASA data\)/)
  assert.match(check, /HASA schedule, 1 bedroom, all utilities included: \$2,762/)
  assert.match(check, /HASA · SPSVC-17 \(E\) · effective September 10, 2025 · figures copied on October 18, 2026 · https:\/\//)
  assert.doesNotMatch(check, /\$2,734/)
})

test('the same listing under CityFHEPS gets the CityFHEPS figure, not the HASA figure', () => {
  const text = turn({ ...ask, plan: { program: 'CityFHEPS', household: '1' }, listing: SAMPLE })
  const check = text.slice(Math.max(0, text.indexOf('RENT CHECK')))
  assert.match(check, /CityFHEPS 2026 payment standard, 1 bedroom, all utilities included: \$2,734/)
  assert.match(check, /\$16 higher/)
  assert.doesNotMatch(check, /\$2,762/)
})

test('with no program chosen the assistant is told to ask before giving a figure', () => {
  const text = turn({ ...ask, plan: { program: '', household: '2' }, listing: SAMPLE })
  assert.match(text, /No program is chosen\. Ask which program before you give any rent figure\./)
  assert.doesNotMatch(text.slice(Math.max(0, text.indexOf('RENT CHECK'))), /\$2,7/)
})

test('a plan the person did not share, or a bad listing, produces no rent check', () => {
  assert.doesNotMatch(turn({ messages: [{ role: 'user', content: 'hi' }], includePlan: false, plan: { program: 'HASA' }, listing: SAMPLE }), /RENT CHECK/)
  assert.doesNotMatch(turn({ ...ask, plan: { program: 'HASA', household: '1' }, listing: { ...SAMPLE, unitKind: 'castle' } }), /RENT CHECK/)
  assert.doesNotMatch(turn({ ...ask, plan: { program: 'HASA', household: '1' }, listing: { ...SAMPLE, rent: 'lots' } }), /RENT CHECK/)
})

test('an unknown program has no rent check and the assistant is told to say so', () => {
  const text = turn({ ...ask, plan: { program: 'FHEPS', household: '1' }, listing: SAMPLE })
  assert.match(text, /The app has no FHEPS rent check\. Say you do not have one and ask your caseworker\./)
})

test('device-only answers are never sent to the assistant or saved to the account', () => {
  const secret = { letterDate: '2026-06-20', hasaDeduction: '123', section8Agency: 'NYCHA', voucherBedrooms: '2', cityfhepsAllowance: 'heat pump' }
  const text = turn({ ...ask, plan: { program: 'CityFHEPS', household: '1', ...secret }, checks: secret, listing: SAMPLE })
  for (const value of ['2026-06-20', '123', 'NYCHA', 'heat pump', 'letterDate']) assert.ok(!text.includes(value), value)
  const place = sanitizePlace({ program: 'CityFHEPS', household: '1', ...secret, checks: secret })
  assert.equal(JSON.stringify(place).includes('2026-06-20'), false)
  assert.equal('letterDate' in place, false)
  assert.equal('checks' in place, false)
  // The client code that builds those two requests does not read the device-only state.
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const requests = [...app.matchAll(/fetch\('\/api\/(account|guide)'[\s\S]*?\.then\(/g)].map((match) => match[0])
  assert.ok(requests.length >= 2)
  for (const request of requests) assert.doesNotMatch(request, /checks|letterDate|hasaDeduction|section8Agency|voucherBedrooms|cityfhepsAllowance/)
  assert.match(app, /CHECKS_KEY = 'leasepath\.checks'/)
})
