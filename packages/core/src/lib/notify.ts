import type { Order } from "./orders";
import type { NewLead } from "./leads";
import { getSettings } from "./settings";
import { logEmailEvent } from "./orders";
import {
  type Email,
  leadNotification,
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
 * Transactional email. Sent through Resend (https://resend.com) when
 * RESEND_API_KEY is set, otherwise through Brevo (https://www.brevo.com) with
 * BREVO_API_KEY. Entirely optional: with neither key every send is a no-op, so
 * dev and demo environments work without email setup. Failures are logged,
 * never thrown — a missed email must never fail a payment confirmation or a
 * fulfilment action.
 *
 * Brevo contact-list sync (syncCustomerToBrevo) is separate from sending and
 * keeps using BREVO_API_KEY whichever provider sends the mail.
 *
 * Templates live in src/lib/email/. This module only decides who gets what.
 */

export type EmailProvider = "resend" | "brevo";

/** Which service sends the mail, or null when email is off. Resend wins when both keys are set. */
export function emailProvider(): EmailProvider | null {
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.BREVO_API_KEY) return "brevo";
  return null;
}

/** "Resend" / "Brevo", for messages shown to the owner. */
export function emailProviderName(): string {
  return emailProvider() === "resend" ? "Resend" : "Brevo";
}

const FROM_FALLBACK = "EVHERFIT <no-reply@evherfit.com>";

/** Resolved sender: the owner-editable setting, else EMAIL_FROM, else the fallback. */
async function from(): Promise<string> {
  return (await getSettings()).email_from || FROM_FALLBACK;
}

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
 * One POST to an email provider's API. Times out after 10s (these calls sit
 * inside payment verification and webhook handlers — they must never hang the
 * response) and retries once on network errors, 429 and 5xx. Other 4xx are
 * config problems that a retry can't fix.
 */
const BREVO_TIMEOUT_MS = 10_000;

type PostResult = { ok: boolean; status?: number; body?: string };

async function post(url: string, auth: Record<string, string>, payload: unknown): Promise<PostResult> {
  let last: PostResult = { ok: false };
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { ...auth, "content-type": "application/json", accept: "application/json" },
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

async function brevoPost(path: string, payload: unknown): Promise<PostResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, body: "BREVO_API_KEY is not set" };
  return post(`https://api.brevo.com/v3${path}`, { "api-key": apiKey }, payload);
}

type Message = { from: string; to: string; subject: string; html: string; replyTo?: string };

/** The body Resend's POST /emails expects. Exported for the tests. */
export function resendPayload(m: Message) {
  return {
    from: m.from,
    to: [m.to],
    subject: m.subject,
    html: m.html,
    ...(m.replyTo ? { reply_to: m.replyTo } : {}),
  };
}

/** The body Brevo's POST /smtp/email expects. Exported for the tests. */
export function brevoPayload(m: Message) {
  return {
    sender: parseFrom(m.from),
    to: [{ email: m.to }],
    subject: m.subject,
    htmlContent: m.html,
    ...(m.replyTo ? { replyTo: { email: m.replyTo } } : {}),
  };
}

/** Hands one message to whichever provider is configured. */
async function deliver(m: Message): Promise<PostResult> {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) return post("https://api.resend.com/emails", { authorization: `Bearer ${resendKey}` }, resendPayload(m));
  return brevoPost("/smtp/email", brevoPayload(m));
}

type SendOutcome = "sent" | "failed" | "skipped";

/** `replyTo`: omitted → the support address, `false` → none, a string → that address. */
async function send(
  to: string | undefined,
  email: Email,
  opts?: { replyTo?: boolean | string }
): Promise<SendOutcome> {
  if (!emailProvider() || !to) return "skipped";
  const replyTo =
    typeof opts?.replyTo === "string"
      ? opts.replyTo
      : opts?.replyTo === false
        ? ""
        : (await getSettings()).support_email;
  const result = await deliver({ from: await from(), to, subject: email.subject, html: email.html, replyTo });
  if (!result.ok) {
    console.error(`Email "${email.subject}" failed (${result.status ?? "network"}):`, result.body);
    return "failed";
  }
  return "sent";
}

/**
 * Owner-facing alert inbox. Async because it is an owner-editable setting now;
 * awaiting it also warms the settings cache before any template is rendered,
 * which is what lets the email shell read the support address synchronously.
 */
const adminInbox = async () => (await getSettings()).order_notify_email || undefined;

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
      : `${kind} email failed to send — check the ${emailProviderName()} settings and server logs`,
    actor
  );
}

/* ---------- order lifecycle ---------- */

