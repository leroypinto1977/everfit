"use client";

import { useActionState } from "react";
import { sendStageEmailAction } from "../actions";

/**
 * Manual send buttons for the lifecycle emails. Each stage only appears once
 * the order has reached it (paid → confirmation, shipped → shipped update,
 * delivered → delivered update); the automatic sends still happen on every
 * transition — these are for re-sends.
 */

const STAGES: { stage: string; label: string; from: string[] }[] = [
  { stage: "confirmation", label: "Order confirmation", from: ["paid", "shipped", "delivered"] },
  { stage: "shipped", label: "Shipped update", from: ["shipped", "delivered"] },
  { stage: "delivered", label: "Delivered update", from: ["delivered"] },
];

function StageButton({ orderId, stage, label }: { orderId: string; stage: string; label: string }) {
  const [state, action, pending] = useActionState(sendStageEmailAction, undefined);

  return (
    <form action={action} className="flex flex-col items-start gap-1">
      <input type="hidden" name="id" value={orderId} />
      <input type="hidden" name="stage" value={stage} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl border border-[#dcdfee] px-5 py-2.5 text-sm font-semibold text-[#2b337d] transition-colors hover:border-[#2b337d]/50 hover:bg-[#2b337d]/[0.04] disabled:opacity-60"
      >
        {pending ? "Sending…" : `✉ ${label}`}
      </button>
      {state?.ok && <span className="text-xs text-emerald-700">{state.ok}</span>}
      {state?.error && <span className="max-w-56 text-xs text-red-600">{state.error}</span>}
    </form>
  );
}

export default function EmailButtons({ orderId, status }: { orderId: string; status: string }) {
  const available = STAGES.filter((s) => s.from.includes(status));
  if (available.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6">
      <h2 className="font-semibold">Customer emails</h2>
      <p className="mt-1 text-sm text-[#6b7194]">
        Each stage emails the customer automatically — use these to send one again (e.g. it landed
        in spam, or you fixed the tracking number). Every send is logged in the activity below.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {available.map((s) => (
          <StageButton key={s.stage} orderId={orderId} stage={s.stage} label={s.label} />
        ))}
      </div>
    </div>
  );
}
