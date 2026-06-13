import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, orderEvents, orders, productVariants, refunds } from "@/db/schema";
import { redeemCoupon } from "./coupons";

/**
 * Order persistence on Neon Postgres (Drizzle). Every status transition is
 * guarded by a conditional UPDATE (atomic — safe against the verify/webhook
 * race) and recorded in order_events so the admin timeline shows who did
 * what. DATABASE_URL is required; the old JSON-file fallback is gone.
 */

export type OrderStatus =
  | "created"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "failed";

export interface Order {
  id: string; // razorpay order_id
  paymentId?: string;
  status: OrderStatus;
  amount: number; // paise
  currency: string;
  item?: string;
  variantKey?: string;
  qty: number;
  couponCode?: string;
  discount: number; // paise off list price
  courier?: string;
  tracking?: string;
  invoiceNo?: number;
  customerId?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
}

export interface OrderEvent {
  id: string;
  type: string;
  note: string | null;
  actor: string;
  createdAt: string;
}

type Row = typeof orders.$inferSelect;

function toOrder(r: Row): Order {
  return {
    id: r.id,
    paymentId: r.paymentId ?? undefined,
    status: r.status as OrderStatus,
    amount: r.amount,
    currency: r.currency,
    item: r.item ?? undefined,
    variantKey: r.variantKey ?? undefined,
    qty: r.qty,
    couponCode: r.couponCode ?? undefined,
    discount: r.discount,
    courier: r.courier ?? undefined,
    tracking: r.tracking ?? undefined,
    invoiceNo: r.invoiceNo ?? undefined,
    customerId: r.customerId ?? undefined,
    customer: {
      name: r.name,
      email: r.email,
      phone: r.phone,
      address: r.address,
      city: r.city,
      state: r.state,
      pincode: r.pincode,
    },
    createdAt: r.createdAt.toISOString(),
    paidAt: r.paidAt?.toISOString(),
    shippedAt: r.shippedAt?.toISOString(),
    deliveredAt: r.deliveredAt?.toISOString(),
    cancelledAt: r.cancelledAt?.toISOString(),
    refundedAt: r.refundedAt?.toISOString(),
  };
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}

async function logEvent(orderId: string, type: string, actor: string, note?: string) {
  await db().insert(orderEvents).values({ orderId, type, actor, note });
}

/* ---------- create ---------- */

export async function saveOrder(input: {
  id: string;
  amount: number;
  currency: string;
  item: string;
  variantKey: string;
  qty?: number;
  couponCode?: string;
  discount?: number;
  customer: Order["customer"];
}) {
  const c = input.customer;

  // keep one customer record per phone; the latest order wins the details
  const [cust] = await db()
    .insert(customers)
    .values({
      phone: normalizePhone(c.phone),
      name: c.name,
      email: c.email,
      address: c.address,
      city: c.city,
      state: c.state,
      pincode: c.pincode,
    })
    .onConflictDoUpdate({
      target: customers.phone,
      set: {
        name: c.name,
        email: c.email,
        address: c.address,
        city: c.city,
        state: c.state,
        pincode: c.pincode,
      },
    })
    .returning({ id: customers.id });

  await db().insert(orders).values({
    id: input.id,
    customerId: cust.id,
    status: "created",
    amount: input.amount,
    currency: input.currency,
    item: input.item,
    variantKey: input.variantKey,
    qty: input.qty ?? 1,
    couponCode: input.couponCode ?? null,
    discount: input.discount ?? 0,
    name: c.name,
    email: c.email,
    phone: c.phone,
    address: c.address,
    city: c.city,
    state: c.state,
    pincode: c.pincode,
  });

  await logEvent(input.id, "created", "customer");
}

/* ---------- read ---------- */

export async function getOrder(id: string): Promise<Order | null> {
  const rows = await db().select().from(orders).where(eq(orders.id, id)).limit(1);
  return rows[0] ? toOrder(rows[0]) : null;
}

