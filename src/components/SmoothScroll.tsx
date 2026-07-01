"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import SiteHeader from "./SiteHeader";

/**
 * On each route change: scroll to the hash target if present, otherwise reset
 * to the top. Combined with manual scroll restoration this also means a plain
 * refresh always lands at the top of the page (no browser scroll restore).
 */
function ScrollManager() {
  const lenis = useLenis();
  const pathname = usePathname();

  useEffect(() => {
    if (!lenis) return;
    const raf = requestAnimationFrame(() => {
      const hash = window.location.hash;
      if (hash) {
        const el = document.querySelector(hash);
        if (el) {
          lenis.scrollTo(el as HTMLElement, { offset: -80 });
          return;
        }
      }
      lenis.scrollTo(0, { immediate: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [lenis, pathname]);

  return null;
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // The admin panel is an app-shell dashboard with its own scroll container —
  // Lenis (which hijacks the window scroll) makes it feel broken there, so it
  // only runs on the marketing storefront.
  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1, // wheel smoothing — lower = smoother/heavier, higher = snappier
        smoothWheel: true,
        syncTouch: true, // smooth scrolling on touch devices too
        syncTouchLerp: 0.08,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
      }}
    >
      <ScrollManager />
      <SiteHeader />
      {children}
    </ReactLenis>
  );
}
