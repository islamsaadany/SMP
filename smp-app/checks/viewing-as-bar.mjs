/* THE BAR QUIETENS WHILE A VIEW IS ON (§519).

   Islam, with the El Abd page open and a view-as running: *"while viewing as
   Amr hassan I'm seeing the white bar at the top which is for the smo only is
   that a glitch?"* IT IS NOT, and that half was answered by measurement rather
   than built: the trail follows the SEAT on the session (`cards` is the
   session's own kind, fixed at sign-in), which is the whole point of a
   simulation, and the viewer switcher is in that same row — so a bar that went
   away would strand the office with no way back to themselves (§61). What was
   wrong is the WEIGHT. His decision: *"greyed is better not to get confused
   that the user has access by anyone else."*

   HIS PICK OF TWO DRAWN AT REAL SIZE (rule 1c): **A** — quieter while a view
   is on, full weight the moment you switch back, BOTH MENUS STILL WORKING.
   **B** (quiet and held, the carets dropped and the menus refusing) he
   refused, so *the menus still open while quiet* is not a detail here: it is
   the one assertion that separates what shipped from what he turned down.

   ONE DECISION, TWO BARS, AND THE SIGNAL DIFFERS BECAUSE WHAT EACH BAR HAS
   DIFFERS (§53.5, §42): the frozen trail is painted in the browser, so
   sync.js writes a root attribute from `actingAs()`; the served bar
   (lib/topbar.ts, §444) is rendered BY THE SERVER, which already knows, so it
   stamps a class and there is no moment at full weight. Both are asserted
   here, because a round that quietened one and not the other would look
   finished from whichever page was opened first.

   WHAT IS DRIVEN AND WHAT IS READ, said out loud because the difference is
   the strength of the claim (§100.3):
     · §1 DRIVES the served bar — `topBarHtml()` is pure and `TOPBAR_CSS` is
       an exported string, so a real document is assembled from both and the
       PAINT measured. No database.
     · §2 DRIVES the frozen trail against the shell's own body, its own
       stylesheet and its own route.js, with `markViewing` SLICED OUT OF
       sync.js BY MATCHED TEXT — so the product's own bytes write the
       attribute rather than this file writing it, and a build that stopped
       writing it goes red here.
     · §3 READS route.js for the one fact a paint cannot show: that the mark
       is written on every paint and BEFORE the trail is mounted.

   EVERY COLOUR IS ASSERTED AS AN AGREEMENT WITH A RESOLVED TOKEN, never as a
   hex typed here (§94.8), and in BOTH PALETTES (§38.5) — a quietening that
   reads in light and vanishes in dark is half a decision.

   It needs a browser; with none it FAILS rather than skips, because a check
   that quietly does not run is a green tick over nothing (§54.5).

     node checks/viewing-as-bar.mjs
     SMP_BREAK=no-quiet     node checks/viewing-as-bar.mjs   # must go red
     SMP_BREAK=caret-line   node checks/viewing-as-bar.mjs   # must go red
     SMP_BREAK=no-mark      node checks/viewing-as-bar.mjs   # must go red
     SMP_BREAK=held-menus   node checks/viewing-as-bar.mjs   # must go red
     SMP_BREAK=tb-always    node checks/viewing-as-bar.mjs   # must go red
     SMP_BREAK=tb-no-quiet  node checks/viewing-as-bar.mjs   # must go red      */
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { chromium } from "playwright-core";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { topBarHtml, TOPBAR_CSS } from "../lib/topbar.ts";
import { moduleMenu, offerable } from "../lib/modules.ts";

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, "..");
const ROOT = join(APP, "..");
const BREAK = process.env.SMP_BREAK || "";

/* A PRESS DEGRADES RATHER THAN THROWING (§215, in the file whose own header
   promises it). Playwright waits thirty seconds on a control it cannot reach
   and then throws out of the top level — so `held-menus`, the break that IS
   an unreachable control, killed the run: node exited 1, which is loud
   enough for a caller, and the one assertion that break exists for never
   printed its verdict and §3 was never reached. A run that dies is not a run
   that reported (§298.3). Short clock, and a refusal comes back as false with
   its reason, so the pass carries on and the verdict is a count. */
const press = async (page, sel) => {
  try { await page.locator(sel).click({ timeout: 2500 }); return true; }
  catch (e) { return false; }
};

