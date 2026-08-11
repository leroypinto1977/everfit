<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Monorepo

Two separately-deployed Next.js apps in one npm workspace. See the README for the
full layout and the Vercel setup.

- `apps/store` — the public storefront. Must contain **no** admin code or routes.
- `apps/admin` — the admin panel, on its own private domain. Its routes sit at the
  root (`/orders`, not `/admin/orders`).
- `packages/core` — everything both apps share (`@everfit/core/db`,
  `@everfit/core/lib/*`, `@everfit/core/components/*`). Raw TypeScript, compiled by
  each app via `transpilePackages`.

Rules of thumb:

- Auth internals (`admin-auth.ts`) and team management stay in `apps/admin/src/lib/`,
  never in `packages/core`.
- Inside `packages/core` use relative imports; the `@/*` alias only exists per app.
- The two apps cannot touch each other's Next.js cache. When an admin write should
  refresh a storefront page, go through `revalidateStorefront()` — not
  `revalidatePath()`.
- Root `package.json` scripts must delegate with `npm --prefix apps/<app> run <script>`.
  Inside a lifecycle script npm ignores `--workspace` in **either** position and re-runs
  the root script forever — `npm run build` at the repo root then never terminates.
