import { Resend } from "resend";
import type { Order } from "./orders";
import { courierName, trackingUrl } from "./couriers";

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
      subject: "Your EVHERFIT Infinity Band is confirmed 🎉",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1c2030">
          <h1 style="color:#2b337d;font-style:italic">EVHERFIT</h1>
          <h2>Order confirmed — be the woman.</h2>
          <p>Hi ${c.name}, thanks for your order! Your EVHERFIT Infinity Band pair ships within
          24 hours; we'll email tracking details once it's on the way.</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0">
            <tr><td style="padding:8px 0;color:#6b7194">Item</td><td align="right">${order.item ?? "EVHERFIT Infinity Band"}</td></tr>
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
            <h2>New EVHERFIT order</h2>
            <p><strong>${c.name}</strong> · ${c.phone} · ${c.email}</p>
            <p>${order.item ?? "EVHERFIT Infinity Band"}</p>
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

/** Wrapper shared by the fulfilment emails — same brand frame as the confirmation. */
async function sendCustomerEmail(order: Order, subject: string, bodyHtml: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  try {
    const res = await new Resend(apiKey).emails.send({
      from: FROM,
      to: order.customer.email,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1c2030">
          <h1 style="color:#2b337d;font-style:italic">EVHERFIT</h1>
          ${bodyHtml}
          <p style="color:#6b7194;font-size:13px">Track anytime: <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/track">order tracking</a> · Questions? Just reply to this email.</p>
        </div>`,
    });
    if (res.error) console.error("Order email failed:", res.error);
  } catch (err) {
    console.error("Order email failed:", err);
  }
}

export async function sendShippedEmail(order: Order) {
  const link = trackingUrl(order.courier, order.tracking);
  const via = order.courier ? ` via ${courierName(order.courier)}` : "";
  await sendCustomerEmail(
    order,
    "Your EVHERFIT order is on the way 📦",
    `
      <h2>Shipped${via}!</h2>
      <p>Hi ${order.customer.name}, your ${order.item ?? "EVHERFIT Infinity Band"} just left our warehouse.</p>
      ${
        order.tracking
          ? `<p>Tracking number: <strong>${order.tracking}</strong>${
              link ? ` — <a href="${link}">track your package</a>` : ""
            }</p>`
          : ""
      }
      <p>Order <code>${order.id}</code></p>`
  );
}

export async function sendDeliveredEmail(order: Order) {
  await sendCustomerEmail(
    order,
    "Delivered — time to train 💪",
    `
      <h2>Your Infinity Band has arrived.</h2>
      <p>Hi ${order.customer.name}, your order <code>${order.id}</code> was delivered. Be the woman.</p>
      <p>If anything's not right, reply to this email within 7 days and we'll sort it out.</p>`
  );
}

export async function sendRefundEmail(order: Order, amount: number) {
  await sendCustomerEmail(
    order,
    "Your EVHERFIT refund is on its way",
    `
      <h2>Refund initiated</h2>
      <p>Hi ${order.customer.name}, we've initiated a refund of <strong>${inr(amount)}</strong> for order
      <code>${order.id}</code>. It typically reaches your account in 5–7 working days.</p>`
  );
}
