import { readFileSync } from "fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't read .env.local (Next.js convention) on its own.
if (!process.env.DATABASE_URL) {
  try {
    const env = readFileSync(".env.local", "utf8");
    const m = env.match(/^DATABASE_URL="?([^"\n]+)"?/m);
    if (m) process.env.DATABASE_URL = m[1];
  } catch {
    /* fall through — drizzle-kit will error with a clear message */
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
