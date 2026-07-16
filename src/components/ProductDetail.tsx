"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { variantImages, type Variant } from "@/lib/product";
import ProductBuyPanel from "./ProductBuyPanel";
import Reveal from "./Reveal";

/**
 * Product hero: a real-photo gallery on the left and the buy panel on the right,
 * sharing one "selected offer" state so picking 1.5 kg / 2 kg / bundle swaps the
 * photos too. Falls back gracefully when an offer has a single image.
 */
export default function ProductDetail({
  variants,
  name,
  highlights,
}: {
  variants: Variant[];
  name: string;
  highlights: string[];
}) {
  const fallback = variants.find((v) => v.popular && !v.soldOut) ?? variants.find((v) => !v.soldOut) ?? variants[0];
  const [selected, setSelected] = useState(fallback.key);
  const [imgIndex, setImgIndex] = useState(0);

  const variant = variants.find((v) => v.key === selected) ?? fallback;
  const images = variantImages(selected);
  const active = images[imgIndex] ?? images[0];
  const alt = `${name} — ${variant.weight} (${variant.label})`;

  function selectOffer(key: string) {
    setSelected(key);
    setImgIndex(0);
  }

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
      {/* gallery */}
      <Reveal>
        <div>
          <div className="relative overflow-hidden rounded-3xl border border-line bg-card p-6 shadow-[0_2px_24px_rgba(43,51,125,0.06)]">
            <div className="absolute inset-12 -z-0 rounded-full bg-brand-soft blur-[60px]" />
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl"
            >
              <Image
                src={active}
                alt={alt}
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 560px"
                className="object-cover"
              />
            </motion.div>
          </div>

          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setImgIndex(i)}
                  aria-label={`View photo ${i + 1}`}
                  aria-pressed={i === imgIndex}
                  className={`relative aspect-[4/5] overflow-hidden rounded-2xl border bg-card transition-all ${
                    i === imgIndex
                      ? "border-brand shadow-[0_4px_16px_rgba(43,51,125,0.15)]"
                      : "border-line hover:border-brand/40"
                  }`}
                >
                  <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      {/* info + buy */}
      <Reveal delay={0.15}>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Be the woman</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-brand sm:text-5xl">
            {name}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted">
            <span className="text-accent" aria-label="4.9 out of 5 stars">★★★★★</span>
            4.9 · 214 reviews
          </p>

          <ul className="mt-6 space-y-2.5">
            {highlights.map((h) => (
              <li key={h} className="flex gap-3 text-[0.95rem] leading-relaxed text-foreground/80">
                <span className="mt-0.5 text-accent">✓</span>
                {h}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <ProductBuyPanel variants={variants} selected={selected} onSelect={selectOffer} />
          </div>
        </div>
      </Reveal>
    </div>
  );
}
