import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { SPONSOR_SLOTS, SPONSOR_CONTACT, hasSponsors, slotsFor } from '../src/data/sponsors.js'

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')

test('sponsor config is empty by default so nothing shows', () => {
  assert.deepEqual(SPONSOR_SLOTS.resources, [])
  assert.deepEqual(SPONSOR_SLOTS.search, [])
  assert.equal(hasSponsors('resources'), false)
  assert.equal(hasSponsors('search'), false)
  assert.deepEqual(slotsFor('resources'), [])
})

test('slotsFor only returns complete rows', () => {
  const config = {
    resources: [
      { id: 'a', title: 'A', blurb: 'B', href: 'https://example.com' },
      { id: 'bad', title: '', href: 'https://x.com' },
      null,
    ],
    search: [],
  }
  assert.equal(slotsFor('resources', config).length, 1)
  assert.equal(slotsFor('resources', config)[0].id, 'a')
  assert.equal(hasSponsors('resources', config), true)
})

test('SponsoredSlot renders nothing when empty and labels Sponsored when filled', () => {
  const slot = read('src/components/SponsoredSlot.jsx')
  assert.match(slot, /if \(!slots\.length\) return null/)
  assert.match(slot, /Sponsored/)
  assert.match(slot, /rel="noopener noreferrer sponsored"/)
  assert.doesNotMatch(slot, /gtag|facebook|doubleclick|adsense|googletagmanager/i)
  assert.match(slot, /#\/sponsor/)
})

test('Sponsor page has rules, contact, and never claims sponsorship changes Ruby or rankings', () => {
  const page = read('src/components/SponsorPage.jsx')
  assert.match(page, /must accept housing vouchers/i)
  assert.match(page, /No fee scams/)
  assert.match(page, /LeasePath can refuse/)
  assert.match(page, /never affects Ruby/)
  assert.match(page, /rankings/)
  assert.match(page, /SPONSOR_CONTACT/)
  assert.equal(SPONSOR_CONTACT, 'michaelcarannante@yahoo.com')
  assert.match(read('src/data/sponsors.js'), /michaelcarannante@yahoo\.com/)
  assert.doesNotMatch(page, /gtag|googletagmanager|facebook\.net/i)
})

test('Resources and Search mount SponsoredSlot; Footer links Sponsor LeasePath', () => {
  assert.match(read('src/components/ResourcesPage.jsx'), /SponsoredSlot placement="resources"/)
  assert.match(read('src/components/SearchPage.jsx'), /SponsoredSlot placement="search"/)
  assert.match(read('src/components/Footer.jsx'), /#\/sponsor/)
  assert.match(read('src/App.jsx'), /SponsorPage/)
  assert.match(read('src/sitePages.js'), /Sponsor LeasePath/)
})

test('no new tracking or external script origins added for sponsors', () => {
  const files = [
    'src/components/SponsoredSlot.jsx',
    'src/components/SponsorPage.jsx',
    'src/data/sponsors.js',
  ].map(read).join('\n')
  assert.doesNotMatch(files, /googletagmanager|google-analytics|facebook\.net|doubleclick|hotjar|segment\.com/i)
})
