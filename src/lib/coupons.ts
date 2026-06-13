import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { coupons } from "@/db/schema";

/**
 * Discount codes. The discount is always computed server-side from the
 * stored coupon (checkout never trusts a client-sent amount). Usage is
 * counted at payment time via redeemCoupon, not when the order is created,
 * so abandoned checkouts don't burn a limited-use code.
 */

export type CouponType = "percent" | "flat";

export interface AppliedCoupon {
  code: string;
  discount: number; // paise taken off
}

function normalize(code: string) {
  return code.trim().toUpperCase();
}

/**
 * Validate a code against an order subtotal (paise) and return the discount,
 * or an error string. Discount never exceeds the subtotal.
 */
export async function evaluateCoupon(
  rawCode: string,
  subtotal: number
): Promise<{ discount: number; code: string } | { error: string }> {
  const code = normalize(rawCode);
  if (!code) return { error: "Enter a code." };

  const rows = await db().select().from(coupons).where(eq(coupons.code, code)).limit(1);
  const c = rows[0];
  if (!c || !c.active) return { error: "That code isn't valid." };
  if (c.expiresAt && c.expiresAt.getTime() < Date.now()) return { error: "That code has expired." };
  if (c.maxUses !== null && c.usedCount >= c.maxUses) return { error: "That code has been fully redeemed." };
  if (c.minAmount !== null && subtotal < c.minAmount) {
    return { error: `Spend at least ₹${(c.minAmount / 100).toLocaleString("en-IN")} to use this code.` };
  }

  const raw = c.type === "percent" ? Math.round((subtotal * c.value) / 100) : c.value;
  const discount = Math.min(raw, subtotal);
  if (discount <= 0) return { error: "That code doesn't apply here." };
  return { discount, code: c.code };
}

/**
 * Atomically increment usage, respecting max_uses. Returns false if the code
 * was exhausted in the race between checkout and payment — the caller keeps
 * the order paid regardless (the discount was already honoured at checkout).
 */
export async function redeemCoupon(rawCode: string) {
  const code = normalize(rawCode);
  if (!code) return false;
  const rows = await db()
    .update(coupons)
    .set({ usedCount: sql`${coupons.usedCount} + 1` })
    .where(
      and(
        eq(coupons.code, code),
        sql`(${coupons.maxUses} IS NULL OR ${coupons.usedCount} < ${coupons.maxUses})`
      )
    )
    .returning({ id: coupons.id });
  return rows.length > 0;
}

/* ---------- admin ---------- */

export async function listCoupons() {
  return db().select().from(coupons).orderBy(desc(coupons.createdAt));
}

export async function createCoupon(input: {
  code: string;
  type: CouponType;
  value: number; // percent or paise
  minAmount?: number | null;
  maxUses?: number | null;
  expiresAt?: Date | null;
}) {
  await db()
    .insert(coupons)
    .values({
      code: normalize(input.code),
      type: input.type,
      value: input.value,
      minAmount: input.minAmount ?? null,
      maxUses: input.maxUses ?? null,
      expiresAt: input.expiresAt ?? null,
    });
}

export async function setCouponActive(id: string, active: boolean) {
  await db().update(coupons).set({ active }).where(eq(coupons.id, id));
}
