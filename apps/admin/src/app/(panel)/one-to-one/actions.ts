"use server";

import { revalidatePath } from "next/cache";
import { requireScreen } from "@/lib/admin-auth";
import { isLeadStatus, updateLeadFollowUp } from "@everfit/core/lib/leads";
import { isLeadTemperature } from "@everfit/core/lib/lead-score";

export async function saveFollowUpAction(formData: FormData) {
  const admin = await requireScreen("one-to-one");
  const status = formData.get("status");
  if (!isLeadStatus(status)) return;
  const temperature = formData.get("temperature");
  const summary = String(formData.get("summary") ?? "").trim().slice(0, 5000);
  await updateLeadFollowUp(
    String(formData.get("id")),
    status,
    isLeadTemperature(temperature) ? temperature : null,
    summary,
    admin.name || admin.email
  );
  revalidatePath("/one-to-one");
}
