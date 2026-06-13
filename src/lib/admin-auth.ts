import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { and, count, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminSessions, adminUsers, passwordResets } from "@/db/schema";

/**
 * Per-user admin auth, self-hosted:
 * - passwords stored as scrypt hashes (salt$hash, N=16384 via Node defaults)
 * - sessions are random 256-bit tokens in an httpOnly cookie; only the
 *   SHA-256 of the token is stored server-side, so a DB leak can't be
 *   replayed as a session
 * - the first account (owner) is created from the login page using
 *   ADMIN_KEY as a one-time setup secret; after that ADMIN_KEY is inert
 */

const COOKIE = "evherfit_admin";
const SESSION_DAYS = 7;

export type AdminRole = "owner" | "staff";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

/* ---------- passwords ---------- */

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split("$");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

/* ---------- login rate limiting (per instance, good enough for a small team) ---------- */

const attempts = new Map<string, { n: number; resetAt: number }>();

export function loginRateLimited(email: string) {
  const now = Date.now();
  const entry = attempts.get(email);
  if (!entry || entry.resetAt < now) {
    attempts.set(email, { n: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.n += 1;
  return entry.n > 5;
}

/* ---------- sessions ---------- */

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db().insert(adminSessions).values({ tokenHash: sha256(token), userId, expiresAt });

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/admin",
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await db().delete(adminSessions).where(eq(adminSessions.tokenHash, sha256(token)));
  }
  store.delete(COOKIE);
}

/** The signed-in admin, or null. */
export async function getAdminUser(): Promise<AdminUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  const rows = await db()
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      active: adminUsers.active,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
    .where(and(eq(adminSessions.tokenHash, sha256(token)), gt(adminSessions.expiresAt, new Date())))
    .limit(1);

  const u = rows[0];
  if (!u?.active) return null;
  return { id: u.id, email: u.email, name: u.name, role: u.role as AdminRole };
}

/** Call at the top of every admin page/action. Returns the signed-in user. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** For destructive/financial actions: products, refunds, team, exports. */
export async function requireOwner(): Promise<AdminUser> {
  const user = await requireAdmin();
  if (user.role !== "owner") redirect("/admin");
  return user;
}

/* ---------- first-run setup ---------- */

/** True until the first admin account exists. */
export async function needsSetup() {
  const [row] = await db().select({ n: count() }).from(adminUsers);
  return row.n === 0;
}

/** ADMIN_KEY doubles as the one-time setup secret for creating the owner. */
export function isValidSetupKey(key: string) {
  const expected = process.env.ADMIN_KEY;
  if (!expected || !key) return false;
  const a = Buffer.from(sha256(key));
  const b = Buffer.from(sha256(expected));
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ---------- password reset ---------- */

const RESET_TTL_MIN = 60;

/**
 * Issue a reset token for an active account. Returns the raw token + user
 * (only the hash is stored). Returns null when no active account matches —
 * the caller must still respond neutrally so emails can't be enumerated.
 */
export async function createPasswordReset(email: string) {
  const rows = await db()
    .select({ id: adminUsers.id, name: adminUsers.name, active: adminUsers.active })
    .from(adminUsers)
    .where(eq(adminUsers.email, email.toLowerCase().trim()))
    .limit(1);
  const user = rows[0];
  if (!user || !user.active) return null;

  const token = randomBytes(32).toString("hex");
  await db().insert(passwordResets).values({
    tokenHash: sha256(token),
    userId: user.id,
    expiresAt: new Date(Date.now() + RESET_TTL_MIN * 60 * 1000),
  });
  return { token, user: { id: user.id, name: user.name, email } };
}

/** True if the token is known and unexpired. */
export async function isValidResetToken(token: string) {
  if (!token) return false;
  const rows = await db()
    .select({ userId: passwordResets.userId })
    .from(passwordResets)
    .where(and(eq(passwordResets.tokenHash, sha256(token)), gt(passwordResets.expiresAt, new Date())))
    .limit(1);
  return rows.length > 0;
}

/**
 * Consume a reset token and set the new password. Single-use: the token (and
 * every live session for that user) is destroyed, forcing a fresh sign-in.
 */
export async function resetPasswordWithToken(token: string, newPassword: string) {
  if (!token || newPassword.length < 8) return false;
  const rows = await db()
    .select({ userId: passwordResets.userId })
    .from(passwordResets)
    .where(and(eq(passwordResets.tokenHash, sha256(token)), gt(passwordResets.expiresAt, new Date())))
    .limit(1);
  const userId = rows[0]?.userId;
  if (!userId) return false;

  await db().update(adminUsers).set({ passwordHash: hashPassword(newPassword) }).where(eq(adminUsers.id, userId));
  await db().delete(passwordResets).where(eq(passwordResets.userId, userId));
  await db().delete(adminSessions).where(eq(adminSessions.userId, userId));
  return true;
}
