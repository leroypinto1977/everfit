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
import { sendTeammateWelcome } from "@everfit/core/lib/notify";
import {
  getSettings,
  senderDomain,
  SETTING_DEFS,
  SettingValidationError,
  setSetting,
  validateSetting,
  type SettingKey,
} from "@everfit/core/lib/settings";
import { verifiedSenderDomains } from "@everfit/core/lib/notify";
import { revalidateStorefront } from "@/lib/revalidate-store";

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
  await sendTeammateWelcome({ name, email, role: role === "owner" ? "Owner" : "Staff" });
  revalidatePath("/settings");
  return { ok: `${name} can now sign in with that email and password. Ask them to change it after first login.` };
}

export async function toggleActiveAction(formData: FormData) {
  const me = await requireOwner();
  const id = String(formData.get("id"));
  if (id === me.id) return; // can't lock yourself out
  await setAdminUserActive(id, formData.get("active") === "true");
  revalidatePath("/settings");
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
  revalidatePath("/settings");
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 8) return { error: "New password must be at least 8 characters." };

  const ok = await changePassword(me.id, current, next);
  return ok ? { ok: "Password updated." } : { error: "Current password didn't match." };
}

/**
 * Save the owner-editable store settings. Writes only the keys that actually
 * changed, so an unrelated edit does not stamp every row with a new author.
 *
 * Validation is all-or-nothing: a bad GSTIN rejects the whole submission rather
 * than saving half a form, which would leave the invoice in a state the owner
 * did not choose.
 */
export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireOwner();
  const current = await getSettings();

  // Validate everything before writing anything. Saving half a form would leave
  // the invoice in a state the owner never chose.
  const clean: { key: SettingKey; value: string }[] = [];
  try {
    for (const def of SETTING_DEFS) {
      const raw = formData.get(def.key);
      if (raw === null) continue; // field absent from this form
      clean.push({ key: def.key, value: validateSetting(def.key, String(raw)) });
    }
  } catch (err) {
    if (err instanceof SettingValidationError) return { error: err.message };
    throw err;
  }

  // Write only what actually changed, so an unrelated edit does not stamp every
  // row with a new author — and so a value still coming from the environment is
  // not needlessly copied into the database.
  const changed = clean.filter(({ key, value }) => value !== current[key]);
  if (!changed.length) return { ok: "No changes to save." };

  /*
   * A sender on a domain Brevo has not authenticated does not "mostly work" —
   * it is rejected or filed as spam, and nothing in the app would report it.
   * So the change is refused, but only on positive evidence: if Brevo cannot be
   * reached, or there is no API key to ask with, verifiedSenderDomains() returns
   * null and the save proceeds. A third party being briefly down must not block
   * the owner from editing their own settings.
   */
  const sender = changed.find((c) => c.key === "email_from");
  if (sender?.value) {
    const domain = senderDomain(sender.value);
    const verified = await verifiedSenderDomains();
    if (domain && verified && !verified.includes(domain)) {
      return {
        error:
          `Brevo has not authenticated "${domain}", so mail from that address would bounce or land in spam. ` +
          `Add and verify the domain in Brevo (Senders, Domains & Dedicated IPs → Domains), then save again.` +
          (verified.length ? ` Verified right now: ${verified.join(", ")}.` : ""),
      };
    }
  }

  try {
    for (const { key, value } of changed) await setSetting(key, value, me.email);
  } catch (err) {
    console.error("[settings] save failed", err);
    return { error: "Couldn't save those settings — please try again." };
  }

  revalidatePath("/settings");
  // The support address reaches storefront-rendered copy; best-effort, and the
  // admin write has already succeeded either way.
  await revalidateStorefront();

  return { ok: `Saved ${changed.length} change${changed.length === 1 ? "" : "s"}.` };
}
