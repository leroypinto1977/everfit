import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Lazy Drizzle client over a shared pg pool (Neon Postgres via DATABASE_URL).
 * Lazy so importing this module never crashes a build step that runs without
 * env vars — callers that reach db() without DATABASE_URL get a clear error.
 */

let pool: Pool | undefined;
let client: NodePgDatabase<typeof schema> | undefined;

export function db() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — the store now requires Postgres (Neon).");
  }
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  client ??= drizzle(pool, { schema });
  return client;
}

export function hasDb() {
  return Boolean(process.env.DATABASE_URL);
}

export * as tables from "./schema";
