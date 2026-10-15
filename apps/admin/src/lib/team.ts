import { desc, eq } from "drizzle-orm";
import { db } from "@everfit/core/db";
import { adminSessions, adminUsers } from "@everfit/core/db/schema";
import { hashPassword, verifyPassword, type AdminRole } from "./admin-auth";
import type { ScreenKey } from "./screens";

/** Admin team management — owner-only operations (enforced in the actions). */

export async function listAdminUsers() {
  return db()
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      screens: adminUsers.screens,
      active: adminUsers.active,
      mustChangePassword: adminUsers.mustChangePassword,
      createdAt: adminUsers.createdAt,
      lastLoginAt: adminUsers.lastLoginAt,
    })
    .from(adminUsers)
    .orderBy(desc(adminUsers.createdAt));
}

export async function createAdminUser(input: {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  screens?: ScreenKey[]; // staff only; owners see every screen
  mustChangePassword?: boolean; // true when an owner chose the password for them
}) {
  const [user] = await db()
    .insert(adminUsers)
    .values({
      name: input.name,
      email: input.email.toLowerCase().trim(),
      role: input.role,
      screens: input.screens ?? [],
      passwordHash: hashPassword(input.password),
      mustChangePassword: input.mustChangePassword ?? false,
    })
    .returning({ id: adminUsers.id });
  return user;
}

/** Deactivating also kills every live session for that user. */
export async function setAdminUserActive(id: string, active: boolean) {
  await db().update(adminUsers).set({ active }).where(eq(adminUsers.id, id));
  if (!active) await db().delete(adminSessions).where(eq(adminSessions.userId, id));
}

export async function setAdminUserRole(id: string, role: AdminRole) {
  await db().update(adminUsers).set({ role }).where(eq(adminUsers.id, id));
}

export async function setAdminUserScreens(id: string, screens: ScreenKey[]) {
  await db().update(adminUsers).set({ screens }).where(eq(adminUsers.id, id));
}

/** The caller signs out the user's other sessions once this returns true. */
export async function changePassword(userId: string, current: string, next: string) {
  const rows = await db().select().from(adminUsers).where(eq(adminUsers.id, userId)).limit(1);
  if (!rows[0] || !verifyPassword(current, rows[0].passwordHash)) return false;
  await setOwnPassword(userId, next);
  return true;
}

/** The user chose this password themselves, so the owner-set-password hold lifts. */
export async function setOwnPassword(userId: string, password: string) {
  await db()
    .update(adminUsers)
    .set({ passwordHash: hashPassword(password), mustChangePassword: false })
    .where(eq(adminUsers.id, userId));
}

