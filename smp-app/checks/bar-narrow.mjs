/* THE TOP BAR ON A NARROWED WINDOW, AND THE REFINE PANEL'S TOP (§792).

   Islam, zoomed in on Strategy, with two screenshots: *"in a zoomed state the
   top bar elements are interfering with each other"* — the trail's "Strategy"
   drawn over "Viewing as" — and *"the copilot panel is slightly below the
   placement where there is space above it which shouldn't be there … when I
   zoom out and in again the panel issue is fixed but it doesn't need to
   happen from the start."*

   WHAT IS DRIVEN (§100.3), each on the product's own bytes:
     1 · STRATEGY'S BAR — the shell's body, its stylesheet, its route.js (which
         mounts the trail) and the Jump to script (which mounts its box), with
         the viewer's picker, the role line and the bar's buttons put in as
         sync.js and searchsel.js draw them. At every width from 1440 to 521:
         no two things on the bar overlap, nothing leaves the bar, and the
         step you are on keeps every letter.
     2 · THE MODULES' BAR (lib/topbar.ts) — `topBarHtml()` and `TOPBAR_CSS`,
         with the same Jump to script. The same assertions (§53.5).
     3 · THE REFINE PANEL — the built file, the live gate stubbed and never
         the panel (as checks/copilot-panel-compete.py does): its top is the
         chrome's bottom when it opens, when it is expanded, and after the
         window narrows and widens again with nothing pressed.

   An overlap is two boxes sharing area, read off the paint — never a width
   typed here (§94.8).

     node checks/bar-narrow.mjs
     SMP_BREAK=no-give      node checks/bar-narrow.mjs   # must go red (§1)
     SMP_BREAK=tb-no-give   node checks/bar-narrow.mjs   # must go red (§2)
     SMP_BREAK=panel-fixed  node checks/bar-narrow.mjs   # must go red (§3)

   SMP_BUILT points §3 at another build (§276). It needs a browser; with none
   it FAILS rather than skips (§54.5). */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { createServer } from "node:http";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { topBarHtml, TOPBAR_CSS } from "../lib/topbar.ts";
import { JUMP_SCRIPT } from "../lib/jump-script.ts";

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, "..");
const ROOT = join(APP, "..");
const BREAK = process.env.SMP_BREAK || "";
const BUILT = process.env.SMP_BUILT || join(ROOT, "SMP-Project-Folder", "strategy-management-platform-v3.22.html");

let ok = 0;
const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};
/* a break is asserted to have matched before it is written (§344.1) */
const bend = (src, from, to, why) => {
  const n = src.split(from).length - 1;
  if (n !== 1) { console.log("  !! BREAK DID NOT MATCH (" + why + "): " + n + " hits"); process.exit(2); }
  return src.replace(from, to);
};
const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const BODY = readFileSync(join(APP, "shell", "body.html"), "utf8");
const ROUTE = readFileSync(join(APP, "shell", "route.js"), "utf8");
let CSS = readFileSync(join(APP, "public", "platform.css"), "utf8");
let TBCSS = TOPBAR_CSS;
let BUILTSRC = readFileSync(BUILT, "utf8");
if (BREAK === "no-give") {
  /* the trail as it was: squeezable, its steps not */
  CSS = bend(CSS, "nav.trail details.trclient { min-width:0; flex:0 1 auto; }", "", "no-give");
  CSS = bend(CSS, ".top .viewer { flex-shrink:1000; min-width:222px; }", "", "no-give floor");
} else if (BREAK === "tb-no-give") {
  /* the bar as it was: Jump to keeping its 190px box, the viewer no floor */
  TBCSS = bend(TBCSS, "@media (max-width:999px){.tb .sjbtn{min-width:0}.tb .sjbtn .sjl,.tb .sjbtn .sjk{display:none}.tbnote{display:none}}", "", "tb-no-give");
  TBCSS = bend(TBCSS, ".tbviewer{flex:0 1000 auto;min-width:222px;justify-content:flex-end}", "", "tb-no-give floor");
} else if (BREAK === "panel-fixed") {
  /* a top that is a number kept from one moment, which is what it was */
  BUILTSRC = bend(BUILTSRC, "top:var(--chrome-h, 150px); width:var(--copPw, 550px)", "top:260px; width:var(--copPw, 550px)", "panel-fixed");
}

const WIDTHS = [1440, 1280, 1100, 1000, 999, 960, 900, 881, 880, 820, 761, 760, 680, 600, 521];
const LONG = "Al Mansour International Holding Group";

/* Every thing a reader can see on the bar, and which pairs share area. A
   thing inside another (a caret in its step) is one thing; a closed menu's
   rows are not on the bar. */
