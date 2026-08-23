/* A small local stand-in for the Vercel deployment: static files from the
   repo root plus /api/state via the real handler — so the database mode can
   be exercised end-to-end before anything ships.

     DATABASE_URL=postgres://... node scripts/dev-server.js [port]
*/
const http = require("http");
const fs = require("fs");
const path = require("path");
const stateHandler = require("../api/state.js");
const authHandler = require("../api/auth.js");

const ROOT = path.join(__dirname, "..");
const PORT = parseInt(process.argv[2], 10) || 3999;
/* Mirrors vercel.json's rewrite: one tenant today, its own name in the URL,
   and the versioned filename behind it (§35.6). */
const TENANT = "raya-trade";
const PLATFORM_FILE = "SMP-Project-Folder/strategy-management-platform-v3.21.html";
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript",
                ".css": "text/css", ".json": "application/json", ".ico": "image/x-icon",
                /* The PWA's three: a manifest served as octet-stream is ignored,
                   and a worker has to arrive as JavaScript or registration is
                   refused outright. Vercel sets these in vercel.json; this is
                   the same list for the local server, or the thing works in
                   production and not where it gets tested. */
                ".webmanifest": "application/manifest+json; charset=utf-8",
                ".png": "image/png", ".svg": "image/svg+xml" };

/* The same security headers vercel.json sets, read FROM vercel.json rather
   than typed again — the local server exists to test what ships, and a second
   copy of a header list is a second copy that goes stale. HSTS is left to
   production: sending it from http://localhost would pin the browser to https
   for localhost, which breaks every other local server on the machine. */
const VERCEL = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
const SECURITY = ((VERCEL.headers || []).filter(function (h) { return h.source === "/(.*)"; })[0] || {})
  .headers.filter(function (h) { return h.key !== "Strict-Transport-Security"; });

http.createServer(function (req, res) {
  SECURITY.forEach(function (h) { res.setHeader(h.key, h.value); });
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/state") return stateHandler(req, res);
  if (url.pathname === "/api/auth") return authHandler(req, res);
  if (url.pathname === "/favicon.ico") { res.statusCode = 204; return res.end(); }
  let p = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
  if (!p.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  if (url.pathname === "/" || url.pathname === "") p = path.join(ROOT, "index.html");
  /* The same rewrite vercel.json performs, so what is tested here is what
     ships. Without it the gate's /raya-trade link 404s locally and the
     pretty URL is only ever exercised in production — which is the one
     place a broken link costs something. Keep the two in step. */
  if (url.pathname === "/" + TENANT) p = path.join(ROOT, PLATFORM_FILE);
  fs.readFile(p, function (err, data) {
    if (err) { res.statusCode = 404; return res.end("not found"); }
    res.setHeader("Content-Type", TYPES[path.extname(p)] || "application/octet-stream");
    res.end(data);
  });
}).listen(PORT, function () { console.log("dev server on http://localhost:" + PORT); });
