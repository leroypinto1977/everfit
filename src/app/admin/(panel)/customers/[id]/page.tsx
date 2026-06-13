import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/customers";
import StatusBadge from "@/components/admin/StatusBadge";
import type { OrderStatus } from "@/lib/orders";
import { saveNotesAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  return (
    <>
      <Link href="/admin/customers" className="text-sm text-[#6b7194] hover:text-[#2b337d]">
        ← All customers
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold italic">{customer.name}</h1>
          <p className="mt-1 text-sm text-[#6b7194]">
            {customer.phone} · {customer.email}
          </p>
        </div>
        <p className="text-right text-sm text-[#6b7194]">
          Lifetime value
          <span className="block font-display text-2xl font-bold text-[#2b337d]">
            ₹{(customer.totalSpent / 100).toLocaleString("en-IN")}
          </span>
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6">
          <h2 className="font-semibold">Address</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#4a5072]">
            {customer.address || "—"}
            <br />
            {[customer.city, customer.state].filter(Boolean).join(", ")} {customer.pincode}
          </p>
          <p className="mt-4 text-xs text-[#9aa0c3]">
            Customer since {customer.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}
          </p>
        </div>

        <form action={saveNotesAction} className="rounded-2xl border border-[#e3e5f0] bg-white p-6 lg:col-span-2">
          <h2 className="font-semibold">Internal notes</h2>
          <input type="hidden" name="id" value={customer.id} />
          <textarea
            name="notes"
            rows={3}
            defaultValue={customer.notes ?? ""}
            placeholder="Preferences, support history, anything the next person should know…"
            className="mt-3 w-full rounded-xl border border-[#dcdfee] px-4 py-3 text-sm outline-none focus:border-[#2b337d]"
          />
          <button
            type="submit"
            className="mt-3 rounded-xl border border-[#dcdfee] px-5 py-2 text-sm font-semibold text-[#4a5072] hover:border-[#2b337d]/40"
          >
            Save notes
          </button>
        </form>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[#e3e5f0] bg-white">
        <div className="px-6 py-4">
          <h2 className="font-semibold">Orders ({customer.orders.length})</h2>
        </div>
        <table className="w-full text-left text-sm">
          <tbody>
            {customer.orders.map((o) => (
              <tr key={o.id} className="border-t border-[#eef0f7] transition-colors hover:bg-[#f8f9fd]">
                <td className="px-6 py-3.5">
                  <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs text-[#2b337d] hover:underline">
                    {o.id}
                  </Link>
                  {o.item && <span className="block text-xs text-[#9aa0c3]">{o.item}</span>}
                </td>
                <td className="px-6 py-3.5 font-medium">₹{(o.amount / 100).toLocaleString("en-IN")}</td>
                <td className="px-6 py-3.5">
                  <StatusBadge status={o.status as OrderStatus} />
                </td>
                <td className="px-6 py-3.5 text-right text-xs text-[#9aa0c3]">
                  {o.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
