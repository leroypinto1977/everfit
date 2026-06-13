// Seeds sample orders for local demos: npm run seed
// Requires DATABASE_URL (read from .env.local/.env if present) and the
// schema from `npm run db:migrate`. Inserts into the relational tables:
// customers, orders, order_events.
import { readFile } from "fs/promises";

async function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const file of [".env.local", ".env"]) {
    try {
      const env = await readFile(file, "utf8");
      const m = env.match(/^DATABASE_URL="?([^"\n]+)"?$/m);
      if (m) return m[1];
    } catch {}
  }
  return null;
}

const names = [
  ["Ananya Rao", "Bengaluru", "Karnataka", "560034"],
  ["Priya Sharma", "Mumbai", "Maharashtra", "400050"],
  ["Meera Krishnan", "Pune", "Maharashtra", "411038"],
  ["Divya Nair", "Kochi", "Kerala", "682025"],
  ["Sneha Reddy", "Hyderabad", "Telangana", "500081"],
  ["Aishwarya Iyer", "Chennai", "Tamil Nadu", "600040"],
  ["Kavya Menon", "Coimbatore", "Tamil Nadu", "641002"],
  ["Riya Kapoor", "New Delhi", "Delhi", "110017"],
  ["Lakshmi Pillai", "Thiruvananthapuram", "Kerala", "695011"],
  ["Neha Joshi", "Ahmedabad", "Gujarat", "380015"],
  ["Tanvi Desai", "Surat", "Gujarat", "395007"],
  ["Ishita Bose", "Kolkata", "West Bengal", "700019"],
  ["Pooja Hegde", "Mangaluru", "Karnataka", "575002"],
  ["Shruti Kulkarni", "Nagpur", "Maharashtra", "440010"],
  ["Anjali Verma", "Lucknow", "Uttar Pradesh", "226010"],
  ["Deepika Singh", "Jaipur", "Rajasthan", "302021"],
  ["Ritu Agarwal", "Indore", "Madhya Pradesh", "452010"],
  ["Sanya Malhotra", "Chandigarh", "Chandigarh", "160036"],
];

const statuses = ["paid", "paid", "paid", "shipped", "shipped", "delivered", "created", "failed"];

const variants = [
  { key: "0.5", item: "EVHERFIT Infinity Band — 0.5 kg × 2 (Tone)", amount: 149900 },
  { key: "1", item: "EVHERFIT Infinity Band — 1 kg × 2 (Strength)", amount: 199900 },
  { key: "1", item: "EVHERFIT Infinity Band — 1 kg × 2 (Strength)", amount: 199900 },
  { key: "2", item: "EVHERFIT Infinity Band — 2 kg × 2 (Power)", amount: 249900 },
];

const orders = names.map(([name, city, state, pincode], i) => {
  const daysAgo = Math.floor(Math.random() * 14);
  const created = new Date(Date.now() - daysAgo * 86_400_000 - Math.random() * 60_000_000);
  const status = statuses[i % statuses.length];
  const paid = status !== "created" && status !== "failed";
  const first = name.split(" ")[0].toLowerCase();
  const variant = variants[i % variants.length];
  const phone = `+91 98${String(40000000 + i * 123457).slice(0, 8)}`;
  return {
    id: `order_DEMO${String(i + 1).padStart(4, "0")}`,
    paymentId: paid ? `pay_DEMO${String(i + 1).padStart(4, "0")}` : null,
    status,
    amount: variant.amount,
    item: variant.item,
    variantKey: variant.key,
    tracking: status === "shipped" || status === "delivered" ? `99${String(100000 + i * 7919)}` : null,
    courier: status === "shipped" || status === "delivered" ? "delhivery" : null,
    name,
    email: `${first}@example.com`,
    phone,
    phoneNorm: phone.replace(/\D/g, "").slice(-10),
    address: `${12 + i}, ${i % 2 ? "Rose Garden Apartments" : "Lakeview Residency"}, ${i % 2 ? "4th Cross" : "MG Road"}`,
    city,
    state,
    pincode,
    createdAt: created,
    paidAt: paid ? new Date(created.getTime() + 90_000) : null,
    shippedAt: status === "shipped" || status === "delivered" ? new Date(created.getTime() + 86_400_000) : null,
    deliveredAt: status === "delivered" ? new Date(created.getTime() + 3 * 86_400_000) : null,
  };
});

const databaseUrl = await loadDatabaseUrl();
if (!databaseUrl) {
  console.error("DATABASE_URL is required (env or .env.local). Run npm run db:migrate first.");
  process.exit(1);
}

const { Pool } = await import("pg");
const pool = new Pool({ connectionString: databaseUrl, max: 2 });

for (const o of orders) {
  const {
    rows: [cust],
  } = await pool.query(
    `INSERT INTO customers (phone, name, email, address, city, state, pincode, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (phone) DO UPDATE SET name = $2, email = $3, address = $4, city = $5, state = $6, pincode = $7
     RETURNING id`,
    [o.phoneNorm, o.name, o.email, o.address, o.city, o.state, o.pincode, o.createdAt]
  );

  await pool.query(
    `INSERT INTO orders (id, customer_id, status, amount, currency, item, variant_key, payment_id, courier, tracking,
       invoice_no, name, email, phone, address, city, state, pincode, created_at, paid_at, shipped_at, delivered_at)
     VALUES ($1, $2, $3, $4, 'INR', $5, $6, $7, $8, $9,
       CASE WHEN $18::timestamptz IS NOT NULL THEN nextval('invoice_seq')::int END,
       $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
     ON CONFLICT (id) DO NOTHING`,
    [
      o.id, cust.id, o.status, o.amount, o.item, o.variantKey, o.paymentId, o.courier, o.tracking,
      o.name, o.email, o.phone, o.address, o.city, o.state, o.pincode,
      o.createdAt, o.paidAt, o.shippedAt, o.deliveredAt,
    ]
  );

  const events = [["created", "customer", o.createdAt]];
  if (o.paidAt) events.push(["paid", "system", o.paidAt]);
  if (o.shippedAt) events.push(["shipped", "seed@demo", o.shippedAt]);
  if (o.deliveredAt) events.push(["delivered", "seed@demo", o.deliveredAt]);
  for (const [type, actor, at] of events) {
    await pool.query(
      "INSERT INTO order_events (order_id, type, actor, created_at) VALUES ($1, $2, $3, $4)",
      [o.id, type, actor, at]
    );
  }
}

await pool.end();
console.log(`Seeded ${orders.length} demo orders into Postgres.`);
