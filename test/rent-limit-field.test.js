import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { tx, setTxLang } from '../src/i18nAuto.js'
import { checkListing } from '../src/listingChecker.js'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

const WORDING = [
  ['Your monthly rent limit', 'Tu límite de renta mensual'],
  ['Type the amount from your shopping letter or voucher paperwork. Not sure? Ask your case manager or housing specialist.', 'Escribe la cantidad de tu carta de búsqueda o de los papeles de tu vale. ¿No estás seguro? Pregúntale a tu administrador de caso o especialista de vivienda.'],
  ['Use the amount on your shopping letter, or ask your case manager.', 'Usa la cantidad de tu carta de búsqueda, o pregúntale a tu administrador de caso.'],
  ['May fit your limit', 'Puede estar dentro de tu límite'],
  ['Likely over your limit', 'Probablemente supera tu límite'],
]

test('the typed-limit field and result wording is the approved text in English and Spanish', () => {
  try {
    for (const [en, es] of WORDING) {
      setTxLang('en')
      assert.equal(tx(en), en)
      setTxLang('es')
      assert.equal(tx(en), es)
      assert.doesNotMatch(es, /cupón|cupon/i)
    }
    setTxLang('es')
    assert.equal(tx('Asking rent {rent}, your limit {limit}.', { rent: '$2,400', limit: '$2,500' }), 'Piden $2,400. Tu límite es $2,500.')
  } finally {
    setTxLang('en')
  }
})

test('the field is on the checker and the plan page, takes digits only, and feeds the checker result', () => {
  const field = read('src/components/RentLimitField.jsx')
  assert.match(field, /replace\(\/\[\^\\d\]\/g, ''\)\.slice\(0, 5\)/)
  assert.match(read('src/components/ListingCheckerPage.jsx'), /<RentLimitField/)
  assert.match(read('src/components/ProgramPanels.jsx'), /<RentLimitField/)
  assert.equal(checkListing('2BR Bushwick, Brooklyn. $2,400/mo. 312 Myrtle Avenue', '2500').ownLimitResult.summary, 'May fit your limit')
})

test('the typed limit stays on the device: kept only in leasepath.checks, never in an API body, analytics, or the program name', () => {
  const field = read('src/components/RentLimitField.jsx')
  assert.doesNotMatch(field, /fetch\(|sendBeacon|dataLayer|XMLHttpRequest/)
  const app = read('src/App.jsx')
  assert.match(app, /const CHECKS_KEY = 'leasepath\.checks'/)
  // The two requests that carry the plan send named fields only, and none is the typed limit.
  assert.doesNotMatch(app, /rentLimit:\s*(plan|checks)\./)
  assert.doesNotMatch(app, /body: JSON\.stringify\(\{[^}]*checks/)
  assert.doesNotMatch(read('src/analytics.js'), /rentLimit|checks/)
  assert.doesNotMatch(read('server/accounts.js'), /rentLimit/)
  assert.doesNotMatch(read('server/guide.js'), /rentLimit/)
})

test('the program choice is never echoed on screen as a heading, never in the Ruby request, never in a draft', async () => {
  const app = read('src/App.jsx')
  const guide = app.slice(app.indexOf("fetch('/api/guide', {\n        method: 'POST'"), app.indexOf('listing,\n        }),'))
  assert.doesNotMatch(guide, /program:/)
  assert.doesNotMatch(read('src/components/ProgramPanels.jsx'), /<h2>\{tx\("HASA|<h2>\{tx\("Use the amount on your FHEPS/)
  assert.doesNotMatch(read('src/components/PlanPage.jsx'), /on your FHEPS letter/)
  const { starterMessage } = await import('../src/fit.js')
  assert.doesNotMatch(starterMessage({ unitKind: 'apartment', bedrooms: 1, rent: 2000, crossStreets: 'A and B', neighborhood: 'X', borough: 'Bronx' }, { program: 'HASA' }), /HASA/)
  const { isSensitiveView } = await import('../src/analytics.js')
  for (const hashPath of ['/plan', '/income-check', '/match-alerts', '/caseworker-pack', '/docs-tracker', '/resources']) assert.equal(isSensitiveView({ hashPath }), true, hashPath)
})