const MEASURE = (sel) => {
  const bar = document.querySelector(sel.bar), br = bar.getBoundingClientRect(), L = [];
  bar.querySelectorAll(sel.things).forEach((el) => {
    if (el.closest(sel.skip)) return;
    const q = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (q.width < 2 || q.height < 2 || cs.visibility === "hidden") return;
    L.push({ el, n: (el.textContent.trim() || el.className || el.tagName).slice(0, 18), l: q.left, r: q.right, t: q.top, b: q.bottom });
  });
  const clash = [];
  for (let a = 0; a < L.length; a++) for (let c = a + 1; c < L.length; c++) {
    const A = L[a], C = L[c];
    if (A.el.contains(C.el) || C.el.contains(A.el)) continue;
    if (A.l < C.r - 0.5 && C.l < A.r - 0.5 && A.t < C.b - 0.5 && C.t < A.b - 0.5) clash.push(A.n + " × " + C.n);
  }
  const out = L.filter((x) => x.l < br.left - 0.5 || x.r > br.right + 0.5).map((x) => x.n);
  const on = bar.querySelector(sel.on), sp = on ? on.querySelector("span") : null;
  return { clash, out, things: L.length, cut: sp ? sp.scrollWidth > sp.clientWidth + 1 : null,
           sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
};

/* ── the two documents ──────────────────────────────────────────────── */
const MENU = [{ key: "strategy", label: "Strategy", href: "/x/strategy" }, { key: "insights", label: "Insights", href: "/x/insights" }];
const shellDoc = (client) =>
  "<!doctype html>\n<html lang='en' data-module='strategy' data-console='1' data-console-client='" + esc(client) + "'" +
  " data-palette='forefront' data-theme='light' data-modules='" + esc(JSON.stringify(MENU)) + "'>" +
  "<head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
  "<link rel='stylesheet' href='/platform.css'></head><body class='ready'>" + BODY +
  "<script>window.SYNC={actingAs:function(){return null},markViewing:function(){}};window.paint=function(){};</script>" +
  "<script src='/route.js'></script><script>paint();</script><script>" + JUMP_SCRIPT + "</script></body></html>";
/* what sync.js, searchsel.js, theme.js and keysheet.js hang on the bar */
const DRESS = () => {
  const v = document.querySelector(".viewer");
  v.querySelector("select").outerHTML = '<button type="button" class="ssbtn"><span class="sslabel">Islam Saadany — the group</span><span>▾</span></button>';
  document.getElementById("viewerNote").textContent = "Super user, the group";
  const ta = document.getElementById("topacts");
  document.getElementById("readbtn").hidden = false;
  const th = document.getElementById("themebtn"); th.hidden = false;
  th.innerHTML = '<svg class="themesvg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  const k = document.createElement("button"); k.className = "infobtn keysbtn"; k.textContent = "?"; ta.appendChild(k);
  const o = document.createElement("button"); o.className = "infobtn"; o.textContent = "Sign out"; ta.appendChild(o);
};
const PEOPLE = [{ key: "islam", name: "Islam Saadany — the group", note: "Super user · the group" }, { key: "amr", name: "Amr Hassan", note: "Contributor" }];
const tbDoc = (client) =>
  "<!doctype html>\n<html lang='en' data-theme='light'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
  "<style>" + TBCSS + "</style></head><body>" +
  topBarHtml({ slug: "raya-trade", tenantName: client, module: "insights", have: ["strategy", "insights"], consultant: true,
               viewer: { current: "islam", self: "islam", people: PEOPLE }, reading: null }) +
  "<script>" + JUMP_SCRIPT + "</script></body></html>";

/* THE BUILT FILE IS OPENED AS A FILE, which is what it is: served from an
   address it looks for a server behind it. A break is written to a copy in a
   scratch folder, never over the build. */
let builtUrl = pathToFileURL(BUILT).href, scratch = null;
if (BREAK === "panel-fixed") {
  scratch = mkdtempSync(join(tmpdir(), "smp-bar-"));
  writeFileSync(join(scratch, "built.html"), BUILTSRC);
  builtUrl = pathToFileURL(join(scratch, "built.html")).href;
}
process.on("exit", () => { if (scratch) try { rmSync(scratch, { recursive: true, force: true }); } catch {} });

const srv = createServer((req, res) => {
  const u = new URL(req.url, "http://x"), p = u.pathname, client = u.searchParams.get("c") || "Raya Trade";
  if (p === "/platform.css") { res.writeHead(200, { "Content-Type": "text/css" }); return res.end(CSS); }
  if (p === "/route.js") { res.writeHead(200, { "Content-Type": "application/javascript" }); return res.end(ROUTE); }
  if (p.startsWith("/api/")) { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ ok: true, clients: [], items: [] })); }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(p.startsWith("/tb") ? tbDoc(client) : shellDoc(client));
});
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + srv.address().port;

let browser = null;
try { browser = await chromium.launch({ executablePath: process.env.SMP_CHROME || undefined, args: ["--no-sandbox"] }); }
catch (e) { check("a browser to drive the bars in", false, e.message.split("\n")[0] + " — set SMP_CHROME"); }

