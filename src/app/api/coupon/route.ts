import { NextResponse } from "next/server";
import { evaluateCoupon } from "@/lib/coupons";
import { getPurchasableVariant } from "@/lib/catalog";

/**
 * Live coupon check for the checkout UI. The amount is always derived from
 * the server-side variant price, never trusted from the client — the final
 * discount is recomputed again at /api/checkout.
 */
export async function POST(req: Request) {
  const { code, variant: variantKey } = await req.json();
  if (!code) return NextResponse.json({ error: "Enter a code." }, { status: 400 });

  const variant = await getPurchasableVariant(variantKey);
  if (!variant) return NextResponse.json({ error: "Product unavailable." }, { status: 400 });

  const result = await evaluateCoupon(String(code), variant.price);
  if ("error" in result) return NextResponse.json(result, { status: 400 });

  return NextResponse.json(result); // { discount, code }
}
