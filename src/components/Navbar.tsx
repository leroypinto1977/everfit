"use client";

import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import Magnetic from "./Magnetic";
import { InfinityMark } from "./Logo";

const links = [
  { href: "#features", label: "Features" },
  { href: "#showcase", label: "Her health" },
  { href: "#specs", label: "Specs" },
  { href: "#reviews", label: "Reviews" },
];

export default function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.21, 0.65, 0.36, 1], delay: 0.2 }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/70 backdrop-blur-xl border-b border-line"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <InfinityMark className="h-5 text-accent" />
          <span className="font-display text-xl font-bold tracking-tight">EVHERFIT</span>
        </Link>

        <ul className="hidden gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="group relative text-sm text-muted transition-colors hover:text-foreground"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        <Magnetic>
          <Link
            href="/checkout"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-transform hover:scale-105 active:scale-95"
          >
            Buy now — ₹2,999
          </Link>
        </Magnetic>
      </nav>
    </motion.header>
  );
}
