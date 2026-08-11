"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import SplitText from "./SplitText";
import Magnetic from "./Magnetic";
import { InfinityMark } from "./Logo";

const proof = [
  { value: "7+", label: "Years coaching" },
  { value: "20,000+", label: "Women transformed" },
  { value: "100%", label: "Home workouts" },
];

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // parallax: content fades out on scroll
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const portraitY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  return (
    <section ref={ref} className="relative flex min-h-screen items-center overflow-hidden pb-16 pt-28">
      {/* giant watermark infinity behind the portrait */}
      <div className="pointer-events-none absolute -right-44 top-1/4 hidden w-[760px] text-brand opacity-[0.05] lg:block">
        <InfinityMark className="w-full" draw />
      </div>

      {/* soft brand glows */}
      <div className="animate-breathe absolute -left-40 top-1/4 h-[480px] w-[480px] rounded-full bg-brand/10 blur-[140px]" />
      <div className="absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-accent/15 blur-[120px]" />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* copy */}
        <motion.div style={{ opacity: textOpacity, y: textY }} className="text-center lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-brand"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Women-centered fitness, at home
          </motion.p>

          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="not-italic block text-foreground">
              <SplitText text="You take care of everyone." delay={0.3} />
            </span>
            <span className="relative italic mt-1 inline-block text-brand">
              <SplitText text="Now it&apos;s your turn." delay={0.65} />
              <span className="absolute -bottom-2 left-0 h-[3px] w-16 rounded-full bg-brand" />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.7 }}
            className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted lg:mx-0"
          >
            Fitness at home, built <span className="font-semibold text-brand">by women, for women.</span>
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.7 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-5 lg:justify-start"
          >
            <Magnetic>
              <a
                href="#programs"
                className="rounded-full bg-brand px-8 py-4 font-display text-base font-bold text-white transition hover:brightness-95"
              >
                Start at home
              </a>
            </Magnetic>
            <Link href="/product" className="group text-sm text-muted transition-colors hover:text-brand">
              Shop the band
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.7 }}
            className="mt-12 flex items-center justify-center gap-8 lg:justify-start"
          >
            {proof.map((p) => (
              <li key={p.label} className="text-center lg:text-left">
                <p className="font-display text-2xl font-bold text-brand sm:text-3xl">{p.value}</p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.15em] text-muted sm:text-xs">{p.label}</p>
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* founder portrait — the face 20,000+ women already trust */}
        <motion.div style={{ y: portraitY }} className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.9, ease: [0.21, 0.65, 0.36, 1] }}
            className="relative mx-auto aspect-[4/5] w-full max-w-sm rounded-[2rem] bg-gradient-to-br from-brand to-brand-deep shadow-[0_24px_70px_rgba(43,51,125,0.3)] lg:max-w-md"
          >
            {/* Dedicated clip layer: its own compositing context (translateZ)
                keeps the scaled portrait clipped to the rounded frame even
                after Framer strips the parent transform — Safari/iOS otherwise
                fails to clip a composited (scaled) child to a rounded parent. */}
            <div className="absolute inset-0 overflow-hidden rounded-[2rem] [transform:translateZ(0)]">
              <Image
                src="/manjula.jpg"
                alt="Manjula Narayanan, founder of EVHERFIT and women's fitness coach"
                fill
                priority
                quality={95}
                sizes="(max-width: 640px) 90vw, 700px"
                className="object-cover object-[44.2%_50%] scale-[1]"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 rounded-b-[2rem] bg-gradient-to-t from-brand-deep/85 via-brand-deep/30 to-transparent p-7">
              <p className="font-display text-2xl font-bold leading-none text-white">Manjula Narayanan</p>
              <p className="mt-2 text-xs uppercase tracking-[0.25em] text-white/75">
                Founder · Women&apos;s fitness coach
              </p>
            </div>
          </motion.div>

          {/* floating credibility chip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.7 }}
            className="absolute -left-2 top-8 hidden rounded-2xl border border-line bg-card/95 px-5 py-3 shadow-[0_12px_36px_rgba(43,51,125,0.16)] backdrop-blur sm:block lg:-left-8"
          >
            <p className="font-display text-sm font-bold text-brand">Tamil Nadu&apos;s trusted coach</p>
            <p className="mt-0.5 text-xs text-muted">for women&apos;s fitness at home</p>
          </motion.div>
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        style={{ opacity: textOpacity }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-muted lg:block"
      >
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="block"
        >
          Scroll ↓
        </motion.span>
      </motion.div>
    </section>
  );
}
