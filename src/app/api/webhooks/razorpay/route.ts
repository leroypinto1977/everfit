import { NextResponse } from "next/server";
import crypto from "crypto";
import { markPaid, markFailed, markRefundProcessed } from "@/lib/orders";
import { sendOrderNotifications } from "@/lib/notify";

/**
 * Razorpay server-to-server webhook — the authoritative "an order happened"
 * signal. Configure in Razorpay Dashboard → Settings → Webhooks:
 *   URL:    https://<your-domain>/api/webhooks/razorpay
 *   Secret: same value as RAZORPAY_WEBHOOK_SECRET
 *   Events: payment.captured, payment.failed
 *
 * This fires even if the customer closes the browser the instant payment
 * completes, so no paid order is ever lost. markPaid is transition-aware,
 * so if /api/verify already confirmed this payment, no duplicate emails.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);
  const payment = event.payload?.payment?.entity;

  if (event.event === "payment.captured" && payment) {
    const { order, transitioned } = await markPaid(payment.order_id, payment.id);
    if (order && transitioned) await sendOrderNotifications(order);
  }

  if (event.event === "payment.failed" && payment) {
    await markFailed(payment.order_id, payment.error_description ?? undefined);
  }

  // optional event — enable refund.processed in the Razorpay webhook config
  const refund = event.payload?.refund?.entity;
  if (event.event === "refund.processed" && refund) {
    await markRefundProcessed(refund.id);
  }

  return NextResponse.json({ received: true });
}
