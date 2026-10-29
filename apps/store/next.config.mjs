// Plain JavaScript on purpose, not next.config.ts: to read a TypeScript config
// `next start` loads Next's native SWC binding, whose Tokio runtime starts one
// thread per CPU — 64 on Hostinger — and Hostinger counts every thread against
// the account's 200-process limit. With a .mjs config the running app never
// loads it: about 9 threads per app instead of 73 (measured 2026-10-29).
import path from "node:path";

/** @type {import("next").NextConfig} */
const nextConfig = {
  // @everfit/core ships raw TypeScript from the workspace — Next has to compile
  // it as if it were app source rather than a prebuilt node_modules dependency.
  transpilePackages: ["@everfit/core"],

  // Serve the files in public/ as they are instead of through /_next/image.
  // On Hostinger's web-app hosting the optimiser is killed mid-resize on
  // large sources and answers 503, and while the server restarts every other
  // image fails with it. The source images are kept at display size (about
  // 1600px wide, 100–250 KB), so there is little left for it to save.
  images: { unoptimized: true },

  // Next serves public/ files with `max-age=0`, so every product photo went
  // back to the Node process on every view. A day in browsers and the CDN,
  // then a week of serving the old copy while it revalidates; rename a file
  // when its content changes.
  async headers() {
    return [
      {
        source: "/:path*.:ext(jpg|jpeg|png|webp|avif|svg)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },

  experimental: {
    // One build worker. By default Next starts one per CPU it can see, which on
    // Hostinger is the whole host's core count, and every worker's threads
    // count against the account's process limit while the live apps keep
    // running: builds filled the limit and the apps could not restart.
    cpus: 1,

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
    root: path.join(import.meta.dirname, "..", ".."),
  },
};

export default nextConfig;
