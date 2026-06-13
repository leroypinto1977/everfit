import { and, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, refunds } from "@/db/schema";

/**
 * Revenue reporting. "Revenue" means orders that reached payment (paid /
 * shipped / delivered / refunded), bucketed by the day they were PAID.
 * Refunds subtract from net on the day the refund was initiated.
 * All amounts in paise.
 */

export interface RevenueStats {
  grossRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  paidOrders: number;
  refundCount: number;
  avgOrderValue: number;
}

const REVENUE_STATUSES = `('paid','shipped','delivered','refunded')`;

export async function getRevenueStats(from: Date, to: Date): Promise<RevenueStats> {
  const [o] = await db()
    .select({
      gross: sql<number>`coalesce(sum(${orders.amount}) filter (where ${orders.status} in ('paid','shipped','delivered','refunded')), 0)::int`,
      paidOrders: sql<number>`count(*) filter (where ${orders.status} in ('paid','shipped','delivered','refunded'))::int`,
    })
    .from(orders)
    .where(and(gte(orders.paidAt, from), lt(orders.paidAt, to)));

  const [r] = await db()
    .select({
      amount: sql<number>`coalesce(sum(${refunds.amount}), 0)::int`,
      n: sql<number>`count(*)::int`,
    })
    .from(refunds)
    .where(and(gte(refunds.createdAt, from), lt(refunds.createdAt, to)));

  return {
    grossRevenue: o.gross,
    refundedAmount: r.amount,
    netRevenue: o.gross - r.amount,
    paidOrders: o.paidOrders,
    refundCount: r.n,
    avgOrderValue: o.paidOrders ? Math.round(o.gross / o.paidOrders) : 0,
  };
}

export async function getDailyRevenue(from: Date, to: Date) {
  const rows = await db().execute(sql`
    SELECT date_trunc('day', paid_at)::date AS day,
           sum(amount)::int AS revenue,
           count(*)::int AS orders
    FROM orders
    WHERE status IN ${sql.raw(REVENUE_STATUSES)}
      AND paid_at >= ${from} AND paid_at < ${to}
    GROUP BY 1 ORDER BY 1
  `);
  return rows.rows as unknown as { day: string; revenue: number; orders: number }[];
}

export async function getVariantMix(from: Date, to: Date) {
  const rows = await db().execute(sql`
    SELECT coalesce(variant_key, '?') AS variant,
           count(*)::int AS orders,
           sum(amount)::int AS revenue
    FROM orders
    WHERE status IN ${sql.raw(REVENUE_STATUSES)}
      AND paid_at >= ${from} AND paid_at < ${to}
    GROUP BY 1 ORDER BY 3 DESC
  `);
  return rows.rows as unknown as { variant: string; orders: number; revenue: number }[];
}

/** Flat rows for the accounting CSV export. */
export async function getOrdersForExport(from: Date, to: Date) {
  const rows = await db().execute(sql`
    SELECT o.id, o.invoice_no, o.status, o.amount, o.currency, o.item, o.variant_key, o.qty,
           o.payment_id, o.name, o.email, o.phone, o.city, o.state, o.pincode,
           o.created_at, o.paid_at, o.shipped_at, o.delivered_at,
           r.amount AS refund_amount, r.id AS refund_id
    FROM orders o
    LEFT JOIN refunds r ON r.order_id = o.id
    WHERE o.created_at >= ${from} AND o.created_at < ${to}
    ORDER BY o.created_at
  `);
  return rows.rows as Record<string, unknown>[];
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = v instanceof Date ? v.toISOString() : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}