/** On payment: confirm to the customer, alert the store, sync the contact. */
export async function sendOrderNotifications(order: Order) {
  const inbox = await adminInbox();
  await Promise.allSettled([
    sendCustomerEmail(order, orderConfirmation(order), "Confirmation"),
    send(inbox, newOrderAdmin(order), { replyTo: false }),
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

/* ---------- 1-to-1 leads ---------- */

/**
 * Tell the team a new 1-to-1 application arrived. Who gets it, the subject and
 * the body are all owner-editable (Settings → 1-to-1 lead email); with no
 * recipients set this does nothing. Each inbox gets its own copy, and replying
 * to it writes to the lead rather than to a no-reply address.
 */
export async function sendLeadNotification(lead: NewLead) {
  const s = await getSettings();
  const recipients = s.lead_notify_emails.split(",").map((addr) => addr.trim()).filter(Boolean);
  if (!recipients.length) return;

  const email = leadNotification(lead, { subject: s.lead_email_subject, body: s.lead_email_body });
  await Promise.allSettled(recipients.map((to) => send(to, email, { replyTo: lead.email })));
}

/* ---------- marketing contacts ---------- */

/**
 * Optional: mirror paying customers into a Brevo contact list so the store
 * can run campaigns later. Off unless BREVO_LIST_ID (the numeric id from
 * Brevo → Contacts → Lists) is set. Upserts, so repeat buyers just update.
 */
export async function syncCustomerToBrevo(order: Order) {
  const listId = Number((await getSettings()).brevo_list_id);
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
  await send(await adminInbox(), lowStockAdmin(items), { replyTo: false });
}

export async function sendTeammateWelcome(input: { name: string; email: string; role: string }) {
  await send(input.email, teammateWelcome(input), { replyTo: false });
}

/** True when the store can actually send email (used by the admin UI). */
export function emailConfigured() {
  return emailProvider() !== null;
}

/**
 * Send one template (by preview key) to an arbitrary inbox — the "send test"
 * button on /admin/emails. Unlike the fire-and-forget senders above, this
 * reports failure so the owner can see whether the provider is wired up correctly.
 */
export async function sendTestEmail(to: string, email: Email): Promise<{ error?: string }> {
  if (!emailProvider()) {
    return { error: "Neither RESEND_API_KEY nor BREVO_API_KEY is set — add one to the environment first." };
  }
  const result = await deliver({ from: await from(), to, subject: `[Test] ${email.subject}`, html: email.html });
  if (!result.ok) {
    const provider = emailProviderName();
    return {
      error: result.status
        ? `${provider} rejected the send (${result.status}): ${(result.body ?? "").slice(0, 300)}`
        : `Couldn't reach ${provider}: ${result.body ?? "network error"}`,
    };
  }
  return {};
}

/**
 * Password-reset link. When email isn't configured (no provider key) the
 * link is logged to the server console so the flow is still usable in dev —
 * in production email should be configured, so this never leaks there.
 */
export async function sendPasswordResetEmail(input: { name: string; email: string; resetUrl: string }) {
  if (!emailProvider()) {
    console.info(`[password reset] email not configured — reset link for ${input.email}: ${input.resetUrl}`);
    return;
  }
  await send(input.email, passwordReset(input), { replyTo: false });
}

/** Domains Resend has verified, or null when it can't be asked (e.g. a send-only API key). */
async function resendVerifiedDomains(): Promise<string[] | null> {
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, accept: "application/json" },
      signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { name?: string; status?: string }[] };
    if (!Array.isArray(body.data)) return null;
    return body.data.filter((d) => d.status === "verified" && d.name).map((d) => d.name!.toLowerCase());
  } catch {
    return null;
  }
}

/**
 * Whether the email provider will actually accept mail from `address`.
 *
 * With Resend that means the address's domain is verified there. The rest of
 * this comment is about Brevo.
 *
 * Two ways an address can be usable, and checking only the first is wrong:
 *   - its domain is authenticated (SPF/DKIM), which covers every address on it;
 *   - the exact address is registered as an active sender, which Brevo allows
 *     on its own — this is how most small accounts send before they get round
 *     to authenticating a domain.
 *
 * Returns null when we cannot tell (no API key, network failure, unexpected
 * response) so callers can distinguish "not verified" from "could not check"
 * and avoid blocking on a third party being briefly unreachable.
 */
export async function senderIsUsable(address: string): Promise<boolean | null> {
  const addr = address.trim().toLowerCase();
  const domain = addr.slice(addr.lastIndexOf("@") + 1);

  if (process.env.RESEND_API_KEY) {
    const verified = await resendVerifiedDomains();
    return verified ? verified.includes(domain) : null;
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;
  const headers = { "api-key": apiKey, accept: "application/json" };

  const get = async (path: string) => {
    const res = await fetch(`https://api.brevo.com/v3${path}`, {
      headers,
      signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
    });
    return res.ok ? await res.json() : null;
  };

  try {
    const [domains, senders] = await Promise.all([get("/senders/domains"), get("/senders")]);
    if (!domains && !senders) return null;

    const authed = (domains as { domains?: { domain_name?: string; authenticated?: boolean }[] } | null)?.domains;
    if (Array.isArray(authed) && authed.some((d) => d.authenticated && d.domain_name?.toLowerCase() === domain)) {
      return true;
    }

    const list = (senders as { senders?: { email?: string; active?: boolean }[] } | null)?.senders;
    if (Array.isArray(list) && list.some((x) => x.active && x.email?.toLowerCase() === addr)) return true;

    // Only a definite "no" if at least one list came back to say so.
    return Array.isArray(authed) || Array.isArray(list) ? false : null;
  } catch {
    return null;
  }
}

/** What the provider will send from — Brevo's active senders, or "@domain" per Resend-verified domain. Best effort. */
export async function usableSenders(): Promise<string[]> {
  if (process.env.RESEND_API_KEY) return ((await resendVerifiedDomains()) ?? []).map((d) => `@${d}`);
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch("https://api.brevo.com/v3/senders", {
      headers: { "api-key": apiKey, accept: "application/json" },
      signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { senders?: { email?: string; active?: boolean }[] };
    return (body.senders ?? []).filter((s) => s.active && s.email).map((s) => s.email!);
  } catch {
    return [];
  }
}