let ok = 0;
const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};

/* A BREAK IS ASSERTED TO HAVE MATCHED BEFORE IT IS WRITTEN (§344.1): a
   substitution whose old text has moved produces a run reporting 0 red, which
   is indistinguishable from a guard that works (§54.5). */
const bend = (src, from, to, why) => {
  const n = src.split(from).length - 1;
  if (n !== 1) { console.log("  !! BREAK DID NOT MATCH (" + why + "): " + n + " hits"); process.exit(2); }
  return src.replace(from, to);
};

/* ── the four palettes, as the product itself declares them ─────────────
   `data-palette` × `data-theme`, both read off _shared.css rather than typed,
   so a token this file compares against is the token the page resolves. */
const PALETTES = [
  { palette: "forefront", theme: "light" },
  { palette: "forefront", theme: "dark" },
  { palette: "slate", theme: "light" },
  { palette: "slate", theme: "dark" },
];

const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/* ════════════════════════════════════════════════════════════════════════
   1 · THE SERVED BAR (lib/topbar.ts, driven)
   ════════════════════════════════════════════════════════════════════════ */
console.log("1 · the served bar quietens while a view is on (driven)");

const PEOPLE = [
  { key: "islam", name: "Islam Saadany", note: "Super user · the group" },
  { key: "amr", name: "Amr Hassan", note: "Contributor · El Abd" },
];
const barOf = (viewer) => topBarHtml({
  slug: "el-abd", tenantName: "El Abd", module: "strategy",
  have: ["strategy"], consultant: true, viewer,
});
const SELF = { current: "islam", self: "islam", people: PEOPLE };
const VIEW = { current: "amr", self: "islam", people: PEOPLE };

/* THE CSS IS BROKEN HERE AND NOT IN THE FILE, because topbar.ts carries its
   own two breaks already (`tb-always`, `tb-no-quiet`) and this section serves
   the exported string. One route in, so a build cannot be broken for the
   served bar and measured unbroken (§100.3). */
const tbCss = TOPBAR_CSS;

const tbDoc = (viewer, theme) =>
  "<!doctype html>\n<html lang='en' data-theme='" + theme + "'><head><meta charset='utf-8'>" +
  "<style>" + tbCss + "</style></head><body>" + barOf(viewer) + "</body></html>";

/* ════════════════════════════════════════════════════════════════════════
   2 · THE FROZEN TRAIL (sync.js + route.js + arrange.css, driven)
   ════════════════════════════════════════════════════════════════════════ */
const BODY = readFileSync(join(APP, "shell", "body.html"), "utf8");
let ROUTE = readFileSync(join(APP, "shell", "route.js"), "utf8");
let CSS = readFileSync(join(APP, "public", "platform.css"), "utf8");
const SYNCSRC = readFileSync(join(ROOT, "SMP-Project-Folder/src/sync.js"), "utf8");

/* THE PRODUCT'S OWN `markViewing`, SLICED BY MATCHED TEXT (§53.5, §276): a
   stub writing the attribute itself would pass on a build that had stopped
   writing it, which is the one thing this section exists to catch. */
const MVFROM = "  function markViewing() {";
const MVTO = "\n  }";
const mvAt = SYNCSRC.indexOf(MVFROM);
if (mvAt < 0) { console.log("  !! markViewing() not found in sync.js — the slice has moved"); process.exit(2); }
let MARKVIEWING = SYNCSRC.slice(mvAt, SYNCSRC.indexOf(MVTO, mvAt) + MVTO.length);
check("markViewing() is sliced out of sync.js, so the product writes the mark",
  /data-viewing-as/.test(MARKVIEWING) && /removeAttribute/.test(MARKVIEWING),
  MARKVIEWING.replace(/\s+/g, " ").slice(0, 90));

/* ── the falsifications, each applied to the SERVED bytes ───────────────
   public/platform.css carries arrange.css verbatim (scripts/sync-css.mjs), so
   breaking it here breaks exactly the rules the product ships (§276). */
