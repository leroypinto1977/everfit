"use client";

import { m, type Variants } from "motion/react";

// `opacity` and `y` only — deliberately no `filter`. A blur filter is not a
// compositor-only property: every element carrying one gets its own render
// surface, and animating the radius re-rasterizes that whole subtree on every
// frame. Reveal wraps ~36 blocks, so a blur here meant a phone permanently held
// several times its own viewport in blurred surfaces and re-rastered a section
// of it on every scroll — the same trap globals.css documents for the glows.
const variants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.21, 0.65, 0.36, 1] },
  }),
};

/** Fades + slides children in when they scroll into view. */
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <m.div
      className={className}
      variants={variants}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </m.div>
  );
}
