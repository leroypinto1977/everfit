import { and, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, refunds } from "@/db/schema";
import { REPORT_TZ, istMonthStart } from "./report-time";

/**
 * Revenue reporting. "Revenue" means orders that reached payment (paid /
 * shipped / delivered / refunded), bucketed by the day they were PAID.
 * Refunds subtract from net on the day the refund was initiated.
 *
 * All calendar bucketing happens in IST (REPORT_TZ) via `AT TIME ZONE`, because
 * the Postgres session runs in UTC but the store operates in India — without
 * this a late-night IST sale falls into the previous UTC day/month. Callers pass
 * IST-aligned range boundaries (see src/lib/report-time.ts). All amounts in paise.
 */

/** GST is charged on the price the customer pays (invoice: "inclusive of all taxes"). */
export const GST_RATE = Number(process.env.GST_RATE ?? 0.18);

/** Split a GST-inclusive amount (paise) into its taxable base and GST component. */
export function gstSplit(inclusivePaise: number) {
  const taxable = Math.round(inclusivePaise / (1 + GST_RATE));
  return { taxable, gst: inclusivePaise - taxable, rate: GST_RATE };
}

export interface RevenueStats {
  grossRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  paidOrders: number;
  refundCount: number;
  refundRate: number; // refunded ÷ gross, 0–1 (value-weighted)
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
    refundRate: o.gross > 0 ? r.amount / o.gross : 0,
    avgOrderValue: o.paidOrders ? Math.round(o.gross / o.paidOrders) : 0,
  };
}

export async function getDailyRevenue(from: Date, to: Date) {
  const rows = await db().execute(sql`
    SELECT to_char(date_trunc('day', paid_at AT TIME ZONE ${REPORT_TZ}), 'YYYY-MM-DD') AS day,
           sum(amount)::int AS revenue,
           count(*)::int AS orders
    FROM orders
    WHERE status IN ${sql.raw(REVENUE_STATUSES)}
      AND paid_at >= ${from} AND paid_at < ${to}
    GROUP BY 1 ORDER BY 1
  `);
  return rows.rows as unknown as { day: string; revenue: number; orders: number }[];
}

export interface VariantMixRow {
  key: string;
  weight: string | null;
  label: string | null;
  orders: number;
  revenue: number;
}

export async function getVariantMix(from: Date, to: Date): Promise<VariantMixRow[]> {
  const rows = await db().execute(sql`
    SELECT coalesce(o.variant_key, '?') AS key,
           pv.weight, pv.label,
           count(*)::int AS orders,
           sum(o.amount)::int AS revenue
    FROM orders o
    LEFT JOIN product_variants pv ON pv.key = o.variant_key
    WHERE o.status IN ${sql.raw(REVENUE_STATUSES)}
      AND o.paid_at >= ${from} AND o.paid_at < ${to}
    GROUP BY o.variant_key, pv.weight, pv.label
    ORDER BY revenue DESC
  `);
  return rows.rows as unknown as VariantMixRow[];
}

export interface MonthRevenue {
  month: string; // YYYY-MM (IST)
  revenue: number; // paise, gross
  orders: number;
  manualRevenue: number; // paise
  manualOrders: number;
  refunded: number; // paise refunded in this month
  net: number; // paise, gross − refunded
}

/** Revenue per IST calendar month for the last `months` months, gap-filled. */
export async function getMonthlyRevenue(months = 12): Promise<MonthRevenue[]> {
  const from = istMonthStart(months - 1);

  const rows = await db().execute(sql`
    WITH months AS (
      SELECT generate_series(
        date_trunc('month', ${from}::timestamptz AT TIME ZONE ${REPORT_TZ}),
        date_trunc('month', now() AT TIME ZONE ${REPORT_TZ}),
        interval '1 month'
      ) AS m
    ),
    sales AS (
      SELECT date_trunc('month', paid_at AT TIME ZONE ${REPORT_TZ}) AS m,
             sum(amount)::int AS revenue,
             count(*)::int AS orders,
             coalesce(sum(amount) filter (where source = 'manual'), 0)::int AS manual_revenue,
             count(*) filter (where source = 'manual')::int AS manual_orders
      FROM orders
      WHERE status IN ('paid','shipped','delivered','refunded') AND paid_at IS NOT NULL
      GROUP BY 1
    ),
    refs AS (
      SELECT date_trunc('month', created_at AT TIME ZONE ${REPORT_TZ}) AS m,
             sum(amount)::int AS refunded
      FROM refunds
      GROUP BY 1
    )
    SELECT to_char(months.m, 'YYYY-MM') AS month,
           coalesce(sales.revenue, 0)::int AS revenue,
           coalesce(sales.orders, 0)::int AS orders,
           coalesce(sales.manual_revenue, 0)::int AS manual_revenue,
           coalesce(sales.manual_orders, 0)::int AS manual_orders,
           coalesce(refs.refunded, 0)::int AS refunded
    FROM months
    LEFT JOIN sales ON sales.m = months.m
    LEFT JOIN refs ON refs.m = months.m
    ORDER BY months.m
  `);

  return (rows.rows as Record<string, unknown>[]).map((r) => {
    const revenue = Number(r.revenue);
    const refunded = Number(r.refunded);
    return {
      month: String(r.month),
      revenue,
      orders: Number(r.orders),
      manualRevenue: Number(r.manual_revenue),
      manualOrders: Number(r.manual_orders),
      refunded,
      net: revenue - refunded,
    };
  });
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

export interface TopCustomer {
  name: string;
  orders: number;
  spent: number; // paise, paid+shipped+delivered
}

/** Highest-spending customers in the range (excludes refunded orders). */
export async function getTopCustomers(from: Date, to: Date, limit = 8): Promise<TopCustomer[]> {
  const rows = await db().execute(sql`
    SELECT coalesce(c.name, o.name) AS name,
           count(*)::int AS orders,
           sum(o.amount)::int AS spent
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    WHERE o.status IN ('paid','shipped','delivered')
      AND o.paid_at >= ${from} AND o.paid_at < ${to}
    GROUP BY o.customer_id, coalesce(c.name, o.name)
    ORDER BY spent DESC
    LIMIT ${limit}
  `);
  return rows.rows as unknown as TopCustomer[];
}

/** Flat rows for the accounting CSV export (with GST split). */
export async function getOrdersForExport(from: Date, to: Date) {
  const rows = await db().execute(sql`
    SELECT o.id, o.invoice_no, o.status, o.amount,
           round(o.amount / (1 + ${GST_RATE}::numeric))::int AS taxable_value,
           (o.amount - round(o.amount / (1 + ${GST_RATE}::numeric))::int) AS gst,
           o.discount, o.coupon_code, o.currency, o.item, o.variant_key, o.qty,
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
