import assert from 'node:assert/strict'
import test from 'node:test'
import { ASK, ASK_SPECIALIST } from '../src/rentCheck.js'
import { brokerFeeNotices, cashDepositNotice, cityfhepsBrokerFeeMax, fareNotices, securityVoucherNotices } from '../src/fees.js'
import { HASA_RULES } from '../src/data/hasa.js'
import { CITYFHEPS_RULES } from '../src/data/cityfheps.js'
import { FARE_RULES, SECURITY_VOUCHER_RULES } from '../src/data/notices.js'

const all = (notices) => notices.map((notice) => notice.text).join('\n')

test('CityFHEPS broker fee is up to 15% of annual rent', () => {
  assert.equal(cityfhepsBrokerFeeMax(2650), 4770)
  assert.equal(cityfhepsBrokerFeeMax(2734), 4921.2)
  assert.equal(cityfhepsBrokerFeeMax(1100), 1980)
  assert.equal(cityfhepsBrokerFeeMax(0), null)
  assert.equal(cityfhepsBrokerFeeMax(-5), null)
  assert.equal(cityfhepsBrokerFeeMax('abc'), null)
  const [fee] = brokerFeeNotices('CityFHEPS', 2650)
  assert.match(fee.text, /up to 15% of the annual rent/)
  assert.match(fee.text, /\$2,650 a month that is up to \$4,770\./)
  assert.match(fee.text, /should not ask you to pay any additional broker fee/)
  assert.equal(fee.source.program, 'CityFHEPS')
  assert.equal(fee.source.document, 'DSS-8j (E)')
  assert.equal(fee.source.documentDate, '2026-01-28')
  assert.ok(fee.source.url.endsWith('dss-8j-e.pdf'))
  const cents = brokerFeeNotices('CityFHEPS', 2734)[0].text
  assert.match(cents, /\$4,921\.20/)
})

test('CityFHEPS without a rent still states the 15% rule and no amount', () => {
  const [fee] = brokerFeeNotices('CityFHEPS', 0)
  assert.match(fee.text, /15%/)
  assert.doesNotMatch(fee.text, /up to \$/)
})

test('a broker fee asked of the tenant is flagged with the FARE Act source', () => {
  const notices = brokerFeeNotices('CityFHEPS', 2650, 1500)
  const flag = notices.find((notice) => notice.level === 'watch')
  assert.match(flag.text, /\$1,500/)
  assert.match(flag.text, /Do not pay it before you check/)
  assert.equal(flag.source.program, 'NYC FARE Act')
  assert.equal(flag.source.effectiveDate, '2025-06-11')
  assert.equal(brokerFeeNotices('CityFHEPS', 2650, 0).some((notice) => notice.level === 'watch'), false)
  // HASA households get the same tenant-fee flag, without any HASA fee figure.
  const hasa = brokerFeeNotices('HASA', 2700, 900)
  assert.ok(hasa.some((notice) => notice.level === 'watch'))
})

test('HASA broker fee says ask your caseworker and shows no figure or percentage', () => {
  const notices = brokerFeeNotices('HASA', 2762)
  const text = all(notices)
  assert.match(text, /Ask your caseworker\./)
  assert.doesNotMatch(text, /\d+\s?%/)
  assert.doesNotMatch(text, /\$\d/)
  assert.doesNotMatch(text, /15%|50%|percent/)
  assert.equal(HASA_RULES.brokerFee2013.confidence === 'official', false, 'the 2013 row is not an official current source')
})

test('Section 8 and an unchosen program get no broker fee figure, and Section 8 says ask your housing specialist', () => {
  for (const [program, who] of [['Section 8', ASK_SPECIALIST], ['', ASK], ['FHEPS', ASK]]) {
    const text = all(brokerFeeNotices(program, 2500))
    assert.match(text, new RegExp(who))
    assert.doesNotMatch(text, /\$\d|%/)
  }
  assert.doesNotMatch(all(brokerFeeNotices('Section 8', 2500)), /caseworker/)
})

test('FARE Act notices are sourced, and the HRA interaction is stated as unconfirmed', () => {
  const notices = fareNotices()
  assert.equal(notices.length, 3)
  const sourced = notices.filter((notice) => notice.source)
  assert.equal(sourced.length, 2)
  for (const notice of sourced) {
    assert.equal(notice.source.program, 'NYC FARE Act')
    assert.equal(notice.source.effectiveDate, '2025-06-11')
    assert.ok(notice.source.url.startsWith('https://www.nyc.gov/'))
  }
  const last = notices[2]
  assert.equal(last.source, undefined)
  assert.match(last.text, /has not been confirmed/)
  assert.ok(last.text.endsWith(`${ASK}.`))
  assert.doesNotMatch(all(notices), /238-a|\$20\b/)
})

