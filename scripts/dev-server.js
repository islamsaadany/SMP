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
const chatHandler = require("../api/chat.js");
const mailHandler = require("../api/mail.js");
const platformHandler = require("../api/platform.js");

const ROOT = path.join(__dirname, "..");
const PORT = parseInt(process.argv[2], 10) || 3999;
/* Mirrors vercel.json's rewrites: a client's own name in the URL, and the
   versioned filename behind every one of them (§35.6, spec 030). The list is
   READ FROM vercel.json rather than typed again — the same rule the security
   headers below follow, and the one §35.6 asks for: three files carry this
   mapping and they must stay in step. */
const CLIENT_PATHS = null;   /* filled below, from vercel.json's rewrites */
const PLATFORM_FILE = "SMP-Project-Folder/strategy-management-platform-v3.22.html";
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
/* ── A CLIENT'S PATH IS A PATTERN, NOT A LIST (§288.19) ────────────
   It was four named paths, and the product can CREATE a client — so making
   one produced a card that opened a page the server had never heard of. The
   platform could make something it could not serve, and nothing said so: the
   card was right, the schema was right, and the address 404'd.

   ONE REWRITE, matching a single lower-case segment. The exclusions come for
   free from the pattern rather than from a list to keep in step: it has no
   dot, so every real file (`sw.js`, `favicon.svg`, `manifest.webmanifest`) is
   outside it by construction; it is one segment, so `/api/state` is too; and
   `/platform` is matched by the rewrite ABOVE it, which wins on order.

   Read from vercel.json as before — three files carry this mapping and they
   must stay in step (§35.6) — but as a REGEX now, so what runs locally is
   what Vercel will do. */
const CLIENT_RE = (function () {
  const r = (VERCEL.rewrites || [])
    .filter(function (x) { return x.destination && /strategy-management-platform/.test(x.destination); })[0];
  if (!r) return null;
  /* `/:name(pattern)` is Vercel's own spelling; a plain path is taken whole. */
  const m = /^\/:[A-Za-z0-9_]+\((.*)\)$/.exec(r.source);
  return new RegExp("^/" + (m ? m[1] : r.source.replace(/^\//, "")) + "$");
})();
const SECURITY = ((VERCEL.headers || []).filter(function (h) { return h.source === "/(.*)"; })[0] || {})
  .headers.filter(function (h) { return h.key !== "Strict-Transport-Security"; });

http.createServer(function (req, res) {
  SECURITY.forEach(function (h) { res.setHeader(h.key, h.value); });
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/state") return stateHandler(req, res);
  if (url.pathname === "/api/auth") return authHandler(req, res);
  if (url.pathname === "/api/chat") return chatHandler(req, res);
  if (url.pathname === "/api/mail") return mailHandler(req, res);
  if (url.pathname === "/api/platform") return platformHandler(req, res);
  if (url.pathname === "/favicon.ico") { res.statusCode = 204; return res.end(); }
  let p = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
  if (!p.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  if (url.pathname === "/" || url.pathname === "") p = path.join(ROOT, "index.html");
  /* The same rewrite vercel.json performs, so what is tested here is what
     ships. Without it the gate's /raya-trade link 404s locally and the
     pretty URL is only ever exercised in production — which is the one
     place a broken link costs something. Keep the two in step. */
  if (CLIENT_RE && url.pathname !== "/platform" && CLIENT_RE.test(url.pathname)) {
    p = path.join(ROOT, PLATFORM_FILE);
  }
  /* Forefront's own platform, at the clean path vercel.json rewrites — the
     same rule the client paths follow: what is tested here is what ships. */
  if (url.pathname === "/platform") p = path.join(ROOT, "platform.html");
  fs.readFile(p, function (err, data) {
    if (err) { res.statusCode = 404; return res.end("not found"); }
    res.setHeader("Content-Type", TYPES[path.extname(p)] || "application/octet-stream");
    res.end(data);
  });
}).listen(PORT, function () {
  console.log("dev server on http://localhost:" + PORT);
  console.log("client paths: " + (CLIENT_RE ? CLIENT_RE.source : "(none in vercel.json)"));
});
