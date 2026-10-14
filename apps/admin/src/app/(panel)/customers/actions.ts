"use server";

import { revalidatePath } from "next/cache";
import { requireScreen } from "@/lib/admin-auth";
import { updateCustomerNotes } from "@everfit/core/lib/customers";

export async function saveNotesAction(formData: FormData) {
  await requireScreen("customers");
  const id = String(formData.get("id"));
  await updateCustomerNotes(id, String(formData.get("notes") ?? "").trim());
  revalidatePath(`/customers/${id}`);
}
