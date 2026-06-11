import { Resend } from "resend";
import type { Order } from "./orders";

/**
 * Order notifications via Resend — entirely optional: without
 * RESEND_API_KEY this is a no-op, so dev and demo environments work
 * without email setup. Failures are logged, never thrown: a missed
 * email must not fail a payment confirmation.
 */

const FROM = process.env.EMAIL_FROM ?? "EVHERFIT <onboarding@resend.dev>";

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export async function sendOrderNotifications(order: Order) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const c = order.customer;
  const shipTo = `${c.address}, ${c.city}, ${c.state} — ${c.pincode}`;

  const tasks = [
    resend.emails.send({
      from: FROM,
      to: c.email,
      subject: "Your EVHERFIT Pulse is confirmed 🎉",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1c2030">
          <h1 style="color:#2b337d;font-style:italic">EVHERFIT</h1>
          <h2>Order confirmed — be the woman.</h2>
          <p>Hi ${c.name}, thanks for your order! Your EVHERFIT Pulse ships within 24 hours;
          we'll email tracking details once it's on the way.</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0">
            <tr><td style="padding:8px 0;color:#6b7194">Order</td><td align="right"><code>${order.id}</code></td></tr>
            <tr><td style="padding:8px 0;color:#6b7194">Amount</td><td align="right"><strong>${inr(order.amount)}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#6b7194">Ship to</td><td align="right">${shipTo}</td></tr>
          </table>
          <p style="color:#6b7194;font-size:13px">Questions? Just reply to this email.</p>
        </div>`,
    }),
  ];

  const notifyTo = process.env.ORDER_NOTIFY_EMAIL;
  if (notifyTo) {
    tasks.push(
      resend.emails.send({
        from: FROM,
        to: notifyTo,
        subject: `New order ${inr(order.amount)} — ${c.name} (${c.city})`,
        html: `
          <div style="font-family:sans-serif;color:#1c2030">
            <h2>New EVHERFIT Pulse order</h2>
            <p><strong>${c.name}</strong> · ${c.phone} · ${c.email}</p>
            <p>${shipTo}</p>
            <p>Order <code>${order.id}</code> · Payment <code>${order.paymentId ?? "—"}</code> · ${inr(order.amount)}</p>
            <p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/orders/${order.id}">Open in admin panel</a></p>
          </div>`,
      })
    );
  }

  const results = await Promise.allSettled(tasks);
  for (const r of results) {
    if (r.status === "rejected") console.error("Order email failed:", r.reason);
    else if (r.value.error) console.error("Order email failed:", r.value.error);
  }
}
