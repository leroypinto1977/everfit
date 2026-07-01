"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import Magnetic from "./Magnetic";
import { InfinityMark } from "./Logo";
import { PROGRAMS } from "@/lib/programs";

const SCROLL_OFFSET = -80; // clear the fixed header when scrolling to a section

export default function Navbar() {
  const pathname = usePathname() || "/";
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Recompute the shrink/blur state + which section the upper-third of the
  // viewport is over. Runs on every Lenis scroll frame (real wheel scrolling
  // goes through Lenis), with a native scroll listener as a fallback.
  const refresh = useCallback(() => {
    setScrolled(window.scrollY > 40);
    if (pathname !== "/") {
      setActiveSection(null);
      return;
    }
    const probeY = window.innerHeight * 0.35;
    let current: string | null = null;
    for (const id of ["story", "programs"]) {
      const el = document.getElementById(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.top <= probeY && r.bottom > probeY) {
        current = id;
        break;
      }
    }
    setActiveSection((prev) => (prev === current ? prev : current));
  }, [pathname]);

  const lenis = useLenis(refresh, [refresh]);
  useEffect(() => {
    refresh();
    window.addEventListener("scroll", refresh, { passive: true });
    return () => window.removeEventListener("scroll", refresh);
  }, [refresh]);

  const active =
    pathname.startsWith("/product")
      ? "band"
      : pathname.startsWith("/track")
        ? "track"
        : pathname === "/"
          ? activeSection
          : null;

  // --- in-page anchor navigation (smooth via Lenis, no full reload) ---
  function goToSection(id: string, e?: React.MouseEvent) {
    e?.preventDefault();
    setMenuOpen(false);
    if (pathname === "/") {
      const el = document.getElementById(id);
      if (el) {
        if (lenis) lenis.scrollTo(el, { offset: SCROLL_OFFSET });
        else el.scrollIntoView({ behavior: "smooth" });
        window.history.replaceState(null, "", `/#${id}`);
      }
    } else {
      router.push(`/#${id}`); // ScrollManager scrolls once home mounts
    }
  }

  function goTop(e?: React.MouseEvent) {
    if (pathname === "/") {
      e?.preventDefault();
      if (lenis) lenis.scrollTo(0);
      else window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.replaceState(null, "", "/");
    }
  }

  // --- Programs hover dropdown ---
  const [menuOpen, setMenuOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenuOpen(true);
  };
  const closeMenu = () => {
    closeTimer.current = setTimeout(() => setMenuOpen(false), 130);
  };

  // --- mobile drawer ---
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    setMobileOpen(false); // close on route change
  }, [pathname]);

  // Lock background scroll while the mobile drawer is open. Lenis owns the
  // scroll, so pause it (stop/start) and hide overflow as a belt-and-braces.
  useEffect(() => {
    if (!mobileOpen) return;
    lenis?.stop();
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      lenis?.start();
      html.style.overflow = prevOverflow;
    };
  }, [mobileOpen, lenis]);

  const linkBase = "group relative text-sm transition-colors";
  const underline = (on: boolean) =>
    `pointer-events-none absolute -bottom-1 left-0 h-px bg-brand transition-all duration-300 ${
      on ? "w-full" : "w-0 group-hover:w-full"
    }`;
  const tone = (on: boolean) => (on ? "text-brand" : "text-muted hover:text-brand");

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.21, 0.65, 0.36, 1], delay: 0.2 }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-card/80 backdrop-blur-xl border-b border-line shadow-[0_1px_24px_rgba(43,51,125,0.06)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" onClick={goTop} className="flex items-center gap-2.5 text-brand">
          <InfinityMark className="h-5" />
          <span className="font-display text-xl font-bold tracking-tight">EVHERFIT</span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {/* Programs — hover dropdown + click scrolls to the section */}
          <li className="relative" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
            <button
              type="button"
              onClick={(e) => goToSection("programs", e)}
              className={`${linkBase} flex items-center gap-1.5 ${tone(active === "programs" || menuOpen)}`}
            >
              Programs
              <span className={`text-[0.6rem] transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`}>
                ▾
              </span>
              <span className={underline(active === "programs")} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute left-1/2 top-full z-50 w-[342px] -translate-x-1/2 pt-4"
                >
                  <div className="overflow-hidden rounded-2xl border border-line bg-card p-2 shadow-[0_20px_55px_rgba(43,51,125,0.18)]">
                    {PROGRAMS.map((p) => (
                      <a
                        key={p.key}
                        href={p.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/item block rounded-xl px-4 py-3.5 transition-colors hover:bg-brand-soft/60"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-display text-[0.95rem] font-bold text-brand">{p.name}</span>
                          <span className="text-xs text-accent opacity-0 transition-opacity group-hover/item:opacity-100">
                            ↗
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted">{p.tagline}</p>
                      </a>
                    ))}
                    <button
                      type="button"
                      onClick={(e) => goToSection("programs", e)}
                      className="mt-1 block w-full rounded-xl px-4 py-2.5 text-left text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-muted transition-colors hover:bg-brand-soft/60 hover:text-brand"
                    >
                      Compare both on the site →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>

          <li>
            <Link href="/product" className={`${linkBase} ${tone(active === "band")}`}>
              The band
              <span className={underline(active === "band")} />
            </Link>
          </li>

          <li>
            <Link href="/#story" onClick={(e) => goToSection("story", e)} className={`${linkBase} ${tone(active === "story")}`}>
              Our story
              <span className={underline(active === "story")} />
            </Link>
          </li>

          <li>
            <Link href="/track" className={`${linkBase} ${tone(active === "track")}`}>
              Track order
              <span className={underline(active === "track")} />
            </Link>
          </li>
        </ul>

        <div className="flex items-center gap-1.5">
          <div className="hidden md:block">
            <Magnetic>
              <button
                type="button"
                onClick={(e) => goToSection("programs", e)}
                className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
              >
                Join a program
              </button>
            </Magnetic>
          </div>

          {/* mobile hamburger */}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-brand md:hidden"
          >
            <span
              className={`absolute h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                mobileOpen ? "rotate-45" : "-translate-y-1.5"
              }`}
            />
            <span
              className={`absolute h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                mobileOpen ? "-rotate-45" : "translate-y-1.5"
              }`}
            />
          </button>
        </div>
      </nav>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.21, 0.65, 0.36, 1] }}
            className="overflow-hidden border-b border-line bg-card/95 backdrop-blur-xl md:hidden"
          >
            <div className="mx-auto max-w-7xl px-6 pb-5 pt-1">
              <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Programs
              </p>
              {PROGRAMS.map((p) => (
                <a
                  key={p.key}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-brand-soft/60"
                >
                  <span className="font-display font-bold text-brand">{p.name}</span>
                  <span className="text-xs text-accent">↗</span>
                </a>
              ))}

              <div className="my-2 h-px bg-line" />

              <Link
                href="/product"
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-3 py-3 font-display font-semibold text-foreground/80 transition-colors hover:bg-brand-soft/60 hover:text-brand"
              >
                The band
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  setMobileOpen(false);
                  goToSection("story", e);
                }}
                className="block w-full rounded-xl px-3 py-3 text-left font-display font-semibold text-foreground/80 transition-colors hover:bg-brand-soft/60 hover:text-brand"
              >
                Our story
              </button>
              <Link
                href="/track"
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-3 py-3 font-display font-semibold text-foreground/80 transition-colors hover:bg-brand-soft/60 hover:text-brand"
              >
                Track order
              </Link>

              <button
                type="button"
                onClick={(e) => {
                  setMobileOpen(false);
                  goToSection("programs", e);
                }}
                className="mt-3 block w-full rounded-full bg-brand px-5 py-3 text-center font-display font-bold text-white transition hover:brightness-95"
              >
                Join a program
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
