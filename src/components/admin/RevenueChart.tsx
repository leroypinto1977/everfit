"use client";

import { motion } from "motion/react";

export interface DayPoint {
  label: string; // e.g. "3 Jun"
  revenue: number; // rupees
  orders: number;
}

/** 14-day revenue bar chart — bars grow in on mount, tooltip on hover. */
export default function RevenueChart({ days }: { days: DayPoint[] }) {
  const max = Math.max(...days.map((d) => d.revenue), 1);

  return (
    <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">Revenue — last 14 days</h2>
        <span className="text-xs text-[#9aa0c3]">paid orders only</span>
      </div>

      <div className="mt-6 flex h-48 items-end gap-2">
        {days.map((d, i) => (
          <div key={d.label} className="group relative flex h-full flex-1 flex-col justify-end">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max((d.revenue / max) * 100, d.revenue > 0 ? 4 : 1.5)}%` }}
              transition={{ delay: 0.2 + i * 0.05, duration: 0.6, ease: [0.21, 0.65, 0.36, 1] }}
              className={`w-full rounded-t-md ${d.revenue > 0 ? "bg-[#2b337d] group-hover:bg-[#ef6fa7]" : "bg-[#e3e5f0]"} transition-colors`}
            />
            {/* tooltip */}
            <div className="pointer-events-none absolute -top-12 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1c2030] px-3 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              ₹{d.revenue.toLocaleString("en-IN")} · {d.orders} order{d.orders === 1 ? "" : "s"}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-2 text-[0.6rem] text-[#9aa0c3]">
        {days.map((d) => (
          <span key={d.label} className="flex-1 truncate text-center">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
