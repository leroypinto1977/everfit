/**
 * Resolve one app's environment exactly the way Next.js would.
 *
 * Node scripts that run outside the Next runtime (the env gate, the migration
 * runner, drizzle-kit's config) still need the same values from the same files
 * with the same precedence, so they all go through @next/env here rather than
 * hand-rolling a dotenv read. Precedence, highest first:
 *
 *   process.env  >  .env.<NODE_ENV>.local  >  .env.local  >  .env.<NODE_ENV>  >  .env
 *
 * which is why values injected by PM2, systemd or a CI dashboard always win.
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import nextEnv from "@next/env";

const { loadEnvConfig, resetEnv } = nextEnv;

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const APPS = ["store", "admin"];

const QUIET = { info() {}, error() {} };

/**
 * Read `apps/<app>`'s environment and return it, leaving this process's own
 * process.env untouched — callers may resolve both apps in a row, and each must
 * see only its own files.
 *
 * @param {"store"|"admin"} app
 * @param {{ dev?: boolean }} [options]
 * @returns {Record<string, string | undefined>}
 */
export function resolveAppEnv(app, { dev = false } = {}) {
  const snapshot = { ...process.env };
  resetEnv();
  loadEnvConfig(path.join(ROOT, "apps", app), dev, QUIET, true);
  const resolved = { ...process.env };

  for (const key of Object.keys(process.env)) {
    if (!(key in snapshot)) delete process.env[key];
  }
  Object.assign(process.env, snapshot);
  return resolved;
}

/**
 * Find `name` by checking the real environment first, then each app's env
 * files. Used by tooling that is app-agnostic but needs a shared value —
 * DATABASE_URL is the same string for both deployments by definition.
 *
 * @param {string} name
 * @param {{ dev?: boolean }} [options]
 * @returns {string | undefined}
 */
export function resolveShared(name, options) {
  if (process.env[name]?.trim()) return process.env[name];
  for (const app of APPS) {
    const value = resolveAppEnv(app, options)[name];
    if (value?.trim()) return value;
  }
  return undefined;
}
