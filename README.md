# EVHERFIT — Infinity Band

Product website + admin panel for the **EVHERFIT Infinity Band** ("Be the woman") —
a weighted resistance band (iron-sand core, silicone shell) worn on wrists/ankles,
sold as a pair in three weights: 0.5 kg ₹1,499 · 1 kg ₹1,999 · 2 kg ₹2,499. Variants
are priced server-side in `packages/core/src/lib/product.ts`.

Next.js (App Router) + Tailwind v4 + Motion (Framer Motion) + Lenis smooth scroll,
with no-login guest checkout via Razorpay.

Brand (from the brand book): light surfaces (off-white `#F4F5F9`), primary indigo
`#2B337D`, near-black; Palette W pink `#E56CA5` as the women's-line accent. Display
face Renoric ≈ **Exo 2 italic**, body URW Geometric ≈ **Poppins** (Google Fonts
approximations). Infinity mark is drawn as an inline SVG in
`packages/core/src/components/Logo.tsx` — horizontal lockup only, per the guidelines.

## Repo layout

The storefront and the admin panel are **two separate applications with two
separate deployments**, in one npm-workspaces monorepo. The public site contains
no admin code at all, and the admin panel lives on its own private domain.

```
apps/
  store/     public storefront  →  Vercel project "everfit"        (evherfit.com)
  admin/     admin panel        →  Vercel project "everfit-admin"  (admin.evherfit.com)
packages/
  core/      shared domain layer, imported by both apps as @everfit/core
             ├─ src/db/         Drizzle schema + lazy Postgres client
             ├─ src/lib/        orders, catalog, coupons, inventory, razorpay,
             │                  revenue, tax, report-time, email templates …
             └─ src/components/ Logo (the one shared UI piece)
drizzle/     SQL migrations (shared — one database serves both apps)
tests/       vitest unit tests for the pure logic in packages/core
```

Admin-only code that must never reach the storefront — `admin-auth.ts` (password
hashing, sessions, rate limiting) and `team.ts` — lives in `apps/admin/src/lib/`,
not in the shared package.

## Run it

```bash
cp .env.example .env.local   # fill in Razorpay test keys + ADMIN_KEY + DATABASE_URL
npm install
npm run db:migrate           # apply migrations
npm run seed                 # optional: demo orders for the admin panel
```

Then run whichever app you're working on — they can run side by side:

```bash
npm run dev          # storefront   → http://localhost:3000
npm run dev:admin    # admin panel  → http://localhost:3001
```

Both apps read the repo-root `.env.local` through a symlink in each app
directory (`apps/store/.env.local`, `apps/admin/.env.local`). If you clone
fresh, recreate them:

```bash
ln -sf ../../.env.local apps/store/.env.local && ln -sf ../../.env.local apps/admin/.env.local
```

Other root scripts: `npm test` (vitest), `npm run typecheck` (both apps),
`npm run lint` (both apps), `npm run build` / `npm run build:admin`.

## Admin panel — its own app, its own domain

Per-user sign-in (email + password, scrypt-hashed) with httpOnly cookie sessions;
`ADMIN_KEY` is only the one-time secret used to create the owner account on first
run. Roles are `owner` and `staff` — destructive/financial screens are owner-only.

Because it is a separate deployment, the panel's routes sit at the **root** of the
admin domain (`/orders`, not `/admin/orders`), and the storefront returns 404 for
`/admin*`.

- **Dashboard** (`/`): revenue/orders/to-ship/AOV KPIs, animated 14-day revenue
  chart, recent orders.
- **Orders** (`/orders`): status filter chips (to ship / shipped / delivered /
  pending / failed) + search by name, phone, email, order ID, or PIN code.
- **Order detail** (`/orders/<id>`): full shipping + payment info, **Mark as
  shipped** (with optional courier tracking number) and **Mark as delivered** actions.
- Also: customers, products, inventory, coupons, revenue, analytics, emails,
  settings, manual sales, plus printable `/orders/<id>/invoice` and `/label`.

