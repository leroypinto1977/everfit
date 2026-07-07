"use client";

import { useActionState, useState } from "react";
import { COURIERS } from "@/lib/couriers";
import {
  cancelOrderAction,
  markDeliveredAction,
  markShippedAction,
  sendRecoveryEmailAction,
} from "../actions";

/**
 * Client wrappers around the fulfilment transitions so a rejected transition
 * (someone else already moved the order) shows an error instead of silently
 * refreshing. On success the server action revalidates and the form unmounts.
 */

function ActionError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-3 w-full rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>;
}

export function ShipForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(markShippedAction, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#e3e5f0] bg-white p-6">
      <input type="hidden" name="id" value={orderId} />
      <div className="w-44">
        <label htmlFor="courier" className="mb-2 block text-sm text-[#6b7194]">
          Courier
        </label>
        <select
          id="courier"
          name="courier"
          className="w-full rounded-xl border border-[#dcdfee] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2b337d]"
        >
          <option value="">— Select —</option>
          {COURIERS.map((co) => (
            <option key={co.key} value={co.key}>
              {co.name}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-64 flex-1">
        <label htmlFor="tracking" className="mb-2 block text-sm text-[#6b7194]">
          Tracking number (optional)
        </label>
        <input
          id="tracking"
          name="tracking"
          placeholder="e.g. 1234567890"
          className="w-full rounded-xl border border-[#dcdfee] px-4 py-2.5 text-sm outline-none focus:border-[#2b337d]"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[#2b337d] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#232a68] disabled:opacity-60"
      >
        {pending ? "Shipping…" : "Mark as shipped"}
      </button>
      <p className="w-full text-xs text-[#9aa0c3]">The customer gets a shipping email with the tracking link.</p>
      <ActionError error={state?.error} />
    </form>
  );
}

export function DeliverForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(markDeliveredAction, undefined);

  return (
    <form action={action} className="rounded-2xl border border-[#e3e5f0] bg-white p-6">
      <input type="hidden" name="id" value={orderId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[#2b337d] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#232a68] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Mark as delivered"}
      </button>
      <ActionError error={state?.error} />
    </form>
  );
}

export function CancelForm({ orderId }: { orderId: string }) {
  const [cancelState, cancelAct, cancelling] = useActionState(cancelOrderAction, undefined);
  const [nudgeState, nudgeAct, nudging] = useActionState(sendRecoveryEmailAction, undefined);
  const [nudged, setNudged] = useState(false);

  return (
    <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6">
      <p className="text-sm text-[#6b7194]">
        This order never reached payment. Nudge the customer to finish checking out, or cancel it.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <form
          action={nudgeAct}
          onSubmit={() => setNudged(true)}
        >
          <input type="hidden" name="id" value={orderId} />
          <button
            type="submit"
            disabled={nudging || (nudged && !nudgeState?.error)}
            className="rounded-xl bg-[#2b337d] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#232a68] disabled:opacity-60"
          >
            {nudging ? "Sending…" : nudged && !nudgeState?.error ? "Nudge sent ✓" : "Send recovery email"}
          </button>
        </form>
        <form action={cancelAct}>
          <input type="hidden" name="id" value={orderId} />
          <button
            type="submit"
            disabled={cancelling}
            className="rounded-xl border border-[#dcdfee] px-6 py-2.5 text-sm font-semibold text-[#4a5072] transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-60"
          >
            {cancelling ? "Cancelling…" : "Cancel order"}
          </button>
        </form>
      </div>
      <ActionError error={cancelState?.error ?? nudgeState?.error} />
    </div>
  );
}
