import type { Metadata } from "next";
import Link from "next/link";
import InfoPage from "@/components/InfoPage";

export const metadata: Metadata = { title: "Contact us — EVHERFIT" };

const channels = [
  {
    icon: "✉️",
    title: "Email",
    body: "support@evherfit.com",
    note: "Replies within 1 working day",
    href: "mailto:support@evherfit.com",
  },
  {
    icon: "💬",
    title: "WhatsApp",
    body: "+91 98400 00000",
    note: "Mon–Sat, 10am–6pm IST",
    href: "https://wa.me/919840000000",
  },
];

export default function ContactPage() {
  return (
    <InfoPage kicker="Help" title="Contact us">
      <p>
        Order question, sizing doubt, return, or just want to say hi — we&apos;d love to
        hear from you.
      </p>
      <div className="not-prose mt-8 grid gap-4 sm:grid-cols-2">
        {channels.map((c) => (
          <a
            key={c.title}
            href={c.href}
            className="rounded-3xl border border-line bg-card p-7 transition-colors hover:border-brand/40"
          >
            <span className="text-2xl">{c.icon}</span>
            <p className="mt-3 font-display text-lg font-bold text-brand">{c.title}</p>
            <p className="mt-1">{c.body}</p>
            <p className="mt-1 text-sm text-muted">{c.note}</p>
          </a>
        ))}
      </div>
      <p className="mt-8">
        Tracking an order? The fastest way is the{" "}
        <Link href="/track" className="text-brand underline-offset-2 hover:underline">
          track-order page
        </Link>{" "}
        — you just need your order ID and phone number.
      </p>
    </InfoPage>
  );
}
