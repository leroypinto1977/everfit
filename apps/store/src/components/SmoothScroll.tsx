"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import SiteHeader from "./SiteHeader";

const HEADER_OFFSET = 80; // clear the fixed header when landing on a section

/**
 * On each route change: scroll to the hash target if present, otherwise reset
 * to the top. Combined with manual scroll restoration this also means a plain
 * refresh always lands at the top of the page (no browser scroll restore).
 *
 * Scrolling itself is the browser's own. Lenis used to smooth the wheel here,
 * but its interpolation made every scroll trail the input and kept a
 * requestAnimationFrame loop running on every page, which is the lag visitors
 * noticed.
 */
function ScrollManager() {
  const pathname = usePathname();

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const el = window.location.hash ? document.querySelector(window.location.hash) : null;
      const top = el ? el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET : 0;
      window.scrollTo({ top, behavior: el ? "smooth" : "instant" });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  }, []);

  return (
    <>
      <ScrollManager />
      <SiteHeader />
      {children}
    </>
  );
}
