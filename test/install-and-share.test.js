import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import {
  APP_URL,
  INSTALL_STEPS,
  SHARE_TEXT,
  smsShareHref,
  whatsappShareHref,
} from '../src/data/installAndShare.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

test('install guides cover iPhone and Chrome on a phone', () => {
  assert.ok(INSTALL_STEPS.iphone.steps.length >= 3)
  assert.ok(INSTALL_STEPS.chromePhone.steps.length >= 3)
  assert.match(INSTALL_STEPS.iphone.steps.join(' '), /Safari|Home Screen/i)
  assert.match(INSTALL_STEPS.chromePhone.steps.join(' '), /Chrome|Install/i)
})

test('share links point at leasepath.app and open SMS / WhatsApp', () => {
  assert.equal(APP_URL, 'https://leasepath.app')
  assert.match(SHARE_TEXT, /leasepath\.app/)
  assert.match(smsShareHref(), /^sms:/)
  assert.match(smsShareHref(), /leasepath\.app/)
  assert.match(whatsappShareHref(), /^https:\/\/wa\.me\//)
  assert.match(whatsappShareHref(), /leasepath\.app/)
})

test('QR asset ships and App wires /install', () => {
  assert.ok(existsSync(join(root, 'public/images/leasepath-qr.png')))
  assert.match(read('src/App.jsx'), /InstallAndSharePage/)
  assert.match(read('worker/index.js'), /'install'/)
  assert.match(read('src/components/InstallAndSharePage.jsx'), /Print flyer|QR/)
})
