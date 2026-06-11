import { promises as fs } from "fs";
import path from "path";

/**
 * Order persistence.
 *
 * Local/dev: a JSON file under .data/ so the flow works with zero setup.
 * Production: swap these three functions for a real database (e.g. Neon
 * Postgres via the Vercel Marketplace) — the rest of the app only talks
 * to this interface. A serverless filesystem is ephemeral, so the JSON
 * file will NOT persist on Vercel.
 */

export type OrderStatus = "created" | "paid" | "failed" | "shipped" | "delivered";

export interface Order {
  id: string; // razorpay_order_id
  paymentId?: string;
  status: OrderStatus;
  amount: number; // in paise
  currency: string;
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

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "orders.json");

async function readAll(): Promise<Order[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(orders: Order[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(orders, null, 2));
}

export async function saveOrder(order: Order) {
  const orders = await readAll();
  orders.unshift(order);
  await writeAll(orders);
}

export async function updateOrder(id: string, patch: Partial<Order>) {
  const orders = await readAll();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], ...patch };
  await writeAll(orders);
  return orders[idx];
}

export async function listOrders(): Promise<Order[]> {
  return readAll();
}
