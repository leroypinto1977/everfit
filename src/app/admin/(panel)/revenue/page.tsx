import { getAdminUser } from "@/lib/admin-auth";
import { getDailyRevenue, getRevenueStats, getVariantMix } from "@/lib/revenue";
import KpiCard from "@/components/admin/KpiCard";
import RevenueChart, { type DayPoint } from "@/components/admin/RevenueChart";
import { DownloadIcon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

function parseDate(value: string | undefined, fallback: Date) {
  const d = value ? new Date(`${value}T00:00:00`) : fallback;
  return isNaN(d.getTime()) ? fallback : d;
}

function toInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;

  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - 29);
  defaultFrom.setHours(0, 0, 0, 0);
  const from = parseDate(sp.from, defaultFrom);
  const to = parseDate(sp.to, new Date()); // inclusive in the UI
  const toExclusive = new Date(to);
  toExclusive.setDate(toExclusive.getDate() + 1);
  toExclusive.setHours(0, 0, 0, 0);

  const [stats, daily, mix, user] = await Promise.all([
    getRevenueStats(from, toExclusive),
    getDailyRevenue(from, toExclusive),
    getVariantMix(from, toExclusive),
    getAdminUser(),
  ]);

  // continuous day series for the chart (only for ranges the chart can fit)
  const rangeDays = Math.round((toExclusive.getTime() - from.getTime()) / 86_400_000);
  let days: DayPoint[] | null = null;
  if (rangeDays <= 92) {
    const byDay = new Map(daily.map((d) => [new Date(d.day).toDateString(), d]));
    days = [];
    for (let i = 0; i < rangeDays; i++) {
      const day = new Date(from);
      day.setDate(from.getDate() + i);
      const hit = byDay.get(day.toDateString());
      days.push({
        label: day.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        revenue: (hit?.revenue ?? 0) / 100,
        orders: hit?.orders ?? 0,
      });
    }
  }

  const exportUrl = `/api/admin/export?from=${toInput(from)}&to=${toInput(to)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold italic">Revenue</h1>
          <p className="mt-1 text-sm text-[#6b7194]">Bucketed by payment date · refunds counted when initiated</p>
        </div>
        {user?.role === "owner" && (
          <a
            href={exportUrl}
            className="inline-flex items-center gap-2 rounded-xl border border-[#dcdfee] bg-white px-5 py-2.5 text-sm font-semibold text-[#4a5072] hover:border-[#2b337d]/40"
          >
            <DownloadIcon className="h-4 w-4" />
            Export CSV
          </a>
        )}
      </div>

      <form className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="from" className="mb-1 block text-xs text-[#6b7194]">
            From
          </label>
          <input
            id="from"
            type="date"
            name="from"
            defaultValue={toInput(from)}
            className="rounded-xl border border-[#dcdfee] bg-white px-4 py-2 text-sm outline-none focus:border-[#2b337d]"
          />
        </div>
        <div>
          <label htmlFor="to" className="mb-1 block text-xs text-[#6b7194]">
            To
          </label>
          <input
            id="to"
            type="date"
            name="to"
            defaultValue={toInput(to)}
            className="rounded-xl border border-[#dcdfee] bg-white px-4 py-2 text-sm outline-none focus:border-[#2b337d]"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-[#2b337d] px-5 py-2 text-sm font-semibold text-white hover:bg-[#232a68]"
        >
          Apply
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} label="Gross revenue" value={`₹${(stats.grossRevenue / 100).toLocaleString("en-IN")}`} hint={`${stats.paidOrders} paid orders`} />
        <KpiCard index={1} label="Refunded" value={`₹${(stats.refundedAmount / 100).toLocaleString("en-IN")}`} hint={`${stats.refundCount} refunds`} />
        <KpiCard index={2} label="Net revenue" value={`₹${(stats.netRevenue / 100).toLocaleString("en-IN")}`} hint="gross − refunds" />
        <KpiCard index={3} label="Avg. order value" value={`₹${Math.round(stats.avgOrderValue / 100).toLocaleString("en-IN")}`} />
      </div>

      {days && <RevenueChart days={days} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6">
          <h2 className="font-semibold">Sales by variant</h2>
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-[#9aa0c3]">
              <tr>
                <th className="py-2">Variant</th>
                <th className="py-2 text-right">Orders</th>
                <th className="py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {mix.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-[#9aa0c3]">
                    No paid orders in this range.
                  </td>
                </tr>
              )}
              {mix.map((m) => (
                <tr key={m.variant} className="border-t border-[#eef0f7]">
                  <td className="py-3 font-medium">{m.variant} kg</td>
                  <td className="py-3 text-right">{m.orders}</td>
                  <td className="py-3 text-right">₹{(m.revenue / 100).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6 text-sm text-[#6b7194]">
          <h2 className="font-semibold text-[#1c2030]">Settlements & fees</h2>
          <p className="mt-3 leading-relaxed">
            Razorpay deducts its fee before paying out, so the amount that lands in the bank is lower than
            net revenue here. Reconcile payouts in{" "}
            <a
              href="https://dashboard.razorpay.com/app/settlements"
              target="_blank"
              rel="noreferrer"
              className="text-[#2b337d] underline"
            >
              Razorpay → Settlements
            </a>
            . The CSV export includes payment IDs to match against settlement reports.
          </p>
        </div>
      </div>
    </div>
  );
}
