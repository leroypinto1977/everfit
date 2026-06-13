import { readFileSync } from "fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

// Run pending SQL migrations from ./drizzle against DATABASE_URL.
// Usage: npm run db:migrate  (reads .env.local like Next.js does)

if (!process.env.DATABASE_URL) {
  try {
    const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const m = env.match(/^DATABASE_URL="?([^"\n]+)"?/m);
    if (m) process.env.DATABASE_URL = m[1];
  } catch {
    /* handled below */
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (env or .env.local). Aborting.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
await migrate(drizzle(pool), { migrationsFolder: new URL("../drizzle", import.meta.url).pathname });
await pool.end();
console.log("Migrations applied.");
