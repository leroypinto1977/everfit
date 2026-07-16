import type { Order } from "./orders";
import { logEmailEvent } from "./orders";
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

/**
 * One POST to the Brevo v3 API. Times out after 10s (these calls sit inside
 * payment verification and webhook handlers — they must never hang the
 * response) and retries once on network errors, 429 and 5xx. Other 4xx are
 * config problems that a retry can't fix.
 */
const BREVO_TIMEOUT_MS = 10_000;

async function brevoPost(
  path: string,
  payload: unknown
): Promise<{ ok: boolean; status?: number; body?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, body: "BREVO_API_KEY is not set" };

  let last: { ok: boolean; status?: number; body?: string } = { ok: false };
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(`https://api.brevo.com/v3${path}`, {
        method: "POST",
        headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
      });
      if (res.ok) return { ok: true, status: res.status };
      const body = await res.text().catch(() => "");
      last = { ok: false, status: res.status, body };
      if (res.status < 500 && res.status !== 429) return last;
    } catch (err) {
      last = { ok: false, body: err instanceof Error ? err.message : String(err) };
    }
  }
  return last;
}

type SendOutcome = "sent" | "failed" | "skipped";

async function send(to: string | undefined, email: Email, opts?: { replyTo?: boolean }): Promise<SendOutcome> {
  if (!process.env.BREVO_API_KEY || !to) return "skipped";
  const result = await brevoPost("/smtp/email", {
    sender: parseFrom(FROM),
    to: [{ email: to }],
    subject: email.subject,
    htmlContent: email.html,
    ...(opts?.replyTo === false ? {} : { replyTo: { email: REPLY_TO } }),
  });
  if (!result.ok) {
    console.error(`Email "${email.subject}" failed (${result.status ?? "network"}):`, result.body);
    return "failed";
  }
  return "sent";
}

const adminInbox = () => process.env.ORDER_NOTIFY_EMAIL;

/**
 * Send a customer email and record the outcome on the order's activity
 * timeline, so the team can see "confirmation sent" (or that it failed)
 * without digging through server logs. Skipped sends (email not configured)
 * log nothing — dev and demo timelines stay clean.
 */
async function sendCustomerEmail(order: Order, email: Email, kind: string, actor = "system") {
  const outcome = await send(order.customer.email, email);
  if (outcome === "skipped") return;
  await logEmailEvent(
    order.id,
    outcome === "sent"
      ? `${kind} email sent to ${order.customer.email}`
      : `${kind} email failed to send — check Brevo settings and server logs`,
    actor
  );
}

/* ---------- order lifecycle ---------- */

/** On payment: confirm to the customer, alert the store, sync the contact. */
export async function sendOrderNotifications(order: Order) {
  await Promise.allSettled([
    sendCustomerEmail(order, orderConfirmation(order), "Confirmation"),
    send(adminInbox(), newOrderAdmin(order), { replyTo: false }),
    syncCustomerToBrevo(order),
  ]);
}

/** Customer confirmation only — for manual re-sends from the order page. */
export async function sendConfirmationEmail(order: Order, actor = "system") {
  await sendCustomerEmail(order, orderConfirmation(order), "Confirmation", actor);
}

export async function sendShippedEmail(order: Order, actor = "system") {
  await sendCustomerEmail(order, orderShipped(order), "Shipped", actor);
}

export async function sendDeliveredEmail(order: Order, actor = "system") {
  await sendCustomerEmail(order, orderDelivered(order), "Delivered", actor);
}

export async function sendRefundEmail(order: Order, amount: number, actor = "system") {
  await sendCustomerEmail(order, refundInitiated(order, amount), "Refund", actor);
}

/** Gentle recovery nudge when a payment attempt fails (order never placed). */
export async function sendPaymentFailedEmail(order: Order, actor = "system") {
  await sendCustomerEmail(order, paymentFailed(order), "Payment-recovery", actor);
}

/* ---------- marketing contacts ---------- */

/**
 * Optional: mirror paying customers into a Brevo contact list so the store
 * can run campaigns later. Off unless BREVO_LIST_ID (the numeric id from
 * Brevo → Contacts → Lists) is set. Upserts, so repeat buyers just update.
 */
export async function syncCustomerToBrevo(order: Order) {
  const listId = Number(process.env.BREVO_LIST_ID);
  if (!process.env.BREVO_API_KEY || !listId || !order.customer.email) return;

  const [first, ...rest] = order.customer.name.trim().split(/\s+/);
  const digits = order.customer.phone.replace(/\D/g, "").slice(-10);
  const sms = /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : undefined;

  const contact = {
    email: order.customer.email.toLowerCase(),
    updateEnabled: true,
    listIds: [listId],
    attributes: {
      FIRSTNAME: first || order.customer.name,
      ...(rest.length ? { LASTNAME: rest.join(" ") } : {}),
      ...(sms ? { SMS: sms } : {}),
    },
  };

  let result = await brevoPost("/contacts", contact);
  // The same phone on a different contact makes Brevo reject the whole
  // upsert — the email contact still matters, so retry without the number.
  if (!result.ok && sms && result.body?.includes("duplicate_parameter")) {
    const attributes = { ...contact.attributes };
    delete attributes.SMS;
    result = await brevoPost("/contacts", { ...contact, attributes });
  }
  if (!result.ok) {
    console.error(`Brevo contact sync failed (${result.status ?? "network"}):`, result.body);
  }
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
  if (!process.env.BREVO_API_KEY) {
    return { error: "BREVO_API_KEY is not set — add it to the environment first." };
  }
  const result = await brevoPost("/smtp/email", {
    sender: parseFrom(FROM),
    to: [{ email: to }],
    subject: `[Test] ${email.subject}`,
    htmlContent: email.html,
  });
  if (!result.ok) {
    return {
      error: result.status
        ? `Brevo rejected the send (${result.status}): ${(result.body ?? "").slice(0, 300)}`
        : `Couldn't reach Brevo: ${result.body ?? "network error"}`,
    };
  }
  return {};
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
