import { listOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  paid: "bg-accent/15 text-accent",
  created: "bg-yellow-500/15 text-yellow-400",
  failed: "bg-red-500/15 text-red-400",
  shipped: "bg-blue-500/15 text-blue-400",
};

/**
 * Client-facing order dashboard. Protected by a shared key:
 *   /admin/orders?key=<ADMIN_KEY>
 * Swap for real auth (e.g. Clerk) before adding more admin features.
 */
export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted">
        Unauthorized — append ?key=&lt;ADMIN_KEY&gt; to the URL.
      </main>
    );
  }

  const orders = await listOrders();
  const paid = orders.filter((o) => o.status === "paid");
  const revenue = paid.reduce((sum, o) => sum + o.amount, 0) / 100;

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="font-display text-3xl font-bold">Orders</h1>
      <p className="mt-2 text-muted">
        {paid.length} paid orders · ₹{revenue.toLocaleString("en-IN")} revenue
      </p>

      <div className="mt-10 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-card text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-4">Order</th>
              <th className="px-5 py-4">Customer</th>
              <th className="px-5 py-4">Contact</th>
              <th className="px-5 py-4">Ship to</th>
              <th className="px-5 py-4">Amount</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-muted">
                  No orders yet.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0">
                <td className="px-5 py-4 font-mono text-xs">{o.id}</td>
                <td className="px-5 py-4">{o.customer.name}</td>
                <td className="px-5 py-4 text-muted">
                  {o.customer.phone}
                  <br />
                  {o.customer.email}
                </td>
                <td className="max-w-56 px-5 py-4 text-muted">
                  {o.customer.address}, {o.customer.city} {o.customer.pincode}
                </td>
                <td className="px-5 py-4">₹{(o.amount / 100).toLocaleString("en-IN")}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[o.status]}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted">
                  {new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
