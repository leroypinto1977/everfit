/**
 * The single source of truth for every environment variable either app reads.
 *
 * Two deployments (apps/store, apps/admin) share one codebase and one database,
 * so "which variable does which app need" used to live in three places at once:
 * .env.example, the admin Settings page, and whatever the deploy target's
 * dashboard happened to have. They drifted, and the admin panel shipped without
 * half its config. This module is now the only list; everything else reads it:
 *
 *   - scripts/check-env.mjs        hard gate before `next build` / `next start`
 *   - each app's instrumentation.ts  startup banner when something is missing
 *   - apps/admin Settings page     the owner-facing "Store configuration" panel
 *
 * Written in erasable-only TypeScript (no enums, no namespaces) so that plain
 * `node scripts/check-env.mjs` can import it directly via Node's type stripping.
 */

export type EnvApp = "store" | "admin";

/**
 * required    — the app is broken without it (payments fail, nothing loads)
 * recommended — the app runs, but a whole feature silently does nothing
 * optional    — has a sane built-in default
 */
export type EnvLevel = "required" | "recommended" | "optional";

export interface EnvVar {
  name: string;
  /** Which deployments read it. */
  apps: EnvApp[];
  level: EnvLevel;
  /**
   * NEXT_PUBLIC_* values are inlined into the client bundle by `next build`,
   * so they must be present at BUILD time — setting them only in PM2/systemd
   * at runtime is too late and leaves the literal fallback in the bundle.
   */
  buildTime?: boolean;
  /** Must hold the identical value on both deployments. */
  sharedSecret?: boolean;
  /**
   * Owner-editable from the admin panel (lib/settings.ts). The env var is the
   * fallback, so "not set" here is not a problem when a value has been saved in
   * the panel instead.
   */
  dbOverridable?: boolean;
  group: string;
  summary: string;
  /** What actually breaks when it is missing. Shown in the admin panel. */
  impact: string;
}

const BOTH: EnvApp[] = ["store", "admin"];

