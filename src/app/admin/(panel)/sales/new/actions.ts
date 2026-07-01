"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/admin-auth";
import { recordManualSale } from "@/lib/orders";
import { getPurchasableVariant } from "@/lib/catalog";

export type ManualSaleState = { error?: string };

const METHODS = new Set(["cash", "upi", "card", "bank", "other"]);

export async function recordManualSaleAction(
  _prev: ManualSaleState,
  formData: FormData
): Promise<ManualSaleState> {
  const me = await requireOwner();

  const variantKey = String(formData.get("variantKey") ?? "").trim();
  if (!variantKey) return { error: "Pick a product." };

  const qty = Math.max(1, parseInt(String(formData.get("qty") ?? "1"), 10) || 1);
  const paymentMethod = String(formData.get("paymentMethod") ?? "cash");
  if (!METHODS.has(paymentMethod)) return { error: "Pick a valid payment method." };

  const amountRupees = parseFloat(String(formData.get("amount") ?? ""));
  let amount: number;
  if (Number.isFinite(amountRupees) && amountRupees > 0) {
    amount = Math.round(amountRupees * 100);
  } else {
    const v = await getPurchasableVariant(variantKey);
    if (!v) return { error: "That product no longer exists." };
    amount = v.price * qty;
  }

  const dateStr = String(formData.get("paidAt") ?? "").trim();
  const paidAt = dateStr ? new Date(`${dateStr}T12:00:00`) : undefined;
  if (paidAt && isNaN(paidAt.getTime())) return { error: "Invalid date." };

  try {
    await recordManualSale({
      variantKey,
      qty,
      amount,
      paymentMethod,
      customerName: String(formData.get("customerName") ?? "").trim() || undefined,
      customerPhone: String(formData.get("customerPhone") ?? "").trim() || undefined,
      note: String(formData.get("note") ?? "").trim() || undefined,
      paidAt,
      actor: me.email,
    });
  } catch (err) {
    console.error("Manual sale failed", err);
    return { error: "Couldn't record the sale. Please try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/revenue");
  revalidatePath("/admin/inventory");
  redirect("/admin/orders");
}
