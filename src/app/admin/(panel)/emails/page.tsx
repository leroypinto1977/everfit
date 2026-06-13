import { requireOwner } from "@/lib/admin-auth";
import type { Order } from "@/lib/orders";
import {
  lowStockAdmin,
  newOrderAdmin,
  orderConfirmation,
  orderDelivered,
  orderShipped,
  paymentFailed,
  refundInitiated,
  teammateWelcome,
} from "@/lib/email/templates";

export const dynamic = "force-dynamic";

// A fully-populated sample order so every template branch (discount, tracking)
// renders. Static timestamps keep this deterministic.
const sample: Order = {
  id: "order_PREVIEW123",
  paymentId: "pay_PREVIEW123",
  status: "paid",
  amount: 169915,
  currency: "INR",
  item: "EVHERFIT Infinity Band — 1 kg × 2 (Strength)",
  variantKey: "1",
  qty: 1,
  couponCode: "LAUNCH15",
  discount: 29985,
  courier: "delhivery",
  tracking: "9912345678",
  invoiceNo: 42,
  customer: {
    name: "Ananya Rao",
    email: "ananya@example.com",
    phone: "+91 98400 12345",
    address: "18, Lakeview Residency, MG Road",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560034",
  },
  createdAt: "2026-06-13T09:30:00.000Z",
  paidAt: "2026-06-13T09:31:30.000Z",
};

const previews = [
  {
    email: orderConfirmation(sample),
    when: "Customer · sent the moment payment is captured",
  },
  {
    email: orderShipped(sample),
    when: "Customer · sent when an order is marked shipped (single or bulk)",
  },
  {
    email: orderDelivered(sample),
    when: "Customer · sent when an order is marked delivered",
  },
  {
    email: refundInitiated(sample, sample.amount),
    when: "Customer · sent when the owner issues a refund",
  },
  {
    email: paymentFailed(sample),
    when: "Customer · sent on a failed payment attempt (Razorpay payment.failed)",
  },
  {
    email: newOrderAdmin(sample),
    when: "Admin (ORDER_NOTIFY_EMAIL) · sent on every new paid order",
  },
  {
    email: lowStockAdmin([
      { weight: "1 kg × 2", sku: "EVH-IB-10", stock: 4 },
      { weight: "0.5 kg × 2", sku: "EVH-IB-05", stock: 0 },
    ]),
    when: "Admin · sent when a variant drops to 5 or fewer in stock",
  },
  {
    email: teammateWelcome({ name: "Priya Sharma", email: "priya@evherfit.com", role: "Staff" }),
    when: "New teammate · sent when the owner adds an admin user",
  },
];

export default async function EmailsPage() {
  await requireOwner();

  return (
    <>
      <h1 className="font-display text-3xl font-bold italic">Email previews</h1>
      <p className="mt-1 text-sm text-[#6b7194]">
        Every transactional email the store sends, with sample data. Live sending requires
        RESEND_API_KEY and a verified sending domain.
      </p>

      <div className="mt-8 space-y-8">
        {previews.map((p, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-[#e3e5f0] bg-white">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#e3e5f0] px-6 py-4">
              <div>
                <p className="font-semibold">{p.email.subject}</p>
                <p className="mt-0.5 text-xs text-[#9aa0c3]">{p.when}</p>
              </div>
            </div>
            <iframe
              title={p.email.subject}
              srcDoc={p.email.html}
              className="h-[640px] w-full border-0 bg-[#f4f5f9]"
            />
          </div>
        ))}
      </div>
    </>
  );
}
