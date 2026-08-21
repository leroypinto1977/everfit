#!/usr/bin/env node
/**
 * Environment gate. Run it before building or starting either app:
 *
 *   node scripts/check-env.mjs store        # check apps/store
 *   node scripts/check-env.mjs admin        # check apps/admin
 *   node scripts/check-env.mjs all          # both, plus cross-app consistency
 *
 * Flags:
 *   --dev         resolve .env.development* instead of .env.production*
 *   --warn-only   report but always exit 0
 *
 * Exit code 1 means a `required` variable is missing, which is the whole point:
 * a deploy that would have booted into a broken payment flow fails at the build
 * step instead, with the list of what to set.
 *
 * Variables are resolved exactly the way Next.js resolves them, by handing the
 * app directory to @next/env — same file precedence, same $VAR expansion, same
 * multiline handling. process.env wins over every file, so values injected by
 * PM2, systemd or a platform dashboard are seen here too.
 */

import { checkEnv } from "../packages/core/src/lib/env.ts";
import { APPS, resolveAppEnv } from "./load-env.mjs";

const argv = process.argv.slice(2);
const dev = argv.includes("--dev");
const warnOnly = argv.includes("--warn-only");
const target = argv.find((a) => !a.startsWith("--")) ?? "all";

if (target !== "all" && !APPS.includes(target)) {
  console.error(`Unknown target "${target}". Use: store | admin | all`);
  process.exit(2);
}
const targets = target === "all" ? APPS : [target];

/* ── colour, but only for a real terminal ─────────────────────────────── */
const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (tty ? `\u001b[${code}m${s}\u001b[0m` : s);
const bold = (s) => c("1", s);
const red = (s) => c("31", s);
const green = (s) => c("32", s);
const amber = (s) => c("33", s);
const dim = (s) => c("2", s);

const MARK = { ok: green("  ok  "), warn: amber(" warn "), miss: red(" MISS ") };

function report(app, result) {
  console.log(`\n${bold(`apps/${app}`)} ${dim(`— ${dev ? "development" : "production"} environment`)}`);

  let group = "";
  for (const { variable, set } of result.entries) {
    if (variable.group !== group) {
      group = variable.group;
      console.log(dim(`\n  ${group}`));
    }

    const mark = set ? MARK.ok : variable.level === "required" ? MARK.miss : MARK.warn;
    const tags = [
      variable.level === "optional" && !set ? dim("optional") : "",
      variable.buildTime ? amber("build-time") : "",
      variable.sharedSecret ? dim("must match on both apps") : "",
      variable.dbOverridable ? dim("editable in admin panel") : "",
    ]
      .filter(Boolean)
      .join(" ");

    console.log(`  [${mark}] ${variable.name.padEnd(24)} ${tags}`);
    if (!set && variable.level !== "optional") {
      console.log(dim(`           ${variable.impact}`));
      if (variable.dbOverridable) {
        console.log(dim("           (fine to leave unset if it is saved in Settings -> Business details)"));
      }
    }
  }
}

const results = new Map();
for (const app of targets) {
  const env = resolveAppEnv(app, { dev });
  const result = checkEnv(app, env);
  results.set(app, { result, env });
  report(app, result);
}

/* ── cross-app consistency ────────────────────────────────────────────── */
const crossAppProblems = [];
if (targets.length === 2) {
  const [store, admin] = APPS.map((a) => results.get(a).env);

  // REVALIDATE_SECRET is a bearer token the admin panel sends to the storefront.
  // Two different values fail exactly like a missing one, but silently.
  if (store.REVALIDATE_SECRET && admin.REVALIDATE_SECRET && store.REVALIDATE_SECRET !== admin.REVALIDATE_SECRET) {
    crossAppProblems.push(
      "REVALIDATE_SECRET differs between the two apps — the storefront will reject every invalidation with 401."
    );
  }
  // One database, or the panel manages orders the storefront never took.
  if (store.DATABASE_URL && admin.DATABASE_URL && store.DATABASE_URL !== admin.DATABASE_URL) {
    crossAppProblems.push("DATABASE_URL differs between the two apps — they must share one database.");
  }
  if (store.RAZORPAY_KEY_ID && admin.RAZORPAY_KEY_ID && store.RAZORPAY_KEY_ID !== admin.RAZORPAY_KEY_ID) {
    crossAppProblems.push(
      "RAZORPAY_KEY_ID differs between the two apps — refunds issued from the panel would hit a different Razorpay account."
    );
  }

  if (crossAppProblems.length) {
    console.log(`\n${bold("cross-app")}`);
    for (const p of crossAppProblems) console.log(`  [${MARK.miss}] ${p}`);
  }
}

/* ── summary ──────────────────────────────────────────────────────────── */
const missingRequired = targets.flatMap((a) =>
  results.get(a).result.missingRequired.map((v) => `${a}: ${v.name}`)
);
const missingRecommended = targets.flatMap((a) =>
  results.get(a).result.missingRecommended.map((v) => `${a}: ${v.name}`)
);

console.log("");
if (missingRecommended.length) {
  console.log(amber(`${missingRecommended.length} recommended variable(s) unset: ${missingRecommended.join(", ")}`));
}

const failed = missingRequired.length > 0 || crossAppProblems.length > 0;
if (failed) {
  if (missingRequired.length) {
    console.log(red(bold(`Missing ${missingRequired.length} required variable(s): ${missingRequired.join(", ")}`)));
  }
  console.log(dim("See .env.example for what each one is, and deploy/README.md for where to set it."));
  if (warnOnly) {
    console.log(dim("--warn-only: continuing anyway."));
    process.exit(0);
  }
  process.exit(1);
}

console.log(green(`Environment OK for ${targets.map((a) => `apps/${a}`).join(" and ")}.`));
