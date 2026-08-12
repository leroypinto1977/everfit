/**
 * PM2 process definitions for the Hostinger VPS.
 *
 *   pm2 start deploy/ecosystem.config.cjs
 *   pm2 save && pm2 startup      # survive a reboot
 *
 * Deliberately NOT injecting secrets here. Next.js already loads
 * apps/<app>/.env.production itself, which keeps every secret in one
 * root-readable file per app instead of duplicated into ~/.pm2/dump.pm2.
 * Only NODE_ENV, PORT and HOSTNAME are set below — anything present in the real
 * process environment wins over the .env files anyway, so this stays consistent.
 *
 * Fork mode with one instance per app, not cluster: Next's incremental cache is
 * per-process on disk, and multiple workers on one box serve each other's stale
 * pages. Nginx in front is the place to add capacity, or raise instances only
 * after configuring a shared cache handler.
 */

const path = require("node:path");

const ROOT = path.join(__dirname, "..");
// npm workspaces hoist every dependency to the repo root, so there is no
// apps/<app>/node_modules — both apps run the one hoisted Next binary.
const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

/** @param {{ name: string, dir: string, port: number }} app */
function service({ name, dir, port }) {
  return {
    name,
    script: NEXT_BIN,
    args: "start",
    cwd: path.join(ROOT, "apps", dir),
    exec_mode: "fork",
    instances: 1,
    // A Next server that dies on boot (bad DATABASE_URL, port taken) would
    // otherwise restart forever and bury the real error in the log.
    max_restarts: 10,
    min_uptime: "20s",
    restart_delay: 2000,
    // Next's build output and route cache push RSS well past PM2's default.
    max_memory_restart: "600M",
    env: {
      NODE_ENV: "production",
      PORT: String(port),
      // Bind to loopback only. Nginx terminates TLS and proxies in; the Node
      // servers must not be reachable on the VPS's public interface.
      HOSTNAME: "127.0.0.1",
    },
    out_file: path.join(ROOT, "logs", `${name}.out.log`),
    error_file: path.join(ROOT, "logs", `${name}.err.log`),
    merge_logs: true,
    time: true,
  };
}

module.exports = {
  apps: [
    service({ name: "everfit-store", dir: "store", port: 3000 }),
    service({ name: "everfit-admin", dir: "admin", port: 3001 }),
  ],
};
