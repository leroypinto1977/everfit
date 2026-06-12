import type { Metadata } from "next";
import Link from "next/link";
import InfoPage from "@/components/InfoPage";

export const metadata: Metadata = { title: "Shipping policy — EVHERFIT" };

export default function ShippingPage() {
  return (
    <InfoPage kicker="Help" title="Shipping policy" updated="June 2026">
      <h2>Where we ship</h2>
      <p>
        We ship across India to every serviceable PIN code, through our courier
        partners. Shipping is <strong>free on all orders</strong> — no minimums, no
        hidden charges.
      </p>
      <h2>Dispatch & delivery times</h2>
      <ul>
        <li>Orders are packed and dispatched within <strong>24 hours</strong> of payment (working days).</li>
        <li>Metro cities: typically <strong>2–4 working days</strong> after dispatch.</li>
        <li>Rest of India: typically <strong>4–7 working days</strong> after dispatch.</li>
        <li>Remote PIN codes can take up to 10 working days.</li>
      </ul>
      <h2>Tracking your order</h2>
      <p>
        You&apos;ll receive your order ID by email as soon as payment is confirmed, and
        the courier tracking number once your band ships. Check live status any time on
        the{" "}
        <Link href="/track" className="text-brand underline-offset-2 hover:underline">
          track-order page
        </Link>{" "}
        using your order ID and the phone number from checkout.
      </p>
      <h2>Delays & failed deliveries</h2>
      <p>
        If the courier can&apos;t reach you, they attempt delivery up to 3 times before
        returning the package to us — we&apos;ll contact you to reschedule or refund in
        full. For weather or logistics delays beyond the windows above, write to us via
        the contact page and we&apos;ll chase the courier on your behalf.
      </p>
      <h2>Damaged on arrival</h2>
      <p>
        If the package arrives visibly damaged, refuse delivery if possible, or photograph
        the package before opening and contact us within 48 hours — we&apos;ll ship a free
        replacement.
      </p>
    </InfoPage>
  );
}
