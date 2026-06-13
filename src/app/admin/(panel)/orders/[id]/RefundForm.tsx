"use client";

import { useActionState } from "react";
import { refundOrderAction } from "../actions";

export default function RefundForm({ orderId, amount }: { orderId: string; amount: number }) {
  const [state, action, pending] = useActionState(refundOrderAction, undefined);

  return (
    <form action={action} className="mt-6 rounded-2xl border border-purple-200 bg-purple-50/40 p-6">
      <h2 className="font-semibold text-purple-900">Refund this order</h2>
      <p className="mt-1 text-sm text-purple-900/70">
        Issues a full refund of ₹{(amount / 100).toLocaleString("en-IN")} through Razorpay and restores
        stock. The customer is emailed automatically. This can&apos;t be undone.
      </p>
      <input type="hidden" name="id" value={orderId} />
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <label htmlFor="reason" className="mb-2 block text-sm text-purple-900/70">
            Reason (kept on the audit trail)
          </label>
          <input
            id="reason"
            name="reason"
            placeholder="e.g. customer returned the band"
            className="w-full rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-purple-400"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-purple-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-800 disabled:opacity-60"
        >
          {pending ? "Refunding…" : "Issue full refund"}
        </button>
      </div>
      {state?.error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
