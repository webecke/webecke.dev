# wedding.webecke.dev

Sierra & Dallin's wedding page: the dates, the registry, and a form where guests
send a mailing address (and optionally an email) for their invitation.

- **Page:** Vite + React + TypeScript (`src/`), styled to match the printed invitations.
- **Hosting + API:** a Cloudflare Worker with static assets. `dist/` is served as-is;
  `/api/*` and `/admin*` run `worker/index.ts` (logic in `server/`).
- **Data:** Cloudflare D1 (SQLite), one table (`migrations/`).
- **Spam:** Cloudflare Turnstile. **Admin:** `/admin`, locked by Cloudflare Access.
- **Validation:** `shared/validate.ts` runs in the browser *and* on the server.

It's a separate Cloudflare project from the portfolio at the repo root, so the
two deploy independently.

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

Done once, in the Cloudflare dashboard. After that, every push to `main` deploys.

1. **Database.** D1 → *Create database* named `wedding`. Its id goes in `wrangler.toml`.
   Create the table by pasting `migrations/0001_create_invite_requests.sql` into the
   database's *Console* (or run `npm run db:migrate:remote` after `npx wrangler login`).
2. **Turnstile.** Turnstile → *Add widget* for `wedding.webecke.dev`, mode *Managed*.
   The **site key** goes in `wrangler.toml`; keep the **secret key** for step 4.
3. **Worker.** Workers & Pages → *Create* → import the `webecke/webecke.dev` repo.
   - Project name: `wedding-webecke-dev` (must match `name` in `wrangler.toml`)
   - **Root directory: `wedding`** · Build command: `npm run build` · Deploy command: `npx wrangler deploy`
   - *Settings → Build → Build watch paths*: include `wedding/*` so portfolio changes
     don't rebuild the wedding site.
4. **Secret.** Worker → *Settings → Variables and Secrets* → add **Secret**
   `TURNSTILE_SECRET_KEY`. Until it exists the form refuses submissions.
5. **Domain.** Worker → *Settings → Domains & Routes* → *Add* → *Custom domain* →
   `wedding.webecke.dev`. Cloudflare creates the DNS record.
6. **Admin lock.** Zero Trust → Access → Applications → *Add* → *Self-hosted*.
   - Domain `wedding.webecke.dev`, path `admin`
   - Policy: *Allow*, include your two emails (one-time PIN login is fine)
   - Copy the *Application Audience (AUD) Tag* into `ACCESS_AUD` and the team domain
     (`https://<team>.cloudflareaccess.com`) into `ACCESS_TEAM_DOMAIN` in `wrangler.toml`,
     then push. Until then `/admin` stays locked for everyone.
7. **Check:** the page loads at https://wedding.webecke.dev, a test submission says
   "You're on our list!", `/admin` asks you to log in and shows the row, and
   `webecke.dev/wedding` redirects to the subdomain.

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
