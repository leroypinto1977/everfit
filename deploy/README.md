# Deploying EVHERFIT to a Hostinger VPS

Two Next.js apps, one repo, one Postgres database, one VPS:

| App | Directory | Port | Domain | PM2 process |
| --- | --- | --- | --- | --- |
| Storefront | `apps/store` | 3000 | `evherfit.com` | `everfit-store` |
| Admin panel | `apps/admin` | 3001 | `admin.evherfit.com` | `everfit-admin` |

Nginx terminates TLS and proxies each hostname to its port. Both Node servers
bind to `127.0.0.1` only, so nothing reaches them except through Nginx.

> **Hostinger plan.** This needs a **VPS**. Hostinger's shared and Cloud Web
> Hosting plans run PHP, not a long-lived Node process, so `next start`, the
> Razorpay webhook and the admin panel cannot run there.

Vercel stays connected as a staging/preview target. Nothing here removes it —
`apps/store/vercel.json` is still the cron source for Vercel; on the VPS that
job comes from `deploy/cron/reconcile.sh` instead.

---

## How environment variables work here

This is the part that was broken, so it is worth being precise.

**The two apps do not share an environment.** They are separate processes with
separate working directories. Next.js loads env files relative to each app
directory, so `apps/admin` reads `apps/admin/.env.production` and never sees
anything you set only for the storefront. When the admin panel was split out of
the storefront it inherited only `DATABASE_URL` and `ADMIN_KEY`; every other
variable its code reads — Razorpay (for refunds), Brevo (for shipping and
refund email), the URLs, the GST fields — was simply absent. That is the
"environment variables not present in the admin application" error.

**Precedence**, highest wins:

```
process.env  >  .env.production.local  >  .env.local  >  .env.production  >  .env
```

Two consequences that bite:

- **Never create `apps/*/.env.local` on the server.** Those symlinks point at
  the repo-root development file and outrank `.env.production`. They are not
  tracked in git, so a fresh clone will not have them — leave it that way.
- **`NEXT_PUBLIC_*` is inlined at build time.** `NEXT_PUBLIC_SITE_URL` and
  `NEXT_PUBLIC_GTM_ID` are baked into the client bundle by `next build`.
  Changing them needs a rebuild; `pm2 restart` alone does nothing.

**One list, checked automatically.** Every variable either app reads is declared
in [`packages/core/src/lib/env.ts`](../packages/core/src/lib/env.ts), with which
app needs it and what breaks without it. Three things read that list:

- `npm run check-env` — hard gate, non-zero exit on a missing required variable.
  `deploy/deploy.sh` runs it *before* building.
- each app's `src/instrumentation.ts` — prints what is missing to the PM2 log on
  boot.
- the admin panel's **Settings → Store configuration** screen.

Adding a variable to that one file makes it appear in all three.

---

## First-time setup

### 1. Server prerequisites

```bash
sudo apt update && sudo apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

`next build` on a 1–2 GB VPS can run out of memory. Add swap once:

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. Clone

```bash
sudo mkdir -p /var/www && sudo chown "$USER" /var/www
git clone <your-repo-url> /var/www/everfit
cd /var/www/everfit
mkdir -p logs
npm ci
```

### 3. Environment files

One file per app, `0600`, owned by the deploy user:

```bash
install -m 600 deploy/env/store.env.production.example apps/store/.env.production
install -m 600 deploy/env/admin.env.production.example apps/admin/.env.production
nano apps/store/.env.production
nano apps/admin/.env.production
```

Generate each secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Values that **must be byte-identical in both files**: `DATABASE_URL`,
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `REVALIDATE_SECRET`. The env gate
checks all four and fails the deploy if they disagree — a mismatched
`REVALIDATE_SECRET` otherwise just makes catalogue edits stop reaching the
storefront, silently.

Then confirm before building anything:

```bash
npm run check-env
```

### 4. Database

Same Neon (or other Postgres) instance both apps already use:

```bash
npm run db:migrate
```

Migration `0008_settings` adds the `settings` table behind **Settings → Business
details** in the panel. Until it runs, settings reads fall back to the env vars,
so deploying the code before the migration degrades rather than breaks — but run
it, or the owner cannot edit anything from the panel.

### 5. Build and start

```bash
./deploy/deploy.sh
pm2 save
pm2 startup        # run the command it prints, so PM2 survives a reboot
```

### 6. Nginx and TLS

Point `evherfit.com`, `www.evherfit.com` and `admin.evherfit.com` at the VPS IP
with A records first — certbot verifies over HTTP.

```bash
sudo cp deploy/nginx/evherfit.com.conf       /etc/nginx/sites-available/evherfit.com
sudo cp deploy/nginx/admin.evherfit.com.conf /etc/nginx/sites-available/admin.evherfit.com
sudo ln -s /etc/nginx/sites-available/evherfit.com       /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/admin.evherfit.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d evherfit.com -d www.evherfit.com
sudo certbot --nginx -d admin.evherfit.com
```

Both configs forward `X-Forwarded-Proto`. Without it the admin session cookie —
set with `secure: true` in production — is issued for a connection Next believes
is plain HTTP, and sign-in appears to succeed but never sticks.

### 7. Firewall

Only 80/443 and SSH should be open. Ports 3000/3001 must not be reachable
publicly; the apps bind to loopback, but close them anyway:

```bash
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

