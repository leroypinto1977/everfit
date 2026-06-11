"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent, useTransform } from "motion/react";
import BandVisual, { type BandScreen } from "./BandVisual";

const panels: { screen: BandScreen; kicker: string; title: string; body: string }[] = [
  {
    screen: "heart",
    kicker: "Optical HR sensor",
    title: "Your heart, every second.",
    body: "A 4-LED optical sensor samples continuously — resting rate, training zones and recovery alerts, with vibration warnings when you redline.",
  },
  {
    screen: "cycle",
    kicker: "Cycle intelligence",
    title: "In sync with her.",
    body: "Cycle and ovulation tracking built in, not bolted on — phase-aware training suggestions and gentle predictions that learn your rhythm.",
  },
  {
    screen: "sleep",
    kicker: "Sleep lab on your wrist",
    title: "Wake up stronger.",
    body: "Light, deep and REM stages tracked through the night, scored every morning. Silent smart alarms wake you at the lightest point of your sleep.",
  },
  {
    screen: "battery",
    kicker: "14-day battery",
    title: "Charge it. Forget it.",
    body: "A full charge lasts two weeks of 24/7 tracking. The magnetic puck takes it from zero to full in under an hour.",
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

  const rotate = useTransform(scrollYProgress, [0, 1], [-10, 10]);

  return (
    <section id="showcase" ref={ref} className="relative" style={{ height: `${panels.length * 100}vh` }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-brand-bright/15 blur-[130px]" />

        <div className="mx-auto grid w-full max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
          {/* pinned band, screen swaps with the active panel */}
          <motion.div style={{ rotate }} className="relative mx-auto w-60 sm:w-72">
            <div className="absolute inset-0 -z-10 rounded-full bg-brand-bright/20 blur-[70px]" />
            <motion.div
              key={panels[active].screen}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <BandVisual screen={panels[active].screen} className="w-full drop-shadow-2xl" />
            </motion.div>
          </motion.div>

          {/* text crossfades */}
          <div className="relative min-h-[260px]">
            {panels.map((panel, i) => (
              <motion.div
                key={panel.screen}
                className="absolute inset-0"
                animate={{
                  opacity: active === i ? 1 : 0,
                  y: active === i ? 0 : active > i ? -28 : 28,
                }}
                transition={{ duration: 0.5, ease: [0.21, 0.65, 0.36, 1] }}
              >
                <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">{panel.kicker}</p>
                <h3 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{panel.title}</h3>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">{panel.body}</p>
              </motion.div>
            ))}

            {/* progress dots */}
            <div className="absolute -left-10 top-2 hidden flex-col gap-3 lg:flex">
              {panels.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    active === i ? "scale-125 bg-accent" : "bg-line"
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
