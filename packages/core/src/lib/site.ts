/**
 * Canonical site constants shared by metadata, sitemap, robots and JSON-LD.
 * SITE_URL drives absolute URLs for canonicals, Open Graph and structured data.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://evherfit.com").replace(/\/$/, "");

export const BRAND = "EVHERFIT";
/**
 * Fallback support address for synchronous/metadata contexts. The owner-editable
 * value lives in the settings table — prefer `getSettings().support_email` in
 * any async server component. This constant only backstops it.
 */
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "info@evherfit.com";

/** Default social/share image (served by the root opengraph-image route). */
export const OG_IMAGE = "/opengraph-image";
