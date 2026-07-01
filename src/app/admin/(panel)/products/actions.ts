"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/admin-auth";
import { updateProductAdmin, updateVariantAdmin } from "@/lib/catalog";
import { setVariantStock } from "@/lib/inventory";

/** Price/stock edits go live on the storefront immediately via revalidation. */
function refreshStorefront() {
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/");
  revalidatePath("/product");
  revalidatePath("/checkout");
}

export async function updateVariantAction(formData: FormData) {
  const me = await requireOwner();
  const id = String(formData.get("id"));

  const priceRupees = parseFloat(String(formData.get("price")));
  const mrpRupees = parseFloat(String(formData.get("mrp")));
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const newStock = stockRaw === "" ? null : Math.max(0, parseInt(stockRaw, 10) || 0);

  await updateVariantAdmin(id, {
    ...(Number.isFinite(priceRupees) && priceRupees > 0 && { price: Math.round(priceRupees * 100) }),
    ...(Number.isFinite(mrpRupees) && mrpRupees > 0 && { mrp: Math.round(mrpRupees * 100) }),
    active: formData.get("active") === "on",
    blurb: String(formData.get("blurb") ?? "").trim(),
  });
  // route stock through the inventory ledger so the change is audited
  await setVariantStock(id, newStock, me.email);
  refreshStorefront();
}

export async function updateProductAction(formData: FormData) {
  await requireOwner();
  await updateProductAdmin(String(formData.get("id")), {
    name: String(formData.get("name") ?? "").trim() || undefined,
    active: formData.get("active") === "on",
  });
  refreshStorefront();
}
