import type { MetadataRoute } from "next";

/**
 * The admin panel is private tooling on its own domain. Block everything —
 * there is no page here that should ever appear in a search index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
