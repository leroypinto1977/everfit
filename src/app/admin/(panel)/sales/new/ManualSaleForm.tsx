"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { recordManualSaleAction, type ManualSaleState } from "./actions";

type V = { key: string; label: string; weight: string; price: number };

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank transfer" },
  { value: "other", label: "Other" },
];

const field =
  "w-full rounded-xl border border-[#dcdfee] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#2b337d]";
const labelCls = "mb-1.5 block text-sm font-medium text-[#4a5072]";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-[#2b337d] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#232a68] disabled:opacity-60"
    >
      {pending ? "Recording…" : "Record sale"}
    </button>
  );
}

export default function ManualSaleForm({ variants }: { variants: V[] }) {
  const [state, action] = useActionState<ManualSaleState, FormData>(recordManualSaleAction, {});
  const [variantKey, setVariantKey] = useState(variants[0]?.key ?? "");
  const [qty, setQty] = useState(1);
  const [amount, setAmount] = useState("");

  // Suggest the amount from list price × qty whenever product/qty changes.
  useEffect(() => {
    const v = variants.find((x) => x.key === variantKey);
    if (v) setAmount(((v.price * qty) / 100).toString());
  }, [variantKey, qty, variants]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="variantKey" className={labelCls}>
            Product
          </label>
          <select
            id="variantKey"
            name="variantKey"
            value={variantKey}
            onChange={(e) => setVariantKey(e.target.value)}
            className={field}
          >
            {variants.map((v) => (
              <option key={v.key} value={v.key}>
                {v.weight} · {v.label} — ₹{(v.price / 100).toLocaleString("en-IN")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="qty" className={labelCls}>
            Quantity
          </label>
          <input
            id="qty"
            name="qty"
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className={field}
          />
        </div>

        <div>
          <label htmlFor="amount" className={labelCls}>
            Amount charged (₹)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={field}
          />
          <p className="mt-1 text-xs text-[#9aa0c3]">Prefilled from list price — edit if you gave a discount.</p>
        </div>

        <div>
          <label htmlFor="paymentMethod" className={labelCls}>
            Payment method
          </label>
          <select id="paymentMethod" name="paymentMethod" defaultValue="cash" className={field}>
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="paidAt" className={labelCls}>
            Date
          </label>
          <input id="paidAt" name="paidAt" type="date" defaultValue={today} max={today} className={field} />
        </div>

        <div>
          <label htmlFor="customerName" className={labelCls}>
            Customer name <span className="font-normal text-[#9aa0c3]">(optional)</span>
          </label>
          <input id="customerName" name="customerName" type="text" placeholder="Walk-in customer" className={field} />
        </div>

        <div>
          <label htmlFor="customerPhone" className={labelCls}>
            Customer phone <span className="font-normal text-[#9aa0c3]">(optional)</span>
          </label>
          <input id="customerPhone" name="customerPhone" type="tel" className={field} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="note" className={labelCls}>
            Note <span className="font-normal text-[#9aa0c3]">(optional)</span>
          </label>
          <input id="note" name="note" type="text" placeholder="e.g. stall at the marathon expo" className={field} />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Submit />
        <Link href="/admin/orders" className="text-sm font-medium text-[#6b7194] hover:text-[#2b337d]">
          Cancel
        </Link>
      </div>
    </form>
  );
}
