/**
 * The EVHERFIT Infinity Band: a resistance band set with foam-grip handles,
 * offered in two resistance levels (Light 4.5 kg and Heavy 9 kg) plus a combo
 * of both. The variant `key`s stay "1.5"/"2"/"bundle" — they are baked into
 * existing order records and ?w= URLs, so renaming them would orphan history.
 * Live prices/stock come from the DB catalog (src/lib/catalog.ts) and are
 * passed to components as props; the VARIANTS below are only the fallback
 * for environments without DATABASE_URL (and the original seed data).
 */

export interface Variant {
  key: string; // used in URLs (?w=1.5) and order records
  weight: string; // display resistance, e.g. "1.5 kg"
  label: string; // marketing name
  blurb: string;
  price: number; // paise, for the set
  mrp: number | null; // paise, struck-through price; null = show the price alone
  popular?: boolean;
  soldOut?: boolean;
}

export const PRODUCT_NAME = "EVHERFIT Infinity Band";

export const VARIANTS: Variant[] = [
  {
    key: "1.5",
    weight: "4.5 kg",
    label: "Light",
    blurb: "Toning, pilates, mobility & everyday resistance",
    price: 799_00,
    mrp: null,
  },
  {
    key: "2",
    weight: "9 kg",
    label: "Heavy",
    blurb: "Strength training, HIIT & conditioning",
    price: 999_00,
    mrp: null,
  },
  {
    key: "bundle",
    weight: "4.5 kg + 9 kg",
    label: "Combo",
    blurb: "Both bands, the full range of resistance",
    price: 1499_00,
    mrp: 1599_00,
    popular: true,
  },
];

/**
 * Product photography, keyed by variant key. The gallery shows the first image
 * as the hero and the rest as thumbnails. Files live in /public/products.
 * Light is the blue band, Heavy is the red band, and the combo shows both.
 */
export const PRODUCT_IMAGES: Record<string, string[]> = {
  "1.5": [
    "/products/tube-blue-1.jpg",
    "/products/tube-blue-2.jpg",
    "/products/tube-blue-3.jpg",
  ],
  "2": [
    "/products/tube-red-1.jpg",
    "/products/tube-red-2.jpg",
    "/products/tube-red-3.jpg",
  ],
  bundle: [
    "/products/bundle-1.jpg",
    "/products/bundle-2.jpg",
    "/products/bundle-3.jpg",
    "/products/bundle-4.jpg",
  ],
};

/** A safe hero image for surfaces that show the product without a chosen variant. */
export const HERO_IMAGE = "/products/bundle-1.jpg";

export function variantImages(key: string | undefined | null): string[] {
  return (key && PRODUCT_IMAGES[key]) || PRODUCT_IMAGES.bundle;
}

export function getVariant(key: string | undefined | null): Variant {
  return VARIANTS.find((v) => v.key === key) ?? VARIANTS[1];
}

export function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}
