import Link from "next/link";
import { getOrderCounts, listOrders } from "@everfit/core/lib/orders";
import { getDailyRevenue, getRevenueStats } from "@everfit/core/lib/revenue";
import { istAddDays, istDayStart, istInput, REPORT_TZ } from "@everfit/core/lib/report-time";
import { listVariantsAdmin } from "@everfit/core/lib/catalog";
import AutoRefresh from "@/components/AutoRefresh";
import KpiCard from "@/components/KpiCard";
import RevenueChart, { type DayPoint } from "@/components/RevenueChart";
import StatusBadge from "@/components/StatusBadge";
import { inr } from "@everfit/core/lib/product";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // Windows are IST-aligned so "last 30 days" matches how the store's day rolls over.
  const tomorrow = istAddDays(istDayStart(), 1); // exclusive end = start of tomorrow (IST)
  const days30 = istAddDays(tomorrow, -30);
  const days60 = istAddDays(tomorrow, -60);
  const days14 = istAddDays(tomorrow, -14);

  // aggregates come from SQL — the dashboard no longer pages 500 orders into memory
  const [stats, prevStats, daily, counts, { orders: recent }, variants] = await Promise.all([
    getRevenueStats(days30, tomorrow),
    getRevenueStats(days60, days30),
    getDailyRevenue(days14, tomorrow),
    getOrderCounts(),
    listOrders({ limit: 6 }),
    listVariantsAdmin(),
  ]);

  const lowStock = variants.filter((v) => v.active && v.stock !== null && v.stock <= 5);

  // % change vs the previous 30 days (only when there's a base to compare against)
  const delta =
    prevStats.grossRevenue > 0
      ? Math.round(((stats.grossRevenue - prevStats.grossRevenue) / prevStats.grossRevenue) * 100)
      : null;
  const deltaHint =
    delta === null ? "last 30 days" : `${delta >= 0 ? "+" : ""}${delta}% vs previous 30 days`;
  const revenueHint =
    stats.refundedAmount > 0 ? `net ${inr(stats.netRevenue)} · ${deltaHint}` : deltaHint;

  // continuous 14-day IST series for the chart
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const days: DayPoint[] = [];
  for (let i = 0; i < 14; i++) {
    const dayStart = istAddDays(days14, i);
    const hit = byDay.get(istInput(dayStart));
    days.push({
      label: dayStart.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: REPORT_TZ }),
      revenue: (hit?.revenue ?? 0) / 100,
      orders: hit?.orders ?? 0,
    });
  }

  const attention = counts.failed7d + counts.abandoned7d;

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold italic">Dashboard</h1>
          <p className="mt-1 text-sm text-[#6b7194]">EVHERFIT Infinity Band store overview</p>
        </div>
        <Link
          href="/orders"
          className="rounded-xl bg-[#2b337d] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#232a68]"
        >
          View all orders
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          label="Revenue (30 days)"
          value={inr(stats.grossRevenue)}
          hint={revenueHint}
        />
        <KpiCard index={1} label="Orders (30 days)" value={String(stats.paidOrders)} hint="successful payments" />
        <KpiCard index={2} label="To ship" value={String(counts.toShip)} hint="paid, awaiting dispatch" />
        <KpiCard
          index={3}
          label="Avg. order value"
          value={inr(stats.avgOrderValue)}
          hint="last 30 days"
        />
      </div>

      {attention > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-800">
          💸 {counts.failed7d > 0 && (
            <>
              <Link href="/orders?status=failed" className="font-semibold underline">
                {counts.failed7d} failed payment{counts.failed7d === 1 ? "" : "s"}
              </Link>
            </>
          )}
          {counts.failed7d > 0 && counts.abandoned7d > 0 && " and "}
          {counts.abandoned7d > 0 && (
            <Link href="/orders?status=created" className="font-semibold underline">
              {counts.abandoned7d} abandoned checkout{counts.abandoned7d === 1 ? "" : "s"}
            </Link>
          )}{" "}
          in the last 7 days — open one to send the customer a recovery email.
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800">
          ⚠️ Low stock:{" "}
          {lowStock.map((v) => `${v.weight} (${v.stock} left)`).join(", ")} —{" "}
          <Link href="/products" className="font-semibold underline">
            manage products
          </Link>
        </div>
      )}

      <RevenueChart days={days} />

      <div className="rounded-2xl border border-[#e3e5f0] bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-semibold">Recent orders</h2>
          <Link href="/orders" className="text-sm text-[#2b337d] hover:underline">
            See all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-6 pb-8 pt-2 text-sm text-[#9aa0c3]">
            No orders yet — they&apos;ll appear here the moment someone checks out.
          </p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-t border-[#eef0f7] transition-colors hover:bg-[#f8f9fd]">
                  <td className="px-6 py-4">
                    <Link href={`/orders/${o.id}`} className="font-medium text-[#2b337d] hover:underline">
                      {o.customer.name}
                    </Link>
                    <span className="block font-mono text-xs text-[#9aa0c3]">{o.id}</span>
                  </td>
                  <td className="px-6 py-3.5 text-[#6b7194]">
                    {o.customer.city || "—"}
                  </td>
                  <td className="px-6 py-4">₹{(o.amount / 100).toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-[#9aa0c3]">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
