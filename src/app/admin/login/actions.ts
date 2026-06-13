"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import {
  createSession,
  isValidSetupKey,
  loginRateLimited,
  needsSetup,
  verifyPassword,
} from "@/lib/admin-auth";
import { createAdminUser } from "@/lib/team";

type FormState = { error?: string } | undefined;

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  if (loginRateLimited(email)) {
    return { error: "Too many attempts — wait a minute and try again." };
  }

  const rows = await db().select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  const user = rows[0];
  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    return { error: "That email and password didn't match." };
  }

  await db().update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
  await createSession(user.id);
  redirect("/admin");
}

/** One-time owner creation, gated by ADMIN_KEY. Disabled once any admin exists. */
export async function setupOwner(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await needsSetup())) return { error: "Setup is already complete — sign in instead." };

  const key = String(formData.get("key") ?? "");
  if (!isValidSetupKey(key)) {
    return { error: "Setup key didn't match ADMIN_KEY. Check your environment config." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  if (!name || !email || password.length < 8) {
    return { error: "Name, email and a password of at least 8 characters are required." };
  }

  const user = await createAdminUser({ name, email, password, role: "owner" });
  await createSession(user.id);
  redirect("/admin");
}
