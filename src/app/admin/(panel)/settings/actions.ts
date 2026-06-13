"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireOwner } from "@/lib/admin-auth";
import {
  changePassword,
  createAdminUser,
  listAdminUsers,
  setAdminUserActive,
  setAdminUserRole,
} from "@/lib/team";

type FormState = { error?: string; ok?: string } | undefined;

export async function addUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "owner" ? "owner" : "staff";

  if (!name || !email || password.length < 8) {
    return { error: "Name, email and a password of at least 8 characters are required." };
  }

  try {
    await createAdminUser({ name, email, password, role });
  } catch {
    return { error: "Couldn't create the account — is that email already in use?" };
  }
  revalidatePath("/admin/settings");
  return { ok: `${name} can now sign in with that email and password. Ask them to change it after first login.` };
}

export async function toggleActiveAction(formData: FormData) {
  const me = await requireOwner();
  const id = String(formData.get("id"));
  if (id === me.id) return; // can't lock yourself out
  await setAdminUserActive(id, formData.get("active") === "true");
  revalidatePath("/admin/settings");
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
  revalidatePath("/admin/settings");
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 8) return { error: "New password must be at least 8 characters." };

  const ok = await changePassword(me.id, current, next);
  return ok ? { ok: "Password updated." } : { error: "Current password didn't match." };
}
