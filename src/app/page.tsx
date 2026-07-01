import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import BrandStory from "@/components/BrandStory";
import Coach from "@/components/Coach";
import Programs from "@/components/Programs";
import GearTeaser from "@/components/GearTeaser";
import Testimonials from "@/components/Testimonials";
import BuySection from "@/components/BuySection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <Marquee />
      <BrandStory />
      <Coach />
      <Programs />
      <GearTeaser />
      <Testimonials />
      <BuySection />
      <Footer />
    </main>
  );
}
