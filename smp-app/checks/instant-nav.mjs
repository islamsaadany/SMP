/* §606 — EVERY PRESS SHOWS SOMETHING AT ONCE (CLAUDE.md 1d), MEASURED.

   Islam: "the navigation between the pages needs to be momentarily". Starts
   the BUILT app on its own port, signs the office in, throttles the browser
   to production's round trip (§369: 600ms) and presses every way between
   pages, sampling what the screen holds every 60ms from the press until the
   page settles. What it can tell apart: the old page still standing, a grey
   shape (the press drawing, a console tab's shape, a page's boot skeleton,
   Processes' own), a saved copy marked Updating…, and the page itself.

   WHAT IS ASSERTED IS THE PROPERTY, NEVER THE MILLISECONDS (§94.8), with one
   threshold that is the rule itself — "at once" is within 150ms of the press:
     §1  the files a page waits on carry their content hash in their address,
         and a stamped address is cached for good while a plain one is not;
     §2  a console tab pressed for the first time shows its shape at once and
         is never blank on the way to its page; pressed again, its page;
     §3  a press that loads another page shows that page's shape at once —
         the console to a client, module to module, a client to the console;
     §4  arriving at the console shows its saved copy, marked Updating… and
         taking no input, before the latest replaces it.

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/instant-nav.mjs
     … --break=no-navskel   (RED §3: the press draws nothing)
     … --break=unversioned  (RED §1: every address plain again)
   Needs `npm run build` first and the chromium this image carries. */
import { spawn } from "node:child_process";
import { SCHEMA } from "../db/schema-name.mjs";
import { chromium } from "playwright-core";
import pg from "pg";
import { devTenant, DEV_PASSWORD } from "../scripts/dev-tenant.mjs";
const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const CHROME = process.env.SMP_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = 3986, BASE = "http://localhost:" + PORT, RTT = 600, AT_ONCE = 150;
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
let oks = 0, fails = 0;
const check = (l, c, m) => { if (c) { oks++; console.log("ok    " + l); } else { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(typeof m === "string" ? m : JSON.stringify(m)).slice(0, 260))); } };

await devTenant({ url: URL_, log: () => {} });
const db = new pg.Pool({ connectionString: URL_, max: 1, options: "-c search_path=" + SCHEMA });
const ALL = ["strategy", "portfolio", "insights", "processes", "tracker", "notes", "copilot"];
const was = (await db.query("SELECT modules FROM tenants WHERE key = 'raya-trade'")).rows[0].modules;
await db.query("UPDATE tenants SET modules = $1 WHERE key = 'raya-trade'", [JSON.stringify(ALL)]);
const server = spawn("npx", ["next", "start", "-p", String(PORT)], { cwd: new URL("..", import.meta.url).pathname,
  env: { ...process.env, DATABASE_URL_UNPOOLED: URL_, DATABASE_URL: URL_, SMP_BREAK: brk }, stdio: ["ignore", "ignore", "pipe"], detached: true });
server.stderr.on("data", () => {});
let up = false;
for (let i = 0; i < 60 && !up; i++) { await new Promise((r) => setTimeout(r, 500)); try { up = (await fetch(BASE + "/")).status === 200; } catch {} }
const stop = async () => { try { process.kill(-server.pid); } catch {} await db.query("UPDATE tenants SET modules = $1 WHERE key = 'raya-trade'", [JSON.stringify(was)]); await db.end(); };
if (!up) { console.log("FAIL  the app did not start"); await stop(); process.exit(1); }

