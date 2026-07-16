import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Bump when storefront content changes meaningfully. A fixed date is more
// honest than new Date() (which stamps "now" on every crawl, so lastmod is
// never a real freshness signal).
const LAST_MODIFIED = new Date("2026-07-16");

// Public, indexable storefront pages only — checkout, success, /track and admin
// are deliberately left out (noindex and/or disallowed in robots.ts).
const routes: Array<[path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly"]> = [
  ["", 1, "weekly"],
  ["/product", 0.9, "weekly"],
  ["/about", 0.6, "monthly"],
  ["/contact", 0.5, "monthly"],
  ["/shipping", 0.4, "monthly"],
  ["/refunds", 0.4, "monthly"],
  ["/privacy", 0.3, "yearly"],
  ["/terms", 0.3, "yearly"],
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(([path, priority, changeFrequency]) => ({
    url: `${SITE_URL}${path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency,
    priority,
  }));
}
