"use client";

import { useEffect, useRef } from "react";
import { gaItem, trackViewItem } from "@/lib/analytics";
import type { Variant } from "@/lib/product";

/** Fires a GA4 view_item for the variant the product page pre-selects. */
export default function ViewItemTracker({ variants, name }: { variants: Variant[]; name: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const variant =
      variants.find((v) => v.popular && !v.soldOut) ?? variants.find((v) => !v.soldOut) ?? variants[0];
    if (variant) trackViewItem(gaItem(variant, name));
  }, [variants, name]);

  return null;
}
