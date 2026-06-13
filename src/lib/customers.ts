import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, orders } from "@/db/schema";

/**
 * Customer directory — one row per phone number, aggregated from orders.
 * Records are created/refreshed automatically at checkout (see saveOrder).
 */

const PAID_STATUSES = ["paid", "shipped", "delivered"] as const;

export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  orderCount: number;
  paidOrderCount: number;
  totalSpent: number; // paise, paid+shipped+delivered orders
  lastOrderAt: string | null;
  createdAt: string;
}

export async function listCustomers(opts?: {
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ customers: CustomerSummary[]; total: number }> {
  const where = opts?.q
    ? or(
        ilike(customers.name, `%${opts.q.trim()}%`),
        ilike(customers.phone, `%${opts.q.trim()}%`),
        ilike(customers.email, `%${opts.q.trim()}%`),
        ilike(customers.city, `%${opts.q.trim()}%`)
      )
    : undefined;

  const orderCount = sql<number>`count(${orders.id})::int`;
  const paidOrderCount = sql<number>`count(${orders.id}) filter (where ${orders.status} in ('paid','shipped','delivered'))::int`;
  const totalSpent = sql<number>`coalesce(sum(${orders.amount}) filter (where ${orders.status} in ('paid','shipped','delivered')), 0)::int`;
  const lastOrderAt = sql<string | null>`max(${orders.createdAt})`;

  const [rows, totals] = await Promise.all([
    db()
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        city: customers.city,
        state: customers.state,
        createdAt: customers.createdAt,
        orderCount,
        paidOrderCount,
        totalSpent,
        lastOrderAt,
      })
      .from(customers)
      .leftJoin(orders, eq(orders.customerId, customers.id))
      .where(where)
      .groupBy(customers.id)
      .orderBy(desc(lastOrderAt))
      .limit(opts?.limit ?? 50)
      .offset(opts?.offset ?? 0),
    db().select({ n: sql<number>`count(*)::int` }).from(customers).where(where),
  ]);

  return {
    customers: rows.map((r) => ({
      ...r,
      lastOrderAt: r.lastOrderAt ? new Date(r.lastOrderAt).toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    })),
    total: totals[0].n,
  };
}

export async function getCustomer(id: string) {
  const rows = await db().select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!rows[0]) return null;
  const customerOrders = await db()
    .select()
    .from(orders)
    .where(eq(orders.customerId, id))
    .orderBy(desc(orders.createdAt));
  const totalSpent = customerOrders
    .filter((o) => (PAID_STATUSES as readonly string[]).includes(o.status))
    .reduce((sum, o) => sum + o.amount, 0);
  return { ...rows[0], orders: customerOrders, totalSpent };
}

export async function updateCustomerNotes(id: string, notes: string) {
  await db().update(customers).set({ notes: notes || null }).where(eq(customers.id, id));
}