const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { sessionStorage.setItem("smp.welcome.done", "1"); } catch (e) {} });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
let inflight = 0;
page.on("request", (r) => { if (/\/api\//.test(r.url())) inflight++; });
const done = (r) => { if (/\/api\//.test(r.url())) inflight = Math.max(0, inflight - 1); };
page.on("requestfinished", done); page.on("requestfailed", done);

/* what the screen holds, read off the page: a grey shape of any of the
   platform's kinds, the saved copy's mark, or the page's own words */
const SAMPLE = () => {
  const vis = (e) => !!(e && e.getClientRects().length && getComputedStyle(e).visibility !== "hidden");
  const root = document.querySelector("#page") || document.querySelector("main") || document.body;
  const shape = Array.from(document.querySelectorAll('#navskel,.tsk,.ccard.skel,.bootsk,.bootpg,[aria-busy="true"] .animate-pulse')).filter(vis).length
    + (document.documentElement.classList.contains("booting") ? 1 : 0);
  const text = root ? (root.innerText || "").replace(/\s+/g, " ").trim() : "";
  return { doc: window.__navdoc || 0, url: location.pathname + location.hash, shape, len: text.length, fp: text.slice(0, 160),
    saved: !!document.querySelector("#page[inert] .stale, .staleflag"), inert: !!document.querySelector("#page[inert]") };
};
let docN = 0;
async function measure(press, settleSel) {
  const before = await page.evaluate(SAMPLE).catch(() => null);
  const mine = ++docN;
  await page.evaluate((n) => { window.__navdoc = n; }, mine).catch(() => {});
  const t0 = Date.now(), samples = [];
  const pressing = press().catch(() => {});
  let stableSince = null, lastFp = null;
  while (Date.now() - t0 < 15000) {
    const s = await page.evaluate(SAMPLE).catch(() => null), t = Date.now() - t0;
    if (!s) { samples.push({ t, st: "loading" }); await new Promise((r) => setTimeout(r, 60)); continue; }
    let st;
    if (s.shape > 0) st = "shape";
    else if (s.doc === mine && before && s.url === before.url && s.fp === before.fp) st = "old";
    else if (s.saved) st = "saved";
    else if (s.len < 40) st = "blank";
    else st = "page";
    samples.push({ t, st, sameDoc: s.doc === mine });
    if (st === "page" && inflight === 0 && s.fp === lastFp && (!settleSel || await page.$(settleSel))) { if (stableSince === null) stableSince = t; if (t - stableSince > 700) break; }
    else stableSince = null;
    lastFp = s.fp;
    await new Promise((r) => setTimeout(r, 60));
  }
  await pressing;
  const firstShown = samples.find((s) => s.st !== "old" && s.st !== "loading");
  const phases = []; for (const s of samples) if (!phases.length || phases[phases.length - 1].k !== s.st) phases.push({ k: s.st, at: s.t });
  /* "blank" counts only in the page that was pressed: a document that has
     arrived but not yet painted (its stylesheet still coming) shows the
     previous frame, so blank there is not on screen */
  const blankSeen = samples.some((s) => s.st === "blank" && s.sameDoc);
  return { first: firstShown ? firstShown.t : null, firstKind: firstShown ? firstShown.st : null, blankSeen,
    phases: phases.map((p) => p.k + "@" + p.at).join(" ") };
}
const tab = (k) => () => page.click('#nav button[data-tab="' + k + '"]');
const via = (path) => () => page.evaluate((p) => {
  const b = document.querySelector('[data-trgo="' + p + '"]') || document.querySelector('a[href="' + p + '"]');
  if (b) b.click(); else location.assign(p);
}, path);
const openCard = () => page.evaluate(() => {
  const c = document.querySelector('.ccard[data-client="raya-trade"]');
  const r = c && Array.from(c.querySelectorAll(".mrow")).find((x) => /Strategy/.test(x.textContent));
  (r || c).click();
});

try {
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.fill("#user", "office@forefront.example");
  await page.fill("#password", DEV_PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL("**/platform*", { timeout: 20000 });
  await page.waitForSelector("body.ready", { timeout: 20000 });
  await page.waitForTimeout(1200);

  console.log("── §1 · the files a page waits on are stamped, and a stamp is cached for good");
  const srcs = async (url) => { const r = await page.request.get(BASE + url); const h = await r.text();
    return Array.from(h.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="(\/[a-z-]+\.(?:js|css)[^"]*)"/g)).map((m) => m[1]); };
  const con = await srcs("/platform"), str = await srcs("/raya-trade/strategy"), trk = await srcs("/raya-trade/tracker");
  const plain = (list, names) => names.filter((n) => !list.some((s) => s.startsWith(n + "?v=")));
  const p1 = plain(con, ["/platform-page.js", "/client-setup.js", "/memory-split.js", "/navskel.js"]);
  const p2 = plain(str, ["/platform.css", "/theme.js", "/shell.js", "/navskel.js"]);
  const p3 = plain(trk, ["/topbar.js"]);
  check("the console, Strategy and a module page load their files by stamped address", !p1.length && !p2.length && !p3.length, { console: p1, strategy: p2, tracker: p3 });
  const stamped = str.find((s) => s.startsWith("/shell.js?v=")) || "/shell.js?v=none";
  const cc = async (u) => (await page.request.fetch(BASE + u, { method: "HEAD" })).headers()["cache-control"] || "";
  const [cs, cp, ct] = [await cc(stamped), await cc("/shell.js"), await cc(trk.find((s) => s.startsWith("/topbar.js")) || "/topbar.js")];
  check("a stamped address is cached for good, a plain one is asked about every time", /immutable/.test(cs) && /immutable/.test(ct) && !/immutable/.test(cp), { stamped: cs, topbar: ct, plain: cp });

  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: RTT, downloadThroughput: 2.5 * 1024 * 1024, uploadThroughput: 1024 * 1024 });

  console.log("── §2 · a console tab: its shape at once, never blank");
  for (const k of ["clients", "consultants", "access", "memory", "frameworks", "copilot", "history"]) {
    const m = await measure(tab(k));
    check("first visit to " + k + ": its shape within " + AT_ONCE + "ms, never blank", m.first !== null && m.first <= AT_ONCE && m.firstKind === "shape" && !m.blankSeen, m);
  }
  const back = await measure(tab("clients"));
  check("pressed again: the tab as it was left, at once", back.first !== null && back.first <= AT_ONCE && back.firstKind === "page", back);

  console.log("── §3 · a press that loads another page shows its shape at once");
  const moves = [["the console → a client's Strategy", openCard],
                 ["Strategy → Internal Tracker", via("/raya-trade/tracker")],
                 ["Internal Tracker → Insights", via("/raya-trade/insights")],
                 ["Insights → Processes", via("/raya-trade/processes")],
                 ["Processes → Meeting Notes", via("/raya-trade/notes")],
                 ["Meeting Notes → the console", via("/platform")]];
  let consoleArrival = null;
  for (const [name, press] of moves) {
    if (name.startsWith("the console →")) { await page.click('#nav button[data-tab="clients"]'); await page.waitForSelector('.ccard[data-client="raya-trade"]', { timeout: 20000 }); await page.waitForTimeout(900); }
    const m = await measure(press);
    check(name + ": the next page's shape within " + AT_ONCE + "ms", m.first !== null && m.first <= AT_ONCE && m.firstKind === "shape", m);
    if (name.endsWith("the console")) consoleArrival = m;
  }

  console.log("── §4 · arriving at the console shows its saved copy, then the latest");
  check("the saved copy is on screen before the latest, marked Updating… and taking no input",
    !!consoleArrival && /saved@/.test(consoleArrival.phases) && consoleArrival.phases.indexOf("saved@") < consoleArrival.phases.lastIndexOf("page@"), consoleArrival);
  await page.waitForTimeout(2500);
  const settled = await page.evaluate(() => ({ inert: !!document.querySelector("#page[inert]"), mark: !!document.querySelector("#page .stale") }));
  check("and once the latest lands the page is pressable and unmarked", !settled.inert && !settled.mark, settled);
  check("no page error on the way", errs.length === 0, errs.slice(0, 3));
} finally {
  await browser.close();
  await stop();
}
console.log((fails ? "RED   " : "GREEN ") + oks + " ok, " + fails + " failed");
process.exit(fails ? 1 : 0);
