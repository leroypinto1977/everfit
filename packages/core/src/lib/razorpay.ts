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

export interface PaymentInfo {
  method?: string; // upi | card | netbanking | wallet | …
  fee?: number; // paise, Razorpay's fee incl. its GST (its `fee` field is tax-inclusive)
}

/**
 * Best-effort lookup of how a payment was made and what Razorpay charged for it.
 * Used by the browser verify path so both are captured immediately; never throws
 * — on any failure the webhook (whose captured event already carries fee/method)
 * backfills later.
 */
export async function fetchPaymentInfo(paymentId: string): Promise<PaymentInfo> {
  try {
    const p = (await razorpay().payments.fetch(paymentId)) as { method?: string; fee?: number };
    return {
      method: p.method || undefined,
      // fee is only populated once the payment is captured; guard against null
      fee: typeof p.fee === "number" ? p.fee : undefined,
    };
  } catch (err) {
    console.error("Could not fetch payment info", err);
    return {};
  }
}

/** Full refund of a captured payment. Returns the Razorpay refund entity. */
export async function refundPayment(paymentId: string, opts?: { amount?: number; notes?: string }) {
  return razorpay().payments.refund(paymentId, {
    ...(opts?.amount ? { amount: opts.amount } : {}), // omitted = full refund
    ...(opts?.notes ? { notes: { reason: opts.notes } } : {}),
  });
}
