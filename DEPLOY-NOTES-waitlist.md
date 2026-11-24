# Leasebot waitlist: deploy notes (branch `waitlist-form`)

Stores only email, language (en/es) and a timestamp. No IP, user agent, or housing answers.
Until the steps below are done, `POST /api/waitlist` answers 503 and the page shows an
"Email us instead" mailto link, so merging early does not break signups.

Run from the repo root, only when Michael says "Deploy it!".

1. Create the database (prints a `database_id`):
   `npx wrangler d1 create leasepath-waitlist`
2. Paste the id into `wrangler.jsonc` under `d1_databases` -> `database_id` (replace the
   `00000000-...` placeholder) and delete the TODO(deploy) comment.
3. Apply the migration to the real database:
   `npx wrangler d1 migrations apply leasepath-waitlist --remote`
4. Build and deploy: `npm run build && npx wrangler deploy`
   (the `WAITLIST_LIMITER` rate limit, 5 per 60 s per network, is created by the deploy).
5. Smoke test with one fake address, then delete it (see below).

## Export the list to CSV
`npx wrangler d1 execute leasepath-waitlist --remote --json --command "SELECT email, lang, created_at FROM waitlist ORDER BY id" > waitlist.json`
or, for a CSV directly:
`npx wrangler d1 export leasepath-waitlist --remote --table waitlist --no-schema --output waitlist.sql`
(JSON converts easily: `jq -r '.[0].results[] | [.email,.lang,.created_at] | @csv' waitlist.json > waitlist.csv`).
Keep exports off shared drives; delete them when done.

## Delete one row (a test address or a removal request)
`npx wrangler d1 execute leasepath-waitlist --remote --command "DELETE FROM waitlist WHERE email = 'qa-test@example.com' COLLATE NOCASE"`

## Local trial
`npx wrangler d1 migrations apply leasepath-waitlist --local && npx wrangler dev --local`
