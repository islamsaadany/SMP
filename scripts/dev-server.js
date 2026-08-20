/* A small local stand-in for the Vercel deployment: static files from the
   repo root plus /api/state via the real handler — so the database mode can
   be exercised end-to-end before anything ships.

     DATABASE_URL=postgres://... node scripts/dev-server.js [port]
*/
const http = require("http");
const fs = require("fs");
const path = require("path");
const stateHandler = require("../api/state.js");

const ROOT = path.join(__dirname, "..");
const PORT = parseInt(process.argv[2], 10) || 3999;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript",
                ".css": "text/css", ".json": "application/json", ".ico": "image/x-icon" };

http.createServer(function (req, res) {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/state") return stateHandler(req, res);
  if (url.pathname === "/favicon.ico") { res.statusCode = 204; return res.end(); }
  let p = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
  if (!p.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  if (url.pathname === "/" || url.pathname === "") p = path.join(ROOT, "index.html");
  fs.readFile(p, function (err, data) {
    if (err) { res.statusCode = 404; return res.end("not found"); }
    res.setHeader("Content-Type", TYPES[path.extname(p)] || "application/octet-stream");
    res.end(data);
  });
}).listen(PORT, function () { console.log("dev server on http://localhost:" + PORT); });
