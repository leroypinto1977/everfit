import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @everfit/core ships raw TypeScript from the workspace — Next has to compile
  // it as if it were app source rather than a prebuilt node_modules dependency.
  transpilePackages: ["@everfit/core"],

  turbopack: {
    // The monorepo root, so Turbopack resolves and watches the workspace
    // packages that live outside this app directory. Without it Next guesses
    // from the nearest lockfile and can pick the wrong directory.
    root: path.join(__dirname, "..", ".."),
  },
};

export default nextConfig;
