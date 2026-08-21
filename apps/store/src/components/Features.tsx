"use client";

import { useRef } from "react";
import { m, useMotionValue, useSpring, useTransform } from "motion/react";
import Reveal from "./Reveal";

const features = [
  {
    icon: "🌸",
    title: "Made for her",
    body: "Comfortable foam grips and manageable resistance levels, built around how women actually train.",
  },
  {
    icon: "🎨",
    title: "Colour-coded resistance",
    body: "Blue is 4.5 kg, red is 9 kg. Pick your level at a glance, or clip both bands together for more.",
  },
  {
    icon: "🚶‍♀️",
    title: "Full-body workout",
    body: "Presses, rows, curls, squats, glute work and more. Toning, strength, HIIT, pilates and mobility.",
  },
  {
    icon: "🔒",
    title: "Clip-on handles",
    body: "Padded foam handles attach to the band with metal carabiners, so you swap bands in seconds, no tools.",
  },
  {
    icon: "🎒",
    title: "Train anywhere",
    body: "Light, packable latex band coils down small. Home, gym, park or travel, it comes with you.",
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
    <m.div
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
      className="group relative h-full rounded-3xl border border-line bg-card p-8 shadow-[0_2px_20px_rgba(43,51,125,0.05)] transition-colors duration-300 hover:border-brand/30"
    >
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-soft/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      {children}
    </m.div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl px-6 py-20 sm:py-32">
      <Reveal>
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">Why Infinity</p>
        <h2 className="font-display text-4xl font-bold tracking-tight text-brand sm:text-6xl">
          Made for her.
          <br />
          <span className="text-foreground/60">Down to the last detail.</span>
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 0.12}>
            <TiltCard>
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-5 font-display text-xl font-bold text-brand">{f.title}</h3>
              <p className="mt-3 leading-relaxed text-muted">{f.body}</p>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
