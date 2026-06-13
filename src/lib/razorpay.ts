import Razorpay from "razorpay";

/** Shared Razorpay client. Throws a clear error when keys are missing. */

let client: Razorpay | undefined;

export function razorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  client ??= new Razorpay({ key_id, key_secret });
  return client;
}

/** Full refund of a captured payment. Returns the Razorpay refund entity. */
export async function refundPayment(paymentId: string, opts?: { amount?: number; notes?: string }) {
  return razorpay().payments.refund(paymentId, {
    ...(opts?.amount ? { amount: opts.amount } : {}), // omitted = full refund
    ...(opts?.notes ? { notes: { reason: opts.notes } } : {}),
  });
}
