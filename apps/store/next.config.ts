import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @everfit/core ships raw TypeScript from the workspace — Next has to compile
  // it as if it were app source rather than a prebuilt node_modules dependency.
  transpilePackages: ["@everfit/core"],

  experimental: {
    // Ship the stylesheet inside the HTML instead of behind a <link>.
    //
    // The storefront's CSS is one 10.6 KB Tailwind file, and as a separate
    // request it was the page's only render-blocking resource — it had to
    // share a phone's connection with ~180 KB of concurrently-fetched JS, so a
    // file that transfers in ~55 ms was not arriving until 1.9 s, and nothing
    // painted before it did. Inlined, the styles land with the document and
    // the first paint stops waiting on the network entirely.
    //
    // The trade-off Next documents is that inlined CSS cannot be cached apart
    // from the HTML, so returning visitors re-download it. For a storefront
    // whose visitors are overwhelmingly first-time and on phones, paying
    // 10.6 KB per page load to remove a second of blank screen is the right
    // side of that trade.
    inlineCss: true,
  },

  turbopack: {
    // The monorepo root, so Turbopack resolves and watches the workspace
    // packages that live outside this app directory. Without it Next guesses
    // from the nearest lockfile and can pick the wrong directory.
    root: path.join(__dirname, "..", ".."),
  },
};

export default nextConfig;
