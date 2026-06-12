import { promises as fs } from "fs";
import path from "path";
import { Pool } from "pg";

/**
 * Order persistence with two backends:
 *
 * - DATABASE_URL set (production — e.g. Neon Postgres from the Vercel
 *   Marketplace): a single `orders` table with the order as JSONB.
 * - No DATABASE_URL (local dev): a JSON file under .data/ so the flow
 *   works with zero setup. Serverless filesystems are ephemeral, so this
 *   fallback does NOT persist across deploys/instances on Vercel.
 */

export type OrderStatus = "created" | "paid" | "failed" | "shipped" | "delivered";

export interface Order {
  id: string; // razorpay_order_id
  paymentId?: string;
  status: OrderStatus;
  amount: number; // in paise
  currency: string;
  item?: string; // e.g. "EVHERFIT Infinity Band — 1 kg × 2 (Strength)"
  tracking?: string; // courier tracking number, set when shipped
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
}

interface OrderStore {
  save(order: Order): Promise<void>;
  update(id: string, patch: Partial<Order>): Promise<Order | null>;
  get(id: string): Promise<Order | null>;
  list(): Promise<Order[]>;
}

/* ---------- JSON file backend (local dev) ---------- */

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "orders.json");

const fileStore: OrderStore = {
  async save(order) {
    const orders = await this.list();
    orders.unshift(order);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(orders, null, 2));
  },
  async update(id, patch) {
    const orders = await this.list();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    orders[idx] = { ...orders[idx], ...patch };
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(orders, null, 2));
    return orders[idx];
  },
  async get(id) {
    return (await this.list()).find((o) => o.id === id) ?? null;
  },
  async list() {
    try {
      return JSON.parse(await fs.readFile(FILE, "utf8"));
    } catch {
      return [];
    }
  },
};

/* ---------- Postgres backend (production) ---------- */

let pool: Pool | undefined;
let schemaReady: Promise<unknown> | undefined;

function db() {
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  schemaReady ??= pool.query(
    `CREATE TABLE IF NOT EXISTS orders (
       id text PRIMARY KEY,
       data jsonb NOT NULL,
       created_at timestamptz NOT NULL DEFAULT now()
     )`
  );
  return { pool, schemaReady };
}

const pgStore: OrderStore = {
  async save(order) {
    const { pool, schemaReady } = db();
    await schemaReady;
    await pool.query(
      "INSERT INTO orders (id, data, created_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
      [order.id, order, order.createdAt]
    );
  },
  async update(id, patch) {
    const { pool, schemaReady } = db();
    await schemaReady;
    // patch fields are flat, so a shallow jsonb merge is safe
    const res = await pool.query(
      "UPDATE orders SET data = data || $2 WHERE id = $1 RETURNING data",
      [id, patch]
    );
    return res.rows[0]?.data ?? null;
  },
  async get(id) {
    const { pool, schemaReady } = db();
    await schemaReady;
    const res = await pool.query("SELECT data FROM orders WHERE id = $1", [id]);
    return res.rows[0]?.data ?? null;
  },
  async list() {
    const { pool, schemaReady } = db();
    await schemaReady;
    const res = await pool.query("SELECT data FROM orders ORDER BY created_at DESC LIMIT 500");
    return res.rows.map((r) => r.data);
  },
};

const store: OrderStore = process.env.DATABASE_URL ? pgStore : fileStore;

/* ---------- public API ---------- */

export async function saveOrder(order: Order) {
  await store.save(order);
}

export async function updateOrder(id: string, patch: Partial<Order>) {
  return store.update(id, patch);
}

export async function getOrder(id: string) {
  return store.get(id);
}

export async function listOrders(): Promise<Order[]> {
  return store.list();
}

/**
 * Transition an order to paid exactly once. Both the browser verify call
 * and the Razorpay webhook race to confirm a payment — `transitioned`
 * tells the caller whether THIS call won (and should send notifications).
 */
export async function markPaid(id: string, paymentId: string) {
  const existing = await store.get(id);
  if (!existing) return { order: null, transitioned: false };
  if (["paid", "shipped", "delivered"].includes(existing.status)) {
    return { order: existing, transitioned: false };
  }
  const order = await store.update(id, {
    status: "paid",
    paymentId,
    paidAt: new Date().toISOString(),
  });
  return { order, transitioned: order !== null };
}