if (BREAK === "no-quiet") {
  CSS = bend(CSS, "html[data-viewing-as] nav.trail .trff,", "html[data-viewing-as-NEVER] nav.trail .trff,", "no-quiet");
} else if (BREAK === "caret-line") {
  /* the drawing's own literal, which measures 1.38:1 — the caret invisible,
     which lands the look on B (the option he refused) */
  CSS = bend(CSS, "html[data-viewing-as] nav.trail details.trstep > summary > svg { color:var(--ink-3); }",
    "html[data-viewing-as] nav.trail details.trstep > summary > svg { color:var(--line); }", "caret-line");
} else if (BREAK === "no-mark") {
  MARKVIEWING = bend(MARKVIEWING, 'el.setAttribute("data-viewing-as", "1")', 'void 0', "no-mark");
} else if (BREAK === "held-menus") {
  /* B, built: the menus refuse */
  CSS = CSS + "\nhtml[data-viewing-as] nav.trail details.trstep > summary { pointer-events:none; }\n";
}

const MENU = moduleMenu(offerable());
const CLIENTS = [{ key: "el-abd", name: "El Abd", kind: "client" }, { key: "rhi", name: "RHI", kind: "client" }];

/* THE SYNC STUB CARRIES THE REAL FUNCTION AND A CONTROLLABLE `actingAs` —
   route.js asks `SYNC.markViewing()` and nothing else, so what is driven is
   the seam the product uses. `window.__VIEWING` is the check's own switch for
   whether a view is on; everything downstream of `actingAs()` is the
   product's. */
const trailDoc = ({ palette, theme }) =>
  "<!doctype html>\n<html lang='en' data-module='strategy' data-console='1' data-console-client='El Abd'" +
  " data-palette='" + palette + "' data-theme='" + theme + "'" +
  " data-modules='" + esc(JSON.stringify(MENU)) + "'>" +
  "<head><meta charset='utf-8'><link rel='stylesheet' href='/platform.css'></head><body class='ready'>" +
  BODY +
  "<script>window.SYNC = (function () {\n" +
  "  function actingAs() { return window.__VIEWING ? 'amr' : null; }\n" +
  MARKVIEWING + "\n" +
  "  return { actingAs: actingAs, markViewing: markViewing };\n" +
  "})();\nwindow.paint = function () {};</script>" +
  "<script src='/route.js'></script><script>paint();</script></body></html>";

const srv = createServer((req, res) => {
  const p = String(req.url).split("?")[0];
  if (p === "/platform.css") { res.writeHead(200, { "Content-Type": "text/css" }); return res.end(CSS); }
  if (p === "/route.js") { res.writeHead(200, { "Content-Type": "application/javascript" }); return res.end(ROUTE); }
  if (p === "/api/platform") { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ ok: true, clients: CLIENTS })); }
  if (p.startsWith("/tb/")) {
    const [, , who, theme] = p.split("/");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(tbDoc(who === "none" ? null : who === "view" ? VIEW : SELF, theme));
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(trailDoc({ palette: req.headers["x-pal"] || "forefront", theme: req.headers["x-thm"] || "light" }));
});
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + srv.address().port;

let browser = null;
try {
  browser = await chromium.launch({ executablePath: process.env.SMP_CHROME || undefined });
} catch (e) {
  check("a browser to drive the two bars in", false, e.message.split("\n")[0] + " — set SMP_CHROME");
}

