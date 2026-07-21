"use client";

import { useState } from "react";
import Link from "next/link";
import { VARIANTS, inr, type Variant } from "@/lib/product";
import Magnetic from "./Magnetic";

export default function ProductBuyPanel({
  variants = VARIANTS,
  selected,
  onSelect,
}: {
  variants?: Variant[];
  /** Controlled selected key. When omitted the panel manages its own state. */
  selected?: string;
  onSelect?: (key: string) => void;
}) {
  const fallback = variants.find((v) => v.popular && !v.soldOut) ?? variants.find((v) => !v.soldOut) ?? variants[0];
  const [internal, setInternal] = useState(fallback.key);
  const variantKey = selected ?? internal;
  const setVariantKey = onSelect ?? setInternal;
  const variant = variants.find((v) => v.key === variantKey) ?? fallback;

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-4xl font-bold text-brand">{inr(variant.price)}</span>
        <span className="text-lg text-muted line-through">{inr(variant.mrp)}</span>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
          Save {inr(variant.mrp - variant.price)}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">Price for the set · Free shipping · Inclusive of all taxes</p>

      <p className="mt-7 text-sm font-semibold uppercase tracking-[0.15em] text-muted">Choose your resistance</p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {variants.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setVariantKey(v.key)}
            aria-pressed={v.key === variant.key}
            className={`relative rounded-2xl border px-2 py-4 text-center transition-all sm:px-3 ${
              v.key === variant.key
                ? "border-brand bg-brand text-white shadow-[0_8px_24px_rgba(43,51,125,0.25)]"
                : "border-line bg-card text-foreground hover:border-brand/40"
            } ${v.soldOut ? "opacity-60" : ""}`}
          >
            {v.popular && !v.soldOut && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">
                Best value
              </span>
            )}
            {v.soldOut && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-line px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-muted">
                Sold out
              </span>
            )}
            <span className="block font-display text-lg font-bold">{v.weight}</span>
            <span className={`mt-1 block text-xs ${v.key === variant.key ? "text-white/70" : "text-muted"}`}>
              {v.label} · {inr(v.price)}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        {variant.soldOut ? (
          <span className="block cursor-not-allowed rounded-full bg-line py-4 text-center font-display text-lg font-bold text-muted">
            Sold out · back soon
          </span>
        ) : (
          <Magnetic strength={0.25}>
            <Link
              href={`/checkout?w=${variant.key}`}
              className="block rounded-full bg-brand py-4 text-center font-display text-lg font-bold text-white transition hover:brightness-95"
            >
              Buy now · {inr(variant.price)} →
            </Link>
          </Magnetic>
        )}
        <p className="mt-3 text-center text-xs text-muted">
          Secure checkout via Razorpay · UPI, cards, netbanking & EMI · 7-day returns
        </p>
      </div>
    </div>
  );
}
