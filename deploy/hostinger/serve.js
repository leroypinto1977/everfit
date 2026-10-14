/**
 * Starts one of the apps for a Hostinger "Web App" (hPanel → Websites → Web Apps).
 *
 * Hostinger's Next.js preset deploys only the app's own directory, and in this
 * workspace `next` and almost every other dependency are hoisted to the
 * repository root — so the preset's server dies with "Cannot find module
 * 'next'". Instead each web app deploys the whole repository (preset "Other",
 * root directory "./") and starts through this file, which resolves `next`
 * from the root and points it at the app's directory.
 *
 * Hostinger's Node runner hands the server its socket through `listen`, so the
 * port below only matters when this is run by hand.
 */
const { createServer } = require("node:http");
const path = require("node:path");

module.exports = function serve(app) {
  const root = path.join(__dirname, "..", "..");

  // The panel's environment variables are written to .env at the deploy root;
  // Next only reads env files inside the app directory. Already-set variables win.
  try {
    process.loadEnvFile(path.join(root, ".env"));
  } catch {
    // No such file (local runs) — the app's own env files apply.
  }

  const next = require("next");
  const server = next({ dev: false, dir: path.join(root, "apps", app) });
  const handle = server.getRequestHandler();

  server.prepare().then(
    () => createServer((req, res) => handle(req, res)).listen(process.env.PORT || 3000),
    (err) => {
      console.error(`[hostinger] ${app} failed to start:`, err);
      process.exit(1);
    },
  );
};
