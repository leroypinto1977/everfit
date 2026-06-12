"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent, useTransform } from "motion/react";
import ProductVisual, { type ProductView } from "./ProductVisual";

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

export default function Showcase() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setActive(Math.min(panels.length - 1, Math.floor(p * panels.length)));
  });

  const rotate = useTransform(scrollYProgress, [0, 1], [-8, 8]);

  return (
    <section id="showcase" ref={ref} className="relative bg-card" style={{ height: `${panels.length * 100}vh` }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-brand/8 blur-[130px]" />

        <div className="mx-auto grid w-full max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
          {/* pinned product, view swaps with the active panel */}
          <motion.div style={{ rotate }} className="relative mx-auto w-72 sm:w-96">
            <div className="absolute inset-8 -z-10 rounded-full bg-brand-soft blur-[60px]" />
            <motion.div
              key={panels[active].view}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <ProductVisual view={panels[active].view} className="w-full" />
            </motion.div>
          </motion.div>

          {/* text crossfades */}
          <div className="relative min-h-[280px]">
            {panels.map((panel, i) => (
              <motion.div
                key={panel.view}
                className="absolute inset-0"
                animate={{
                  opacity: active === i ? 1 : 0,
                  y: active === i ? 0 : active > i ? -28 : 28,
                }}
                transition={{ duration: 0.5, ease: [0.21, 0.65, 0.36, 1] }}
              >
                <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">{panel.kicker}</p>
                <h3 className="font-display text-4xl font-bold tracking-tight text-brand sm:text-5xl">{panel.title}</h3>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">{panel.body}</p>
              </motion.div>
            ))}

            {/* progress dots */}
            <div className="absolute -left-10 top-2 hidden flex-col gap-3 lg:flex">
              {panels.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    active === i ? "scale-125 bg-brand" : "bg-line"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
