import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

import { ROOT, resolveShared } from "./load-env.mjs";

// Run pending SQL migrations from ./drizzle against DATABASE_URL.
// Usage: npm run db:migrate
//
// Resolves DATABASE_URL the way Next.js does, from whichever app env file
// exists — previously it only grepped the repo-root .env.local, which is the
// development file and is absent on a deployed server, so `npm run db:migrate`
// aborted there even though both apps could reach the database perfectly well.

const connectionString = resolveShared("DATABASE_URL");

if (!connectionString) {
  console.error(
    "DATABASE_URL is not set.\n" +
      "Checked: the process environment, apps/store and apps/admin (.env.production, .env.local, .env).\n" +
      "Run `node scripts/check-env.mjs all` to see the full picture."
  );
  process.exit(1);
}

const pool = new pg.Pool({ connectionString, max: 1 });
await migrate(drizzle(pool), { migrationsFolder: path.join(ROOT, "drizzle") });
await pool.end();
console.log("Migrations applied.");