if (browser) {
  const errs = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 500 } });
  page.on("pageerror", (e) => errs.push(String(e)));

  /* ── §1, continued: the served bar ─────────────────────────────────── */
  const tbRead = async (who, theme) => {
    await page.goto(base + "/tb/" + who + "/" + theme);
    await page.waitForTimeout(80);
    return page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      const tok = (n) => cs.getPropertyValue(n).trim();
      const paint = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).color : null; };
      return {
        marked: document.querySelector("header.tb") ? document.querySelector("header.tb").className : "",
        ff: paint(".tbff"), client: paint(".tbclient > summary"), mod: paint(".tbstep:not(.tbclient) > summary"),
        caret: paint(".tbstep > summary > svg"), sep: paint(".tbsep"),
        viewerBox: !!document.querySelector("#tbas"),
        ink: tok("--tb-ink"), ink2: tok("--tb-ink-2"), ink3: tok("--tb-ink-3"), line: tok("--tb-line"),
      };
    });
  };
  /* resolve a token to the rgb() the paint reads back as, so what is compared
     is a value and never a spelling (§94.8) */
  const rgbOf = async (hex) => page.evaluate((h) => {
    const d = document.createElement("span"); d.style.color = h; document.body.appendChild(d);
    const c = getComputedStyle(d).color; d.remove(); return c;
  }, hex);

  for (const theme of ["light", "dark"]) {
    const self = await tbRead("self", theme);
    const view = await tbRead("view", theme);
    const q = await rgbOf(self.ink3);
    check("served bar · " + theme + " · viewing somebody else marks the header",
      /\btbviewing\b/.test(view.marked), view.marked);
    check("served bar · " + theme + " · viewing YOURSELF does not (§94.2)",
      !/\btbviewing\b/.test(self.marked), self.marked);
    check("served bar · " + theme + " · every step quietens to --tb-ink-3 while a view is on",
      view.ff === q && view.client === q && view.mod === q,
      JSON.stringify({ want: q, ff: view.ff, client: view.client, mod: view.mod }));
    check("served bar · " + theme + " · and comes back to full weight on switching back (§94.2)",
      self.ff !== q && self.mod !== q && self.mod === (await rgbOf(self.ink)),
      JSON.stringify({ ff: self.ff, mod: self.mod, ink: self.ink }));
    check("served bar · " + theme + " · the caret keeps a weight a word keeps, never the line colour",
      view.caret === q && view.caret !== (await rgbOf(self.line)),
      JSON.stringify({ caret: view.caret, line: self.line }));
    /* THE SWITCHER IS WHY THE BAR STAYS (§61) — asserted in the state that
       most looks like a bar nobody needs. */
    check("served bar · " + theme + " · the viewer switcher is still there to get back from",
      view.viewerBox === true);
  }
  const none = await tbRead("none", "light");
  check("served bar · a page with no viewer at all is not marked (§94.2)",
    !/\btbviewing\b/.test(none.marked) && none.viewerBox === false, none.marked);

  /* ── §2: the frozen trail ──────────────────────────────────────────── */
  console.log("\n2 · the frozen trail quietens while a view is on (driven)");
  const trailRead = async (viewing) => {
    await page.evaluate((v) => { window.__VIEWING = v; paint(); }, viewing);
    await page.waitForTimeout(120);
    return page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      const tok = (n) => cs.getPropertyValue(n).trim();
      const paint = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).color : null; };
      return {
        mark: document.documentElement.getAttribute("data-viewing-as"),
        has: document.documentElement.hasAttribute("data-viewing-as"),
        trail: !!document.querySelector("nav.trail"),
        ff: paint("nav.trail .trff"), client: paint("nav.trail details.trclient > summary"),
        mod: paint("nav.trail details.trmod > summary"),
        caret: paint("nav.trail details.trstep > summary > svg"), sep: paint("nav.trail .trsep"),
        viewerBox: !!document.querySelector("#asWho"),
        ink: tok("--ink"), ink2: tok("--ink-2"), ink3: tok("--ink-3"), line: tok("--line"),
      };
    });
  };
  for (const pal of PALETTES) {
    const label = pal.palette + "/" + pal.theme;
    await page.setExtraHTTPHeaders({ "x-pal": pal.palette, "x-thm": pal.theme });
    await page.goto(base + "/el-abd/strategy/mobile/plan");
    await page.waitForTimeout(200);
    const off = await trailRead(false);
    const on = await trailRead(true);
    const q = await rgbOf(off.ink3);
    const lineRgb = await rgbOf(off.line);
    check("trail · " + label + " · it is drawn at all, or the rest of this proves nothing (§113.8)",
      off.trail === true && off.ff !== null);
    check("trail · " + label + " · a view-as writes the mark on the root",
      on.has === true && on.mark === "1", String(on.mark));
    /* STORED AS AN ABSENCE (§50.6): a build writing "0" would read as quiet
       to nobody and as present to every selector that only asks whether the
       attribute is there. */
    check("trail · " + label + " · nobody viewed REMOVES it rather than setting \"0\" (§50.6)",
      off.has === false, String(off.mark));
    check("trail · " + label + " · every step quietens to --ink-3 while a view is on",
      on.ff === q && on.client === q && on.mod === q,
      JSON.stringify({ want: q, ff: on.ff, client: on.client, mod: on.mod }));
    /* OPTION D (2026-10-26) REWRITTEN, NEVER LOOSENED (§218): the trail's
       first step is the platform's mark now, not the word, and at full
       weight it draws in the mark's own navy (#0F2C69 on amber) — the same
       in every theme, as the console's mark is — and never the quiet ink. */
    check("trail · " + label + " · and comes back to full weight on switching back (§94.2)",
      off.mod === (await rgbOf(off.ink)) && off.ff === "rgb(15, 44, 105)" && off.ff !== q,
      JSON.stringify({ ff: off.ff, mod: off.mod, ink: off.ink, ink2: off.ink2 }));
    /* THE ONE STATED DEPARTURE FROM THE DRAWING, asserted so it cannot drift
       back: --line on the bar's surface is 1.38:1 light and 1.43 dark, which
       on the caret takes away the one mark saying *this opens* and lands the
       look on B. */
    check("trail · " + label + " · the caret keeps the words' ink and never the line colour",
      on.caret === q && on.caret !== lineRgb, JSON.stringify({ caret: on.caret, line: lineRgb, want: q }));
    check("trail · " + label + " · and the › separators DO recede to the line colour",
      on.sep === lineRgb, JSON.stringify({ sep: on.sep, line: lineRgb }));
    check("trail · " + label + " · the viewer switcher is still there to get back from (§61)",
      on.viewerBox === true);
  }

  /* ── A IS NOT B: the menus still open while quiet ──────────────────── */
  console.log("\n2b · and both menus still OPEN while quiet (A, not the refused B)");
  await page.setExtraHTTPHeaders({ "x-pal": "forefront", "x-thm": "light" });
  await page.goto(base + "/el-abd/strategy/mobile/plan");
  await page.waitForTimeout(200);
  await page.evaluate(() => { window.__VIEWING = true; paint(); });
  await page.waitForTimeout(150);
  const quiet = await page.evaluate(() => getComputedStyle(document.querySelector("nav.trail .trmod > summary")).color);
  const want = await page.evaluate(() => {
    const d = document.createElement("span");
    d.style.color = getComputedStyle(document.documentElement).getPropertyValue("--ink-3").trim();
    document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c;
  });
  check("the module step is quiet before the menus are pressed", quiet === want, JSON.stringify({ quiet, want }));
  for (const step of ["trmod", "trclient"]) {
    const landed = await press(page, "nav.trail ." + step + " > summary");
    await page.waitForTimeout(220);
    const open = await page.evaluate((s) => {
      const d = document.querySelector("nav.trail ." + s);
      const m = d && d.querySelector(".menu");
      const r = m ? m.getBoundingClientRect() : null;
      return { open: !!(d && d.open), box: r ? { w: Math.round(r.width), h: Math.round(r.height) } : null };
    }, step);
    check("the " + step + " menu still opens while quiet (A; B is refused)",
      landed && open.open === true && !!open.box && open.box.w > 150 && open.box.h > 10,
      JSON.stringify(landed ? open : { press: "refused — the control could not be reached", ...open }));
    await press(page, "nav.trail ." + step + " > summary");
    await page.waitForTimeout(120);
  }
  check("no page error from any of it", errs.length === 0, errs.join(" | "));
  await browser.close();
}
srv.close();

