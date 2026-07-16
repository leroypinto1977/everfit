import type { Metadata } from "next";
import TrackClient from "./TrackClient";

// A per-order lookup form has no search value and shows order data — keep it out
// of the index while still giving it a unique title (not the homepage's).
export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of your EVHERFIT order with your order ID and phone number.",
  alternates: { canonical: "/track" },
  robots: { index: false, follow: true },
};

export default function TrackPage() {
  return <TrackClient />;
}
