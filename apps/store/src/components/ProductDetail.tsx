"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { m } from "motion/react";
import { variantImages, type Variant } from "@everfit/core/lib/product";
import ProductBuyPanel from "./ProductBuyPanel";
import Reveal from "./Reveal";

/**
 * Product hero: a real-photo gallery on the left and the buy panel on the right,
 * sharing one "selected offer" state so picking Light / Heavy / Combo swaps the
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

  /*
   * Deep links: /product?v=light | heavy | combo (the marketing names), and the
   * raw variant keys work too. Resolved on the client rather than from the
   * page's searchParams on purpose — touching searchParams server-side would
   * opt this route out of static rendering, and a marketing landing page that
   * has to be rendered per request is a bad trade for preselecting a chip.
   *
   * A link to a sold-out variant still selects it, so the visitor sees the
   * thing they clicked marked sold out rather than silently landing on a
   * different one.
   *
   * This reads an external system (the URL) exactly once after hydration, which
   * is the case set-state-in-effect exists to permit rather than forbid. The two
   * alternatives are both worse here: resolving it during render would make the
   * client's first render disagree with the server HTML and break hydration, and
   * useSearchParams() would force a Suspense bailout that empties the product
   * hero out of the static HTML that search engines read.
   */
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("v")?.trim().toLowerCase();
    if (!wanted) return;
    const match = variants.find(
      (v) => v.key.toLowerCase() === wanted || v.label.toLowerCase() === wanted
    );
    if (!match) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setSelected(match.key);
    setImgIndex(0);
  }, [variants]);

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
            <m.div
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
            </m.div>
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