export async function listOrders(opts?: {
  status?: OrderStatus | "";
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ orders: Order[]; total: number }> {
  const conditions = [];
  if (opts?.status) conditions.push(eq(orders.status, opts.status));
  if (opts?.q) {
    const like = `%${opts.q.trim()}%`;
    conditions.push(
      or(
        ilike(orders.id, like),
        ilike(orders.name, like),
        ilike(orders.phone, like),
        ilike(orders.email, like),
        ilike(orders.pincode, like)
      )
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, totals] = await Promise.all([
    db()
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(opts?.limit ?? 50)
      .offset(opts?.offset ?? 0),
    db().select({ n: count() }).from(orders).where(where),
  ]);

  return { orders: rows.map(toOrder), total: totals[0].n };
}

export async function getOrderEvents(orderId: string): Promise<OrderEvent[]> {
  const rows = await db()
    .select()
    .from(orderEvents)
    .where(eq(orderEvents.orderId, orderId))
    .orderBy(desc(orderEvents.createdAt));
  return rows.map((e) => ({
    id: e.id,
    type: e.type,
    note: e.note,
    actor: e.actor,
    createdAt: e.createdAt.toISOString(),
  }));
}

export async function getOrderRefunds(orderId: string) {
  return db().select().from(refunds).where(eq(refunds.orderId, orderId));
}

/* ---------- stock ---------- */

export const LOW_STOCK_THRESHOLD = 5;

/** Adjust tracked stock and return the variant's new level (null = untracked). */
async function adjustStock(variantKey: string | null | undefined, delta: number) {
  if (!variantKey) return null;
  const rows = await db()
    .update(productVariants)
    .set({ stock: sql`${productVariants.stock} + ${delta}` })
    .where(and(eq(productVariants.key, variantKey), sql`${productVariants.stock} IS NOT NULL`))
    .returning({ weight: productVariants.weight, sku: productVariants.sku, stock: productVariants.stock });
  return rows[0] ?? null;
}

/* ---------- transitions ---------- */

/**
 * Transition an order to paid exactly once. Both the browser verify call and
 * the Razorpay webhook race to confirm a payment — `transitioned` tells the
 * caller whether THIS call won (and should send notifications). Also assigns
 * the invoice number and decrements tracked stock.
 */
export async function markPaid(id: string, paymentId: string) {
  const rows = await db()
    .update(orders)
    .set({
      status: "paid",
      paymentId,
      paidAt: new Date(),
      invoiceNo: sql`nextval('invoice_seq')::int`,
    })
    .where(and(eq(orders.id, id), inArray(orders.status, ["created", "failed"])))
    .returning();

  if (!rows[0]) return { order: await getOrder(id), transitioned: false, lowStock: [] };

  const variant = await adjustStock(rows[0].variantKey, -rows[0].qty);
  if (rows[0].couponCode) await redeemCoupon(rows[0].couponCode);
  await logEvent(id, "paid", "system", `Razorpay payment ${paymentId}`);

  // flag a low-stock alert only on the transition past the threshold (not every sale)
  const lowStock =
    variant && variant.stock !== null && variant.stock <= LOW_STOCK_THRESHOLD &&
    variant.stock + rows[0].qty > LOW_STOCK_THRESHOLD
      ? [{ weight: variant.weight, sku: variant.sku, stock: variant.stock }]
      : [];

  return { order: toOrder(rows[0]), transitioned: true, lowStock };
}

/** Failed payment — only flips orders still awaiting payment (never clobbers a paid one). */
export async function markFailed(id: string, note?: string) {
  const rows = await db()
    .update(orders)
    .set({ status: "failed" })
    .where(and(eq(orders.id, id), eq(orders.status, "created")))
    .returning();
  if (rows[0]) await logEvent(id, "failed", "system", note);
  return rows[0] ? toOrder(rows[0]) : null;
}

export async function markShipped(
  id: string,
  opts: { courier?: string; tracking?: string; actor: string }
) {
  const rows = await db()
    .update(orders)
    .set({
      status: "shipped",
      shippedAt: new Date(),
      courier: opts.courier || null,
      tracking: opts.tracking || null,
    })
    .where(and(eq(orders.id, id), eq(orders.status, "paid")))
    .returning();
  if (rows[0]) {
    const via = [opts.courier, opts.tracking].filter(Boolean).join(" ");
    await logEvent(id, "shipped", opts.actor, via || undefined);
  }
  return rows[0] ? toOrder(rows[0]) : null;
}

export async function markDelivered(id: string, actor: string) {
  const rows = await db()
    .update(orders)
    .set({ status: "delivered", deliveredAt: new Date() })
    .where(and(eq(orders.id, id), eq(orders.status, "shipped")))
    .returning();
  if (rows[0]) await logEvent(id, "delivered", actor);
  return rows[0] ? toOrder(rows[0]) : null;
}

/** Cancel an order that never got paid. Paid orders go through refunds instead. */
export async function cancelOrder(id: string, actor: string) {
  const rows = await db()
    .update(orders)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(and(eq(orders.id, id), inArray(orders.status, ["created", "failed"])))
    .returning();
  if (rows[0]) await logEvent(id, "cancelled", actor);
  return rows[0] ? toOrder(rows[0]) : null;
}

/** Record a Razorpay refund: flips status, restores tracked stock. */
export async function markRefunded(
  id: string,
  refund: { refundId: string; amount: number; reason?: string },
  actor: string
) {
  const rows = await db()
    .update(orders)
    .set({ status: "refunded", refundedAt: new Date() })
    .where(and(eq(orders.id, id), inArray(orders.status, ["paid", "shipped", "delivered"])))
    .returning();
  if (!rows[0]) return null;

  await db()
    .insert(refunds)
    .values({
      id: refund.refundId,
      orderId: id,
      amount: refund.amount,
      reason: refund.reason,
    })
    .onConflictDoNothing();
  await adjustStock(rows[0].variantKey, rows[0].qty);
  await logEvent(id, "refund_initiated", actor, refund.reason);
  return toOrder(rows[0]);
}

/** Razorpay webhook confirmation that a refund reached the customer. */
export async function markRefundProcessed(refundId: string) {
  const rows = await db()
    .update(refunds)
    .set({ status: "processed" })
    .where(eq(refunds.id, refundId))
    .returning();
  if (rows[0]) await logEvent(rows[0].orderId, "refund_processed", "system");
  return rows[0] ?? null;
}

export async function addOrderNote(id: string, note: string, actor: string) {
  await logEvent(id, "note", actor, note);
}
