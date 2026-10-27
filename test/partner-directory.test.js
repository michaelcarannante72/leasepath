import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { PARTNERS, PARTNER_SOURCES, filterPartners, telHref } from '../src/data/partners.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

test('every partner has a verified source link and borough coverage', () => {
  assert.ok(PARTNERS.length >= 8)
  for (const partner of PARTNERS) {
    assert.ok(partner.name)
    assert.ok(partner.blurb)
    assert.ok(partner.boroughs.length)
    assert.ok(PARTNER_SOURCES[partner.sourceId], partner.id)
    assert.match(partner.href, /^https:\/\//)
    assert.ok(partner.blurb.length > 40)
    for (const phone of partner.phones || []) {
      assert.match(telHref(phone.number), /^tel:\d+$/)
    }
  }
})

test('phones used on cards match official HRA or Legal Aid published numbers', () => {
  const phones = PARTNERS.flatMap((p) => (p.phones || []).map((x) => x.number))
  for (const need of ['718-557-1379', '212-962-4795', '212-426-3000', '718-722-3100', '718-991-4600', '718-286-2450', '347-422-5333', '800-649-9125', '212-416-0197', '311']) {
    assert.ok(phones.includes(need), need)
  }
  assert.ok(PARTNERS.some((p) => p.email === 'civiljustice@hra.nyc.gov'))
})

test('borough filter and search work on-device', () => {
  assert.equal(filterPartners(PARTNERS, { borough: 'Staten Island' }).every((p) => p.boroughs.includes('Staten Island')), true)
  assert.ok(filterPartners(PARTNERS, { query: 'housing court' }).some((p) => /Housing Court Answers/i.test(p.name)))
  assert.equal(filterPartners(PARTNERS, { borough: 'Queens', query: 'zzz-nope' }).length, 0)
})

test('App, Resources, worker, and page wire /partners', () => {
  assert.match(read('src/App.jsx'), /PartnerDirectoryPage/)
  assert.match(read('src/components/ResourcesPage.jsx'), /#\/partners/)
  assert.match(read('src/components/PartnerDirectoryPage.jsx'), /Legal aid and nonprofit partners/)
  assert.match(read('worker/index.js'), /'partners'/)
  assert.match(read('wrangler.jsonc'), /"\/partners"/)
})
