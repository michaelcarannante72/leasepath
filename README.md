# LeasePath

LeasePath is a StreetEasy-style search for New York City apartments that take a housing voucher: HASA, CityFHEPS, and Section 8. The public site is [leasepath.app](https://leasepath.app).

The apartments in the app are sample listings for practice. They are not vacancies, and LeasePath does not approve a rent. The amount on a person's shopping letter or voucher controls. Rent figures come from the housing specialist's criteria, one separate data module per program (see Rent data below).

LeasePath is a web app only. It ships as a progressive web app (PWA) from [leasepath.app](https://leasepath.app). There is no Android or iOS store app, and no Trusted Web Activity, so there is no `/.well-known/assetlinks.json`.

## Run

Node 22.12 or newer is required (Wrangler needs Node 22; Vite needs 20.19 or newer).

```sh
cd leasepath
npm install
npm run dev
```

Open http://localhost:5183/

Other scripts:

```sh
npm test         # node --test, no network
npm run lint
npm run build    # writes dist/
npm run preview  # serves dist/ and the same /api routes on http://localhost:5183/
```

To run the real Worker with Durable Objects locally, build first and then `npx wrangler dev --local`. Put local secrets in `.dev.vars` (not committed).

LeasePath is a progressive web app. Chrome and Edge can install it from the address bar once the service worker is active. On iPhone, use Share, then Add to Home Screen. The installed app opens full screen, and a visit that already loaded LeasePath can open the search again offline. Assistant questions still need the network.

## Assistant

The dock assistant calls SpaceXAI (xAI) from the Vite server locally, and from a Cloudflare Worker in production. The key stays on the server and is never sent to the browser.

1. Create a key at https://console.x.ai/team/default/api-keys
2. Copy `.env.example` to `.env`
3. Set `XAI_API_KEY`
4. Restart `npm run dev`

The request goes to `https://api.x.ai/v1/responses` with the model named in `server/guide.js` (`MODEL`, currently `grok-4.7`, listed in the xAI model docs on October 18, 2026) and `store: false`. The README and the code read the same name. Change it in `server/guide.js` only. Search, the letter comparison, the steps, the practice message, and the resource list work without a key.

The assistant is written for a household that already has a HASA voucher. Its policy pack is `server/hraKnowledge.js`, taken from HRA, DSS, and NYC Health pages checked on October 8, 2026. That pack covers HASA, the food box and other food help, CityFHEPS, FHEPS, one-shot deals, Homebase, Pathway Home, and SOTA. The Resources tab shows the same kinds of links and does not ask anyone to sign in. It also finds the nearest food pantry and the next distribution from the public Food Help NYC list. The location stays in the browser.

## Sign-in

Twelve assistant questions are free on a browser. The next question needs a Google account. The server enforces that limit. Clearing the cookie does not reset it for that network beyond 24 free questions a day. A signed-in account can ask 20 questions a day. The whole site stops at 400 assistant questions a day. A rejected API key does not use up a question.

Google sign-in uses the Google Identity Services button, which loads only when someone opens the sign-in dialog. LeasePath checks the ID token on the server and then keeps its own cookie. The Google account is not sent to the model. Email and password sign-up is also available. The server stores the email and a PBKDF2 hash of the password, and there is no password reset yet.

1. In Google Cloud Console, create an OAuth client ID of type Web.
2. Add authorized JavaScript origins: `https://leasepath.app`, `https://www.leasepath.app`, and `http://localhost:5183`.
3. Put that client id in `GOOGLE_CLIENT_ID`. No client secret is used.
4. Set `LEASEPATH_AUTH_SECRET` to a long random string. Local dev writes `.data/auth-secret` if this is empty.

Production:

```sh
npx wrangler secret put XAI_API_KEY
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put LEASEPATH_AUTH_SECRET
```

The question counters use a Durable Object binding named `USAGE_METER`. Signed-in letters use `ACCOUNT_BOOK`. Both classes are created by the migrations in `wrangler.jsonc`. Add new migrations there for any new Durable Object class, and never edit an old tag.

## Deploy to leasepath.app

The domain must live in the same Cloudflare account you deploy from. Because you bought `leasepath.app` on Cloudflare, that zone is already there.

1. Log in once: `npx wrangler login`
2. Put the production secrets: `XAI_API_KEY`, `GOOGLE_CLIENT_ID`, and `LEASEPATH_AUTH_SECRET`
3. Publish: `npm run deploy`

`wrangler.jsonc` names the Worker `leasepath` and attaches custom domains `leasepath.app` and `www.leasepath.app`. Cloudflare creates the DNS records and the certificate. If a CNAME already exists on those hostnames (for example from an older Pages project), delete that record first, then deploy again.

The Worker serves the Vite `dist` folder and handles every `/api/*` route plus `/privacy` and `/terms`. The app routes with the URL hash, so any other unknown path returns a real 404 (`public/404.html`) instead of the app shell. Static security headers and long cache lifetimes for hashed files come from `public/_headers`. A `workers.dev` URL is also created as a fallback.

After a deploy, installed copies pick up the new build the next time they open with a network connection. When the service worker rules change, bump `CACHE_VERSION` in `public/service-worker.js`.

## Rent data

HASA, CityFHEPS, and Section 8 each have their own module and their own rows. A row is never shared across programs, even where two dollar figures match.

| Program | Module | Source file in `src/data/criteria/` | Effective |
| --- | --- | --- | --- |
| HASA | `src/data/hasa.js` | `hasa.json` (SPSVC-17) | 2025-09-10 |
| CityFHEPS | `src/data/cityfheps.js` | `cityfheps-2026.json` (DSS-8r) | 2026-04-01 |
| Section 8 (NYCHA) | `src/data/section8.js` | `section8-nycha-2026.json` | 2026-01-01 |

- `cityfheps-2025.json` is historical (no effective date). It is exported for tests only and no check reads it.
- `rules.json` in that folder is the extract of the specialist's rule rows the app reads. `meta.json` holds the date the figures were copied.
- Refresh with `node scripts/sync-criteria.mjs /path/to/criteria --checked YYYY-MM-DD`. The app never reads that folder at runtime.
- A figure shows only for a row that has a source link and is marked official. Any other row shows "Ask your caseworker".
- Every rent result shows the program, the effective date, the date the figures were copied, and the source link (`src/components/SourceLine.jsx`).
- `src/rentCheck.js` has one check per program. `src/fees.js` has the broker fee, FARE Act and security voucher notices. `src/shoppingLetter.js` is the 120-day timer.
- The letter issue date and the other check answers live only in this browser (`leasepath.checks`). They are not sent to `/api/account` or `/api/guide`.
- `server/figures.js` builds the assistant's figures from the same modules.
