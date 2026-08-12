import { logEnvStatus } from "@everfit/core/lib/env";

/**
 * Runs once when a server instance boots. The only job here is to state the
 * environment's configuration in the log immediately — on a self-hosted box the
 * PM2 log is the first thing you read after a deploy, and "RAZORPAY_KEY_ID is
 * missing" belongs there rather than in a customer's failed checkout.
 */
export function register() {
  // Also evaluated for the edge runtime; the env registry describes the Node server.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  logEnvStatus("store");
}
