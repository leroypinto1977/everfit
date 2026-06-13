"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/admin-auth";
import { createCoupon, setCouponActive } from "@/lib/coupons";

type FormState = { error?: string; ok?: string } | undefined;

export async function createCouponAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireOwner();

  const code = String(formData.get("code") ?? "").trim();
  const type = formData.get("type") === "flat" ? "flat" : "percent";
  const valueRaw = parseFloat(String(formData.get("value")));
  const minRaw = String(formData.get("minAmount") ?? "").trim();
  const maxRaw = String(formData.get("maxUses") ?? "").trim();
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();

  if (!code) return { error: "Code is required." };
  if (!Number.isFinite(valueRaw) || valueRaw <= 0) return { error: "Enter a discount value greater than zero." };
  if (type === "percent" && valueRaw > 100) return { error: "A percentage can't exceed 100." };

  try {
    await createCoupon({
      code,
      type,
      value: type === "percent" ? Math.round(valueRaw) : Math.round(valueRaw * 100),
      minAmount: minRaw ? Math.round(parseFloat(minRaw) * 100) : null,
      maxUses: maxRaw ? Math.max(1, parseInt(maxRaw, 10)) : null,
      expiresAt: expiresRaw ? new Date(`${expiresRaw}T23:59:59`) : null,
    });
  } catch {
    return { error: "Couldn't create that code — does it already exist?" };
  }
  revalidatePath("/admin/coupons");
  return { ok: `Code ${code.toUpperCase()} is live.` };
}

export async function toggleCouponAction(formData: FormData) {
  await requireOwner();
  await setCouponActive(String(formData.get("id")), formData.get("active") === "true");
  revalidatePath("/admin/coupons");
}
