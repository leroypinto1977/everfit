"use client";

import Link from "next/link";
import { VARIANTS, inr, type Variant } from "@/lib/product";
import Reveal from "./Reveal";
import Magnetic from "./Magnetic";

export default function Pricing({ variants = VARIANTS }: { variants?: Variant[] }) {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-32">
      <Reveal>
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">Pick your weight</p>
        <h2 className="font-display text-4xl font-bold tracking-tight text-brand sm:text-6xl">
          Start light. <span className="text-foreground/60">Grow infinite.</span>
        </h2>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Every option is a pair — one band for each wrist or ankle. Free shipping
          across India, 7-day returns.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {variants.map((v, i) => (
          <Reveal key={v.key} delay={i * 0.12}>
            <div
              className={`relative flex h-full flex-col rounded-3xl border p-8 ${
                v.popular
                  ? "border-brand bg-brand text-white shadow-[0_24px_60px_rgba(43,51,125,0.35)]"
                  : "border-line bg-card shadow-[0_2px_20px_rgba(43,51,125,0.05)]"
              }`}
            >
              {v.popular && (
                <span className="absolute -top-3.5 left-8 rounded-full bg-accent px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  Most popular
                </span>
              )}
              <p className={`font-display text-lg font-bold ${v.popular ? "text-accent-soft" : "text-accent"}`}>
                {v.label}
              </p>
              <p className={`mt-2 font-display text-4xl font-bold ${v.popular ? "text-white" : "text-brand"}`}>
                {v.weight}
              </p>
              <p className={`mt-3 text-sm leading-relaxed ${v.popular ? "text-white/75" : "text-muted"}`}>
                {v.blurb}
              </p>

              <div className="mt-8 flex items-baseline gap-3">
                <span className={`font-display text-3xl font-bold ${v.popular ? "text-white" : "text-foreground"}`}>
                  {inr(v.price)}
                </span>
                <span className={`line-through ${v.popular ? "text-white/50" : "text-muted/60"}`}>
                  {inr(v.mrp)}
                </span>
              </div>

              {v.soldOut ? (
                <span
                  className={`mt-6 block cursor-not-allowed rounded-full py-3.5 text-center font-display font-bold opacity-50 ${
                    v.popular ? "bg-white/60 text-brand" : "bg-line text-muted"
                  }`}
                >
                  Sold out
                </span>
              ) : (
                <Magnetic strength={0.25}>
                  <Link
                    href={`/checkout?w=${v.key}`}
                    className={`mt-6 block rounded-full py-3.5 text-center font-display font-bold transition hover:brightness-95 ${
                      v.popular ? "bg-white text-brand" : "bg-brand text-white"
                    }`}
                  >
                    Buy {v.label.toLowerCase()} →
                  </Link>
                </Magnetic>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
