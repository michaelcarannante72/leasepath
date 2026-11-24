#!/usr/bin/env node
// ONE-TIME script (NOT RUN: Michael decides). Would remove `program` and `situation` from existing account records.
//
// IMPORTANT LIMIT: each account is its own Durable Object (ACCOUNT_BOOK, SQLite inside it). Durable Objects cannot be
// listed or queried from outside the Worker, so no script can walk "all accounts". Without this script, an old saved
// value is already stripped from every response and overwritten without it on that person's next save (server/accounts.js).
// To scrub the rest in bulk, the Worker needs a small admin route that calls a method on each AccountBook. That route is
// NOT part of this commit. This script is the client for it, so the safe defaults and count-only reporting are fixed now.
//
//   node scripts/scrub-account-programs.mjs --keys keys.txt            dry run (default): reads nothing, changes nothing
//   node scripts/scrub-account-programs.mjs --keys keys.txt --remote   asks the live Worker how many records would change
//   node scripts/scrub-account-programs.mjs --keys keys.txt --remote --apply   rewrites them
//
// Env for --remote: SCRUB_URL (the admin route) and SCRUB_TOKEN (its bearer token). Output is counts only: never an
// account key, email, program, or situation.
import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const remote = args.includes('--remote')
const apply = remote && args.includes('--apply')
const keysFile = args[args.indexOf('--keys') + 1]
if (!keysFile || keysFile.startsWith('--')) {
  console.error('Usage: scrub-account-programs.mjs --keys <file of account keys> [--remote [--apply]]')
  process.exit(2)
}
const keys = readFileSync(keysFile, 'utf8').split('\n').map((line) => line.trim()).filter(Boolean)
console.log(`Mode: ${apply ? 'APPLY (remote)' : remote ? 'dry run (remote read)' : 'dry run (local, no network)'}`)
console.log(`Account keys listed: ${keys.length}`)
if (!remote) {
  console.log('Nothing was contacted or changed. Add --remote to ask the live Worker for counts.')
  process.exit(0)
}
const url = process.env.SCRUB_URL
const token = process.env.SCRUB_TOKEN
if (!url || !token) {
  console.error('--remote needs SCRUB_URL and SCRUB_TOKEN. Nothing was contacted.')
  process.exit(2)
}
let hadProgram = 0
let hadSituation = 0
let rewritten = 0
let failed = 0
for (const key of keys) {
  try {
    const response = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ key, apply }) })
    if (!response.ok) { failed += 1; continue }
    const data = await response.json()
    if (data.hadProgram) hadProgram += 1
    if (data.hadSituation) hadSituation += 1
    if (data.rewritten) rewritten += 1
  } catch {
    failed += 1
  }
}
console.log(`With a saved program: ${hadProgram}`)
console.log(`With a saved situation: ${hadSituation}`)
console.log(apply ? `Rewritten: ${rewritten}` : `Would rewrite: ${Math.max(hadProgram, hadSituation)} (at most). Nothing changed.`)
console.log(`Failed requests: ${failed}`)
