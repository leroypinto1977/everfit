import { asc, eq } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { products, productVariants } from "@/db/schema";
import { VARIANTS, PRODUCT_NAME, type Variant } from "./product";

/**
 * DB-backed catalog (server-only). The storefront and the checkout API read
 * prices/stock from here so admin edits go live without a deploy. The
 * hardcoded VARIANTS in product.ts remain only as a fallback for environments
 * without DATABASE_URL (and as the original seed).
 */

export interface StorefrontVariant extends Variant {
  soldOut: boolean;
}

function fallbackVariants(): StorefrontVariant[] {
  return VARIANTS.map((v) => ({ ...v, soldOut: false }));
}

export async function getCatalog(): Promise<{ name: string; variants: StorefrontVariant[] }> {
  if (!hasDb()) return { name: PRODUCT_NAME, variants: fallbackVariants() };
  try {
    const rows = await db()
      .select({
        key: productVariants.key,
        weight: productVariants.weight,
        label: productVariants.label,
        blurb: productVariants.blurb,
        price: productVariants.price,
        mrp: productVariants.mrp,
        stock: productVariants.stock,
        popular: productVariants.popular,
        productName: products.name,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(productVariants.active, true))
      .orderBy(asc(productVariants.sort));

    if (!rows.length) return { name: PRODUCT_NAME, variants: fallbackVariants() };

    return {
      name: rows[0].productName,
      variants: rows.map((r) => ({
        key: r.key,
        weight: r.weight,
        label: r.label,
        blurb: r.blurb,
        price: r.price,
        mrp: r.mrp,
        popular: r.popular,
        soldOut: r.stock !== null && r.stock <= 0,
      })),
    };
  } catch (err) {
    console.error("Catalog read failed, using fallback:", err);
    return { name: PRODUCT_NAME, variants: fallbackVariants() };
  }
}

/** Checkout-side lookup: the price ALWAYS comes from here, never the client. */
export async function getPurchasableVariant(key: string | undefined | null) {
  const { name, variants } = await getCatalog();
  const variant = variants.find((v) => v.key === key) ?? variants.find((v) => v.popular) ?? variants[0];
  if (!variant) return null;
  return { ...variant, productName: name };
}

/* ---------- admin ---------- */

export async function listVariantsAdmin() {
  return db()
    .select()
    .from(productVariants)
    .orderBy(asc(productVariants.sort));
}

export async function getProductAdmin() {
  const rows = await db().select().from(products).limit(1);
  return rows[0] ?? null;
}

export async function updateVariantAdmin(
  id: string,
  fields: { price?: number; mrp?: number; stock?: number | null; active?: boolean; blurb?: string }
) {
  await db().update(productVariants).set(fields).where(eq(productVariants.id, id));
}

export async function updateProductAdmin(id: string, fields: { name?: string; active?: boolean }) {
  await db().update(products).set(fields).where(eq(products.id, id));
}
