"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireOwner } from "@/lib/admin-auth";
import {
  addOrderNote,
  cancelOrder,
  getOrder,
  markDelivered,
  markRefunded,
  markShipped,
} from "@everfit/core/lib/orders";
import { refundPayment } from "@everfit/core/lib/razorpay";
import {
  emailConfigured,
  sendConfirmationEmail,
  sendDeliveredEmail,
  sendPaymentFailedEmail,
  sendRefundEmail,
  sendShippedEmail,
} from "@everfit/core/lib/notify";

function refresh(id: string) {
  revalidatePath(`/orders/${id}`);
  revalidatePath("/orders");
  revalidatePath("/");
}

/** Transition result for useActionState forms: an error, or undefined on success. */
export type ActionResult = { error?: string } | undefined;

export async function markShippedAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAdmin();
  const id = String(formData.get("id"));
  const order = await markShipped(id, {
    courier: String(formData.get("courier") ?? "").trim() || undefined,
    tracking: String(formData.get("tracking") ?? "").trim() || undefined,
    actor: user.email,
  });
  refresh(id);
  if (!order) {
    return { error: "This order is no longer awaiting shipment — its status just changed." };
  }
  await sendShippedEmail(order, user.email);
  return undefined;
}

/**
 * Mark several paid orders shipped at once (shared courier, no tracking —
 * tracking goes per-order via quick-ship). Each shipped order still gets its
 * email. markShipped is status-guarded, so non-paid ids are simply skipped.
 */
export async function bulkShipAction(formData: FormData) {
  const user = await requireAdmin();
  const ids = formData.getAll("ids").map(String);
  const courier = String(formData.get("courier") ?? "").trim() || undefined;

  const shipped = [];
  for (const id of ids) {
    const order = await markShipped(id, { courier, actor: user.email });
    if (order) shipped.push(order);
  }
  await Promise.allSettled(shipped.map((o) => sendShippedEmail(o, user.email)));

  revalidatePath("/orders");
  revalidatePath("/");
}

export async function markDeliveredAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAdmin();
  const id = String(formData.get("id"));
  const order = await markDelivered(id, user.email);
  refresh(id);
  if (!order) {
    return { error: "Only shipped orders can be marked delivered — this one's status just changed." };
  }
  await sendDeliveredEmail(order, user.email);
  return undefined;
}

export async function cancelOrderAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAdmin();
  const id = String(formData.get("id"));
  const order = await cancelOrder(id, user.email);
  refresh(id);
  if (!order) {
    return { error: "This order can't be cancelled — it already received a payment." };
  }
  return undefined;
}

/** Owner-only: full refund through Razorpay, then flip the order. */
export async function refundOrderAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const user = await requireOwner();
  const id = String(formData.get("id"));
  const reason = String(formData.get("reason") ?? "").trim();

  const order = await getOrder(id);
  if (!order?.paymentId) return { error: "No payment to refund on this order." };

  let refund;
  try {
    refund = await refundPayment(order.paymentId, { notes: reason || undefined });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Razorpay refund failed";
    return { error: message };
  }

  const updated = await markRefunded(
    id,
    { refundId: refund.id, amount: Number(refund.amount ?? order.amount), reason: reason || undefined },
    user.email
  );
  if (updated) await sendRefundEmail(updated, Number(refund.amount ?? order.amount), user.email);
  refresh(id);
  return undefined;
}

/** Which lifecycle emails may be (re-)sent manually at each order status. */
const STAGE_EMAILS = {
  confirmation: {
    statuses: ["paid", "shipped", "delivered"],
    send: sendConfirmationEmail,
    invalid: "The confirmation email applies once the order is paid.",
  },
  shipped: {
    statuses: ["shipped", "delivered"],
    send: sendShippedEmail,
    invalid: "The shipped email applies once the order is marked shipped.",
  },
  delivered: {
    statuses: ["delivered"],
    send: sendDeliveredEmail,
    invalid: "The delivered email applies once the order is marked delivered.",
  },
} as const;

export type EmailSendResult = { ok?: string; error?: string } | undefined;

/**
 * Manually (re-)send one of the lifecycle emails. Every transition already
 * emails automatically — this covers "the customer can't find it" and
 * "we corrected the tracking number, send it again".
 */
export async function sendStageEmailAction(
  _prev: EmailSendResult,
  formData: FormData
): Promise<EmailSendResult> {
  const user = await requireAdmin();
  const id = String(formData.get("id"));
  const stage = STAGE_EMAILS[String(formData.get("stage")) as keyof typeof STAGE_EMAILS];
  if (!stage) return { error: "Unknown email type." };

  if (!emailConfigured()) {
    return { error: "Email isn't configured (BREVO_API_KEY is missing), so nothing can be sent." };
  }
  const order = await getOrder(id);
  if (!order) return { error: "Order not found." };
  if (!order.customer.email) return { error: "This order has no customer email on file." };
  if (!(stage.statuses as readonly string[]).includes(order.status)) {
    return { error: stage.invalid };
  }

  // the sender records the outcome on the order timeline, attributed to user
  await stage.send(order, user.email);
  refresh(id);
  return { ok: `Sent to ${order.customer.email}.` };
}

/**
 * Re-send the "finish your order" nudge for an unpaid checkout. The webhook
 * sends one automatically on payment.failed; this lets the team follow up
 * manually a day later from the order page.
 */
export async function sendRecoveryEmailAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAdmin();
  const id = String(formData.get("id"));

  if (!emailConfigured()) {
    return { error: "Email isn't configured (BREVO_API_KEY is missing), so no nudge can be sent." };
  }
  const order = await getOrder(id);
  if (!order || !["created", "failed"].includes(order.status)) {
    return { error: "Recovery nudges only apply to unpaid checkouts." };
  }
  if (!order.customer.email) {
    return { error: "This order has no customer email on file." };
  }

  await sendPaymentFailedEmail(order, user.email);
  refresh(id);
  return undefined;
}

export async function addNoteAction(formData: FormData) {
  const user = await requireAdmin();
  const id = String(formData.get("id"));
  const note = String(formData.get("note") ?? "").trim();
  if (note) await addOrderNote(id, note, user.email);
  revalidatePath(`/orders/${id}`);
}
