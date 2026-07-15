import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Store analytics beyond raw revenue: the online checkout funnel and
 * customer-level metrics (repeat rate, lifetime value). Kept server-only; the
 * client-side GA4 helpers live in src/lib/analytics.ts.
 */

export interface Funnel {
  started: number; // online checkouts created in range
  paid: number; // reached payment
  shipped: number;
  delivered: number;
  failed: number; // payment attempted and failed
  abandoned: number; // still 'created', never paid
}

/**
 * Online checkout funnel for orders CREATED in the range (manual/offline sales
 * are excluded — they never went through checkout). Bucketed by creation date
 * because the funnel measures whether a started checkout converted.
 */
export async function getFunnel(from: Date, to: Date): Promise<Funnel> {
  const rows = await db().execute(sql`
    SELECT
      count(*)::int AS started,
      count(*) filter (where status IN ('paid','shipped','delivered','refunded'))::int AS paid,
      count(*) filter (where status IN ('shipped','delivered'))::int AS shipped,
      count(*) filter (where status = 'delivered')::int AS delivered,
      count(*) filter (where status = 'failed')::int AS failed,
      count(*) filter (where status = 'created')::int AS abandoned
    FROM orders
    WHERE source = 'online' AND created_at >= ${from} AND created_at < ${to}
  `);
  const r = rows.rows[0] as Record<string, unknown>;
  return {
    started: Number(r.started),
    paid: Number(r.paid),
    shipped: Number(r.shipped),
    delivered: Number(r.delivered),
    failed: Number(r.failed),
    abandoned: Number(r.abandoned),
  };
}

export interface CustomerInsights {
  payingCustomers: number; // all-time, with ≥1 paid order
  repeatCustomers: number; // all-time, with ≥2 paid orders
  repeatRate: number; // repeat ÷ paying, 0–1
  avgLtv: number; // paise, avg lifetime spend per paying customer
  newCustomers: number; // first paid order fell inside the range
}

const PAID = `('paid','shipped','delivered')`;

/**
 * Customer-level metrics. Repeat rate and LTV are all-time (that's what those
 * numbers mean); `newCustomers` is scoped to the range by first-purchase date.
 */
export async function getCustomerInsights(from: Date, to: Date): Promise<CustomerInsights> {
  const rows = await db().execute(sql`
    WITH per_customer AS (
      SELECT customer_id,
             count(*)::int AS orders,
             sum(amount)::int AS spent,
             min(paid_at) AS first_paid
      FROM orders
      WHERE status IN ${sql.raw(PAID)} AND customer_id IS NOT NULL
      GROUP BY customer_id
    )
    SELECT
      count(*)::int AS paying_customers,
      count(*) filter (where orders >= 2)::int AS repeat_customers,
      coalesce(round(avg(spent)), 0)::int AS avg_ltv,
      count(*) filter (where first_paid >= ${from} AND first_paid < ${to})::int AS new_customers
    FROM per_customer
  `);
  const r = rows.rows[0] as Record<string, unknown>;
  const paying = Number(r.paying_customers);
  const repeat = Number(r.repeat_customers);
  return {
    payingCustomers: paying,
    repeatCustomers: repeat,
    repeatRate: paying > 0 ? repeat / paying : 0,
    avgLtv: Number(r.avg_ltv),
    newCustomers: Number(r.new_customers),
  };
}
