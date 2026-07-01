import { requireOwner } from "@/lib/admin-auth";
import { listVariantsAdmin } from "@/lib/catalog";
import { listMovements, REASON_LABEL } from "@/lib/inventory";
import { DownloadIcon } from "@/components/admin/icons";
import { adjustStockAction } from "./actions";

export const dynamic = "force-dynamic";

const LOW = 5;

export default async function InventoryPage() {
  await requireOwner();
  const [variants, movements] = await Promise.all([listVariantsAdmin(), listMovements(60)]);
  const tracked = variants.filter((v) => v.stock !== null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold italic">Inventory</h1>
        <p className="mt-1 text-sm text-[#6b7194]">
          Add or subtract stock — every change is logged below. Sales and refunds adjust it automatically.
        </p>
      </div>

      {/* current stock */}
      <div className="overflow-x-auto rounded-2xl border border-[#e3e5f0] bg-white">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-[#e3e5f0] text-xs uppercase tracking-wider text-[#9aa0c3]">
            <tr>
              <th className="px-6 py-4">Variant</th>
              <th className="px-6 py-4">SKU</th>
              <th className="px-6 py-4">In stock</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => {
              const untracked = v.stock === null;
              const out = !untracked && (v.stock as number) <= 0;
              const low = !untracked && !out && (v.stock as number) <= LOW;
              return (
                <tr key={v.id} className="border-b border-[#eef0f7] last:border-0">
                  <td className="px-6 py-4 font-medium">
                    {v.weight} · {v.label}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-[#9aa0c3]">{v.sku}</td>
                  <td className="px-6 py-4 font-semibold">{untracked ? "—" : v.stock}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        untracked
                          ? "bg-gray-100 text-gray-500"
                          : out
                            ? "bg-red-50 text-red-600"
                            : low
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {untracked ? "not tracked" : out ? "out of stock" : low ? "low" : "in stock"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* adjust form */}
      <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6">
        <h2 className="font-semibold">Adjust stock</h2>
        <p className="mt-1 text-sm text-[#6b7194]">
          Use a positive number to add (restock) or a negative number to subtract (breakage, samples…).
        </p>
        <form action={adjustStockAction} className="mt-5 grid gap-4 sm:grid-cols-[1.4fr_0.8fr_1fr] sm:items-end">
          <div>
            <label htmlFor="variantId" className="mb-1.5 block text-sm font-medium text-[#4a5072]">
              Variant
            </label>
            <select
              id="variantId"
              name="variantId"
              className="w-full rounded-xl border border-[#dcdfee] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#2b337d]"
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.weight} · {v.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="delta" className="mb-1.5 block text-sm font-medium text-[#4a5072]">
              Change (+/−)
            </label>
            <input
              id="delta"
              name="delta"
              type="number"
              step={1}
              placeholder="e.g. 50 or -2"
              required
              className="w-full rounded-xl border border-[#dcdfee] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#2b337d]"
            />
          </div>
          <div>
            <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-[#4a5072]">
              Reason
            </label>
            <select
              id="reason"
              name="reason"
              defaultValue="restock"
              className="w-full rounded-xl border border-[#dcdfee] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#2b337d]"
            >
              <option value="restock">Restock</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-[#4a5072]">
              Note <span className="font-normal text-[#9aa0c3]">(optional)</span>
            </label>
            <input
              id="note"
              name="note"
              type="text"
              placeholder="e.g. new batch from supplier"
              className="w-full rounded-xl border border-[#dcdfee] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#2b337d]"
            />
          </div>
          <button
            type="submit"
            className="h-fit rounded-xl bg-[#2b337d] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#232a68]"
          >
            Apply change
          </button>
        </form>
        {tracked.length === 0 && (
          <p className="mt-3 text-xs text-[#9aa0c3]">
            Tip: applying a change to a not-tracked variant starts tracking it from that number.
          </p>
        )}
      </div>

      {/* movement history */}
      <div className="overflow-x-auto rounded-2xl border border-[#e3e5f0] bg-white">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <h2 className="font-semibold">Recent movements</h2>
          {movements.length > 0 && (
            <a
              href="/api/admin/inventory-export"
              className="inline-flex items-center gap-2 rounded-xl border border-[#dcdfee] bg-white px-4 py-2 text-sm font-semibold text-[#4a5072] transition-colors hover:border-[#2b337d]/40"
            >
              <DownloadIcon className="h-4 w-4" />
              Export CSV
            </a>
          )}
        </div>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-y border-[#e3e5f0] text-xs uppercase tracking-wider text-[#9aa0c3]">
            <tr>
              <th className="px-6 py-4">When</th>
              <th className="px-6 py-4">Variant</th>
              <th className="px-6 py-4">Change</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4">By</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-14 text-center text-[#9aa0c3]">
                  No stock movements yet.
                </td>
              </tr>
            )}
            {movements.map((m) => (
              <tr key={m.id} className="border-b border-[#eef0f7] last:border-0">
                <td className="whitespace-nowrap px-6 py-4 text-xs text-[#9aa0c3]">
                  {new Date(m.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </td>
                <td className="px-6 py-4">{m.weight} · {m.label}</td>
                <td className={`px-6 py-4 font-semibold ${m.delta >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {m.delta >= 0 ? `+${m.delta}` : m.delta}
                </td>
                <td className="px-6 py-4 text-[#6b7194]">
                  {REASON_LABEL[m.reason] ?? m.reason}
                  {m.note && <span className="block text-xs text-[#9aa0c3]">{m.note}</span>}
                </td>
                <td className="px-6 py-4 text-xs text-[#9aa0c3]">{m.actor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
