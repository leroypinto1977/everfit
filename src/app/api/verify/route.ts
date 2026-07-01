import { NextResponse } from "next/server";
import crypto from "crypto";
import { markPaid, markFailed } from "@/lib/orders";
import { fetchPaymentMethod } from "@/lib/razorpay";
import { sendLowStockAlert, sendOrderNotifications } from "@/lib/notify";

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

  if (expected !== razorpay_signature) {
    await markFailed(razorpay_order_id, "Signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const method = await fetchPaymentMethod(razorpay_payment_id);
  const { order, transitioned, lowStock } = await markPaid(razorpay_order_id, razorpay_payment_id, method);
  if (order && transitioned) {
    await sendOrderNotifications(order);
    await sendLowStockAlert(lowStock);
  }

  return NextResponse.json({ ok: true });
}
