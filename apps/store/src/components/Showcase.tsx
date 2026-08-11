"use client";

import Image from "next/image";
import Reveal from "./Reveal";

const panels: { img: string; kicker: string; title: string; body: string }[] = [
  {
    img: "/products/tube-blue-1.jpg",
    kicker: "Clip-on handles",
    title: "Grip. Clip. Go.",
    body: "Padded foam handles clip to the band with metal carabiners, so you can attach, detach and swap in seconds. No hardware, no fuss, a solid grip through every rep.",
  },
  {
    img: "/products/bundle-3.jpg",
    kicker: "Colour-coded resistance",
    title: "Know your level at a glance.",
    body: "Blue is 4.5 kg, red is 9 kg. Pick the band that matches your session, or clip both together when you want to push past your usual load.",
  },
  {
    img: "/products/tube-red-1.jpg",
    kicker: "Train anywhere",
    title: "Your gym, in a bag.",
    body: "Light, packable latex band coils down small enough to drop in a tote. Home, park, hotel room, your full-body workout comes with you.",
  },
  {
    img: "/products/bundle-1.jpg",
    kicker: "The complete set",
    title: "Both bands. Full range.",
    body: "The Combo pairs the 4.5 kg and 9 kg bands so you can progress from toning to strength, and stack them for the days you want more.",
  },
];

/**
 * The set, view by view. Plain stacked rows (photo + copy), alternating sides
 * on desktop — scrolls naturally, no scroll-jacking / pinned sections.
 */
export default function Showcase() {
  return (
    <section id="showcase" className="bg-card">
      <div className="mx-auto max-w-7xl space-y-20 px-6 py-20 sm:py-28 lg:space-y-28">
        {panels.map((panel, i) => {
          const flip = i % 2 === 1;
          return (
            <Reveal key={panel.img}>
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className={`relative mx-auto w-64 sm:w-80 ${flip ? "lg:order-2" : ""}`}>
                  <div className="absolute inset-8 -z-10 rounded-full bg-brand-soft blur-[60px]" />
                  <Image
                    src={panel.img}
                    alt={panel.title}
                    width={1600}
                    height={1066}
                    sizes="(max-width: 640px) 256px, 320px"
                    className="h-auto w-full rounded-3xl border border-line object-cover shadow-[0_8px_30px_rgba(43,51,125,0.10)]"
                  />
                </div>
                <div className={flip ? "lg:order-1" : ""}>
                  <p className="mb-3 text-xs uppercase tracking-[0.3em] text-accent">{panel.kicker}</p>
                  <h2 className="font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl lg:text-5xl">
                    {panel.title}
                  </h2>
                  <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">{panel.body}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
