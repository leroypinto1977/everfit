import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";

export const metadata: Metadata = { title: "Terms of service — EVHERFIT" };

export default function TermsPage() {
  return (
    <InfoPage kicker="Legal" title="Terms of service" updated="June 2026">
      <h2>Orders & pricing</h2>
      <p>
        All prices are in Indian Rupees, inclusive of taxes, with free shipping across
        India. An order is confirmed when payment succeeds via Razorpay; you&apos;ll
        receive a confirmation email with your order ID.
      </p>
      <h2>Shipping</h2>
      <p>
        Orders usually ship within 24 hours and arrive in 2–7 working days depending on
        your PIN code. Track any time with your order ID and phone number on the
        track-order page.
      </p>
      <h2>Returns & warranty</h2>
      <p>
        7-day no-questions returns and a 1-year warranty against manufacturing defects —
        see the returns &amp; refunds policy for full details.
      </p>
      <h2>Safe use</h2>
      <p>
        The Infinity Band adds load to movement. Start light, progress gradually, and
        consult a professional if you are pregnant, recovering from injury, or have a
        medical condition affecting joints or circulation. Stop if you feel pain or
        numbness. The band is not a medical device.
      </p>
      <h2>Contact</h2>
      <p>For anything else, reach us via the contact page — we reply within 1 working day.</p>
    </InfoPage>
  );
}