const sweep = async (title, path, sel, dress) => {
  for (const client of ["Raya Trade", LONG]) {
    const worst = { clash: [], out: [], cut: [], side: [], thin: [] };
    for (const w of WIDTHS) {
      const page = await browser.newPage({ viewport: { width: w, height: 400 } });
      await page.goto(base + path + "?c=" + encodeURIComponent(client));
      await page.waitForSelector("[data-jump]", { timeout: 5000 }).catch(() => {});
      if (dress) await page.evaluate(dress);
      const m = await page.evaluate(MEASURE, sel);
      if (m.clash.length) worst.clash.push(w + ": " + m.clash[0]);
      if (m.out.length) worst.out.push(w + ": " + m.out[0]);
      if (m.cut) worst.cut.push(w);
      if (m.sideways) worst.side.push(w);
      if (m.things < 8) worst.thin.push(w + " (" + m.things + ")");
      await page.close();
    }
    const who = title + ", " + (client === LONG ? "a long client name" : client);
    check(who + ": the bar is drawn whole at all " + WIDTHS.length + " widths (trail, viewer, Jump to, buttons)", !worst.thin.length, worst.thin.join(", "));
    check(who + ": no two things on the bar overlap, 1440 down to 521", !worst.clash.length, worst.clash.slice(0, 3).join(" · "));
    check(who + ": nothing leaves the bar, and the page does not scroll sideways", !worst.out.length && !worst.side.length, worst.out.concat(worst.side).slice(0, 3).join(" · "));
    check(who + ": the step you are on keeps every letter", !worst.cut.length, "cut at " + worst.cut.join(", "));
  }
};

if (browser) {
  console.log("1 · Strategy's bar, narrowed (driven)");
  await sweep("Strategy", "/raya-trade/strategy/mobile/swot",
    { bar: ".top-in", things: "a,summary,label,button,.viewer-note,.trsep", skip: ".menu", on: "nav.trail details.trstep:not(.trclient) > summary" }, DRESS);

  console.log("2 · the modules' bar, narrowed (driven)");
  await sweep("Insights", "/tb",
    { bar: "header.tb", things: "a,summary,label,button,select,.tbnote,.tbsep", skip: ".tbmenu", on: ".tbmod > summary" }, null);

  console.log("3 · the Refine panel sits under the chrome (driven, the built file)");
  const page = await browser.newPage({ viewport: { width: 1300, height: 800 } });
  await page.goto(builtUrl);
  await page.waitForFunction(() => typeof SYNC !== "undefined" && document.querySelector("#units button"), null, { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => { document.documentElement.setAttribute("data-copilot", "1"); SYNC.isLive = () => true; });
  await page.locator("#units button", { hasText: "Mobile" }).first().click({ timeout: 5000 }).catch(() => {});
  await page.locator("#secrow-in button", { hasText: "SWOT" }).first().click({ timeout: 5000 }).catch(() => {});
  const gap = () => page.evaluate(() => {
    const p = document.getElementById("copPanel"), c = document.querySelector(".chrome");
    return p && c ? Math.round((p.getBoundingClientRect().top - c.getBoundingClientRect().bottom) * 10) / 10 : null;
  });
  const sits = (g) => g !== null && Math.abs(g) <= 1;
  await page.locator("[data-cop-panelbtn]").click({ timeout: 5000 }).catch(() => {});
  await page.waitForSelector("#copPanel", { timeout: 5000 }).catch(() => {});
  let g = await gap();
  check("opened at 1300 wide, its top is the chrome's bottom", sits(g), "gap " + g + "px");
  await page.locator("[data-cop-panelexpand]").click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300); g = await gap();
  check("…and expanded over the page", sits(g), "gap " + g + "px");
  for (const w of [900, 700, 1300]) {
    await page.setViewportSize({ width: w, height: 800 }); await page.waitForTimeout(400); g = await gap();
    check("…and with the window at " + w + ", nothing pressed", sits(g), "gap " + g + "px");
  }
  await page.close();
  const narrow = await browser.newPage({ viewport: { width: 700, height: 800 } });
  await narrow.goto(builtUrl);
  await narrow.waitForFunction(() => typeof SYNC !== "undefined" && document.querySelector("#units button"), null, { timeout: 20000 }).catch(() => {});
  await narrow.evaluate(() => { document.documentElement.setAttribute("data-copilot", "1"); SYNC.isLive = () => true; });
  await narrow.locator("#units button", { hasText: "Mobile" }).first().click({ timeout: 5000 }).catch(() => {});
  await narrow.locator("[data-cop-panelbtn]").click({ timeout: 5000 }).catch(() => {});
  await narrow.waitForSelector("#copPanel", { timeout: 5000 }).catch(() => {});
  g = await narrow.evaluate(() => { const p = document.getElementById("copPanel"), c = document.querySelector(".chrome"); return p && c ? p.getBoundingClientRect().top - c.getBoundingClientRect().bottom : null; });
  check("opened on a window 700 wide (the bar on two lines), from the start", sits(g), "gap " + g + "px");
  await narrow.close();
  await browser.close();
}
srv.close();

console.log("\n" + ok + " ok, " + bad.length + " failed" + (BREAK ? "   (SMP_BREAK=" + BREAK + ")" : ""));
process.exit(bad.length ? 1 : 0);
