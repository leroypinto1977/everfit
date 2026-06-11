"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { updateOrder } from "@/lib/orders";

export async function markShipped(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const tracking = String(formData.get("tracking") ?? "").trim();
  await updateOrder(id, { status: "shipped", ...(tracking && { tracking }) });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function markDelivered(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await updateOrder(id, { status: "delivered" });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
