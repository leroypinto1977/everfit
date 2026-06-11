"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Reveal from "./Reveal";

const features = [
  {
    icon: "🌸",
    title: "Cycle insights",
    body: "Phase predictions, ovulation windows and training suggestions tuned to your rhythm — private by design.",
  },
  {
    icon: "🏃‍♀️",
    title: "110+ sport modes",
    body: "Running, lifting, yoga, HIIT, swimming — auto-detection starts tracking when you do.",
  },
  {
    icon: "💧",
    title: "5 ATM waterproof",
    body: "Pool sessions, monsoon runs, cold showers. Rated to 50 metres — wear it everywhere.",
  },
  {
    icon: "⌚",
    title: "1.47″ AMOLED",
    body: "A bright, always-on display with 100+ watch faces. Readable in direct sunlight at 600 nits.",
  },
  {
    icon: "🔋",
    title: "14-day battery",
    body: "Two full weeks of 24/7 tracking on one charge. Magnetic fast-charge in 60 minutes.",
  },
  {
    icon: "🛡️",
    title: "1-year warranty",
    body: "Free replacement for manufacturing defects, plus 7-day no-questions returns.",
  },
];

function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [8, -8]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-8, 8]), { stiffness: 200, damping: 20 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
      }}
      onMouseLeave={() => {
        mx.set(0.5);
        my.set(0.5);
      }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className="group relative h-full rounded-3xl border border-line bg-card p-8 transition-colors duration-300 hover:border-accent/40"
    >
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-accent/8 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      {children}
    </motion.div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl px-6 py-32">
      <Reveal>
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">Why Pulse</p>
        <h2 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
          Made for her.
          <br />
          <span className="text-muted">Down to the last detail.</span>
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 0.12}>
            <TiltCard>
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-5 font-display text-xl font-bold">{f.title}</h3>
              <p className="mt-3 leading-relaxed text-muted">{f.body}</p>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
