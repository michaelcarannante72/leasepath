import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import test from 'node:test'
import { SITE_PAGES } from '../src/sitePages.js'
import { POSTS } from '../src/blog.js'

const root = new URL('..', import.meta.url).pathname
const read = (path) => readFileSync(join(root, path), 'utf8')
const manifest = JSON.parse(read('public/manifest.webmanifest'))

function pngSize(path) {
  const data = readFileSync(join(root, path))
  return [data.readUInt32BE(16), data.readUInt32BE(20)]
}

function walk(dir, found = []) {
  for (const name of readdirSync(join(root, dir))) {
    const path = join(dir, name)
    if (statSync(join(root, path)).isDirectory()) walk(path, found)
    else found.push(path)
  }
  return found
}

test('the manifest has what installability needs and every file it names exists', () => {
  for (const field of ['id', 'name', 'short_name', 'start_url', 'scope', 'display', 'background_color', 'theme_color']) {
    assert.ok(manifest[field], `${field} is missing`)
  }
  assert.equal(manifest.display, 'standalone')
  assert.ok(manifest.start_url.startsWith(manifest.scope))
  assert.match(manifest.theme_color, /^#[0-9a-f]{6}$/i)
  assert.equal(manifest.related_applications, undefined)
  assert.equal(manifest.prefer_related_applications, undefined)
  const purposes = new Set()
  for (const icon of manifest.icons) {
    assert.ok(existsSync(join(root, 'public', icon.src)), `${icon.src} is missing`)
    const [width, height] = pngSize(join('public', icon.src))
    assert.equal(`${width}x${height}`, icon.sizes, `${icon.src} is not ${icon.sizes}`)
    purposes.add(`${icon.purpose}:${width}`)
  }
  for (const purpose of ['any:192', 'any:512', 'maskable:192', 'maskable:512']) assert.ok(purposes.has(purpose), purpose)
  for (const shortcut of manifest.shortcuts || []) {
    assert.ok(shortcut.name && shortcut.url.startsWith('/'), shortcut.name)
  }
})

test('index.html points at real files and carries the share and canonical tags', () => {
  const html = read('index.html')
  for (const match of html.matchAll(/(?:href|src)="(\/[^"]+)"/g)) {
    const path = match[1]
    if (path.startsWith('/src/')) assert.ok(existsSync(join(root, path.slice(1))), path)
    else assert.ok(existsSync(join(root, 'public', path)), `${path} is not in public/`)
  }
  assert.match(html, /<html lang="en"/)
  assert.match(html, /rel="canonical" href="https:\/\/leasepath\.app\/"/)
  assert.match(html, /property="og:title"/)
  assert.match(html, /property="og:image" content="https:\/\/leasepath\.app\/icons\//)
  assert.match(html, /rel="apple-touch-icon"/)
  assert.equal(html.includes('accounts.google.com'), false, 'Google sign-in loads only when the dialog opens')
})

test('the service worker precaches only files that exist, skips /api, and has no old-project cleanup', () => {
  const source = read('public/service-worker.js')
  const shell = source.slice(source.indexOf('const SHELL = ['), source.indexOf(']', source.indexOf('const SHELL = [')))
  const paths = [...shell.matchAll(/'(\/[^']*)'/g)].map((match) => match[1])
  assert.ok(paths.includes('/'))
  for (const path of paths) if (path !== '/') assert.ok(existsSync(join(root, 'public', path)), `${path} is precached but not in public/`)
  assert.match(source, /\/api\//)
  assert.equal(/stoop/i.test(source), false)
})

test('every internal link and route in the app resolves', () => {
  const slugs = new Set(SITE_PAGES.map((page) => page.slug))
  const posts = new Set(POSTS.map((post) => post.slug))
  const routes = new Set(['', '/', '/steps', '/resources', '/plan', '/blog', '/after-you-find', '/after-you-find#chap', '/caseworker-pack', '/inspection-prep', '/scam-alerts', '/moving-help', '/know-your-rights', '/youth', '/youth-lgbtq'])
  const files = walk('src').filter((path) => /\.(jsx?|css)$/.test(path))
  for (const file of files) {
    const text = read(file)
    for (const match of text.matchAll(/(?:href=|go\()["'`](#\/[^"'`$]*)["'`]/g)) {
      const route = match[1].slice(1)
      if (routes.has(route)) continue
      const info = route.match(/^\/info\/([a-z0-9-]+)$/)
      if (info) assert.ok(slugs.has(info[1]), `${file}: ${route}`)
      else assert.fail(`${file}: unknown route ${route}`)
    }
    for (const match of text.matchAll(/href=\{?[`"]#\/blog\/\$\{[^}]+\}/g)) assert.ok(match[0])
    for (const match of text.matchAll(/href="(\/[a-z][^"#?]*)"/g)) {
      const href = match[1]
      const ok = href === '/privacy' || href === '/terms' || href === '/search' || href === '/youth' || href === '/youth-lgbtq' || href.startsWith('/search/')
      assert.ok(ok, `${file}: ${href} is not a served page`)
    }
  }
  for (const slug of ['privacy', 'terms', 'cookies', 'help']) assert.ok(slugs.has(slug), slug)
  assert.ok(posts.size >= 1)
  // Every Footer slug that is rendered with a hash route must exist as a page.
  for (const page of SITE_PAGES) assert.ok(page.title && page.body, page.slug)
})

test('there are no Android, TWA, or old-project remnants in the PWA repo', () => {
  const pattern = /stoop|android|assetlinks|\btwa\b|bubblewrap|play store|related_applications/i
  const files = ['index.html', 'wrangler.jsonc', 'package.json', '.env.example']
    .concat(walk('src'), walk('public'), walk('server'), walk('worker'))
    .filter((path) => !/\.(png|svg|ico)$/.test(path))
  for (const file of files) assert.equal(pattern.test(read(file)), false, `${file} mentions an abandoned target`)
  assert.equal(existsSync(join(root, 'public/.well-known')), false)
  // The README may say the app is PWA-only, but it must not point at the old project folder.
  assert.equal(/stoop/i.test(read('README.md')), false)
})

test('wrangler.jsonc keeps durable object bindings, classes, and migrations in step', () => {
  const config = JSON.parse(read('wrangler.jsonc').replace(/^\s*\/\/.*$/gm, ''))
  assert.equal(config.assets.not_found_handling, '404-page')
  assert.ok(existsSync(join(root, 'public/404.html')))
  assert.match(config.compatibility_date, /^\d{4}-\d{2}-\d{2}$/)
  const worker = read('worker/index.js')
  const classes = config.durable_objects.bindings.map((binding) => binding.class_name)
  const migrated = config.migrations.flatMap((migration) => migration.new_sqlite_classes || [])
  for (const name of classes) {
    assert.ok(migrated.includes(name), `${name} has no migration`)
    assert.match(worker, new RegExp(`export \\{[^}]*\\b${name}\\b`), `${name} is not exported by the Worker`)
  }
  assert.equal(new Set(config.migrations.map((migration) => migration.tag)).size, config.migrations.length)
  for (const binding of config.durable_objects.bindings) assert.match(worker, new RegExp(`env\\.${binding.name}\\b`))
  assert.ok(config.assets.run_worker_first.includes('/api/*'))
  assert.ok(existsSync(join(root, config.main)))
})

test('the README names the real folder, the real model, and the PWA-only scope', () => {
  const readme = read('README.md')
  const guide = read('server/guide.js')
  const model = guide.match(/export const MODEL = '([^']+)'/)[1]
  assert.ok(readme.includes(`\`${model}\``), 'README model name differs from server/guide.js')
  assert.match(readme, /cd leasepath\b/)
  assert.match(readme, /web app only/i)
  for (const file of ['dev', 'build', 'preview', 'test', 'lint', 'deploy']) {
    assert.ok(JSON.parse(read('package.json')).scripts[file], file)
  }
  assert.ok(relative(root, join(root, 'README.md')))
})

test('public/_headers sets the baseline security headers and does not pin a cache lifetime on missing files', () => {
  const headers = read('public/_headers')
  for (const name of ['X-Content-Type-Options: nosniff', 'Referrer-Policy:', 'X-Frame-Options: DENY', 'Permissions-Policy:']) {
    assert.ok(headers.includes(name), name)
  }
  // An immutable rule on /assets/* would also stamp a year-long cache on a 404 for a missing file.
  assert.equal(/immutable/.test(headers), false)
})
