import type { MetadataRoute } from "next";
import { SITE_URL } from "@everfit/core/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api", "/checkout", "/success", "/track"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
