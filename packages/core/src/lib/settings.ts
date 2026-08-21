/**
 * Owner-editable store configuration.
 *
 * Some configuration is business policy, not deployment plumbing: the GSTIN
 * printed on invoices, the inbox that gets order alerts, the return address on
 * a shipping label. Those should not need an SSH session and a rebuild to
 * change, so they live in the `settings` table and are edited from the admin
 * panel.
 *
 * Resolution order, first hit wins:
 *
 *     settings table  ->  environment variable  ->  hardcoded default
 *
 * That ordering is what makes this safe to ship: the table starts empty, every
 * value keeps coming from the env exactly as before, and a key only moves to
 * the database the moment someone edits it. Nothing has to be migrated, and
 * deleting a row reverts that setting to the env value.
 *
 * What is deliberately NOT here:
 *   - secrets (Razorpay, Brevo, DATABASE_URL, the shared bearer tokens) — a
 *     database dump should not yield live payment credentials, and encrypting
 *     them would need a key in the env anyway, gaining nothing;
 *   - NEXT_PUBLIC_* — inlined into the client bundle at build time, so a
 *     database value could never reach it;
 *   - ADMIN_URL / STORE_URL — infrastructure wiring; a typo in the panel would
 *     break the password-reset link you need to get back into the panel;
 *   - REPORT_TIMEZONE — report-time.ts hardcodes a +5:30 offset for its JS
 *     maths and only feeds the named zone to SQL, so a non-IST value would make
 *     the two disagree. It needs a real timezone library first.
 */

import { eq } from "drizzle-orm";
import { db, hasDb } from "../db";
import { settings as settingsTable } from "../db/schema";

export type SettingKey =
  | "store_gstin"
  | "store_state"
  | "store_address"
  | "support_email"
  | "order_notify_email"
  | "brevo_list_id";

export type SettingKind = "text" | "email" | "state" | "gstin" | "number";

export interface SettingDef {
  key: SettingKey;
  /** The environment variable this falls back to. */
  envVar: string;
  label: string;
  help: string;
  kind: SettingKind;
  /** Used when neither the table nor the env has a value. */
  fallback: string;
  group: string;
  multiline?: boolean;
  placeholder?: string;
}

export const SETTING_DEFS: SettingDef[] = [
  {
    key: "store_gstin",
    envVar: "STORE_GSTIN",
    label: "GSTIN",
    help: "Your 15-character GST registration number. Printed on every tax invoice.",
    kind: "gstin",
    fallback: "",
    group: "Tax & invoicing",
    placeholder: "29ABCDE1234F1Z5",
  },
  {
    key: "store_state",
    envVar: "STORE_STATE",
    label: "State of supply",
    help:
      "The state you ship from. Decides whether an invoice splits CGST+SGST (same state as the customer) or charges IGST (different state). Without it, invoices show a single combined GST line.",
    kind: "state",
    fallback: "",
    group: "Tax & invoicing",
    placeholder: "Karnataka",
  },
  {
    key: "store_address",
    envVar: "STORE_ADDRESS",
    label: "Return address",
    help: "Printed on shipping labels as the sender. Leave blank to omit it.",
    kind: "text",
    fallback: "",
    group: "Tax & invoicing",
    multiline: true,
    placeholder: "12 MG Road, Bengaluru 560001",
  },
  {
    key: "support_email",
    envVar: "SUPPORT_EMAIL",
    label: "Support email",
    help:
      "Reply-To on customer email, the contact in the email footer, and the address shown on shipping labels. The storefront's structured-data listing still uses SUPPORT_EMAIL from the environment and only changes on a redeploy.",
    kind: "email",
    fallback: "info@evherfit.com",
    group: "Contact",
    placeholder: "info@evherfit.com",
  },
  {
    key: "order_notify_email",
    envVar: "ORDER_NOTIFY_EMAIL",
    label: "Order alerts inbox",
    help: "Where new-order and low-stock alerts are delivered. Blank means nobody is told about a new order.",
    kind: "email",
    fallback: "",
    group: "Contact",
    placeholder: "owner@evherfit.com",
  },
  {
    key: "brevo_list_id",
    envVar: "BREVO_LIST_ID",
    label: "Brevo contact list id",
    help:
      "Numeric id from Brevo → Contacts → Lists. When set, paying customers are added to that list for campaigns. Storefront checkouts only — manual sales are not synced.",
    kind: "number",
    fallback: "",
    group: "Marketing",
    placeholder: "2",
  },
];

const DEFS_BY_KEY = new Map(SETTING_DEFS.map((d) => [d.key, d]));

export type Settings = Record<SettingKey, string>;

/** Where a resolved value came from — surfaced in the admin UI. */
export type SettingSource = "database" | "environment" | "default";

export interface ResolvedSetting {
  def: SettingDef;
  value: string;
  source: SettingSource;
  updatedAt?: Date;
  updatedBy?: string | null;
}

/* ────────────────────────────── resolution ────────────────────────────── */