export const ENV_VARS: EnvVar[] = [
  /* ── Database ────────────────────────────────────────────────────────── */
  {
    name: "DATABASE_URL",
    apps: BOTH,
    level: "required",
    group: "Database",
    summary: "Postgres connection string (Neon, or any Postgres).",
    impact: "Nothing loads — orders, products, customers and admin accounts all live here.",
  },

  /* ── Payments ────────────────────────────────────────────────────────── */
  {
    name: "RAZORPAY_KEY_ID",
    apps: BOTH,
    level: "required",
    group: "Payments",
    summary: "Razorpay API key id (rzp_test_… or rzp_live_…).",
    impact: "Customers cannot pay, and the admin panel cannot issue refunds.",
  },
  {
    name: "RAZORPAY_KEY_SECRET",
    apps: BOTH,
    level: "required",
    group: "Payments",
    summary: "Razorpay API key secret.",
    impact: "Customers cannot pay, and the admin panel cannot issue refunds.",
  },
  {
    name: "RAZORPAY_WEBHOOK_SECRET",
    apps: ["store"],
    level: "required",
    group: "Payments",
    summary: "Signing secret for POST /api/webhooks/razorpay.",
    impact:
      "Payment confirmations are rejected. An order whose customer closed the tab mid-redirect never reaches 'paid'.",
  },
  {
    name: "CRON_SECRET",
    apps: ["store"],
    level: "required",
    group: "Payments",
    summary: "Bearer token the reconcile cron must present.",
    impact:
      "The reconciliation safety net fails closed — orders where both the webhook and the browser verify failed stay stuck in 'created'.",
  },

  /* ── Admin access ────────────────────────────────────────────────────── */
  {
    name: "ADMIN_KEY",
    apps: ["admin"],
    level: "required",
    group: "Admin access",
    summary: "One-time setup secret used to create the owner account on first run.",
    impact: "The very first owner account cannot be created. Inert once an account exists.",
  },

  /* ── Cross-app wiring ────────────────────────────────────────────────── */
  {
    name: "NEXT_PUBLIC_SITE_URL",
    apps: BOTH,
    level: "required",
    buildTime: true,
    group: "URLs",
    summary: "Public storefront origin, e.g. https://evherfit.com.",
    impact:
      "Canonicals, Open Graph, sitemap, invoice header and every customer email link fall back to the hardcoded default.",
  },
  {
    name: "ADMIN_URL",
    apps: BOTH,
    level: "recommended",
    group: "URLs",
    summary: "Private admin origin, e.g. https://admin.evherfit.com.",
    impact:
      "'Open in admin panel' buttons in the new-order, low-stock, teammate-welcome and password-reset emails point at the storefront instead.",
  },
  {
    name: "STORE_URL",
    apps: ["admin"],
    level: "recommended",
    group: "URLs",
    summary: "Storefront origin the admin panel pushes cache invalidation to.",
    impact: "Falls back to NEXT_PUBLIC_SITE_URL. Only set it separately if the two differ.",
  },
  {
    name: "REVALIDATE_SECRET",
    apps: BOTH,
    level: "recommended",
    sharedSecret: true,
    group: "URLs",
    summary: "Shared bearer token for the admin → storefront revalidation hook.",
    impact:
      "Price and stock edits save but the storefront keeps serving the old catalogue until its next deploy. Must be identical on both deployments.",
  },

  /* ── Transactional email ─────────────────────────────────────────────── */
  {
    name: "BREVO_API_KEY",
    apps: BOTH,
    level: "recommended",
    group: "Email",
    summary: "Brevo API key (starts with xkeysib-).",
    impact: "No email is sent at all — no order confirmations, shipping updates, refund notices or alerts.",
  },
  {
    name: "EMAIL_FROM",
    apps: BOTH,
    level: "recommended",
    group: "Email",
    summary: 'Sender, e.g. "EVHERFIT <orders@evherfit.com>".',
    impact:
      "Falls back to no-reply@evherfit.com, which will not be on your Brevo-verified domain — expect spam folders or hard rejects.",
  },
  {
    name: "SUPPORT_EMAIL",
    dbOverridable: true,
    apps: BOTH,
    level: "recommended",
    group: "Email",
    summary: "Reply-To on customer email, and the contact shown on shipping labels.",
    impact: "Falls back to info@evherfit.com.",
  },
  {
    name: "ORDER_NOTIFY_EMAIL",
    dbOverridable: true,
    apps: BOTH,
    level: "recommended",
    group: "Email",
    summary: "Inbox that receives new-order and low-stock alerts.",
    impact: "Nobody is told a new order came in — fulfilment depends on someone opening the panel.",
  },
  {
    name: "BREVO_LIST_ID",
    dbOverridable: true,
    apps: ["store"],
    level: "optional",
    group: "Email",
    summary: "Numeric Brevo contact list id.",
    impact: "Unset means paying customers are not synced into a Brevo list for later campaigns.",
  },

  /* ── Invoicing & reporting ───────────────────────────────────────────── */
  {
    name: "REPORT_TIMEZONE",
    apps: ["admin"],
    level: "optional",
    group: "Invoicing & reporting",
    summary: "Timezone used to bucket revenue into days and months.",
    impact: "Defaults to Asia/Kolkata (IST).",
  },
  {
    name: "GST_RATE",
    apps: ["admin"],
    level: "optional",
    group: "Invoicing & reporting",
    summary: "GST rate used to back-compute the tax split from GST-inclusive prices.",
    impact: "Defaults to 0.18 (18%).",
  },
  {
    name: "STORE_STATE",
    dbOverridable: true,
    apps: ["admin"],
    level: "optional",
    group: "Invoicing & reporting",
    summary: "Seller's state, e.g. Karnataka.",
    impact: "Without it the invoice cannot split CGST+SGST (intra-state) from IGST (inter-state).",
  },
  {
    name: "STORE_GSTIN",
    dbOverridable: true,
    apps: ["admin"],
    level: "optional",
    group: "Invoicing & reporting",
    summary: "Seller's GSTIN, printed on the tax invoice.",
    impact: "The invoice is not GST-compliant without it.",
  },
  {
    name: "HSN_CODE",
    apps: ["admin"],
    level: "optional",
    group: "Invoicing & reporting",
    summary: "HSN code for the product (9506 = sports/fitness equipment).",
    impact: "Omitted from the invoice.",
  },
  {
    name: "STORE_ADDRESS",
    dbOverridable: true,
    apps: ["admin"],
    level: "optional",
    group: "Invoicing & reporting",
    summary: "Return address printed on shipping labels.",
    impact: "Labels print without a return address.",
  },

  /* ── Analytics ───────────────────────────────────────────────────────── */
  {
    name: "NEXT_PUBLIC_GTM_ID",
    apps: ["store"],
    level: "optional",
    buildTime: true,
    group: "Analytics",
    summary: "Google Tag Manager container id (GTM-XXXXXXX).",
    impact: "No tracking scripts load. GA4 e-commerce events are still pushed to the dataLayer.",
  },
];

