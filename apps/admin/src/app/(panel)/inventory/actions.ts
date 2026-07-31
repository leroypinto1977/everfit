"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/admin-auth";
import { revalidateStorefront } from "@/lib/revalidate-store";
import { applyStockDelta } from "@everfit/core/lib/inventory";

/** Apply a signed stock change (positive = add, negative = subtract). */
export async function adjustStockAction(formData: FormData) {
  const me = await requireOwner();

  const variantId = String(formData.get("variantId") ?? "").trim();
  const delta = parseInt(String(formData.get("delta") ?? "0"), 10);
  const reason = String(formData.get("reason") ?? "adjustment") === "restock" ? "restock" : "adjustment";
  const note = String(formData.get("note") ?? "").trim() || undefined;

  if (!variantId || !Number.isFinite(delta) || delta === 0) return;

  await applyStockDelta(variantId, delta, { reason, note, actor: me.email });

  revalidatePath("/inventory");
  revalidatePath("/products");
  revalidatePath("/");
  await revalidateStorefront();
}
