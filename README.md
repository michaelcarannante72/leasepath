# LeasePath

LeasePath is a mobile-friendly NYC housing journey companion built with React and Vite. It brings together illustrative apartment search examples, local planning details, a step checklist, a private document vault, and links to city support.

The public site is [leasepath.app](https://leasepath.app).

## Run locally

```sh
npm install
npm run dev
```

Use `npm run build` to make a production build and `npm run preview` to serve it locally. The service worker is registered in production builds and caches the app shell and same-origin assets for offline visits.

## Deploy on Cloudflare Pages

Connect the GitHub repository in Cloudflare Pages, then attach the custom domain `leasepath.app`.

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js version | 22 |

Production builds need Node.js 22. This repo includes `.node-version` for that. If the Pages build does not pick it up, set the environment variable `NODE_VERSION` to `22` in the project settings.

`public/_redirects` sends unknown paths to `index.html` so the app still loads if someone opens a direct link. Apartment search, the guide, and the vault all stay in the browser. LeasePath does not send planner details, passphrases, or documents to a server.

## What the prototype does

- Filter sample apartment cards by neighborhood, borough, bedroom count, and a rent amount you enter.
- Save optional program, household, and approved rent details in this browser's local storage. This planner data is not encrypted; the approximate income field is session-only and is not persisted.
- Follow a general housing checklist and find links to NYC food, benefits, and legal support.
- Use a local, scripted guide to explore common questions and draft a broker inquiry. It is not a connected AI service, legal advice, or an eligibility decision.
- Create a local document vault. Files and filenames are encrypted in IndexedDB with AES-GCM using a key derived from your passphrase with PBKDF2. The vault locks when you lock it or leave the page. LeasePath does not receive the files or passphrase. There is no passphrase recovery; forgetting it means the vault cannot be unlocked.

## Important limitations

Apartment cards are illustrative examples, not current vacancies, verified prices, or program-approved units. LeasePath does not calculate official voucher rent limits. Use the rent amount and utility rules in your current program paperwork and verify requirements with your HRA/HASA worker. Linked services and program forms may change.

The vault protects data at rest in this browser profile, but it cannot protect against a compromised device or browser. Keep a separate backup of important documents and do not rely on LeasePath as your only copy.
