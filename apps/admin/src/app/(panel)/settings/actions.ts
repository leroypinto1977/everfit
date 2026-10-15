"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireOwner, signOutOtherSessions } from "@/lib/admin-auth";
import { changePassword } from "@/lib/team";
import {
  getSettings,
  senderAddress,
  SETTING_DEFS,
  SettingValidationError,
  setSetting,
  validateSetting,
  type SettingKey,
} from "@everfit/core/lib/settings";
import { emailProviderName, senderIsUsable, usableSenders } from "@everfit/core/lib/notify";
import { revalidateStorefront } from "@/lib/revalidate-store";

type FormState = { error?: string; ok?: string } | undefined;

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 8) return { error: "New password must be at least 8 characters." };

  const ok = await changePassword(me.id, current, next);
  if (!ok) return { error: "Current password didn't match." };
  await signOutOtherSessions(me.id);
  return { ok: "Password updated. You've been signed out everywhere else." };
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
   * A sender on a domain the email provider (Resend or Brevo) has not verified
   * does not "mostly work" — it is rejected or filed as spam, and nothing in the
   * app would report it. So the change is refused, but only on positive
   * evidence: if the provider cannot be
   * reached, or there is no API key to ask with, verifiedSenderDomains() returns
   * null and the save proceeds. A third party being briefly down must not block
   * the owner from editing their own settings.
   */
  const sender = changed.find((c) => c.key === "email_from");
  if (sender?.value) {
    const addr = senderAddress(sender.value);
    const usable = addr ? await senderIsUsable(addr) : null;
    if (usable === false) {
      const known = await usableSenders();
      const provider = emailProviderName();
      return {
        error:
          `${provider} will not send from "${addr}" — neither that address nor its domain is verified there, ` +
          `so mail would bounce or land in spam. Verify it in ${provider}, then save again.` +
          (known.length ? ` Currently usable: ${known.join(", ")}.` : ""),
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
