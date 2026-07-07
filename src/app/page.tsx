import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import BrandStory from "@/components/BrandStory";
import Coach from "@/components/Coach";
import Programs from "@/components/Programs";
import GearTeaser from "@/components/GearTeaser";
import Testimonials from "@/components/Testimonials";
import BuySection from "@/components/BuySection";
import Footer from "@/components/Footer";
import { getCatalog } from "@/lib/catalog";

export default async function Home() {
  // "Pairs from ₹…" tracks the cheapest in-stock variant, so admin price
  // edits reach the homepage too (revalidated by the products actions).
  const { variants } = await getCatalog();
  const purchasable = variants.filter((v) => !v.soldOut);
  const fromPrice = Math.min(...(purchasable.length ? purchasable : variants).map((v) => v.price));

  return (
    <main>
      <Hero />
      <Marquee />
      <BrandStory />
      <Coach />
      <Programs />
      <GearTeaser fromPrice={fromPrice} />
      <Testimonials />
      <BuySection />
      <Footer />
    </main>
  );
}
