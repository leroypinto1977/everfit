"use client";

import { useState } from "react";
import { motion } from "motion/react";
import ProductVisual, { type ProductView } from "./ProductVisual";

const views: { view: ProductView; label: string }[] = [
  { view: "loop", label: "As worn" },
  { view: "core", label: "Iron-sand core" },
  { view: "strap", label: "Dual-lock strap" },
  { view: "pair", label: "The pair" },
];

export default function ProductGallery() {
  const [active, setActive] = useState<ProductView>("loop");

  return (
    <div>
      <div className="relative rounded-3xl border border-line bg-card p-10 shadow-[0_2px_24px_rgba(43,51,125,0.06)]">
        <div className="absolute inset-12 -z-0 rounded-full bg-brand-soft blur-[60px]" />
        <motion.div
          key={active}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative"
        >
          <ProductVisual view={active} className="mx-auto w-full max-w-md" />
        </motion.div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3">
        {views.map((v) => (
          <button
            key={v.view}
            type="button"
            onClick={() => setActive(v.view)}
            aria-pressed={active === v.view}
            className={`rounded-2xl border bg-card p-3 transition-all ${
              active === v.view
                ? "border-brand shadow-[0_4px_16px_rgba(43,51,125,0.15)]"
                : "border-line hover:border-brand/40"
            }`}
          >
            <ProductVisual view={v.view} className="w-full" />
            <span className={`mt-1 block text-[0.65rem] uppercase tracking-wider ${active === v.view ? "text-brand" : "text-muted"}`}>
              {v.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
