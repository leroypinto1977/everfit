/**
 * Push a cache invalidation to the storefront deployment.
 *
 * Before the admin panel was split into its own app, catalogue edits called
 * `revalidatePath("/product")` and friends directly — same Next.js cache. Now
 * the storefront is a separate deployment, so we call its /api/revalidate hook
 * with the shared REVALIDATE_SECRET instead.
 *
 * Best-effort by design: a price edit must not fail because the storefront is
 * briefly unreachable. Failures are logged, and the storefront still picks the
 * change up on its next scheduled revalidation.
 */

/** Storefront paths rendered from the product catalogue. */
export const CATALOG_PATHS = ["/", "/product", "/checkout"];

export async function revalidateStorefront(paths: string[] = CATALOG_PATHS) {
  const base = process.env.STORE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.REVALIDATE_SECRET;

  if (!base || !secret) {
    // Not configured (e.g. local dev without the storefront running) — the
    // admin write itself already succeeded, so stay quiet about it.
    return;
  }

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/revalidate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ paths }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[revalidate-store] storefront returned ${res.status}`);
    }
  } catch (err) {
    console.error("[revalidate-store] failed to reach the storefront", err);
  }
}
