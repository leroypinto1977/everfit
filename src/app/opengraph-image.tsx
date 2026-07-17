import { ImageResponse } from "next/og";

// Sitewide social share card. Next serves this for every route that doesn't
// define its own opengraph-image, and reuses it for the Twitter card.
export const alt = "EVHERFIT — Resistance bands & women's fitness gear";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #2B337D 0%, #1c2258 100%)",
          padding: "80px",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em" }}>
          <span style={{ color: "#F48FB1", fontSize: 56, marginRight: 20 }}>∞</span>
          EVHERFIT
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            Be the woman.
          </div>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#F48FB1" }}>
            Strong is infinite.
          </div>
          <div style={{ fontSize: 34, marginTop: 32, color: "#c9cdec", maxWidth: 900 }}>
            The Infinity Band, a resistance band with foam-grip handles, built for her.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
