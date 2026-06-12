// Seeds sample orders for local demos: npm run seed
// Targets the same store the app uses: Postgres when DATABASE_URL is set
// (read from .env.local/.env if present), otherwise .data/orders.json.
import { mkdir, writeFile, readFile } from "fs/promises";

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
  { item: "EVHERFIT Infinity Band — 0.5 kg × 2 (Tone)", amount: 149900 },
  { item: "EVHERFIT Infinity Band — 1 kg × 2 (Strength)", amount: 199900 },
  { item: "EVHERFIT Infinity Band — 1 kg × 2 (Strength)", amount: 199900 },
  { item: "EVHERFIT Infinity Band — 2 kg × 2 (Power)", amount: 249900 },
];

const orders = names.map(([name, city, state, pincode], i) => {
  const daysAgo = Math.floor(Math.random() * 14);
  const created = new Date(Date.now() - daysAgo * 86_400_000 - Math.random() * 60_000_000);
  const status = statuses[i % statuses.length];
  const paid = status !== "created" && status !== "failed";
  const first = name.split(" ")[0].toLowerCase();
  const variant = variants[i % variants.length];
  return {
    id: `order_DEMO${String(i + 1).padStart(4, "0")}`,
    ...(paid && { paymentId: `pay_DEMO${String(i + 1).padStart(4, "0")}` }),
    status,
    amount: variant.amount,
    item: variant.item,
    currency: "INR",
    ...(status === "shipped" || status === "delivered"
      ? { tracking: `DELHIVERY-99${String(100000 + i * 7919)}` }
      : {}),
    customer: {
      name,
      email: `${first}@example.com`,
      phone: `+91 98${String(40000000 + i * 123457).slice(0, 8)}`,
      address: `${12 + i}, ${i % 2 ? "Rose Garden Apartments" : "Lakeview Residency"}, ${i % 2 ? "4th Cross" : "MG Road"}`,
      city,
      state,
      pincode,
    },
    createdAt: created.toISOString(),
    ...(paid && { paidAt: new Date(created.getTime() + 90_000).toISOString() }),
  };
});

orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

const databaseUrl = await loadDatabaseUrl();

if (databaseUrl) {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  await pool.query(
    `CREATE TABLE IF NOT EXISTS orders (
       id text PRIMARY KEY,
       data jsonb NOT NULL,
       created_at timestamptz NOT NULL DEFAULT now()
     )`
  );
  for (const order of orders) {
    await pool.query(
      `INSERT INTO orders (id, data, created_at) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET data = $2, created_at = $3`,
      [order.id, order, order.createdAt]
    );
  }
  await pool.end();
  console.log(`Seeded ${orders.length} demo orders into Postgres (DATABASE_URL)`);
} else {
  await mkdir(".data", { recursive: true });
  await writeFile(".data/orders.json", JSON.stringify(orders, null, 2));
  console.log(`Seeded ${orders.length} demo orders into .data/orders.json`);
}
