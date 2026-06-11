"use client";

import { motion } from "motion/react";

export default function KpiCard({
  label,
  value,
  hint,
  index = 0,
}: {
  label: string;
  value: string;
  hint?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.21, 0.65, 0.36, 1] }}
      className="rounded-2xl border border-[#e3e5f0] bg-white p-6"
    >
      <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#6b7194]">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold italic text-[#2b337d]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[#9aa0c3]">{hint}</p>}
    </motion.div>
  );
}
