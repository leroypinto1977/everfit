"use client";

import { motion } from "motion/react";
import Reveal from "./Reveal";
import { InfinityMark } from "./Logo";

const pillars = [
  {
    title: "Vision",
    body: "A world where women embrace lifelong wellness, strength and vitality — achieving infinite health through empowered, balanced living.",
  },
  {
    title: "Mission",
    body: "To support women on their fitness journey with specialised equipment and guidance that promote sustainable health, strength and longevity — inspired by the infinite potential within every woman.",
  },
];

/** The emotional core of the hub — the infinity story, plus vision & mission. */
export default function BrandStory() {
  return (
    <section id="story" className="relative overflow-hidden bg-card">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 sm:py-32 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        {/* big drawn infinity mark */}
        <Reveal className="order-2 lg:order-1">
          <div className="relative mx-auto w-full max-w-md">
            <div className="animate-breathe absolute inset-10 -z-10 rounded-full bg-brand/10 blur-[80px]" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.21, 0.65, 0.36, 1] }}
              className="text-brand"
            >
              <InfinityMark className="w-full" draw />
            </motion.div>
            <p className="mt-6 text-center text-xs uppercase tracking-[0.4em] text-muted">
              The mark of infinite health
            </p>
          </div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <Reveal>
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">The story of infinite health</p>
            <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-brand sm:text-5xl">
              Fitness isn&apos;t a finish line.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              At the heart of EVHERFIT, the infinity mark stands for limitless
              health and longevity. Fitness isn&apos;t a final goal — it&apos;s a
              lifelong loop of strength, balance and continuous growth. We&apos;re
              here to support women at every stage, with the tools and guidance to
              live with vitality, confidence and purpose — now and always.
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.12}>
                <div className="h-full rounded-3xl border border-line bg-background/60 p-7">
                  <h3 className="font-display text-xl font-bold text-brand">{p.title}</h3>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
