import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Single-admin auth: the client logs in with ADMIN_KEY once; we store a
 * SHA-256 hash of it in an httpOnly cookie so the raw key never lives in
 * the browser. Swap for a real auth provider if more admins are needed.
 */
const COOKIE = "evherfit_admin";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function isValidKey(key: string) {
  const expected = process.env.ADMIN_KEY;
  if (!expected || !key) return false;
  const a = Buffer.from(hash(key));
  const b = Buffer.from(hash(expected));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createSession() {
  const store = await cookies();
  store.set(COOKIE, hash(process.env.ADMIN_KEY!), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/admin",
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function hasSession() {
  const store = await cookies();
  const value = store.get(COOKIE)?.value;
  return Boolean(process.env.ADMIN_KEY && value === hash(process.env.ADMIN_KEY));
}

/** Call at the top of every admin page/action. */
export async function requireAdmin() {
  if (!(await hasSession())) redirect("/admin/login");
}
