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
  { value: 14, suffix: " days", label: "Battery life" },
  { value: 110, suffix: "+", label: "Workout modes" },
  { value: 50, suffix: "m", label: "Water resistance" },
  { value: 600, suffix: " nits", label: "Display brightness" },
];

export default function Stats() {
  return (
    <section id="specs" className="border-y border-line bg-card/50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="px-8 py-14 text-center"
          >
            <p className="font-display text-4xl font-bold text-accent sm:text-5xl">
              <Counter to={s.value} suffix={s.suffix} />
            </p>
            <p className="mt-3 text-sm uppercase tracking-[0.2em] text-muted">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
