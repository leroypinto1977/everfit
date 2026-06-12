import type { Metadata } from "next";
import Link from "next/link";
import InfoPage from "@/components/InfoPage";

export const metadata: Metadata = { title: "About us — EVHERFIT" };

export default function AboutPage() {
  return (
    <InfoPage kicker="Our story" title="Be the woman.">
      <p>
        Evherfit is a specialised fitness brand dedicated to promoting lifelong health
        and wellness, with a core focus on women-centred fitness. Our mission is to
        empower women on their wellness journey by providing the right equipment and
        support to achieve lasting vitality and strength.
      </p>
      <h2>The story of infinite health</h2>
      <p>
        At the heart of our brand, the infinity symbol represents our belief in limitless
        health and longevity. It&apos;s a reminder that fitness isn&apos;t a final goal —
        it&apos;s a lifelong journey of strength, balance, and continuous growth. From
        walking in figure-8s to the shape of DNA strands, the 8 symbolises harmony,
        rhythm, and optimal function — all essential to sustained well-being.
      </p>
      <h2>Our vision</h2>
      <p>
        To create a world where women embrace lifelong wellness, strength, and vitality —
        achieving infinite health through empowered, balanced living.
      </p>
      <h2>Our first product</h2>
      <p>
        The{" "}
        <Link href="/product" className="text-brand underline-offset-2 hover:underline">
          EVHERFIT Infinity Band
        </Link>{" "}
        is where we started: weighted resistance bands contoured for women&apos;s wrists
        and ankles, built to turn everyday movement — walks, flows, lifts — into strength
        that lasts. Designed for her, built for life.
      </p>
      <h2>Get in touch</h2>
      <p>
        We&apos;d love to hear from you — questions, feedback, or your story. Reach us via
        the{" "}
        <Link href="/contact" className="text-brand underline-offset-2 hover:underline">
          contact page
        </Link>
        .
      </p>
    </InfoPage>
  );
}
