/**
 * The EVHERFIT Infinity Band — weighted resistance band, sold as a pair.
 * Live prices/stock come from the DB catalog (src/lib/catalog.ts) and are
 * passed to components as props; the VARIANTS below are only the fallback
 * for environments without DATABASE_URL (and the original seed data).
 */

export interface Variant {
  key: string; // used in URLs (?w=1) and order records
  weight: string; // display weight per band
  label: string; // marketing name
  blurb: string;
  price: number; // paise, for the pair
  mrp: number; // paise, struck-through price
  popular?: boolean;
  soldOut?: boolean;
}

export const PRODUCT_NAME = "EVHERFIT Infinity Band";

export const VARIANTS: Variant[] = [
  {
    key: "0.5",
    weight: "0.5 kg × 2",
    label: "Tone",
    blurb: "Daily walks, pilates, barre",
    price: 1499_00,
    mrp: 2499_00,
  },
  {
    key: "1",
    weight: "1 kg × 2",
    label: "Strength",
    blurb: "Yoga flows, HIIT, power walks",
    price: 1999_00,
    mrp: 3299_00,
    popular: true,
  },
  {
    key: "2",
    weight: "2 kg × 2",
    label: "Power",
    blurb: "Strength training, conditioning",
    price: 2499_00,
    mrp: 3999_00,
  },
];

export function getVariant(key: string | undefined | null): Variant {
  return VARIANTS.find((v) => v.key === key) ?? VARIANTS[1];
}

export function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}
