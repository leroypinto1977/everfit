"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { updateCustomerNotes } from "@/lib/customers";

export async function saveNotesAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await updateCustomerNotes(id, String(formData.get("notes") ?? "").trim());
  revalidatePath(`/admin/customers/${id}`);
}
