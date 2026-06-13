"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import {
  createPasswordReset,
  createSession,
  isValidSetupKey,
  loginRateLimited,
  needsSetup,
  resetPasswordWithToken,
  verifyPassword,
} from "@/lib/admin-auth";
import { createAdminUser } from "@/lib/team";
import { sendPasswordResetEmail } from "@/lib/notify";
import { siteUrl } from "@/lib/email/render";

type FormState = { error?: string } | undefined;
type ResetState = { error?: string; ok?: boolean } | undefined;

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

/** Request a reset link. Always reports success — never reveals if the email exists. */
export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  if (!email) return { error: "Enter your email." };
  if (loginRateLimited(`reset:${email}`)) {
    return { error: "Too many requests — wait a minute and try again." };
  }

  const reset = await createPasswordReset(email);
  if (reset) {
    await sendPasswordResetEmail({
      name: reset.user.name,
      email: reset.user.email,
      resetUrl: siteUrl(`/admin/reset?token=${reset.token}`),
    });
  }
  // ok regardless of whether the account exists — no email enumeration
  return { ok: true };
}

/** Set a new password from a valid reset token, then send to sign-in. */
export async function resetPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Those passwords don't match." };

  const ok = await resetPasswordWithToken(token, password);
  if (!ok) return { error: "This reset link is invalid or has expired. Request a new one." };
  redirect("/admin/login?reset=1");
}