/* ════════════════════════════════════════════════════════════════════════
   3 · THE WIRING — READ, and said to be read (§100.3)
   ════════════════════════════════════════════════════════════════════════ */
console.log("\n3 · the wiring (read)");
const routeSrc = readFileSync(join(APP, "shell", "route.js"), "utf8");
check("route.js asks SYNC.markViewing() rather than deciding again (§42, §53.5)",
  /SYNC\.markViewing\s*\(\s*\)/.test(routeSrc));
/* AND BEFORE THE TRAIL IS MOUNTED, or the first frame of every paint draws it
   at the weight the round exists to remove. */
check("…and before mountTrail(), so the trail is never mounted at full weight first",
  routeSrc.indexOf("SYNC.markViewing") < routeSrc.indexOf("mountTrail()", routeSrc.indexOf("SYNC.markViewing")),
  "markViewing at " + routeSrc.indexOf("SYNC.markViewing"));
const syncSrc = SYNCSRC;
check("sync.js exports it, asked rather than re-derived",
  /markViewing: function \(\) \{ markViewing\(\); \}/.test(syncSrc));
check("…and the signal is actingAs() and never a second test (§42)",
  /if \(actingAs\(\)\) el\.setAttribute\("data-viewing-as"/.test(syncSrc));

console.log("\n%d ok, %d failed", ok, bad.length);
if (bad.length) { console.log("FAILED: " + bad.join("; ")); process.exit(1); }
