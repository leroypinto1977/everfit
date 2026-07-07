import type { Order } from "./orders";
import {
  type Email,
  lowStockAdmin,
  newOrderAdmin,
  orderConfirmation,
  orderDelivered,
  orderShipped,
  passwordReset,
  paymentFailed,
  refundInitiated,
  teammateWelcome,
} from "./email/templates";

/**
 * Transactional email via Brevo (https://www.brevo.com). Entirely optional:
 * without BREVO_API_KEY every send is a no-op, so dev and demo environments
 * work without email setup. Failures are logged, never thrown — a missed
 * email must never fail a payment confirmation or a fulfilment action.
 *
 * Templates live in src/lib/email/. This module only decides who gets what.
 */

const FROM = process.env.EMAIL_FROM ?? "EVHERFIT <no-reply@evherfit.com>";
const REPLY_TO = process.env.SUPPORT_EMAIL ?? "support@evherfit.com";

/** "EVHERFIT <orders@evherfit.com>" → { name, email } for Brevo's sender object. */
function parseFrom(from: string): { name?: string; email: string } {
  const match = from.match(/^\s*(?:"?([^"<]*)"?\s*)?<([^>]+)>\s*$/);
  if (match) {
    const name = match[1]?.trim();
    return { ...(name ? { name } : {}), email: match[2].trim() };
  }
  return { email: from.trim() };
}

async function send(to: string | undefined, email: Email, opts?: { replyTo?: boolean }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || !to) return;
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: parseFrom(FROM),
        to: [{ email: to }],
        subject: email.subject,
        htmlContent: email.html,
        ...(opts?.replyTo === false ? {} : { replyTo: { email: REPLY_TO } }),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`Email "${email.subject}" failed (${res.status}):`, body);
    }
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

/** Customer confirmation only — for manual re-sends from the order page. */
export async function sendConfirmationEmail(order: Order) {
  await send(order.customer.email, orderConfirmation(order));
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

/** True when the store can actually send email (used by the admin UI). */
export function emailConfigured() {
  return Boolean(process.env.BREVO_API_KEY);
}

/**
 * Send one template (by preview key) to an arbitrary inbox — the "send test"
 * button on /admin/emails. Unlike the fire-and-forget senders above, this
 * reports failure so the owner can see whether Brevo is wired up correctly.
 */
export async function sendTestEmail(to: string, email: Email): Promise<{ error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { error: "BREVO_API_KEY is not set — add it to the environment first." };
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: parseFrom(FROM),
        to: [{ email: to }],
        subject: `[Test] ${email.subject}`,
        htmlContent: email.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { error: `Brevo rejected the send (${res.status}): ${body.slice(0, 300)}` };
    }
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Network error talking to Brevo" };
  }
}

/**
 * Password-reset link. When email isn't configured (no BREVO_API_KEY) the
 * link is logged to the server console so the flow is still usable in dev —
 * in production Brevo should be configured, so this never leaks there.
 */
export async function sendPasswordResetEmail(input: { name: string; email: string; resetUrl: string }) {
  if (!process.env.BREVO_API_KEY) {
    console.info(`[password reset] no BREVO_API_KEY — reset link for ${input.email}: ${input.resetUrl}`);
    return;
  }
  await send(input.email, passwordReset(input), { replyTo: false });
}
