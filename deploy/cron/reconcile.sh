#!/usr/bin/env bash
#
# Payment reconciliation — the Hostinger replacement for the Vercel Cron entry
# in apps/store/vercel.json. That file still drives the Vercel staging project;
# on the VPS nothing reads it, so this runs from crontab instead.
#
# Install (hPanel → Advanced → Cron Jobs, or `crontab -e`), once a day:
#
#   0 0 * * * /var/www/everfit/deploy/cron/reconcile.sh >> /var/www/everfit/logs/cron-reconcile.log 2>&1
#
# It calls the storefront over loopback, so it works before DNS/TLS are live and
# never leaves the box. CRON_SECRET is read from the storefront's own env file —
# one place to change it.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT/apps/store/.env.production"
PORT="${STORE_PORT:-3000}"

if [[ ! -r "$ENV_FILE" ]]; then
  echo "$(date -Is) reconcile: cannot read $ENV_FILE" >&2
  exit 1
fi

# Read only the one key, and only from this file: sourcing the whole env would
# drop live Razorpay and Brevo credentials into this shell's environment.
CRON_SECRET="$(sed -n 's/^[[:space:]]*CRON_SECRET[[:space:]]*=[[:space:]]*//p' "$ENV_FILE" | tail -n 1 | sed 's/^"\(.*\)"$/\1/; s/^'"'"'\(.*\)'"'"'$/\1/')"

if [[ -z "$CRON_SECRET" ]]; then
  echo "$(date -Is) reconcile: CRON_SECRET is empty in $ENV_FILE — the route fails closed, so this would 401" >&2
  exit 1
fi

# --max-time guards against a hung request holding a cron slot; the route itself
# is capped at 120s of work.
response="$(curl --silent --show-error --fail-with-body --max-time 180 \
  -H "Authorization: Bearer $CRON_SECRET" \
  "http://127.0.0.1:${PORT}/api/cron/reconcile")" || {
  echo "$(date -Is) reconcile: request failed — $response" >&2
  exit 1
}

echo "$(date -Is) reconcile: $response"
