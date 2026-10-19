#!/usr/bin/env bash
# Post-deploy smoke test for leasepath.app. Read-only: every request is a GET. Nothing is posted, no sign-in, no cookies kept.
# Usage: scripts/smoke-test.sh [base-url]    (default https://leasepath.app)
# Exit code is the number of failed checks (0 = all good).
set -u
BASE="${1:-https://leasepath.app}"
BASE="${BASE%/}"
fail=0
pass=0
tmp="$(mktemp)"
trap 'rm -f "$tmp" "$tmp.h"' EXIT

fetch() { # fetch PATH -> sets code, type; body in $tmp, headers in $tmp.h
  code="$(curl -sS -L --max-redirs 3 -o "$tmp" -D "$tmp.h" -w '%{http_code}' -H 'Cache-Control: no-cache' "$BASE$1" 2>/dev/null || echo 000)"
  type="$(grep -i '^content-type:' "$tmp.h" | tail -1 | tr -d '\r' | cut -d' ' -f2-)"
}
ok() { pass=$((pass + 1)); printf 'PASS  %s\n' "$1"; }
bad() { fail=$((fail + 1)); printf 'FAIL  %s\n' "$1"; }
expect_code() { # PATH CODE LABEL
  fetch "$1"
  if [ "$code" = "$2" ]; then ok "$3 ($1 -> $code)"; else bad "$3 ($1 -> $code, wanted $2)"; fi
}
expect_body() { # REGEX LABEL   (checks the last fetched body)
  if grep -Eq "$1" "$tmp"; then ok "$2"; else bad "$2 (no match for: $1)"; fi
}
expect_header() { # REGEX LABEL (checks the last fetched headers)
  if grep -Eiq "$1" "$tmp.h"; then ok "$2"; else bad "$2 (no header match for: $1)"; fi
}

echo "LeasePath smoke test against $BASE ($(date '+%Y-%m-%d %H:%M %Z'))"

expect_code / 200 'home page'
expect_body '<div id="root">' 'home page is the app shell'
expect_body 'rel="manifest"' 'home page links the manifest'
expect_header '^x-content-type-options: *nosniff' 'home page has nosniff'
expect_header '^x-frame-options: *DENY' 'home page has X-Frame-Options DENY'

expect_code /robots.txt 200 'robots.txt'
expect_body '^Allow: /' 'robots.txt allows crawling'
expect_body '^Disallow: /api/' 'robots.txt keeps /api/ out'
case "$type" in text/plain*) ok 'robots.txt is text/plain' ;; *) bad "robots.txt content-type is '$type'" ;; esac

expect_code /.well-known/assetlinks.json 404 'no Android asset links (PWA only)'
expect_code /assets/missing.js 404 'missing script is a real 404, not the app shell'
expect_code /no-such-page 404 'unknown path is a real 404'
expect_body 'Page not found · LeasePath' '404 page is the LeasePath 404 page'

expect_code /privacy 200 'privacy notice'
expect_body 'Privacy Notice' 'privacy page title'
expect_code /terms 200 'terms of service'
expect_body 'Terms of Service' 'terms page title'
if grep -q 'They were posted on October 15, 2026' "$tmp"; then
  bad 'terms "posted on" date is still October 15, 2026 (change it to the deploy date before deploying)'
elif grep -Eq '\[DEPLOY-DATE|PLACEHOLDER' "$tmp"; then
  bad 'terms still shows a date placeholder'
else
  ok 'terms posted-on date was updated'
fi

expect_code /manifest.webmanifest 200 'web app manifest'
expect_body '"start_url"' 'manifest has start_url'

expect_code /service-worker.js 200 'service worker'
expect_body "CACHE_VERSION = 'v3'" 'service worker is cache v3'
expect_header '^cache-control:.*(no-cache|max-age=0|no-store)' 'service worker is not cached long'

expect_code /api/guide 200 'assistant status endpoint (GET only)'
expect_body '"configured": *true' 'assistant key is configured in production'

echo "Passed $pass, failed $fail."
exit "$fail"
