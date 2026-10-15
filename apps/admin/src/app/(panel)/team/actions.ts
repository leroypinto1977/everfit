"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/admin-auth";
import {
  createAdminUser,
  listAdminUsers,
  resetAdminUserPassword,
  setAdminUserActive,
  setAdminUserRole,
  setAdminUserScreens,
} from "@/lib/team";
import { isScreenKey } from "@/lib/screens";
import { sendTeammateWelcome } from "@everfit/core/lib/notify";

type FormState = { error?: string; ok?: string } | undefined;

export async function addUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "owner" ? "owner" : "staff";
  const screens = formData.getAll("screens").filter(isScreenKey);

  if (!name || !email || password.length < 8) {
    return { error: "Name, email and a password of at least 8 characters are required." };
  }

  try {
    await createAdminUser({ name, email, password, role, screens, mustChangePassword: true });
  } catch {
    return { error: "Couldn't create the account — is that email already in use?" };
  }
  await sendTeammateWelcome({ name, email, role: role === "owner" ? "Owner" : "Staff" });
  revalidatePath("/team");
  return { ok: `${name} can now sign in with that email and password, and will be asked to choose their own.` };
}

export async function toggleActiveAction(formData: FormData) {
  const me = await requireOwner();
  const id = String(formData.get("id"));
  if (id === me.id) return; // can't lock yourself out
  await setAdminUserActive(id, formData.get("active") === "true");
  revalidatePath("/team");
}

export async function setRoleAction(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("id"));
  const role = formData.get("role") === "owner" ? "owner" : "staff";

  // never demote the last owner (including yourself)
  if (role === "staff") {
    const team = await listAdminUsers();
    const owners = team.filter((u) => u.role === "owner" && u.active);
    if (owners.length === 1 && owners[0].id === id) return;
  }
  await setAdminUserRole(id, role);
  revalidatePath("/team");
}

/** Which screens a staff member may open. Owners see everything, so this only matters for staff. */
export async function setScreensAction(formData: FormData) {
  await requireOwner();
  await setAdminUserScreens(String(formData.get("id")), formData.getAll("screens").filter(isScreenKey));
  revalidatePath("/team");
}

/**
 * An owner sets a temporary password for a team member, who is signed out
 * everywhere and must choose their own at next sign-in. Not for your own row:
 * use Change password in Settings, so nobody locks themselves out.
 */
export async function resetUserPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");
  if (id === me.id) return { error: "Use Change password in Settings for your own account." };
  if (password.length < 8) return { error: "The temporary password must be at least 8 characters." };

  const user = (await listAdminUsers()).find((u) => u.id === id);
  if (!user) return { error: "That team member no longer exists." };

  await resetAdminUserPassword(id, password);
  revalidatePath("/team");
  return { ok: `Signed ${user.name} out. They choose a new password after signing in with this one.` };
}
