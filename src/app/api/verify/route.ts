import { NextResponse } from "next/server";
import crypto from "crypto";
import { updateOrder } from "@/lib/orders";

/**
 * Called by the browser right after the Razorpay modal reports success.
 * Verifies the payment signature (HMAC of order_id|payment_id with the key
 * secret) so a forged "success" from the client can't mark an order paid.
 *
 * This gives the user instant confirmation; the webhook remains the
 * authoritative source (it fires even if the user closes the tab here).
 */
export async function POST(req: Request) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    await updateOrder(razorpay_order_id, { status: "failed" });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await updateOrder(razorpay_order_id, {
    status: "paid",
    paymentId: razorpay_payment_id,
    paidAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
