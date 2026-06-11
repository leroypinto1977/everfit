import { NextResponse } from "next/server";
import crypto from "crypto";
import { updateOrder } from "@/lib/orders";

/**
 * Razorpay server-to-server webhook — the authoritative "an order happened"
 * signal. Configure in Razorpay Dashboard → Settings → Webhooks:
 *   URL:    https://<your-domain>/api/webhooks/razorpay
 *   Secret: same value as RAZORPAY_WEBHOOK_SECRET
 *   Events: payment.captured, payment.failed
 *
 * This fires even if the customer closes the browser the instant payment
 * completes, so no paid order is ever lost. This is also the place to
 * trigger order-confirmation email/WhatsApp to the customer and the client.
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
    await updateOrder(payment.order_id, {
      status: "paid",
      paymentId: payment.id,
      paidAt: new Date().toISOString(),
    });
    // TODO: send confirmation email (Resend/SES) + notify client (email/WhatsApp)
  }

  if (event.event === "payment.failed" && payment) {
    await updateOrder(payment.order_id, { status: "failed" });
  }

  return NextResponse.json({ received: true });
}
