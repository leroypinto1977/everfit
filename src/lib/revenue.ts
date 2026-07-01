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

export interface MonthRevenue {
  month: string; // YYYY-MM
  revenue: number; // paise
  orders: number;
  manualRevenue: number; // paise
  manualOrders: number;
}

/** Revenue per calendar month for the last `months` months, gap-filled. */
export async function getMonthlyRevenue(months = 12): Promise<MonthRevenue[]> {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(1);
  from.setMonth(from.getMonth() - (months - 1));

  const rows = await db().execute(sql`
    SELECT to_char(m, 'YYYY-MM') AS month,
           coalesce(sum(o.amount), 0)::int AS revenue,
           count(o.id)::int AS orders,
           coalesce(sum(o.amount) filter (where o.source = 'manual'), 0)::int AS manual_revenue,
           count(o.id) filter (where o.source = 'manual')::int AS manual_orders
    FROM generate_series(date_trunc('month', ${from}::timestamptz), date_trunc('month', now()), interval '1 month') AS m
    LEFT JOIN orders o
      ON date_trunc('month', o.paid_at) = m
     AND o.status IN ('paid','shipped','delivered','refunded')
    GROUP BY m
    ORDER BY m
  `);

  return (rows.rows as Record<string, unknown>[]).map((r) => ({
    month: String(r.month),
    revenue: Number(r.revenue),
    orders: Number(r.orders),
    manualRevenue: Number(r.manual_revenue),
    manualOrders: Number(r.manual_orders),
  }));
}

/** Revenue & order counts split by payment method (range bucketed by paid date). */
export async function getPaymentMethodMix(from: Date, to: Date) {
  const rows = await db().execute(sql`
    SELECT coalesce(payment_method, case when source = 'manual' then 'unspecified' else 'online' end) AS method,
           count(*)::int AS orders,
           sum(amount)::int AS revenue
    FROM orders
    WHERE status IN ('paid','shipped','delivered','refunded')
      AND paid_at >= ${from} AND paid_at < ${to}
    GROUP BY 1 ORDER BY 3 DESC
  `);
  return rows.rows as unknown as { method: string; orders: number; revenue: number }[];
}

/** Flat rows for the accounting CSV export. */
export async function getOrdersForExport(from: Date, to: Date) {
  const rows = await db().execute(sql`
    SELECT o.id, o.invoice_no, o.status, o.amount, o.discount, o.coupon_code, o.currency, o.item, o.variant_key, o.qty,
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
