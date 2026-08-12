import { logEnvStatus } from "@everfit/core/lib/env";

/**
 * Runs once when a server instance boots. See the storefront's copy — the admin
 * panel is the app most likely to be deployed with a partial environment, since
 * it was split out of the storefront after the env vars were first set up.
 */
export function register() {
  // Also evaluated for the edge runtime; the env registry describes the Node server.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  logEnvStatus("admin");
}
