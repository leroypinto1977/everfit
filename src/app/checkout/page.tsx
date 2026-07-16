import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const { variants } = await getCatalog();
  return <CheckoutClient variants={variants} />;
}
