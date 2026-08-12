#!/usr/bin/env bash
#
# One-shot deploy on the Hostinger VPS. Safe to re-run.
#
#   cd /var/www/everfit && ./deploy/deploy.sh
#
# Order matters: the environment is checked BEFORE anything is built, so a
# deploy that would boot into a broken checkout stops while the previous build
# is still serving traffic.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

step() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

step "Pulling latest main"
git pull --ff-only origin main

step "Installing dependencies"
# `npm ci` from the repo root installs the whole workspace and hoists it into
# ./node_modules; there is no per-app node_modules to install.
npm ci

step "Checking environment"
# Hard gate. Exits non-zero when a required variable is missing on either app,
# and when REVALIDATE_SECRET / DATABASE_URL / RAZORPAY_KEY_ID disagree between
# the two env files.
node scripts/check-env.mjs all

step "Applying database migrations"
npm run db:migrate

step "Building the storefront"
# NEXT_PUBLIC_* is inlined here, which is why the build has to come after the
# env files are in place rather than being reused from a previous release.
npm run build

step "Building the admin panel"
npm run build:admin

step "Reloading PM2"
if pm2 describe everfit-store >/dev/null 2>&1; then
  pm2 reload deploy/ecosystem.config.cjs --update-env
else
  pm2 start deploy/ecosystem.config.cjs
  pm2 save
fi

step "Health check"
for service in "store:3000" "admin:3001"; do
  name="${service%%:*}"
  port="${service##*:}"
  # PM2 reload returns before Next has finished binding; give it a moment.
  for attempt in $(seq 1 20); do
    if curl --silent --fail --max-time 5 -o /dev/null "http://127.0.0.1:${port}/"; then
      echo "  ${name} is answering on ${port}"
      break
    fi
    if [[ "$attempt" == 20 ]]; then
      echo "  ${name} did not answer on ${port} — check: pm2 logs everfit-${name}" >&2
      exit 1
    fi
    sleep 1
  done
done

printf '\n\033[32mDeployed.\033[0m Storefront https://evherfit.com · Admin https://admin.evherfit.com\n'
