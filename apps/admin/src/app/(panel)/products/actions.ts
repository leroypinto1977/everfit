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
  // MRP is optional: blank clears it, which removes the struck-through price
  // (and the "Save …" / launch-discount lines) from the storefront.
  const mrpRaw = String(formData.get("mrp") ?? "").trim();
  const mrpRupees = mrpRaw === "" ? null : parseFloat(mrpRaw);
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const newStock = stockRaw === "" ? null : Math.max(0, parseInt(stockRaw, 10) || 0);
  // Cost (COGS) is optional: blank clears it back to "unknown"; 0 is a valid cost.
  const costRaw = String(formData.get("cost") ?? "").trim();
  const costRupees = costRaw === "" ? null : parseFloat(costRaw);

  await updateVariantAdmin(id, {
    ...(Number.isFinite(priceRupees) && priceRupees > 0 && { price: Math.round(priceRupees * 100) }),
    mrp: mrpRupees !== null && Number.isFinite(mrpRupees) && mrpRupees > 0 ? Math.round(mrpRupees * 100) : null,
    cost: costRupees !== null && Number.isFinite(costRupees) && costRupees >= 0 ? Math.round(costRupees * 100) : null,
    active: formData.get("active") === "on",
    blurb: String(formData.get("blurb") ?? "").trim(),
    // Name/weight are free text; ignore a blank submit rather than wiping the label.
    ...(String(formData.get("label") ?? "").trim() && { label: String(formData.get("label")).trim() }),
    ...(String(formData.get("weight") ?? "").trim() && { weight: String(formData.get("weight")).trim() }),
  });
  // route stock through the inventory ledger so the change is audited
  await setVariantStock(id, newStock, me.email);
  await refreshStorefront();
}

export async function updateProductAction(formData: FormData) {
  await requireOwner();
  // Blank clears the code, which falls the invoice back to the HSN_CODE env var.
  const hsn = String(formData.get("hsn") ?? "").trim();
  await updateProductAdmin(String(formData.get("id")), {
    name: String(formData.get("name") ?? "").trim() || undefined,
    active: formData.get("active") === "on",
    hsnCode: hsn || null,
  });
  await refreshStorefront();
}
