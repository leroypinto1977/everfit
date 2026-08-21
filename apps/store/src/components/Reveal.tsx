"use client";

import { useEffect, useRef } from "react";

/**
 * Fades + slides children in when they scroll into view.
 *
 * Deliberately not a Motion component. Reveal is instantiated ~36 times across
 * the site and each instance used to be a full `m.div` carrying its own
 * variants and its own viewport observer. This is one shared
 * IntersectionObserver and a CSS transition instead.
 *
 * Nothing is hidden in the server HTML and nothing is hidden above the fold:
 * an element is only armed (`data-armed`, opacity 0) once the observer has
 * reported it *off* screen, where arming it is imperceptible. So the first
 * screen paints at full opacity without waiting on hydration, and with
 * JavaScript off every section renders in place.
 *
 * The observer — not a `getBoundingClientRect()` in the effect — is what
 * decides above-vs-below fold, and that is the whole trick. Measuring in the
 * effect forces a synchronous layout, and 36 instances alternating measure and
 * mutate thrashes layout badly enough to double the page's total blocking
 * time. IntersectionObserver computes all 36 after layout has already run and
 * hands them back in one batch.
 */

type State = { armed: boolean };

const states = new WeakMap<Element, State>();
let io: IntersectionObserver | null = null;

function observer() {
  io ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const state = states.get(el);
        if (!state) continue;

        if (!entry.isIntersecting) {
          // First report, off screen: arm it now, reveal on the next report.
          if (!state.armed) {
            state.armed = true;
            el.dataset.armed = "";
          }
          continue;
        }

        // On screen. If it was never armed this is the first report and the
        // element was always visible — there is no entrance to play, so just
        // let it be. Either way it is done.
        if (state.armed) el.classList.add("is-visible");
        io?.unobserve(el);
        states.delete(el);
      }
    },
    { rootMargin: "-80px" }, // the old Motion `viewport.margin`
  );
  return io;
}

export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    states.set(el, { armed: false });
    const ob = observer();
    ob.observe(el);
    return () => {
      ob.unobserve(el);
      states.delete(el);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className ? `reveal ${className}` : "reveal"}
      style={delay ? ({ "--reveal-delay": `${delay}s` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
