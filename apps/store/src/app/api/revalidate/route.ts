import { revalidatePath } from "next/cache";

/**
 * On-demand revalidation hook for the admin panel.
 *
 * The admin panel is a separate deployment now, so a price or stock edit made
 * there can no longer call `revalidatePath` on this app's cache directly. It
 * POSTs here instead with the shared REVALIDATE_SECRET.
 *
 * Fails closed: without REVALIDATE_SECRET set, every request is rejected.
 * Only a fixed allow-list of storefront paths can be revalidated, so a leaked
 * secret can't be used to hammer arbitrary routes.
 */

export const dynamic = "force-dynamic";

/** Storefront routes whose content is derived from the product catalogue. */
const ALLOWED = new Set(["/", "/product", "/checkout"]);

function authorized(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let paths: unknown;
  try {
    ({ paths } = await req.json());
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  if (!Array.isArray(paths)) {
    return Response.json({ ok: false, error: "paths must be an array" }, { status: 400 });
  }

  const revalidated = paths.filter((p): p is string => typeof p === "string" && ALLOWED.has(p));
  for (const path of revalidated) revalidatePath(path);

  return Response.json({ ok: true, revalidated });
}
