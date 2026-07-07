import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getOrder } from "@/lib/orders";
import { courierName } from "@/lib/couriers";
import PrintButton from "../invoice/PrintButton";
import Barcode from "./Barcode";

export const dynamic = "force-dynamic";

/**
 * Thermal shipping label — 100 × 150 mm (the standard 4"×6" sticker roll).
 * Outside the (panel) route group so nothing but the label prints, and pure
 * black-on-white because thermal printers are monochrome. @page pins the
 * paper size so the browser's print dialog defaults correctly.
 */
export default async function LabelPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrder(id);
  // labels are for orders that will ship — must have reached payment
  if (!order || !["paid", "shipped", "delivered"].includes(order.status)) notFound();

  const c = order.customer;
  const invoiceId = order.invoiceNo ? `EVH-${String(order.invoiceNo).padStart(4, "0")}` : null;
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "") ?? "evherfit.com";
  const support = process.env.SUPPORT_EMAIL ?? "support@evherfit.com";

  return (
    <main className="min-h-screen bg-[#eef0f7] py-8 print:min-h-0 print:bg-white print:py-0">
      <style>{`
        @page { size: 100mm 150mm; margin: 0; }
        @media print {
          html, body { background: #fff !important; }
          .label-sheet {
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      <div className="mx-auto mb-6 flex w-[100mm] items-center justify-between print:hidden">
        <Link href={`/admin/orders/${order.id}`} className="text-sm text-[#6b7194] hover:text-[#2b337d]">
          ← Back to order
        </Link>
        <PrintButton />
      </div>
      <p className="mx-auto mb-4 w-[100mm] text-xs leading-relaxed text-[#6b7194] print:hidden">
        Sized for a 100 × 150 mm (4″×6″) thermal sticker. In the print dialog pick your label
        printer, set paper size to 100 × 150 mm and margins to none — then it fills the sticker
        exactly.
      </p>

      {/* the label itself — everything inside prints, nothing outside does */}
      <div
        className="label-sheet mx-auto flex h-[150mm] w-[100mm] flex-col bg-white p-[5mm] text-black shadow-lg"
        style={{ fontFamily: "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
      >
        {/* header */}
        <div className="flex items-start justify-between border-b-2 border-black pb-[2mm]">
          <div>
            <div className="font-serif text-[13pt] font-bold italic leading-none">EVHERFIT</div>
            <div className="mt-[1mm] text-[6pt] uppercase tracking-widest">{site}</div>
          </div>
          <div className="border-2 border-black px-[2mm] py-[1mm] text-[8pt] font-extrabold uppercase leading-tight">
            Prepaid
            <span className="block text-[5.5pt] font-semibold normal-case">Do not collect cash</span>
          </div>
        </div>

        {/* ship to */}
        <div className="mt-[3mm]">
          <div className="text-[6.5pt] font-bold uppercase tracking-widest">Deliver to</div>
          <div className="mt-[1mm] text-[14pt] font-extrabold leading-tight">{c.name}</div>
          <div className="mt-[1mm] text-[10pt] leading-snug">
            {c.address}
            <br />
            {[c.city, c.state].filter(Boolean).join(", ")}
          </div>
          <div className="mt-[1.5mm] flex items-end justify-between">
            <div className="text-[10.5pt] font-bold">☎ {c.phone}</div>
            <div className="text-right">
              <span className="block text-[6pt] uppercase tracking-widest">PIN</span>
              <span className="text-[20pt] font-extrabold leading-none tracking-wide">{c.pincode}</span>
            </div>
          </div>
        </div>

        {/* courier / tracking */}
        <div className="mt-[3mm] border-y-2 border-black py-[2mm]">
          {order.courier || order.tracking ? (
            <div className="flex items-baseline justify-between gap-[2mm]">
              <span className="text-[9pt] font-bold uppercase">
                {order.courier ? courierName(order.courier) : "Courier"}
              </span>
              {order.tracking && (
                <span className="font-mono text-[10pt] font-bold tracking-wider">{order.tracking}</span>
              )}
            </div>
          ) : (
            <div className="flex items-baseline justify-between text-[8pt]">
              <span className="font-bold uppercase">Courier</span>
              <span className="text-[7pt]">AWB: ____________________</span>
            </div>
          )}
        </div>

        {/* contents */}
        <div className="mt-[2.5mm] text-[8.5pt] leading-snug">
          <div className="flex justify-between gap-[3mm]">
            <span className="font-semibold">{order.item ?? "EVHERFIT Infinity Band"}</span>
            <span className="whitespace-nowrap font-bold">Qty {order.qty}</span>
          </div>
          <div className="mt-[1mm] flex justify-between font-mono text-[7pt]">
            <span>{order.id}</span>
            {invoiceId && <span>{invoiceId}</span>}
          </div>
        </div>

        {/* return address */}
        <div className="mt-[2.5mm] border-t border-black pt-[1.5mm] text-[6.5pt] leading-snug">
          <span className="font-bold uppercase tracking-wider">If undelivered, return to: </span>
          EVHERFIT{process.env.STORE_ADDRESS ? `, ${process.env.STORE_ADDRESS}` : " · India"} · {support}
        </div>

        {/* barcode pinned to the bottom */}
        {invoiceId && (
          <div className="mt-auto pt-[2mm]">
            <div className="mx-auto w-[70mm]">
              <Barcode value={String(order.invoiceNo)} height={38} />
              <div className="mt-[1mm] text-center font-mono text-[8pt] font-bold tracking-[0.3em]">
                {invoiceId}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