Verify from your laptop: `curl http://<vps-ip>:3001` must time out.

### 8. Cron

Replaces the Vercel Cron entry, once a day (see the Hobby-plan note in the root
README — keep it daily on Vercel too):

```bash
crontab -e
```

```
0 0 * * * /var/www/everfit/deploy/cron/reconcile.sh >> /var/www/everfit/logs/cron-reconcile.log 2>&1
```

Hostinger's hPanel → Advanced → Cron Jobs works equally well; use the same
command.

### 9. Razorpay

Dashboard → Settings → Webhooks → add
`https://evherfit.com/api/webhooks/razorpay`, events `payment.captured`,
`payment.failed`, `refund.processed`, `refund.failed`. Put the secret you set
there into `RAZORPAY_WEBHOOK_SECRET` in `apps/store/.env.production`, then
redeploy.

### 10. Create the owner account

Open `https://admin.evherfit.com/login` and use `ADMIN_KEY` once to create the
first owner. It is inert afterwards. Then open **Settings → Store
configuration** and confirm every row is green.

---

## Routine deploys

```bash
cd /var/www/everfit && ./deploy/deploy.sh
```

Pulls `main`, installs, **checks the environment, then builds**, migrates,
reloads PM2 and health-checks both ports. If the env check fails nothing is
rebuilt and the running site is untouched.

## Operating

```bash
pm2 status
pm2 logs everfit-admin --lines 100
pm2 restart everfit-admin          # after editing a non-NEXT_PUBLIC_ variable
npm run check-env                  # what is missing, and on which app
```

After changing a `NEXT_PUBLIC_*` value, rebuild — a restart will not pick it up:

```bash
npm run build && npm run build:admin && pm2 reload deploy/ecosystem.config.cjs
```

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Admin says a variable is missing that you set | You set it in `apps/store/.env.production`. The apps have separate environments — set it in `apps/admin/.env.production` too. |
| Emails link to the wrong host, or the site URL is stale | `NEXT_PUBLIC_SITE_URL` changed but only the process restarted. Rebuild. |
| Price edits do not show on the storefront | `REVALIDATE_SECRET` missing or different between the two files. `npm run check-env` reports both cases. |
| Sign-in redirects back to `/login` forever | `X-Forwarded-Proto` not reaching Next, so the `secure` cookie is dropped. Check the Nginx config is the one in this directory. |
| Payments succeed but orders stay `created` | `RAZORPAY_WEBHOOK_SECRET` wrong, or the webhook URL in Razorpay does not match. The daily reconcile job recovers these — check `logs/cron-reconcile.log`. |
| A business detail edited in the panel does not change | The settings table wins over the env var, not the reverse. If a value looks stuck, check Settings → Business details — a saved value there overrides `.env.production`. Clear the field to hand control back. |
| `npm run db:migrate` cannot find `DATABASE_URL` | It reads the process env then both apps' env files. Confirm `apps/store/.env.production` exists and is readable by the deploy user. |
| Build killed with no error | Out of memory. Add the swap file from step 1. |

## Deliberately not done

- **`output: "standalone"`.** It would shrink the deploy, but in a workspace it
  also needs `outputFileTracingRoot` and a manual copy of `public/` and
  `.next/static`, and it diverges from how the apps run on Vercel. `next start`
  against the hoisted `node_modules` is the same code path in both places.
- **PM2 cluster mode.** Next's incremental cache is per-process on disk; a
  second worker on the same box serves the first one's stale pages. Scale at
  Nginx, or configure a shared cache handler first.
