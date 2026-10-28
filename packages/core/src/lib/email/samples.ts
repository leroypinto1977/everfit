import type { Order } from "../orders";
import type { NewLead } from "../leads";
import { peekSettings } from "../settings";
import {
  type Email,
  leadNotification,
  lowStockAdmin,
  newOrderAdmin,
  orderConfirmation,
  orderDelivered,
  orderShipped,
  passwordReset,
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
  source: "online",
  paymentMethod: "upi",
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

export const sampleLead: NewLead = {
  ref: "K7Q2X9AB",
  source: "one-to-one",
  name: "Priya Raman",
  phone: "+91 98765 43210",
  email: "priya@example.com",
  answers: [
    { id: "name", label: "Full Name", value: "Priya Raman" },
    { id: "age", label: "Age", value: "34" },
    {
      id: "goal",
      label: "What would you most love to change about your body and health?",
      value: "Lose the weight I gained after pregnancy",
    },
    { id: "kg", label: "How many kg would you like to lose?", value: "12 kg" },
    { id: "health", label: "Do you have any of these health concerns?", value: "Thyroid" },
    {
      id: "afford",
      label: "Are you willing to invest ₹35,000 in your health?",
      value: "Yes, my health is worth it. I’m ready to invest ₹35,000",
    },
    {
      id: "invest",
      label: "How would you like to move forward?",
      value: "I'm ready to invest in myself and start right away",
    },
    { id: "start", label: "When would you like to start your 90 days?", value: "Within the next 2 weeks" },
  ],
  rating: {
    temperature: "hot",
    score: 8,
    reasons: [
      "Moving forward: I'm ready to invest in myself and start right away (+4)",
      "Start: Within the next 2 weeks (+2)",
      "₹35,000: Yes, my health is worth it. I’m ready to invest ₹35,000 (+1)",
      "Has a medical concern (PCOS, thyroid, diabetes or BP) (+1)",
    ],
  },
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
    {
      key: "lead-notification",
      when: "Team (Settings → 1-to-1 lead email) · sent the moment someone submits the 1-to-1 application form",
      // The wording is whatever the owner last saved; callers that want that
      // rather than the built-in default await getSettings() first.
      email: leadNotification(sampleLead, {
        subject: peekSettings().lead_email_subject,
        body: peekSettings().lead_email_body,
      }),
    },
    { key: "teammate-welcome", when: "New teammate · sent when the owner adds an admin user", email: teammateWelcome({ name: "Priya Sharma", email: "priya@evherfit.com", role: "Staff" }) },
    { key: "password-reset", when: "Admin · sent when someone requests a password reset", email: passwordReset({ name: "Ananya Rao", resetUrl: "https://evherfit.com/admin/reset?token=sample" }) },
  ];
}
