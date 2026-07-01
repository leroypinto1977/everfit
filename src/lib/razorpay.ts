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

/**
 * Best-effort lookup of how a payment was made (upi / card / netbanking / …).
 * Used by the browser verify path so the method is captured immediately; never
 * throws — on any failure the webhook backfills it later.
 */
export async function fetchPaymentMethod(paymentId: string): Promise<string | undefined> {
  try {
    const payment = await razorpay().payments.fetch(paymentId);
    const method = (payment as { method?: string }).method;
    return method || undefined;
  } catch (err) {
    console.error("Could not fetch payment method", err);
    return undefined;
  }
}

/** Full refund of a captured payment. Returns the Razorpay refund entity. */
export async function refundPayment(paymentId: string, opts?: { amount?: number; notes?: string }) {
  return razorpay().payments.refund(paymentId, {
    ...(opts?.amount ? { amount: opts.amount } : {}), // omitted = full refund
    ...(opts?.notes ? { notes: { reason: opts.notes } } : {}),
  });
}
