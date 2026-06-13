"use client";

import { useState } from "react";
import { COURIERS } from "@/lib/couriers";
import { markShippedAction } from "./actions";

/**
 * Inline "ship" control for paid orders in the list — expands to a courier
 * picker + tracking field, posts to the same server action the detail page
 * uses (sends the shipping email, revalidates the list).
 */
export default function QuickShip({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-[#dcdfee] px-3 py-1.5 text-xs font-semibold text-[#2b337d] hover:border-[#2b337d]/50"
      >
        Ship
      </button>
    );
  }

  return (
    <form action={markShippedAction} className="flex items-center gap-1.5">
      <input type="hidden" name="id" value={orderId} />
      <select
        name="courier"
        defaultValue=""
        className="rounded-lg border border-[#dcdfee] bg-white px-2 py-1.5 text-xs outline-none focus:border-[#2b337d]"
      >
        <option value="">Courier</option>
        {COURIERS.map((c) => (
          <option key={c.key} value={c.key}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        name="tracking"
        placeholder="Tracking #"
        className="w-28 rounded-lg border border-[#dcdfee] px-2 py-1.5 text-xs outline-none focus:border-[#2b337d]"
      />
      <button
        type="submit"
        className="rounded-lg bg-[#2b337d] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#232a68]"
      >
        Go
      </button>
    </form>
  );
}
