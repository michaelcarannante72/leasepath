import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { applyDocumentLang, EN, ES, LANG_KEY, looksLikeSpanish, readLang, t, writeLang } from '../src/i18n.js'

describe('i18n', () => {
  it('translates core nav and resources strings in Spanish', () => {
    assert.equal(t('es', 'nav.resources'), 'Recursos')
    assert.equal(t('es', 'nav.ruby'), 'Ruby')
    assert.equal(t('es', 'resources.title').includes('Recursos de NYC'), true)
    assert.equal(t('es', 'ruby.intro.eyebrow'), 'Navegadora de Recursos')
    assert.match(t('es', 'ruby.welcome'), /Hola, soy Ruby/)
  })

  it('falls back to English for missing keys', () => {
    assert.equal(t('es', 'nav.search'), 'Buscar')
    assert.equal(t('en', 'missing.key.xyz'), 'missing.key.xyz')
  })

  it('interpolates variables', () => {
    assert.equal(t('en', 'resources.showing', { shown: 3, total: 10 }), 'Showing 3 of 10 listings.')
    assert.match(t('es', 'resources.showing', { shown: 3, total: 10 }), /3/)
  })

  it('stores language preference locally', () => {
    const store = new Map()
    const storage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, v),
    }
    assert.equal(readLang(storage), 'en')
    assert.equal(writeLang('es', storage), 'es')
    assert.equal(storage.getItem(LANG_KEY), 'es')
    assert.equal(readLang(storage), 'es')
    assert.equal(writeLang('fr', storage), 'en')
  })

  it('detects Spanish user messages without treating English voucher words alone as Spanish', () => {
    assert.equal(looksLikeSpanish('Hola, necesito ayuda con mi cupón'), true)
    assert.equal(looksLikeSpanish('¿Dónde aplico para CityFHEPS?'), true)
    assert.equal(looksLikeSpanish('Does this Section 8 voucher cover Brooklyn?'), false)
    assert.equal(looksLikeSpanish(''), false)
  })

  it('sets document lang attribute', () => {
    const prev = globalThis.document
    const el = { lang: 'en' }
    globalThis.document = { documentElement: el }
    try {
      applyDocumentLang('es')
      assert.equal(el.lang, 'es')
      applyDocumentLang('en')
      assert.equal(el.lang, 'en')
    } finally {
      globalThis.document = prev
    }
  })

  it('keeps EN and ES key sets aligned for core UI', () => {
    const enKeys = Object.keys(EN).sort()
    const esKeys = Object.keys(ES).sort()
    assert.deepEqual(esKeys, enKeys)
  })

  it('wires LanguageProvider and toggle into the app shell', () => {
    const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8')
    const header = readFileSync(new URL('../src/components/Header.jsx', import.meta.url), 'utf8')
    const dock = readFileSync(new URL('../src/components/Dock.jsx', import.meta.url), 'utf8')
    const resources = readFileSync(new URL('../src/components/ResourcesPage.jsx', import.meta.url), 'utf8')
    const hero = readFileSync(new URL('../src/components/LandingHero.jsx', import.meta.url), 'utf8')
    const guide = readFileSync(new URL('../server/guide.js', import.meta.url), 'utf8')
    assert.match(main, /LanguageProvider/)
    assert.match(header, /LanguageToggle/)
    assert.match(dock, /useLanguage/)
    assert.match(resources, /t\("resources\.title"\)|t\('resources\.title'\)/)
    assert.match(hero, /hero\.title/)
    assert.match(guide, /REPLY LANGUAGE/)
    assert.match(guide, /NYC Spanish/)
  })
})