function fromEnvOrFallback(def: SettingDef): { value: string; source: SettingSource } {
  const env = process.env[def.envVar]?.trim();
  if (env) return { value: env, source: "environment" };
  return { value: def.fallback, source: "default" };
}

function envSnapshot(): Settings {
  return Object.fromEntries(
    SETTING_DEFS.map((d) => [d.key, fromEnvOrFallback(d).value])
  ) as Settings;
}

/*
 * Cache. Settings are read on every email send and every invoice/label render,
 * so a query each time is wasteful, but they change rarely. A short TTL plus
 * explicit invalidation on write means the editing admin sees their change
 * immediately, and the other app's process picks it up within the window (its
 * pages are also revalidated by the write, via revalidateStorefront).
 */
const TTL_MS = 30_000;
let cache: { at: number; value: Settings } | null = null;

/** Drop the cached snapshot. Called after every write. */
export function invalidateSettingsCache() {
  cache = null;
}

/**
 * Resolved settings, cached briefly. Never throws: if the database is
 * unreachable — or the settings table does not exist yet, which is the case
 * between deploying this code and running the migration — it falls back to the
 * environment, which is exactly the previous behaviour.
 */
export async function getSettings(): Promise<Settings> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

  const resolved = envSnapshot();
  if (hasDb()) {
    try {
      for (const row of await db().select().from(settingsTable)) {
        const key = row.key as SettingKey;
        if (DEFS_BY_KEY.has(key) && row.value.trim()) resolved[key] = row.value;
      }
    } catch (err) {
      console.error("[settings] falling back to environment —", err);
    }
  }

  cache = { at: Date.now(), value: resolved };
  return resolved;
}

/** One resolved setting. */
export async function getSetting(key: SettingKey): Promise<string> {
  return (await getSettings())[key];
}

/**
 * Synchronous read of the last resolved snapshot, for the few call sites that
 * cannot be async — chiefly the email template shell, which is a pure string
 * builder called from deep inside template code.
 *
 * Safe because every one of those call sites sits downstream of an async path
 * that has already awaited getSettings(); if it somehow has not, this returns
 * the environment value, which is what the code did before settings existed.
 * Do not reach for this in new code — await getSettings() instead.
 */
export function peekSettings(): Settings {
  return cache?.value ?? envSnapshot();
}

/* ──────────────────────────────── writes ──────────────────────────────── */

export class SettingValidationError extends Error {}

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate a value for `key`. An empty string is always allowed and means
 * "clear this setting", reverting it to the env value or default.
 */
export function validateSetting(key: SettingKey, raw: string): string {
  const def = DEFS_BY_KEY.get(key);
  if (!def) throw new SettingValidationError(`Unknown setting "${key}".`);

  const value = def.multiline ? raw.trim() : raw.trim().replace(/\s+/g, " ");
  if (!value) return "";

  switch (def.kind) {
    case "email":
      if (!EMAIL_RE.test(value)) throw new SettingValidationError(`${def.label} must be a valid email address.`);
      return value.toLowerCase();
    case "gstin": {
      const upper = value.toUpperCase();
      if (!GSTIN_RE.test(upper)) {
        throw new SettingValidationError(
          `${def.label} must be a valid 15-character GSTIN, e.g. 29ABCDE1234F1Z5.`
        );
      }
      return upper;
    }
    case "number":
      if (!/^\d+$/.test(value)) throw new SettingValidationError(`${def.label} must be a whole number.`);
      return value;
    case "state":
      if (value.length < 3) throw new SettingValidationError(`${def.label} looks too short.`);
      return value;
    default:
      if (value.length > 500) throw new SettingValidationError(`${def.label} is too long (500 characters max).`);
      return value;
  }
}

/**
 * Write one setting. An empty value deletes the row, which reverts the setting
 * to its environment value rather than forcing a blank — that is the only way
 * back to env control once a key has been edited.
 */
export async function setSetting(key: SettingKey, raw: string, actor: string) {
  const value = validateSetting(key, raw);

  if (!value) {
    await db().delete(settingsTable).where(eq(settingsTable.key, key));
  } else {
    await db()
      .insert(settingsTable)
      .values({ key, value, updatedBy: actor })
      .onConflictDoUpdate({
        target: settingsTable.key,
        set: { value, updatedBy: actor, updatedAt: new Date() },
      });
  }
  invalidateSettingsCache();
}

/** Every setting with its value, where that value came from, and who set it. */
export async function listSettings(): Promise<ResolvedSetting[]> {
  const rows = hasDb() ? await db().select().from(settingsTable).catch(() => []) : [];
  const byKey = new Map(rows.map((r) => [r.key, r]));

  return SETTING_DEFS.map((def) => {
    const row = byKey.get(def.key);
    if (row?.value.trim()) {
      return { def, value: row.value, source: "database", updatedAt: row.updatedAt, updatedBy: row.updatedBy };
    }
    const { value, source } = fromEnvOrFallback(def);
    return { def, value, source };
  });
}
