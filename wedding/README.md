# wedding.webecke.dev

Sierra & Dallin's wedding page: the dates, the registry, and a form where guests
send a mailing address or email for their invitation.

- **Page:** Vite + React + TypeScript (`src/`), styled to match the printed invitations.
- **API:** Cloudflare Pages Functions (`functions/`, logic in `server/`).
- **Data:** Cloudflare D1 (SQLite), one table (`migrations/`).
- **Spam:** Cloudflare Turnstile. **Admin:** `/admin`, locked by Cloudflare Access.
- **Validation:** `shared/validate.ts` runs in the browser *and* on the server.

It's a separate Cloudflare Pages project from the portfolio at the repo root,
so the two deploy independently.

## Local development

```bash
cd wedding
npm install
cp .dev.vars.example .dev.vars       # Turnstile test keys + local admin bypass
npm run db:migrate:local             # creates the local SQLite table
npm run preview                      # builds, then serves page + API on http://localhost:8788
npm test                             # unit tests
```

`npm run dev` gives hot reload for page-only work (the form needs `preview`).
Locally, `/admin` opens without a login; on any real hostname it requires Access.

## What changes where

| To change | Edit |
| --- | --- |
| Dates, venues, times, map links | `src/config.ts` |
| The Knot link (footer button; hidden while empty) | `THE_KNOT_URL` in `src/config.ts` |
| Calendar times (Google link) | `calendar` on each reception in `src/config.ts` |
| Calendar files (Apple / Outlook) | `public/*.ics` (keep the times in sync) |
| Flowers and stamp drawings | the SVG sprite in `index.html` |

## One-time Cloudflare setup

Do these once, in this order. After that, every push to `main` deploys.

1. **Database.** From `wedding/`: `npx wrangler login`, then `npx wrangler d1 create wedding`.
   Paste the printed `database_id` into `wrangler.toml`, then run `npm run db:migrate:remote`.
2. **Turnstile.** Dashboard → Turnstile → *Add widget*. Hostnames: `wedding.webecke.dev`
   and `wedding-webecke-dev.pages.dev` (for preview links). Mode: *Managed*.
   Put the **site key** in `wrangler.toml` → `TURNSTILE_SITE_KEY`. Keep the secret key for step 3.
3. **Pages project.** Dashboard → Workers & Pages → *Create* → *Pages* → *Connect to Git* →
   `webecke/webecke.dev`.
   - Project name: `wedding-webecke-dev` · Production branch: `main`
   - Framework preset: *None* · Build command: `npm run build` · Output: `dist`
   - **Root directory: `wedding`**
   - After it's created: *Settings → Variables and Secrets* → add **Secret**
     `TURNSTILE_SECRET_KEY` (Production and Preview).
   - *Settings → Build → Build watch paths*: include `wedding/*` so portfolio changes
     don't rebuild the wedding site. (In the portfolio project, exclude `wedding/*`.)
4. **Domain.** In the project: *Custom domains* → `wedding.webecke.dev`. Cloudflare adds the DNS record.
5. **Admin lock.** Zero Trust → Access → Applications → *Add* → *Self-hosted*.
   - Domain `wedding.webecke.dev`, path `admin`
   - Policy: *Allow*, include the two of your emails (one-time PIN login is fine)
   - Copy the *Application Audience (AUD) Tag* into `ACCESS_AUD` and your team domain
     (`https://<team>.cloudflareaccess.com`) into `ACCESS_TEAM_DOMAIN` in `wrangler.toml`.
6. Commit `wrangler.toml` and push. Then check:
   - the page loads at https://wedding.webecke.dev
   - a test submission says "You're on our list!"
   - https://wedding.webecke.dev/admin asks you to log in and shows the test row
   - `webecke.dev/wedding` redirects to the subdomain

Until steps 2 and 5 are done the site stays safe: the form refuses submissions
without a Turnstile secret, and `/admin` stays locked without the Access settings.

## Data

- Everyone gives a mailing address; an email is optional ("invite by email too").
  The *Invite by* column reads `mail`, or `both` when they left an email.
- Every submission is kept; resending the form is how guests fix typos. `/admin`
  and the CSV show one row per household (newest wins), keyed by street + ZIP.
  `/admin?all=1` shows everything.
- A ZIP that doesn't match the chosen state shows a "double-check?" note to the guest
  and is flagged in the CSV's *ZIP check* column. It never blocks a submission.
- Before printing envelopes, consider one batch address check of the CSV (for
  example Smarty's free trial) and fix any flagged rows by hand.
- Backups: D1 Time Travel can restore any minute from the last 7 days on the free plan.
