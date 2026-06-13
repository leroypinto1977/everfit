import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminSessions, adminUsers } from "@/db/schema";
import { hashPassword, verifyPassword, type AdminRole } from "./admin-auth";

/** Admin team management — owner-only operations (enforced in the actions). */

export async function listAdminUsers() {
  return db()
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      active: adminUsers.active,
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
}) {
  const [user] = await db()
    .insert(adminUsers)
    .values({
      name: input.name,
      email: input.email.toLowerCase().trim(),
      role: input.role,
      passwordHash: hashPassword(input.password),
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

export async function changePassword(userId: string, current: string, next: string) {
  const rows = await db().select().from(adminUsers).where(eq(adminUsers.id, userId)).limit(1);
  if (!rows[0] || !verifyPassword(current, rows[0].passwordHash)) return false;
  await db().update(adminUsers).set({ passwordHash: hashPassword(next) }).where(eq(adminUsers.id, userId));
  return true;
}
