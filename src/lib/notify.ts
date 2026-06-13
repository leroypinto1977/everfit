import { Resend } from "resend";
import type { Order } from "./orders";
import {
  type Email,
  lowStockAdmin,
  newOrderAdmin,
  orderConfirmation,
  orderDelivered,
  orderShipped,
  paymentFailed,
  refundInitiated,
  teammateWelcome,
} from "./email/templates";

/**
 * Transactional email via Resend. Entirely optional: without RESEND_API_KEY
 * every send is a no-op, so dev and demo environments work without email
 * setup. Failures are logged, never thrown — a missed email must never fail a
 * payment confirmation or a fulfilment action.
 *
 * Templates live in src/lib/email/. This module only decides who gets what.
 */

const FROM = process.env.EMAIL_FROM ?? "EVHERFIT <onboarding@resend.dev>";
const REPLY_TO = process.env.SUPPORT_EMAIL ?? "support@evherfit.com";

async function send(to: string | undefined, email: Email, opts?: { replyTo?: boolean }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return;
  try {
    const res = await new Resend(apiKey).emails.send({
      from: FROM,
      to,
      subject: email.subject,
      html: email.html,
      ...(opts?.replyTo === false ? {} : { replyTo: REPLY_TO }),
    });
    if (res.error) console.error(`Email "${email.subject}" failed:`, res.error);
  } catch (err) {
    console.error(`Email "${email.subject}" failed:`, err);
  }
}

const adminInbox = () => process.env.ORDER_NOTIFY_EMAIL;

/* ---------- order lifecycle ---------- */

/** On payment: confirm to the customer and alert the store. */
export async function sendOrderNotifications(order: Order) {
  await Promise.allSettled([
    send(order.customer.email, orderConfirmation(order)),
    send(adminInbox(), newOrderAdmin(order), { replyTo: false }),
  ]);
}

export async function sendShippedEmail(order: Order) {
  await send(order.customer.email, orderShipped(order));
}

export async function sendDeliveredEmail(order: Order) {
  await send(order.customer.email, orderDelivered(order));
}

export async function sendRefundEmail(order: Order, amount: number) {
  await send(order.customer.email, refundInitiated(order, amount));
}

/** Gentle recovery nudge when a payment attempt fails (order never placed). */
export async function sendPaymentFailedEmail(order: Order) {
  await send(order.customer.email, paymentFailed(order));
}

/* ---------- admin ops ---------- */

export async function sendLowStockAlert(items: { weight: string; sku: string; stock: number }[]) {
  if (!items.length) return;
  await send(adminInbox(), lowStockAdmin(items), { replyTo: false });
}

export async function sendTeammateWelcome(input: { name: string; email: string; role: string }) {
  await send(input.email, teammateWelcome(input), { replyTo: false });
}
