import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Relational schema (Neon Postgres). The original single-table JSONB store
 * is preserved as `orders_legacy` by migration 0000 and backfilled into
 * these tables by migration 0001.
 */

/* ---------- team ---------- */

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("staff"), // "owner" | "staff"
  passwordHash: text("password_hash").notNull(), // scrypt: salt$hash
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export const adminSessions = pgTable("admin_sessions", {
  tokenHash: text("token_hash").primaryKey(), // sha256 of the cookie token
  userId: uuid("user_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResets = pgTable("password_resets", {
  tokenHash: text("token_hash").primaryKey(), // sha256 of the emailed token
  userId: uuid("user_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------- catalog ---------- */

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  key: text("key").notNull().unique(), // used in URLs (?w=1) and orders
  sku: text("sku").notNull(),
  label: text("label").notNull(),
  weight: text("weight").notNull(),
  blurb: text("blurb").notNull().default(""),
  price: integer("price").notNull(), // paise
  mrp: integer("mrp").notNull(), // paise, struck-through
  stock: integer("stock"), // null = not tracked
  popular: boolean("popular").notNull().default(false),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

/** Discount codes. Usage is counted when an order is PAID, not created. */
export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(), // stored uppercase
  type: text("type").notNull(), // "percent" | "flat"
  value: integer("value").notNull(), // percent (1–100) or paise
  minAmount: integer("min_amount"), // paise, order must reach this
  maxUses: integer("max_uses"), // null = unlimited
  usedCount: integer("used_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------- customers ---------- */

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull().unique(), // normalized: last 10 digits
  name: text("name").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull().default(""),
  city: text("city").notNull().default(""),
  state: text("state").notNull().default(""),
  pincode: text("pincode").notNull().default(""),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------- orders ---------- */

export const orders = pgTable("orders", {
  id: text("id").primaryKey(), // razorpay order_id, or manual_<uuid> for offline sales
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  status: text("status").notNull(), // created|paid|shipped|delivered|cancelled|refunded|failed
  source: text("source").notNull().default("online"), // "online" (shop) | "manual" (offline entry)
  paymentMethod: text("payment_method"), // upi|card|netbanking|wallet|cash|other (set for manual; optional online)
  amount: integer("amount").notNull(), // paise, charged amount (after discount)
  currency: text("currency").notNull().default("INR"),
  item: text("item"), // display string, e.g. "EVHERFIT Infinity Band — 1 kg × 2 (Strength)"
  variantKey: text("variant_key"),
  qty: integer("qty").notNull().default(1),
  couponCode: text("coupon_code"),
  discount: integer("discount").notNull().default(0), // paise taken off list price
  paymentId: text("payment_id"),
  courier: text("courier"),
  tracking: text("tracking"),
  invoiceNo: integer("invoice_no").unique(), // assigned from invoice_seq on payment
  // shipping snapshot — immutable copy of what the customer entered
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull().default(""),
  state: text("state").notNull().default(""),
  pincode: text("pincode").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  shippedAt: timestamp("shipped_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
});

/** Append-only audit log: who did what to an order, when. */
export const orderEvents = pgTable("order_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // created|paid|shipped|delivered|cancelled|refund_initiated|refund_processed|failed|note
  note: text("note"),
  actor: text("actor").notNull().default("system"), // admin email, "system", or "customer"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const refunds = pgTable("refunds", {
  id: text("id").primaryKey(), // razorpay refund_id
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // paise
  status: text("status").notNull().default("initiated"), // initiated|processed|failed
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Append-only inventory ledger: every stock change with its reason. */
export const inventoryMovements = pgTable("inventory_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  variantId: uuid("variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "cascade" }),
  delta: integer("delta").notNull(), // signed: +restock, -sale
  reason: text("reason").notNull(), // sale|return|restock|adjustment|manual_sale
  note: text("note"),
  orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
  actor: text("actor").notNull().default("system"), // admin email or "system"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
