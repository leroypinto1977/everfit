import { requireOwner } from "@/lib/admin-auth";
import {
  getDailyRevenue,
  getMonthlyRevenue,
  getPaymentMethodMix,
  getRevenueStats,
  getVariantMix,
} from "@/lib/revenue";
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

function monthLabel(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

const METHOD_LABEL: Record<string, string> = {
  online: "Online (Razorpay)",
  upi: "UPI",
  card: "Card",
  netbanking: "Netbanking",
  wallet: "Wallet",
  cash: "Cash",
  bank: "Bank transfer",
  other: "Other",
  unspecified: "Unspecified",
};

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireOwner(); // revenue analytics are owner-only
  const sp = await searchParams;

  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - 29);
  defaultFrom.setHours(0, 0, 0, 0);
  const from = parseDate(sp.from, defaultFrom);
  const to = parseDate(sp.to, new Date()); // inclusive in the UI
  const toExclusive = new Date(to);
  toExclusive.setDate(toExclusive.getDate() + 1);
  toExclusive.setHours(0, 0, 0, 0);

  const [stats, daily, mix, monthly, methodMix] = await Promise.all([
    getRevenueStats(from, toExclusive),
    getDailyRevenue(from, toExclusive),
    getVariantMix(from, toExclusive),
    getMonthlyRevenue(12),
    getPaymentMethodMix(from, toExclusive),
  ]);

  // month-on-month with % change vs the previous month, newest first
  const months = monthly
    .map((m, i) => {
      const prev = i > 0 ? monthly[i - 1].revenue : null;
      const change = prev && prev > 0 ? Math.round(((m.revenue - prev) / prev) * 100) : null;
      return { ...m, change };
    })
    .reverse();

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
        <a
          href={exportUrl}
          className="inline-flex items-center gap-2 rounded-xl border border-[#dcdfee] bg-white px-5 py-2.5 text-sm font-semibold text-[#4a5072] hover:border-[#2b337d]/40"
        >
          <DownloadIcon className="h-4 w-4" />
          Export CSV
        </a>
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

      {/* month on month */}
      <div className="overflow-x-auto rounded-2xl border border-[#e3e5f0] bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-semibold">Month on month</h2>
          <span className="text-xs text-[#9aa0c3]">last 12 months · by payment date</span>
        </div>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-y border-[#e3e5f0] text-xs uppercase tracking-wider text-[#9aa0c3]">
            <tr>
              <th className="px-6 py-3">Month</th>
              <th className="px-6 py-3 text-right">Revenue</th>
              <th className="px-6 py-3 text-right">Orders</th>
              <th className="px-6 py-3 text-right">Manual</th>
              <th className="px-6 py-3 text-right">vs prev</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.month} className="border-b border-[#eef0f7] last:border-0">
                <td className="px-6 py-3 font-medium">{monthLabel(m.month)}</td>
                <td className="px-6 py-3 text-right font-medium">
                  ₹{(m.revenue / 100).toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-3 text-right text-[#6b7194]">{m.orders}</td>
                <td className="px-6 py-3 text-right text-[#6b7194]">
                  {m.manualOrders ? `₹${(m.manualRevenue / 100).toLocaleString("en-IN")}` : "—"}
                </td>
                <td className="px-6 py-3 text-right">
                  {m.change === null ? (
                    <span className="text-[#9aa0c3]">—</span>
                  ) : (
                    <span className={m.change >= 0 ? "font-medium text-emerald-700" : "font-medium text-red-600"}>
                      {m.change >= 0 ? "+" : ""}
                      {m.change}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

        <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6">
          <h2 className="font-semibold">Payment methods</h2>
          <p className="mt-1 text-xs text-[#9aa0c3]">
            Online orders show the Razorpay method when captured; manual sales show how they were paid.
          </p>
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-[#9aa0c3]">
              <tr>
                <th className="py-2">Method</th>
                <th className="py-2 text-right">Orders</th>
                <th className="py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {methodMix.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-[#9aa0c3]">
                    No paid orders in this range.
                  </td>
                </tr>
              )}
              {methodMix.map((m) => (
                <tr key={m.method} className="border-t border-[#eef0f7]">
                  <td className="py-3 font-medium">{METHOD_LABEL[m.method] ?? m.method}</td>
                  <td className="py-3 text-right">{m.orders}</td>
                  <td className="py-3 text-right">₹{(m.revenue / 100).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  );
}
