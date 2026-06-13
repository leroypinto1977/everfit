import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getOrder } from "@/lib/orders";
import { inr } from "@/lib/product";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

/**
 * Printable invoice — deliberately outside the (panel) route group so the
 * sidebar doesn't print. Cmd/Ctrl+P → "Save as PDF" to attach or share.
 */
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order?.invoiceNo) notFound();

  const c = order.customer;
  const invoiceId = `EVH-${String(order.invoiceNo).padStart(4, "0")}`;
  const date = new Date(order.paidAt ?? order.createdAt);

  return (
    <main className="mx-auto max-w-2xl px-8 py-12 text-[#1c2030]">
      <div className="mb-8 flex items-center justify-between print:hidden">
        <Link href={`/admin/orders/${order.id}`} className="text-sm text-[#6b7194] hover:text-[#2b337d]">
          ← Back to order
        </Link>
        <PrintButton />
      </div>

      <header className="flex items-start justify-between border-b-2 border-[#2b337d] pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold italic text-[#2b337d]">EVHERFIT</h1>
          <p className="mt-1 text-xs text-[#6b7194]">
            {process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "") ?? "evherfit.com"}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="font-display text-lg font-bold">Tax invoice</p>
          <p className="mt-1 font-mono">{invoiceId}</p>
          <p className="text-[#6b7194]">{date.toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
        </div>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-8 text-sm">
        <div>
          <h2 className="text-xs uppercase tracking-wider text-[#9aa0c3]">Billed & shipped to</h2>
          <p className="mt-2 font-medium">{c.name}</p>
          <p className="mt-1 leading-relaxed text-[#4a5072]">
            {c.address}
            <br />
            {c.city}, {c.state} — {c.pincode}
            <br />
            {c.phone} · {c.email}
          </p>
        </div>
        <div className="text-right">
          <h2 className="text-xs uppercase tracking-wider text-[#9aa0c3]">Payment</h2>
          <p className="mt-2 text-[#4a5072]">
            Razorpay
            <br />
            <span className="font-mono text-xs">{order.paymentId ?? "—"}</span>
            <br />
            Order <span className="font-mono text-xs">{order.id}</span>
          </p>
        </div>
      </section>

      <table className="mt-10 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#e3e5f0] text-xs uppercase tracking-wider text-[#9aa0c3]">
            <th className="py-3">Item</th>
            <th className="py-3 text-center">Qty</th>
            <th className="py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-[#eef0f7]">
            <td className="py-4">{order.item ?? "EVHERFIT Infinity Band"}</td>
            <td className="py-4 text-center">{order.qty}</td>
            <td className="py-4 text-right">{inr(order.amount)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className="py-2 text-right text-[#6b7194]">
              Shipping
            </td>
            <td className="py-2 text-right">Free</td>
          </tr>
          <tr className="font-display text-lg font-bold text-[#2b337d]">
            <td colSpan={2} className="py-3 text-right">
              Total
            </td>
            <td className="py-3 text-right">{inr(order.amount)}</td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-2 text-xs text-[#9aa0c3]">Price inclusive of all applicable taxes.</p>

      <footer className="mt-14 border-t border-[#e3e5f0] pt-6 text-center text-xs text-[#9aa0c3]">
        Thank you for your order — be the woman. · Questions? Reply to your order email.
      </footer>
    </main>
  );
}
