"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Order } from "@/lib/orders";
import { COURIERS } from "@/lib/couriers";
import StatusBadge from "@/components/admin/StatusBadge";
import QuickShip from "./QuickShip";
import { bulkShipAction } from "./actions";

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const formRef = useRef<HTMLFormElement>(null);

  const paidIds = orders.filter((o) => o.status === "paid").map((o) => o.id);
  const allPaidSelected = paidIds.length > 0 && paidIds.every((id) => selected.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allPaidSelected ? new Set() : new Set(paidIds));
  }

  return (
    <>
      {selected.size > 0 && (
        <form
          ref={formRef}
          action={bulkShipAction}
          onSubmit={() => setSelected(new Set())}
          className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#2b337d]/30 bg-[#2b337d]/[0.04] px-5 py-4"
        >
          {[...selected].map((id) => (
            <input key={id} type="hidden" name="ids" value={id} />
          ))}
          <span className="text-sm font-semibold text-[#2b337d]">
            {selected.size} selected
          </span>
          <select
            name="courier"
            defaultValue=""
            className="rounded-xl border border-[#dcdfee] bg-white px-3 py-2 text-sm outline-none focus:border-[#2b337d]"
          >
            <option value="">Courier (optional)</option>
            {COURIERS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl bg-[#2b337d] px-5 py-2 text-sm font-semibold text-white hover:bg-[#232a68]"
          >
            Mark {selected.size} shipped
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-sm text-[#6b7194] hover:text-[#2b337d]"
          >
            Clear
          </button>
          <span className="w-full text-xs text-[#9aa0c3]">
            Marks the selected paid orders shipped and emails each customer. Add tracking numbers
            per order with the Ship button.
          </span>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[#e3e5f0] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#e3e5f0] text-xs uppercase tracking-wider text-[#9aa0c3]">
            <tr>
              <th className="w-10 px-4 py-4">
                {paidIds.length > 0 && (
                  <input
                    type="checkbox"
                    aria-label="Select all paid orders"
                    checked={allPaidSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 accent-[#2b337d]"
                  />
                )}
              </th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Ship to</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-14 text-center text-[#9aa0c3]">
                  No orders match.
                </td>
              </tr>
            )}
            {orders.map((o) => {
              const selectable = o.status === "paid";
              return (
                <tr
                  key={o.id}
                  className={`border-b border-[#eef0f7] transition-colors last:border-0 hover:bg-[#f8f9fd] ${
                    selected.has(o.id) ? "bg-[#2b337d]/[0.03]" : ""
                  }`}
                >
                  <td className="px-4 py-4">
                    {selectable && (
                      <input
                        type="checkbox"
                        aria-label={`Select order ${o.id}`}
                        checked={selected.has(o.id)}
                        onChange={() => toggle(o.id)}
                        className="h-4 w-4 accent-[#2b337d]"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium text-[#2b337d] hover:underline">
                      {o.customer.name}
                    </Link>
                    <span className="block font-mono text-xs text-[#9aa0c3]">{o.id}</span>
                  </td>
                  <td className="px-6 py-4 text-[#6b7194]">
                    {o.customer.phone}
                    <span className="block text-xs">{o.customer.email}</span>
                  </td>
                  <td className="max-w-52 px-6 py-4 text-[#6b7194]">
                    {o.customer.city}, {o.customer.state} {o.customer.pincode}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    ₹{(o.amount / 100).toLocaleString("en-IN")}
                    {o.item && (
                      <span className="block text-xs font-normal text-[#9aa0c3]">
                        {o.item.replace("EVHERFIT Infinity Band — ", "")}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-6 py-4 text-xs text-[#9aa0c3]">
                    {new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {o.status === "paid" && <QuickShip orderId={o.id} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
