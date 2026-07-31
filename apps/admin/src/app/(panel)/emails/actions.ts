"use server";

import { requireOwner } from "@/lib/admin-auth";
import { emailPreviews } from "@everfit/core/lib/email/samples";
import { sendTestEmail } from "@everfit/core/lib/notify";

export type TestSendResult = { ok?: string; error?: string } | undefined;

/** Owner-only: send one sample template to a real inbox to verify Brevo. */
export async function sendTestEmailAction(
  _prev: TestSendResult,
  formData: FormData
): Promise<TestSendResult> {
  await requireOwner();

  const to = String(formData.get("to") ?? "").trim();
  const key = String(formData.get("template") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { error: "Enter a valid email address." };
  }

  const preview = emailPreviews().find((p) => p.key === key);
  if (!preview) return { error: "Unknown template." };

  const result = await sendTestEmail(to, preview.email);
  if (result.error) return { error: result.error };
  return { ok: `Test "${preview.email.subject}" sent to ${to} — check the inbox (and spam folder).` };
}
