"use client";

import Link from "next/link";
import { motion } from "motion/react";
import ProductVisual from "./ProductVisual";
import Reveal from "./Reveal";
import Magnetic from "./Magnetic";

const points = ["Contoured for her", "Iron-sand core", "Wear anywhere"];

/** Condensed band teaser — curiosity here, full detail + buy on /product. */
export default function GearTeaser() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 sm:py-32 lg:grid-cols-2 lg:gap-14">
        {/* band visual */}
        <Reveal className="order-2 lg:order-1">
          <div className="relative mx-auto w-72 sm:w-96">
            <div className="animate-breathe absolute inset-8 -z-10 rounded-full bg-accent/15 blur-[70px]" />
            <motion.div
              initial={{ opacity: 0, y: 40, rotate: -6 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease: [0.21, 0.65, 0.36, 1] }}
              className="animate-float-slow"
            >
              <ProductVisual view="loop" className="w-full" />
            </motion.div>
          </div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <Reveal>
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">Train with the gear</p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-brand sm:text-6xl">
              The Infinity Band.
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              Weighted resistance bands designed for her — an iron-sand core in a
              soft silicone shell. Strap in and turn every walk, flow and lift into
              strength training. Strong is infinite.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <ul className="mt-8 flex flex-wrap gap-3">
              {points.map((p) => (
                <li
                  key={p}
                  className="rounded-full border border-line bg-card px-5 py-2 text-sm font-medium text-foreground/80"
                >
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Magnetic>
                <Link
                  href="/product"
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-8 py-4 font-display text-base font-bold text-white transition hover:brightness-95"
                >
                  Explore the band
                  <span>→</span>
                </Link>
              </Magnetic>
              <span className="text-sm text-muted">Pairs from ₹1,499 · free shipping</span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
