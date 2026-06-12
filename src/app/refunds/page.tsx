import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";

export const metadata: Metadata = { title: "Cancellations, returns & refunds — EVHERFIT" };

export default function RefundsPage() {
  return (
    <InfoPage kicker="Help" title="Cancellations, returns & refunds" updated="June 2026">
      <h2>Cancelling an order</h2>
      <p>
        You can cancel an order free of charge any time <strong>before it ships</strong>{" "}
        (orders usually ship within 24 hours, so be quick). Write to us via the contact
        page with your order ID, or WhatsApp us — once we confirm the cancellation, a
        full refund is initiated the same day. If the order has already shipped, simply
        refuse the delivery or use the 7-day return below.
      </p>
      <h2>7-day returns</h2>
      <p>
        Changed your mind? You can return your EVHERFIT Infinity Band within 7 days of
        delivery, no questions asked. The band should be unused beyond trying it on, with
        the carry pouch and guide included.
      </p>
      <h2>How to start a return</h2>
      <ul>
        <li>Write to us via the contact page with your order ID and reason (optional).</li>
        <li>We arrange a reverse pickup from your delivery address within 2 working days.</li>
        <li>Once the band reaches us and passes a quick check, your refund is initiated.</li>
      </ul>
      <h2>Refund timelines</h2>
      <p>
        Refunds go back to the original payment method via Razorpay — typically 5–7
        working days for cards and netbanking, and up to 3 days for UPI.
      </p>
      <h2>1-year warranty</h2>
      <p>
        Manufacturing defects — leaking pods, failed stitching, strap or D-ring failure —
        are covered for 12 months from delivery with a free replacement. Normal wear,
        cuts, or damage from misuse aren&apos;t covered.
      </p>
      <h2>Failed payments</h2>
      <p>
        If money was deducted but your order didn&apos;t confirm, the amount is
        auto-refunded by your bank within 5–7 working days. You don&apos;t need to do
        anything.
      </p>
    </InfoPage>
  );
}
