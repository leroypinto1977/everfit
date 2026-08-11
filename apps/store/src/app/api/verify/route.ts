import { NextResponse } from "next/server";
import crypto from "crypto";
import { markPaid } from "@everfit/core/lib/orders";
import { fetchPaymentInfo } from "@everfit/core/lib/razorpay";
import { sendLowStockAlert, sendOrderNotifications } from "@everfit/core/lib/notify";

/** Constant-time compare of two hex-encoded HMACs (length-safe). */
function hmacMatches(expected: string, received: string): boolean {
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(received ?? "", "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Called by the browser right after the Razorpay modal reports success.
 * Verifies the payment signature (HMAC of order_id|payment_id with the key
 * secret) so a forged "success" from the client can't mark an order paid.
 *
 * This gives the user instant confirmation; the webhook remains the
 * authoritative source (it fires even if the user closes the tab here).
 * markPaid is transition-aware, so whichever of the two arrives first
 * sends the notification emails — never both.
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

  // Do NOT mutate order state here: the order id is client-visible, so a forged
  // request must not be able to flip a genuine order to "failed" (which would
  // also remove it from the reconcile cron's `created`-only safety sweep).
  if (!hmacMatches(expected, razorpay_signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { method, fee } = await fetchPaymentInfo(razorpay_payment_id);
  const { order, transitioned, lowStock } = await markPaid(razorpay_order_id, razorpay_payment_id, method, fee);
  if (order && transitioned) {
    await sendOrderNotifications(order);
    await sendLowStockAlert(lowStock);
  }

  return NextResponse.json({ ok: true });
}
