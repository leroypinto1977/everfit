"use client";

import ProductVisual, { type ProductView } from "./ProductVisual";
import Reveal from "./Reveal";

const panels: { view: ProductView; kicker: string; title: string; body: string }[] = [
  {
    view: "loop",
    kicker: "Wraps right",
    title: "Curves of power.",
    body: "The band wraps your wrist or ankle like it was poured there — contoured silicone, zero bounce, comfortable through a full hour of movement.",
  },
  {
    view: "core",
    kicker: "Iron-sand core",
    title: "Soft outside. Iron inside.",
    body: "Fine iron sand in segmented pods spreads the load evenly around the joint — none of the dig and clunk of solid metal weights.",
  },
  {
    view: "strap",
    kicker: "Dual-lock strap",
    title: "Locks in. Lets go never.",
    body: "A wide hook-and-loop strap pulls through a steel D-ring and folds back on itself. It holds through burpees, box jumps and everything between.",
  },
  {
    view: "pair",
    kicker: "Sold as a pair",
    title: "Balance, by design.",
    body: "Two bands in every box — one for each side, so your body trains symmetrically. Stack both on one ankle when you want more.",
  },
];

/**
 * The band, view by view. Plain stacked rows (image + copy), alternating sides
 * on desktop — scrolls naturally, no scroll-jacking / pinned sections.
 */
export default function Showcase() {
  return (
    <section id="showcase" className="bg-card">
      <div className="mx-auto max-w-7xl space-y-20 px-6 py-20 sm:py-28 lg:space-y-28">
        {panels.map((panel, i) => {
          const flip = i % 2 === 1;
          return (
            <Reveal key={panel.view}>
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className={`relative mx-auto w-60 sm:w-80 ${flip ? "lg:order-2" : ""}`}>
                  <div className="absolute inset-8 -z-10 rounded-full bg-brand-soft blur-[60px]" />
                  <ProductVisual view={panel.view} className="w-full" />
                </div>
                <div className={flip ? "lg:order-1" : ""}>
                  <p className="mb-3 text-xs uppercase tracking-[0.3em] text-accent">{panel.kicker}</p>
                  <h3 className="font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl lg:text-5xl">
                    {panel.title}
                  </h3>
                  <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">{panel.body}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
