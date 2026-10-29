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

  // One build worker; see apps/store/next.config.mjs for why.
  experimental: { cpus: 1 },

  turbopack: {
    // The monorepo root, so Turbopack resolves and watches the workspace
    // packages that live outside this app directory. Without it Next guesses
    // from the nearest lockfile and can pick the wrong directory.
    root: path.join(import.meta.dirname, "..", ".."),
  },

  // Belt and braces on top of robots.ts: the admin panel must never be indexed,
  // and it should never be framed by another origin.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
