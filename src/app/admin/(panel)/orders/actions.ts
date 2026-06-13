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
} from "@/lib/orders";
import { refundPayment } from "@/lib/razorpay";
import { sendDeliveredEmail, sendRefundEmail, sendShippedEmail } from "@/lib/notify";

function refresh(id: string) {
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function markShippedAction(formData: FormData) {
  const user = await requireAdmin();
  const id = String(formData.get("id"));
  const order = await markShipped(id, {
    courier: String(formData.get("courier") ?? "").trim() || undefined,
    tracking: String(formData.get("tracking") ?? "").trim() || undefined,
    actor: user.email,
  });
  if (order) await sendShippedEmail(order);
  refresh(id);
}

export async function markDeliveredAction(formData: FormData) {
  const user = await requireAdmin();
  const id = String(formData.get("id"));
  const order = await markDelivered(id, user.email);
  if (order) await sendDeliveredEmail(order);
  refresh(id);
}

export async function cancelOrderAction(formData: FormData) {
  const user = await requireAdmin();
  const id = String(formData.get("id"));
  await cancelOrder(id, user.email);
  refresh(id);
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
  if (updated) await sendRefundEmail(updated, Number(refund.amount ?? order.amount));
  refresh(id);
  return undefined;
}

export async function addNoteAction(formData: FormData) {
  const user = await requireAdmin();
  const id = String(formData.get("id"));
  const note = String(formData.get("note") ?? "").trim();
  if (note) await addOrderNote(id, note, user.email);
  revalidatePath(`/admin/orders/${id}`);
}
