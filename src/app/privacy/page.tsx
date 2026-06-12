import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";

export const metadata: Metadata = { title: "Privacy policy — EVHERFIT" };

export default function PrivacyPage() {
  return (
    <InfoPage kicker="Legal" title="Privacy policy" updated="June 2026">
      <p>
        Evherfit (&ldquo;we&rdquo;) sells the EVHERFIT Infinity Band through this
        website. We collect only what we need to deliver your order and support you.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Order details</strong> — name, email, phone and shipping address, given
          by you at checkout. Used to process, ship and support your order.
        </li>
        <li>
          <strong>Payment data</strong> — handled entirely by Razorpay, our payment
          processor. We never see or store your card, UPI or banking credentials.
        </li>
      </ul>
      <h2>What we don&apos;t do</h2>
      <ul>
        <li>No accounts, no passwords — we don&apos;t store login credentials.</li>
        <li>We don&apos;t sell or share your data with advertisers.</li>
        <li>We don&apos;t send marketing email unless you ask for it.</li>
      </ul>
      <h2>Who we share with</h2>
      <p>
        Your shipping details go to our courier partner to deliver your order, and your
        payment is processed by Razorpay under their privacy policy. That&apos;s it.
      </p>
      <h2>Your choices</h2>
      <p>
        Write to us via the contact page to ask what we hold about you, or to have your
        order history deleted after the warranty period.
      </p>
    </InfoPage>
  );
}
