"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/admin-auth";
import { updateProductAdmin, updateVariantAdmin } from "@/lib/catalog";

/** Price/stock edits go live on the storefront immediately via revalidation. */
function refreshStorefront() {
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/product");
  revalidatePath("/checkout");
}

export async function updateVariantAction(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("id"));

  const priceRupees = parseFloat(String(formData.get("price")));
  const mrpRupees = parseFloat(String(formData.get("mrp")));
  const stockRaw = String(formData.get("stock") ?? "").trim();

  await updateVariantAdmin(id, {
    ...(Number.isFinite(priceRupees) && priceRupees > 0 && { price: Math.round(priceRupees * 100) }),
    ...(Number.isFinite(mrpRupees) && mrpRupees > 0 && { mrp: Math.round(mrpRupees * 100) }),
    stock: stockRaw === "" ? null : Math.max(0, parseInt(stockRaw, 10) || 0),
    active: formData.get("active") === "on",
    blurb: String(formData.get("blurb") ?? "").trim(),
  });
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
