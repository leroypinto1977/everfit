import Link from "next/link";
import { listCustomers } from "@/lib/customers";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page: pageParam = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageParam, 10) || 1);
  const { customers, total } = await listCustomers({ q, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <h1 className="font-display text-3xl font-bold italic">Customers</h1>
      <p className="mt-1 text-sm text-[#6b7194]">
        {total} customer{total === 1 ? "" : "s"} — one per phone number, built automatically from orders
      </p>

      <form className="mt-6">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name, phone, email, city…"
          className="w-80 rounded-xl border border-[#dcdfee] bg-white px-4 py-2 text-sm outline-none focus:border-[#2b337d]"
        />
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[#e3e5f0] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#e3e5f0] text-xs uppercase tracking-wider text-[#9aa0c3]">
            <tr>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Orders</th>
              <th className="px-6 py-4">Lifetime value</th>
              <th className="px-6 py-4">Last order</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-14 text-center text-[#9aa0c3]">
                  No customers yet.
                </td>
              </tr>
            )}
            {customers.map((cu) => (
              <tr key={cu.id} className="border-b border-[#eef0f7] transition-colors last:border-0 hover:bg-[#f8f9fd]">
                <td className="px-6 py-4">
                  <Link href={`/admin/customers/${cu.id}`} className="font-medium text-[#2b337d] hover:underline">
                    {cu.name}
                  </Link>
                  <span className="block text-xs text-[#9aa0c3]">
                    {cu.phone} · {cu.email}
                  </span>
                </td>
                <td className="px-6 py-4 text-[#6b7194]">
                  {[cu.city, cu.state].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-6 py-4">
                  {cu.paidOrderCount}
                  {cu.paidOrderCount > 1 && (
                    <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      repeat
                    </span>
                  )}
                  {cu.orderCount > cu.paidOrderCount && (
                    <span className="block text-xs text-[#9aa0c3]">{cu.orderCount} incl. unpaid</span>
                  )}
                </td>
                <td className="px-6 py-4 font-medium">₹{(cu.totalSpent / 100).toLocaleString("en-IN")}</td>
                <td className="px-6 py-4 text-xs text-[#9aa0c3]">
                  {cu.lastOrderAt
                    ? new Date(cu.lastOrderAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-[#6b7194]">
          <span>
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/customers?${new URLSearchParams({ ...(q && { q }), page: String(page - 1) })}`}
                className="rounded-xl border border-[#dcdfee] bg-white px-4 py-2 hover:border-[#2b337d]/40"
              >
                ← Previous
              </Link>
            )}
            {page < pages && (
              <Link
                href={`/admin/customers?${new URLSearchParams({ ...(q && { q }), page: String(page + 1) })}`}
                className="rounded-xl border border-[#dcdfee] bg-white px-4 py-2 hover:border-[#2b337d]/40"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