Order lifecycle: `created` → `paid` (webhook/verify) → `shipped` → `delivered`,
with `failed` for failed payments.

### How the two apps talk to each other

They share one Postgres database, and otherwise touch in exactly two places:

1. **Cache invalidation.** A price or stock edit in the admin panel used to call
   `revalidatePath` on the storefront's own cache. Now it POSTs to the
   storefront's `/api/revalidate` with `REVALIDATE_SECRET` as a bearer token
   (`apps/admin/src/lib/revalidate-store.ts` → `apps/store/src/app/api/revalidate/route.ts`).
   The endpoint fails closed without the secret and only accepts an allow-list of
   catalogue paths. Best-effort: if the storefront is unreachable the edit still
   saves.
2. **Email links.** Owner-facing emails (new order, low stock, teammate welcome,
   password reset) link into the admin panel via `ADMIN_URL`; customer-facing
   emails link to the storefront via `NEXT_PUBLIC_SITE_URL`.

## Configuration

Every environment variable either app reads is declared once, in
`packages/core/src/lib/env.ts` — which app needs it, whether it is required, and
what breaks without it. Three things read that declaration, so they can no
longer drift apart: the `check-env` script, each app's `instrumentation.ts`
startup banner, and the admin panel's **Settings → Store configuration** screen.

```bash
npm run check-env        # strict: both apps, production env files, exits 1 on a gap
npm run check-env:dev    # the same against your local .env.local
```

Two things to keep in mind, because both have already caused a silently broken
deployment:

- **The apps do not share an environment.** They are separate processes with
  separate working directories, so `apps/admin` never sees a variable set only
  for `apps/store`. `DATABASE_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and
  `REVALIDATE_SECRET` must be identical on both; `check-env` verifies that.
- **`NEXT_PUBLIC_*` is baked in at build time.** Changing `NEXT_PUBLIC_SITE_URL`
  or `NEXT_PUBLIC_GTM_ID` needs a rebuild, not a restart.

## Deploying

Production runs on a **Hostinger VPS**; Vercel stays connected as a
staging/preview target. The full runbook — Nginx, PM2, TLS, cron, firewall,
troubleshooting — is in **[deploy/README.md](deploy/README.md)**.

```bash
cd /var/www/everfit && ./deploy/deploy.sh
```

Both apps run under PM2 (`everfit-store` on 3000, `everfit-admin` on 3001),
bound to loopback, with Nginx terminating TLS for `evherfit.com` and
`admin.evherfit.com`. Production values live in `apps/store/.env.production` and
`apps/admin/.env.production` (templates in `deploy/env/`); never create the
`apps/*/.env.local` symlinks on the server — they are the development file and
outrank `.env.production`.

### Vercel (staging)

Two Vercel projects, one Git repo. Both auto-deploy on push to `main`; a push
that only touches one app still rebuilds both unless you add Ignored Build Steps.

**Storefront** — this is the existing `everfit` project. Change one setting:

- Settings → Build & Deployment → **Root Directory** = `apps/store`
  (leave "Include files outside of the Root Directory" **on** — the build needs
  `packages/core` and the root lockfile).

**Admin panel** — create a new project:

1. Vercel → Add New → Project → import the same `everfit` repo.
2. Name it `everfit-admin`, set **Root Directory** = `apps/admin`, keep
   "Include files outside of the Root Directory" on.
3. Add the env vars marked `[both]` and `[admin]` in `.env.example` —
   at minimum `DATABASE_URL`, `ADMIN_KEY`, `RAZORPAY_KEY_ID`,
   `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_URL`, `STORE_URL`,
   `REVALIDATE_SECRET`, and the Brevo email vars.
4. Add `REVALIDATE_SECRET` and `ADMIN_URL` to the **storefront** project too —
   `REVALIDATE_SECRET` must be identical on both.
5. Domains → add `admin.evherfit.com` (or whichever private hostname you want),
   and point the DNS record at Vercel.
6. Deploy, open the admin domain, and sign in. The account and session cookie are
   unchanged — but the cookie is per-domain, so everyone signs in once more.

The panel is not linked from the storefront anywhere, sends
`X-Robots-Tag: noindex, nofollow, noarchive`, serves `Disallow: /` from
`robots.txt`, and sets `X-Frame-Options: DENY`. Access control is the app's own
sign-in; if you later want a second gate in front of it, Vercel's Deployment
Protection on the `everfit-admin` project does that without touching code.

The reconciliation cron is defined twice, once per host: `apps/store/vercel.json`
drives it on Vercel, `deploy/cron/reconcile.sh` (from crontab) drives it on the
VPS. Keep it at most once a day — sub-daily crons silently block deploys on
Vercel's Hobby plan.

## How orders work without a login (the Fittr model)

There are no user accounts. The checkout form collects everything we need, and Razorpay
tells us — server to server — when money actually moves:

1. **Customer fills the checkout form** (`/checkout`): name, email, phone, address.
   This replaces a login — identity is captured per order.
2. **`POST /api/checkout`** creates a Razorpay Order via their Orders API (price fixed
   server-side) and saves a `created` order with the shipping details.
3. **Razorpay's modal opens** in the browser — UPI / cards / netbanking / EMI.
4. **On success the browser calls `POST /api/verify`**, which checks the HMAC signature
   so a forged "success" can't mark an order paid. The customer sees `/success`.
5. **Razorpay also calls our webhook** (`POST /api/webhooks/razorpay`) with
   `payment.captured` / `payment.failed`. This is the *authoritative* signal — it fires
   even if the customer closes the tab mid-redirect, so no paid order is ever missed.
   This is also where to plug in confirmation emails / WhatsApp notifications.

### How the client tracks orders

- **The admin panel** (its own domain, see above): every order with customer, shipping
  address, payment status, and revenue totals. This is what they fulfil/ship from.
- **Razorpay Dashboard** — every payment, settlement, and refund also shows up there
  (Razorpay emails them on each payment too, if enabled in dashboard settings).

### Razorpay setup checklist

1. Create account at dashboard.razorpay.com → complete KYC for live mode.
2. Settings → API Keys → generate **test** keys first (`rzp_test_…`) → `.env.local`.
3. After deploying, Settings → Webhooks → add
   `https://<domain>/api/webhooks/razorpay`, choose events `payment.captured` and
   `payment.failed`, set a secret, and put the same secret in `RAZORPAY_WEBHOOK_SECRET`.
4. Test with Razorpay's test UPI/card numbers, then swap to live keys.

## Where the animations live

All storefront-only, under `apps/store/`:

| File | What it does |
| --- | --- |
| `src/components/SmoothScroll.tsx` | Lenis inertial smooth scrolling, site-wide |
| `src/components/SplitText.tsx` | Word-by-word masked headline reveal |
| `src/components/Magnetic.tsx` | Cursor-magnetic buttons (spring physics) |
| `src/components/Reveal.tsx` | Scroll-into-view fade/rise/unblur |
| `src/components/Hero.tsx` | Parallax on scroll, floating band, breathing glow |
| `src/components/Showcase.tsx` | Pinned scroll section — product view swaps per panel |
| `src/components/Features.tsx` | 3D tilt-on-hover cards |
| `src/components/Pricing.tsx` | Weight-variant cards with hover lift |
| `src/components/Stats.tsx` | Spring-animated count-up numbers |
| `src/app/globals.css` | Marquee, shine, glow/float keyframes |

The infinity mark's stroke draw-on lives with the shared logo in
`packages/core/src/components/Logo.tsx`; its keyframes are duplicated in each
app's `globals.css` (the storefront uses it on the site, the admin panel on the
sign-in screen).

All scroll/hover animations respect `prefers-reduced-motion`.