/** Every variable the given deployment reads, in declaration order. */
export function envVarsFor(app: EnvApp): EnvVar[] {
  return ENV_VARS.filter((v) => v.apps.includes(app));
}

export interface EnvCheckEntry {
  variable: EnvVar;
  set: boolean;
}

export interface EnvCheckResult {
  app: EnvApp;
  entries: EnvCheckEntry[];
  missingRequired: EnvVar[];
  missingRecommended: EnvVar[];
  /** True when nothing at the `required` level is missing. */
  ok: boolean;
}

/**
 * Evaluate one deployment's configuration. `source` defaults to process.env so
 * this works unchanged in a server component, in instrumentation, and in the
 * CLI (which passes a parsed .env file merged over process.env).
 */
export function checkEnv(
  app: EnvApp,
  source: Record<string, string | undefined> = process.env
): EnvCheckResult {
  const entries = envVarsFor(app).map((variable) => ({
    variable,
    set: Boolean(source[variable.name]?.trim()),
  }));

  const missing = (level: EnvLevel) =>
    entries.filter((e) => !e.set && e.variable.level === level).map((e) => e.variable);

  const missingRequired = missing("required");
  return {
    app,
    entries,
    missingRequired,
    missingRecommended: missing("recommended"),
    ok: missingRequired.length === 0,
  };
}

/**
 * Print a startup banner naming anything unset. Called from each app's
 * `register()` so a server that boots half-configured says so in the PM2 log
 * on line one, instead of at 2am when a customer's payment fails to confirm.
 *
 * Deliberately does not throw: a missing REVALIDATE_SECRET must not take the
 * storefront down, and the code paths that genuinely cannot continue (db(),
 * razorpay()) already throw their own precise errors. The hard gate is
 * `scripts/check-env.mjs`, which runs before the build.
 */
export function logEnvStatus(app: EnvApp): EnvCheckResult {
  const result = checkEnv(app);
  const name = (v: EnvVar) => v.name;

  if (result.missingRequired.length) {
    console.error(
      `[env] apps/${app}: ${result.missingRequired.length} REQUIRED variable(s) missing — ` +
        `${result.missingRequired.map(name).join(", ")}. This deployment is not fully functional.`
    );
    for (const v of result.missingRequired) console.error(`[env]   ${v.name}: ${v.impact}`);
  }
  if (result.missingRecommended.length) {
    console.warn(
      `[env] apps/${app}: ${result.missingRecommended.length} recommended variable(s) unset — ` +
        `${result.missingRecommended.map(name).join(", ")}.`
    );
  }
  if (result.ok && !result.missingRecommended.length) {
    console.log(`[env] apps/${app}: all variables configured.`);
  }
  return result;
}
