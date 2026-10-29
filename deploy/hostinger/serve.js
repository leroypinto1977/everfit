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
// Hostinger counts every thread against the account's process limit, and
// libuv starts 4 for its pool by default; 2 is plenty for this traffic. Must
// be set before anything touches the pool, so it comes first.
process.env.UV_THREADPOOL_SIZE ??= "2";

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
    () => createServer((req, res) => handle(req, uncachedByCdn(res))).listen(process.env.PORT || 3000),
    (err) => {
      console.error(`[hostinger] ${app} failed to start:`, err);
      process.exit(1);
    },
  );
};

/**
 * Next marks prerendered pages `s-maxage=31536000` and relies on the host to
 * purge its edge cache when a page is revalidated. Hostinger's CDN honours the
 * header but is never told to purge, so a price or stock edit in the admin
 * panel would keep showing the old page. Shared caches are told to revalidate
 * instead; Next's own cache still answers them quickly. Hashed assets under
 * /_next/static carry `max-age` + `immutable`, not `s-maxage`, and stay cached.
 */
const NOT_SHARED = "public, max-age=0, must-revalidate";
const shared = (value) => /s-maxage/i.test(String(value));

function uncachedByCdn(res) {
  const setHeader = res.setHeader.bind(res);
  res.setHeader = (name, value) =>
    setHeader(name, String(name).toLowerCase() === "cache-control" && shared(value) ? NOT_SHARED : value);

  const writeHead = res.writeHead.bind(res);
  res.writeHead = (status, ...rest) => {
    const headers = rest.find((arg) => arg && typeof arg === "object" && !Array.isArray(arg));
    for (const key of Object.keys(headers ?? {})) {
      if (key.toLowerCase() === "cache-control" && shared(headers[key])) headers[key] = NOT_SHARED;
    }
    return writeHead(status, ...rest);
  };
  return res;
}
