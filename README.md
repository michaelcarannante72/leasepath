# LeasePath

LeasePath is a StreetEasy-style search for New York City apartments that take a housing voucher: HASA, CityFHEPS, and Section 8. The public site is [leasepath.app](https://leasepath.app).

The apartments in the app are sample listings for practice. They are not vacancies, and LeasePath does not approve a rent. The amount on a person's shopping letter or voucher controls. CityFHEPS comparison figures come from DSS-8j (E), dated January 28, 2026.

## Run

```sh
cd stoop
npm install
npm run dev
```

Open http://localhost:5183/

LeasePath is a progressive web app. Chrome and Edge can install it from the address bar once the service worker is active. On iPhone, use Share, then Add to Home Screen. The installed app opens full screen, and a visit that already loaded LeasePath can open the search again offline. Assistant questions still need the network.

## Assistant

The dock assistant calls SpaceXAI (xAI) from the Vite server locally, and from a Cloudflare Worker in production. The key stays on the server and is never sent to the browser.

1. Create a key at https://console.x.ai/team/default/api-keys
2. Copy `.env.example` to `.env`
3. Set `XAI_API_KEY`
4. Restart `npm run dev`

The request uses `https://api.x.ai/v1`, model `grok-4.7`, with `store: false`. Search, the letter comparison, the steps, the practice message, and the resource list work without a key.

The assistant is written for a household that already has a HASA voucher. Its policy pack is `server/hraKnowledge.js`, taken from HRA, DSS, and NYC Health pages checked on October 8, 2026. That pack covers HASA, the food box and other food help, CityFHEPS, FHEPS, one-shot deals, Homebase, Pathway Home, and SOTA. The Resources tab shows the same kinds of links and does not ask anyone to sign in. It also finds the nearest food pantry and the next distribution from the public Food Help NYC list. The location stays in the browser.

## Sign-in

Twelve assistant questions are free on a browser. The next question needs a Google account. The server enforces that limit. Clearing the cookie does not reset it for that network beyond 24 free questions a day. A signed-in account can ask 20 questions a day. The whole site stops at 400 assistant questions a day. A rejected API key does not use up a question.

Google sign-in uses the Google Identity Services button. LeasePath checks the ID token on the server and then keeps its own cookie. The Google account is not sent to the model.

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

The question counters use a Durable Object binding named `USAGE_METER`. The first deploy after this change creates it from the migration in `wrangler.jsonc`.

## Deploy to leasepath.app

The domain must live in the same Cloudflare account you deploy from. Because you bought `leasepath.app` on Cloudflare, that zone is already there.

1. Log in once: `npx wrangler login`
2. Put the production secrets: `XAI_API_KEY`, `GOOGLE_CLIENT_ID`, and `LEASEPATH_AUTH_SECRET`
3. Publish: `npm run deploy`

`wrangler.jsonc` names the Worker `leasepath` and attaches custom domains `leasepath.app` and `www.leasepath.app`. Cloudflare creates the DNS records and the certificate. If a CNAME already exists on those hostnames (for example from an older Pages project), delete that record first, then deploy again.

The Worker serves the Vite `dist` folder and handles `/api/guide`. A `workers.dev` URL is also created as a fallback.
