import type { Order } from "@/lib/orders";
import {
  type Email,
  lowStockAdmin,
  newOrderAdmin,
  orderConfirmation,
  orderDelivered,
  orderShipped,
  paymentFailed,
  refundInitiated,
  teammateWelcome,
} from "./templates";

/**
 * Sample data + the canonical list of every transactional email, shared by
 * the owner-only /admin/emails page and the dev-only /api/dev/email-preview
 * gallery so the two can never drift apart.
 */

// Fully-populated so every branch (discount, tracking) renders. Static
// timestamps keep previews deterministic.
export const sampleOrder: Order = {
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

export interface EmailPreview {
  key: string; // stable slug for ?t= deep links
  when: string;
  email: Email;
}

export function emailPreviews(): EmailPreview[] {
  return [
    { key: "order-confirmation", when: "Customer · sent the moment payment is captured", email: orderConfirmation(sampleOrder) },
    { key: "shipped", when: "Customer · sent when an order is marked shipped (single or bulk)", email: orderShipped(sampleOrder) },
    { key: "delivered", when: "Customer · sent when an order is marked delivered", email: orderDelivered(sampleOrder) },
    { key: "refund", when: "Customer · sent when the owner issues a refund", email: refundInitiated(sampleOrder, sampleOrder.amount) },
    { key: "payment-failed", when: "Customer · sent on a failed payment attempt (Razorpay payment.failed)", email: paymentFailed(sampleOrder) },
    { key: "new-order-admin", when: "Admin (ORDER_NOTIFY_EMAIL) · sent on every new paid order", email: newOrderAdmin(sampleOrder) },
    {
      key: "low-stock",
      when: "Admin · sent when a variant drops to 5 or fewer in stock",
      email: lowStockAdmin([
        { weight: "1 kg × 2", sku: "EVH-IB-10", stock: 4 },
        { weight: "0.5 kg × 2", sku: "EVH-IB-05", stock: 0 },
      ]),
    },
    { key: "teammate-welcome", when: "New teammate · sent when the owner adds an admin user", email: teammateWelcome({ name: "Priya Sharma", email: "priya@evherfit.com", role: "Staff" }) },
  ];
}
