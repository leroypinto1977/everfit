import { requireOwner } from "@/lib/admin-auth";
import { getProductSales } from "@everfit/core/lib/revenue";
import { istAddDays, istInput, resolveRange } from "@everfit/core/lib/report-time";
import KpiCard from "@/components/KpiCard";
import RangeTabs from "@/components/RangeTabs";
import { DownloadIcon } from "@/components/icons";
import { inr } from "@everfit/core/lib/product";

export const dynamic = "force-dynamic";

/** "1.5 kg · Light", or the bare key once a variant has been deleted. */
function variantName(r: { key: string; weight: string | null; label: string | null }) {
  if (!r.weight) return null;
  return r.label ? `${r.weight} · ${r.label}` : r.weight;
}

export default async function ProductSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  await requireOwner(); // sales reporting is owner-only, like Revenue and Analytics
  const sp = await searchParams;

  const range = resolveRange(sp);
  const { from, to } = range; // `to` is inclusive in the UI
  const rows = await getProductSales(from, istAddDays(to, 1));

  const totalUnits = rows.reduce((n, r) => n + r.units, 0);
  const totalOrders = rows.reduce((n, r) => n + r.orders, 0);
  const totalRevenue = rows.reduce((n, r) => n + r.revenue, 0);
  const totalRefundedUnits = rows.reduce((n, r) => n + r.refundedUnits, 0);
  const uncostedUnits = rows.reduce((n, r) => n + r.uncostedUnits, 0);
  const best = rows.find((r) => r.units > 0);
  const unitsPerOrder = totalOrders > 0 ? totalUnits / totalOrders : 0;

  const exportUrl = `/api/product-sales-export?from=${istInput(from)}&to=${istInput(to)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold italic">Products sold</h1>
          <p className="mt-1 text-sm text-[#6b7194]">
            Units per variant, by payment date (IST) · refunded orders are listed separately, not counted as sold
          </p>
        </div>
        <a
          href={exportUrl}
          className="inline-flex items-center gap-2 rounded-xl border border-[#dcdfee] bg-white px-5 py-2.5 text-sm font-semibold text-[#4a5072] hover:border-[#2b337d]/40"
        >
          <DownloadIcon className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      <RangeTabs basePath="/product-sales" range={range} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} label="Units sold" value={String(totalUnits)} hint={`across ${totalOrders} order${totalOrders === 1 ? "" : "s"}`} />
        <KpiCard
          index={1}
          label="Best seller"
          value={best ? (variantName(best) ?? best.key) : "—"}
          hint={best ? `${best.units} unit${best.units === 1 ? "" : "s"}` : "no sales in this range"}
        />
        <KpiCard index={2} label="Units per order" value={unitsPerOrder ? unitsPerOrder.toFixed(2) : "—"} hint="units ÷ orders" />
        <KpiCard
          index={3}
          label="Returned"
          value={String(totalRefundedUnits)}
          hint="units on refunded orders"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#e3e5f0] bg-white">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-6 py-4">
          <h2 className="font-semibold">By variant</h2>
          <span className="text-xs text-[#9aa0c3]">most units first · revenue is GST-inclusive</span>
        </div>
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-y border-[#e3e5f0] text-xs uppercase tracking-wider text-[#9aa0c3]">
            <tr>
              <th className="px-6 py-3">Variant</th>
              <th className="px-6 py-3">SKU</th>
              <th className="px-6 py-3 text-right">Units</th>
              <th className="px-6 py-3">Share</th>
              <th className="px-6 py-3 text-right">Orders</th>
              <th className="px-6 py-3 text-right">Revenue</th>
              <th className="px-6 py-3 text-right">Avg. unit price</th>
              <th className="px-6 py-3 text-right">Returned</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#9aa0c3]">
                  No paid orders in this range.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const name = variantName(r);
              const share = totalUnits > 0 ? (r.units / totalUnits) * 100 : 0;
              return (
                <tr key={r.key} className="border-b border-[#eef0f7] last:border-0">
                  <td className="px-6 py-3 font-medium">
                    {name ?? (
                      <>
                        {r.key} <span className="text-[#c0863a]">· retired</span>
                      </>
                    )}
                    {r.product && <div className="text-xs font-normal text-[#9aa0c3]">{r.product}</div>}
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-[#9aa0c3]">{r.sku ?? "—"}</td>
                  <td className="px-6 py-3 text-right font-semibold">{r.units}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-[#eef0f7]">
                        <div
                          className="h-full rounded-full bg-[#2b337d]"
                          style={{ width: `${Math.max(share, r.units > 0 ? 2 : 0)}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#9aa0c3]">{share.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right text-[#6b7194]">{r.orders}</td>
                  <td className="px-6 py-3 text-right">{inr(r.revenue)}</td>
                  <td className="px-6 py-3 text-right text-[#6b7194]">
                    {r.units > 0 ? inr(Math.round(r.revenue / r.units)) : "—"}
                  </td>
                  <td className="px-6 py-3 text-right text-[#6b7194]">{r.refundedUnits || "—"}</td>
                </tr>
              );
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="border-t border-[#e3e5f0] bg-[#f8f9fd] text-sm font-semibold">
              <tr>
                <td className="px-6 py-3" colSpan={2}>
                  Total
                </td>
                <td className="px-6 py-3 text-right">{totalUnits}</td>
                <td className="px-6 py-3" />
                <td className="px-6 py-3 text-right">{totalOrders}</td>
                <td className="px-6 py-3 text-right">{inr(totalRevenue)}</td>
                <td className="px-6 py-3" />
                <td className="px-6 py-3 text-right">{totalRefundedUnits || "—"}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* margin per variant — only worth a table once some costs are set */}
      <div className="overflow-x-auto rounded-2xl border border-[#e3e5f0] bg-white">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-6 py-4">
          <h2 className="font-semibold">Contribution by variant</h2>
          <span className="text-xs text-[#9aa0c3]">revenue − cost of the units sold · GST excluded from neither side</span>
        </div>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-y border-[#e3e5f0] text-xs uppercase tracking-wider text-[#9aa0c3]">
            <tr>
              <th className="px-6 py-3">Variant</th>
              <th className="px-6 py-3 text-right">Revenue</th>
              <th className="px-6 py-3 text-right">Cost of goods</th>
              <th className="px-6 py-3 text-right">Contribution</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-[#9aa0c3]">
                  No paid orders in this range.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-[#eef0f7] last:border-0">
                <td className="px-6 py-3 font-medium">
                  {variantName(r) ?? r.key}
                  {r.uncostedUnits > 0 && (
                    <span className="ml-2 text-xs font-normal text-amber-700">
                      {r.uncostedUnits} unit{r.uncostedUnits === 1 ? "" : "s"} with no cost
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 text-right">{inr(r.revenue)}</td>
                <td className="px-6 py-3 text-right text-[#6b7194]">{r.cogs ? inr(r.cogs) : "—"}</td>
                <td className="px-6 py-3 text-right font-medium">{inr(r.revenue - r.cogs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-6 py-4 text-xs text-[#9aa0c3]">
          Contribution is GST-inclusive revenue minus the snapshotted unit cost of the units sold — it is not
          net profit: it carries no payment fees and no GST reversal. See{" "}
          <a href="/revenue" className="underline underline-offset-2 hover:text-[#2b337d]">
            Revenue → Profit &amp; margin
          </a>{" "}
          for the full P&amp;L.
          {uncostedUnits > 0 && (
            <>
              {" "}
              <span className="text-amber-700">
                {uncostedUnits} sold unit{uncostedUnits === 1 ? "" : "s"} in this range have no cost set, so cost
                of goods is a floor and contribution a ceiling.{" "}
                <a href="/products" className="font-semibold underline">
                  Set costs
                </a>
                .
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
