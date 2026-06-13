import { getCatalog } from "@/lib/catalog";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage() {
  const { variants } = await getCatalog();
  return <CheckoutClient variants={variants} />;
}
