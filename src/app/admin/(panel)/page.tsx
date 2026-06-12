import Link from "next/link";
import { listOrders } from "@/lib/orders";
import KpiCard from "@/components/admin/KpiCard";
import RevenueChart, { type DayPoint } from "@/components/admin/RevenueChart";
import StatusBadge from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

const fulfilled = new Set(["paid", "shipped", "delivered"]);

export default async function AdminDashboard() {
  const orders = await listOrders();
  const paidOrders = orders.filter((o) => fulfilled.has(o.status));
  const revenue = paidOrders.reduce((sum, o) => sum + o.amount, 0) / 100;
  const toShip = orders.filter((o) => o.status === "paid").length;
  const aov = paidOrders.length ? Math.round(revenue / paidOrders.length) : 0;

  // bucket paid orders into the last 14 days
  const days: DayPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const inDay = paidOrders.filter((o) => {
      const t = new Date(o.paidAt ?? o.createdAt).getTime();
      return t >= day.getTime() && t < next.getTime();
    });
    days.push({
      label: day.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      revenue: inDay.reduce((s, o) => s + o.amount, 0) / 100,
      orders: inDay.length,
    });
  }

  const recent = orders.slice(0, 6);

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold italic">Dashboard</h1>
          <p className="mt-1 text-sm text-[#6b7194]">EVHERFIT Infinity Band store overview</p>
        </div>
        <Link
          href="/admin/orders"
          className="rounded-xl bg-[#2b337d] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#232a68]"
        >
          View all orders
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} label="Total revenue" value={`₹${revenue.toLocaleString("en-IN")}`} hint="paid + shipped + delivered" />
        <KpiCard index={1} label="Orders" value={String(paidOrders.length)} hint="successful payments" />
        <KpiCard index={2} label="To ship" value={String(toShip)} hint="paid, awaiting dispatch" />
        <KpiCard index={3} label="Avg. order value" value={`₹${aov.toLocaleString("en-IN")}`} />
      </div>

      <div className="mt-6">
        <RevenueChart days={days} />
      </div>

      <div className="mt-6 rounded-2xl border border-[#e3e5f0] bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-semibold">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-[#2b337d] hover:underline">
            See all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-6 pb-8 pt-2 text-sm text-[#9aa0c3]">
            No orders yet — they&apos;ll appear here the moment someone checks out.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-t border-[#eef0f7] transition-colors hover:bg-[#f8f9fd]">
                  <td className="px-6 py-3.5">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium text-[#2b337d] hover:underline">
                      {o.customer.name}
                    </Link>
                    <span className="block font-mono text-xs text-[#9aa0c3]">{o.id}</span>
                  </td>
                  <td className="px-6 py-3.5 text-[#6b7194]">
                    {o.customer.city || "—"}
                  </td>
                  <td className="px-6 py-3.5">₹{(o.amount / 100).toLocaleString("en-IN")}</td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-6 py-3.5 text-right text-xs text-[#9aa0c3]">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