test('security voucher: CityFHEPS gets the W-147N cap, claim window, and notarization', () => {
  const text = all(securityVoucherNotices('CityFHEPS'))
  assert.match(text, /up to one month’s rent/)
  assert.match(text, /three months after you move out/)
  assert.match(text, /notarizes both pages/)
  assert.match(text, /source-of-income discrimination/)
  assert.match(text, /W-147M is the landlord’s statement about the broker/)
  for (const notice of securityVoucherNotices('CityFHEPS')) {
    assert.ok(notice.source, notice.text)
    assert.ok(notice.source.url.startsWith('https://www.nyc.gov/'))
    assert.ok(notice.source.copiedOn)
  }
  const cap = securityVoucherNotices('CityFHEPS').find((notice) => /one month/.test(notice.text))
  assert.equal(cap.source.documentDate, '2025-05-07')
  assert.equal(SECURITY_VOUCHER_RULES.capOneMonth.confidence, 'official')
})

test('security voucher: HASA gets no W-147N specifics, only ask your caseworker', () => {
  const notices = securityVoucherNotices('HASA')
  assert.equal(notices.length, 1)
  assert.equal(notices[0].source, undefined)
  assert.ok(notices[0].text.endsWith(`${ASK}.`))
  assert.doesNotMatch(notices[0].text, /W-147|voucher guarantees|one month|\$|notar/i)
  assert.equal(HASA_RULES.securityVoucher.confidence, 'unverified')
  assert.equal(HASA_RULES.securityVoucher.sourceUrl, '')
  for (const program of ['Section 8', '']) {
    const text = all(securityVoucherNotices(program))
    assert.match(text, /ask your (housing specialist|caseworker)/i)
    assert.doesNotMatch(text, /W-147N|one month/)
  }
  assert.doesNotMatch(all(securityVoucherNotices('Section 8')), /caseworker/)
})

test('a cash deposit ask gets a notice for every program, and only CityFHEPS gets a rule', () => {
  const flag = cashDepositNotice('CityFHEPS')
  assert.equal(flag.level, 'watch')
  assert.equal(flag.source.program, 'HRA security voucher (W-147N)')
  assert.equal(CITYFHEPS_RULES.acceptsSecurityVoucher.confidence, 'official')
  const hasa = cashDepositNotice('HASA')
  assert.match(hasa.text, /no HASA rule on security deposits or vouchers\. Ask your caseworker\./)
  assert.equal(hasa.source, undefined)
  const s8 = cashDepositNotice('Section 8')
  assert.match(s8.text, /no Section 8 deposit rule\. Ask your housing specialist\./)
  assert.equal(s8.source, undefined)
  for (const program of ['', 'FHEPS']) {
    const none = cashDepositNotice(program)
    assert.match(none.text, /Pick your program under My voucher/)
    assert.equal(none.source, undefined)
  }
  for (const program of ['HASA', 'Section 8', '', 'FHEPS']) assert.doesNotMatch(cashDepositNotice(program).text, /W-147|voucher guarantees|one month|\$/)
})

test('a rule whose row is not an official sourced row becomes an ask notice, not a stated rule', () => {
  const rule = SECURITY_VOUCHER_RULES.capOneMonth
  const before = { ...rule }
  const fare = FARE_RULES.noTenantFee
  const fareBefore = { ...fare }
  try {
    rule.sourceUrl = ''
    const text = all(securityVoucherNotices('CityFHEPS'))
    assert.doesNotMatch(text, /up to one month/)
    assert.match(text, /could not be shown\. Ask your caseworker\./)
    fare.confidence = 'unverified'
    const notices = fareNotices('Section 8')
    assert.equal(notices[0].text, 'Ask your housing specialist.')
    assert.equal(notices[0].source, undefined)
    assert.doesNotMatch(all(notices), /background or credit check/)
  } finally {
    Object.assign(rule, before)
    Object.assign(fare, fareBefore)
  }
})

test('every notice that states a rule has a source line, and none carries a figure without one', () => {
  for (const program of ['CityFHEPS', 'HASA', 'Section 8', '']) {
    for (const notice of [...brokerFeeNotices(program, 2650, 800), ...fareNotices(), ...securityVoucherNotices(program)]) {
      if (/\$\d|\d%/.test(notice.text)) {
        assert.ok(notice.source, `${program}: ${notice.text}`)
        assert.ok(notice.text.includes('CityFHEPS') || notice.source.program === 'NYC FARE Act' || /^This listing asks/.test(notice.text) || notice.source.program.includes('W-147N'), notice.text)
      }
    }
  }
})
