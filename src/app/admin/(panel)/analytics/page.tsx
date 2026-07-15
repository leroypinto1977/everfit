import { requireOwner } from "@/lib/admin-auth";
import { getFunnel, getCustomerInsights } from "@/lib/insights";
import { istAddDays, istDayStart, istDaysAgo, istInput, istParseInput } from "@/lib/report-time";
import KpiCard from "@/components/admin/KpiCard";
import { inr } from "@/lib/product";

export const dynamic = "force-dynamic";

function pct(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireOwner();
  const sp = await searchParams;

  const from = istParseInput(sp.from) ?? istDaysAgo(29);
  const to = istParseInput(sp.to) ?? istDayStart();
  const toExclusive = istAddDays(to, 1);

  const [funnel, customers] = await Promise.all([
    getFunnel(from, toExclusive),
    getCustomerInsights(from, toExclusive),
  ]);

  const stages = [
    { label: "Checkout started", value: funnel.started, tone: "bg-[#2b337d]" },
    { label: "Paid", value: funnel.paid, tone: "bg-[#3f49a5]" },
    { label: "Shipped", value: funnel.shipped, tone: "bg-[#6f77c6]" },
    { label: "Delivered", value: funnel.delivered, tone: "bg-[#9aa0dc]" },
  ];
  const conversion = pct(funnel.paid, funnel.started);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold italic">Analytics</h1>
        <p className="mt-1 text-sm text-[#6b7194]">Checkout funnel &amp; customer insights · IST</p>
      </div>

      <form className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="from" className="mb-1 block text-xs text-[#6b7194]">From</label>
          <input id="from" type="date" name="from" defaultValue={istInput(from)}
            className="rounded-xl border border-[#dcdfee] bg-white px-4 py-2 text-sm outline-none focus:border-[#2b337d]" />
        </div>
        <div>
          <label htmlFor="to" className="mb-1 block text-xs text-[#6b7194]">To</label>
          <input id="to" type="date" name="to" defaultValue={istInput(to)}
            className="rounded-xl border border-[#dcdfee] bg-white px-4 py-2 text-sm outline-none focus:border-[#2b337d]" />
        </div>
        <button type="submit"
          className="rounded-xl bg-[#2b337d] px-5 py-2 text-sm font-semibold text-white hover:bg-[#232a68]">
          Apply
        </button>
      </form>

      {/* checkout funnel */}
      <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Checkout funnel</h2>
          <span className="text-xs text-[#9aa0c3]">online orders · by checkout date</span>
        </div>

        {funnel.started === 0 ? (
          <p className="py-8 text-center text-sm text-[#9aa0c3]">No online checkouts in this range.</p>
        ) : (
          <>
            <div className="mt-6 space-y-3">
              {stages.map((s) => (
                <div key={s.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-[#4a5072]">{s.label}</span>
                    <span className="text-[#6b7194]">
                      {s.value} <span className="text-[#9aa0c3]">· {pct(s.value, funnel.started)}%</span>
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#eef0f7]">
                    <div
                      className={`h-full rounded-full ${s.tone}`}
                      style={{ width: `${Math.max(pct(s.value, funnel.started), s.value > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-[#f5f6fc] px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-[#9aa0c3]">Conversion</p>
                <p className="mt-1 text-2xl font-bold text-[#2b337d]">{conversion}%</p>
                <p className="text-xs text-[#9aa0c3]">paid ÷ started</p>
              </div>
              <div className="rounded-xl bg-[#fdf3f7] px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-[#9aa0c3]">Abandoned</p>
                <p className="mt-1 text-2xl font-bold text-[#b83280]">{funnel.abandoned}</p>
                <p className="text-xs text-[#9aa0c3]">unpaid checkouts</p>
              </div>
              <div className="rounded-xl bg-[#fef2f2] px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-[#9aa0c3]">Failed payments</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{funnel.failed}</p>
                <p className="text-xs text-[#9aa0c3]">attempted, declined</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* customer insights */}
      <div>
        <h2 className="mb-3 font-semibold">Customers</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard index={0} label="Paying customers" value={String(customers.payingCustomers)} hint="all-time, ≥1 paid order" />
          <KpiCard
            index={1}
            label="Repeat rate"
            value={`${(customers.repeatRate * 100).toFixed(0)}%`}
            hint={`${customers.repeatCustomers} bought again`}
          />
          <KpiCard index={2} label="Avg. lifetime value" value={inr(customers.avgLtv)} hint="spend per paying customer" />
          <KpiCard index={3} label="New customers" value={String(customers.newCustomers)} hint="first order in range" />
        </div>
      </div>
    </div>
  );
}
