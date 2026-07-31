"use client";

import { useActionState, useState } from "react";
import { createCouponAction } from "./actions";

const inputCls =
  "w-full rounded-xl border border-[#dcdfee] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#2b337d]";

export default function CouponForm() {
  const [state, action, pending] = useActionState(createCouponAction, undefined);
  const [type, setType] = useState("percent");

  return (
    <form action={action} className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="code" required placeholder="Code (e.g. LAUNCH10)" className={`${inputCls} uppercase`} />
        <select name="type" value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
          <option value="percent">Percentage off</option>
          <option value="flat">Flat amount off (₹)</option>
        </select>
        <input
          name="value"
          type="number"
          step={type === "percent" ? "1" : "0.01"}
          min="1"
          required
          placeholder={type === "percent" ? "Percent (1–100)" : "Amount in ₹"}
          className={inputCls}
        />
        <input name="minAmount" type="number" step="0.01" min="0" placeholder="Min order ₹ (optional)" className={inputCls} />
        <input name="maxUses" type="number" min="1" placeholder="Max uses (blank = unlimited)" className={inputCls} />
        <input name="expiresAt" type="date" title="Expiry date (optional)" className={inputCls} />
      </div>
      {state?.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.ok}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[#2b337d] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#232a68] disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create code"}
      </button>
    </form>
  );
}
