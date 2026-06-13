import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Features from "@/components/Features";
import Showcase from "@/components/Showcase";
import Stats from "@/components/Stats";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import BuySection from "@/components/BuySection";
import Footer from "@/components/Footer";
import { getCatalog } from "@/lib/catalog";

export default async function Home() {
  const { variants } = await getCatalog();

  return (
    <main>
      <Navbar />
      <Hero />
      <Marquee />
      <Features />
      <Showcase />
      <Stats />
      <Pricing variants={variants} />
      <Testimonials />
      <BuySection />
      <Footer />
    </main>
  );
}
