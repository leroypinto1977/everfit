"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/admin-auth";
import { revalidateStorefront } from "@/lib/revalidate-store";
import { updateProductAdmin, updateVariantAdmin } from "@everfit/core/lib/catalog";
import { setVariantStock } from "@everfit/core/lib/inventory";

/**
 * Price/stock edits go live immediately: refresh this panel's own pages, then
 * push an invalidation across to the storefront deployment (separate app, so
 * its cache can't be touched directly).
 */
async function refreshStorefront() {
  revalidatePath("/products");
  revalidatePath("/inventory");
  await revalidateStorefront();
}

export async function updateVariantAction(formData: FormData) {
  const me = await requireOwner();
  const id = String(formData.get("id"));

  const priceRupees = parseFloat(String(formData.get("price")));
  const mrpRupees = parseFloat(String(formData.get("mrp")));
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const newStock = stockRaw === "" ? null : Math.max(0, parseInt(stockRaw, 10) || 0);
  // Cost (COGS) is optional: blank clears it back to "unknown"; 0 is a valid cost.
  const costRaw = String(formData.get("cost") ?? "").trim();
  const costRupees = costRaw === "" ? null : parseFloat(costRaw);

  await updateVariantAdmin(id, {
    ...(Number.isFinite(priceRupees) && priceRupees > 0 && { price: Math.round(priceRupees * 100) }),
    ...(Number.isFinite(mrpRupees) && mrpRupees > 0 && { mrp: Math.round(mrpRupees * 100) }),
    cost: costRupees !== null && Number.isFinite(costRupees) && costRupees >= 0 ? Math.round(costRupees * 100) : null,
    active: formData.get("active") === "on",
    blurb: String(formData.get("blurb") ?? "").trim(),
  });
  // route stock through the inventory ledger so the change is audited
  await setVariantStock(id, newStock, me.email);
  await refreshStorefront();
}

export async function updateProductAction(formData: FormData) {
  await requireOwner();
  await updateProductAdmin(String(formData.get("id")), {
    name: String(formData.get("name") ?? "").trim() || undefined,
    active: formData.get("active") === "on",
  });
  await refreshStorefront();
}
