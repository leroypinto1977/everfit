"use client";

import { useRef } from "react";
import { motion, useInView, useMotionValue, useSpring, useMotionValueEvent } from "motion/react";
import { useState } from "react";

function Counter({ to, suffix = "", duration = 1.6 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = useState("0");

  if (inView && mv.get() === 0) mv.set(to);

  useMotionValueEvent(spring, "change", (v) => {
    setDisplay(Math.round(v).toLocaleString("en-IN"));
  });

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

const stats = [
  { value: 2, suffix: " bands", label: "In every box" },
  { value: 3, suffix: " weights", label: "0.5 to 2 kg per band" },
  { value: 120, suffix: "+ washes", label: "Tested, zero leaks" },
  { value: 1, suffix: "-year", label: "Warranty included" },
];

export default function Stats() {
  return (
    <section className="border-y border-line bg-brand-soft/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="px-6 py-10 text-center sm:px-8 sm:py-14"
          >
            <p className="font-display text-3xl font-bold text-brand sm:text-4xl lg:text-5xl">
              <Counter to={s.value} suffix={s.suffix} />
            </p>
            <p className="mt-3 text-sm uppercase tracking-[0.2em] text-muted">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
