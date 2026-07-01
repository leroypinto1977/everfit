import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { inventoryMovements, productVariants } from "@/db/schema";

/**
 * Inventory ledger. Every stock change goes through here (or orders.ts for
 * sales/returns) and is recorded in inventory_movements so admins get a full
 * history. The variant's `stock` column stays the running total.
 */

export type MovementReason = "sale" | "return" | "restock" | "adjustment" | "manual_sale";

export const REASON_LABEL: Record<string, string> = {
  sale: "Online sale",
  manual_sale: "Manual sale",
  return: "Refund/return",
  restock: "Restock",
  adjustment: "Adjustment",
};

/**
 * Apply a signed delta to a variant's stock and log it, atomically. Untracked
 * variants (stock = null) become tracked, counting from 0. Returns new stock.
 */
export async function applyStockDelta(
  variantId: string,
  delta: number,
  opts: { reason: MovementReason; note?: string; actor?: string; orderId?: string }
) {
  return db().transaction(async (tx) => {
    const [v] = await tx
      .update(productVariants)
      .set({ stock: sql`coalesce(${productVariants.stock}, 0) + ${delta}` })
      .where(eq(productVariants.id, variantId))
      .returning({ stock: productVariants.stock });
    await tx.insert(inventoryMovements).values({
      variantId,
      delta,
      reason: opts.reason,
      note: opts.note,
      actor: opts.actor ?? "system",
      orderId: opts.orderId,
    });
    return v?.stock ?? null;
  });
}

/** Set a variant's stock to an absolute value, logging the difference. */
export async function setVariantStock(variantId: string, newStock: number | null, actor: string) {
  const [cur] = await db()
    .select({ stock: productVariants.stock })
    .from(productVariants)
    .where(eq(productVariants.id, variantId));
  const before = cur?.stock ?? null;

  // Stop tracking — no numeric movement to log.
  if (newStock === null) {
    await db().update(productVariants).set({ stock: null }).where(eq(productVariants.id, variantId));
    return null;
  }

  const delta = newStock - (before ?? 0);
  if (delta === 0) {
    await db().update(productVariants).set({ stock: newStock }).where(eq(productVariants.id, variantId));
    return newStock;
  }
  return applyStockDelta(variantId, delta, { reason: "adjustment", actor, note: `Set to ${newStock}` });
}

export interface Movement {
  id: string;
  delta: number;
  reason: string;
  note: string | null;
  actor: string;
  orderId: string | null;
  createdAt: string;
  weight: string;
  label: string;
  sku: string;
}

/** Flat rows for the inventory ledger CSV export (newest first). */
export async function getMovementsForExport() {
  const rows = await db()
    .select({
      datetime: inventoryMovements.createdAt,
      variant: productVariants.weight,
      label: productVariants.label,
      sku: productVariants.sku,
      change: inventoryMovements.delta,
      reason: inventoryMovements.reason,
      note: inventoryMovements.note,
      order_id: inventoryMovements.orderId,
      actor: inventoryMovements.actor,
    })
    .from(inventoryMovements)
    .innerJoin(productVariants, eq(inventoryMovements.variantId, productVariants.id))
    .orderBy(desc(inventoryMovements.createdAt));
  return rows as unknown as Record<string, unknown>[];
}

export async function listMovements(limit = 60): Promise<Movement[]> {
  const rows = await db()
    .select({
      id: inventoryMovements.id,
      delta: inventoryMovements.delta,
      reason: inventoryMovements.reason,
      note: inventoryMovements.note,
      actor: inventoryMovements.actor,
      orderId: inventoryMovements.orderId,
      createdAt: inventoryMovements.createdAt,
      weight: productVariants.weight,
      label: productVariants.label,
      sku: productVariants.sku,
    })
    .from(inventoryMovements)
    .innerJoin(productVariants, eq(inventoryMovements.variantId, productVariants.id))
    .orderBy(desc(inventoryMovements.createdAt))
    .limit(limit);
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}
