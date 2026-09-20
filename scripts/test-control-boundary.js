#!/usr/bin/env node
/* A CONTROL'S BOUNDARY, AND A FOCUS RING THAT IS THERE (2026-09-20)
   ═══════════════════════════════════════════════════════════════════════
   Two faults from the audit against PRODUCT_RULES.md, and one check,
   because they are the same sentence twice: a control has to be findable,
   by the eye and by the keyboard.

     1. Every FIELD in the frozen product took its border from `--line`,
        which is the table-hairline colour: 1.38:1 light, 1.43:1 dark,
        against the 3:1 WCAG 2.2 asks of a component's boundary (1.4.11).
     2. The three newest modules declared 24 rules setting `outline:none`
        on `:focus-visible`, replacing the ring with a background change
        measuring 1.08:1 — so every button and every link in the Internal
        Tracker had an invisible keyboard focus (2.4.7), and since each rule
        named `:hover` in the same breath, a keyboard position and a mouse
        position looked identical.

   WHY THIS ONE MEASURES A STYLESHEET AND NOT A PAGE. Every other contrast
   check in this project drives a browser, and `scripts/contrast-sweep.py`
   is the reason both faults survived: it reads `color` against background
   and NOTHING ELSE — it has never measured a border or a ring, and it runs
   against the frozen Strategy file alone. A rendered page is the better
   subject and is not available here (no Playwright in either runtime, no
   node_modules for smp-app), so this measures what is DECLARED. For a flat
   border on a known ground the two agree, and it says so out loud rather
   than implying it measured pixels (§124).

   IT GUARDS THE RULE, NOT THE TWENTY-ONE. §3 does not hold a list of the
   fields repaired today: it works out which classes the sources put on an
   `<input>`, `<select>` or `<textarea>` and asserts that NONE of them takes
   a bare `--line` border. So the field somebody adds next month is covered
   the day it is added, which is the whole difference between a check and a
   receipt (§104.7).

   WHAT IS DELIBERATELY NOT ASSERTED, said rather than left to be
   rediscovered (§54.5):
     · A bordered button whose text is a LABEL (Save, Add, Done) keeps
       `--line`. 1.4.11 asks 3:1 of what is *required to identify* the
       component, and a button with a word in it is identified by the word.
       Widening this to every bordered thing would have restyled 274
       selectors — every card, band and chip in the product — to repair 21
       fields (rule 1b).
     · A DISABLED control keeps `--line` too: 1.4.11 exempts it, and an
       inert box drawn more strongly than a live one reads backwards. That
       is `.fld.off`, and it is printed on every run so the cost stays
       visible rather than disappearing into a green tick (§113.8).
     · The Internal Tracker's date and owner carry NO border at all today
       and gain none here. Giving them one is a change to the row's shape
       rather than to a token, and §356 settled that shape on purpose
       ("super simple"). RECORDED, NOT DONE — it wants its own drawing.

   Run: node scripts/test-control-boundary.js
   Red: node scripts/test-control-boundary.js --break=<name>   (see BREAKS)
*/
"use strict";
const fs = require("fs"), path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "SMP-Project-Folder/src");
const MODULES = path.join(ROOT, "smp-app/modules");
const MODULE_NAMES = ["tracker", "notes", "insights"];

/* THE BREAKS (constitution XVI): each must turn this file red before its
   green run is believed (§94.5). Never set on a deployment — this is a
   check, so they live on the command line and nowhere else. */
const BREAK = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
const BREAKS = ["weak-token", "bare-line", "outline-none", "no-ring"];

let bad = 0, n = 0;
const fail = [];
function ck(what, ok, detail) {
  n++;
  if (ok) return;
  bad++; fail.push(what + (detail ? "  — " + detail : ""));
}
function say(s) { process.stdout.write(s + "\n"); }

/* ── the WCAG relative-luminance formula, written out once ───────────── */
function lum(hex) {
  const h = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const s = c.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}
function ratio(a, b) {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* Comments are masked rather than removed, so every offset a rule reports
   still points at the real file when a failure has to be found by hand. */
function mask(t) { return t.replace(/\/\*[\s\S]*?\*\//g, (m) => " ".repeat(m.length)); }
function rules(text) {
  const out = [], re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(mask(text)))) {
    out.push({ sel: m[1].replace(/\s+/g, " ").trim(), body: text.slice(m.index + m[1].length + 1, re.lastIndex - 1) });
  }
  return out;
}

const cssFiles = fs.readdirSync(SRC).filter((f) => f.endsWith(".css"));
const css = cssFiles.map((f) => ({ f, t: fs.readFileSync(path.join(SRC, f), "utf8") }));
const mods = MODULE_NAMES.map((m) => ({ m, t: fs.readFileSync(path.join(MODULES, m, "page.ts"), "utf8") }));

/* ══ 1. THE TOKEN CLEARS 3:1 ON EVERY GROUND, IN EVERY PALETTE ══════════
   Not "on white". A field in a table sits on the zebra stripe as often as
   on the surface, and the stripe is the worst reading of the six — so a
   token chosen against white alone passes this line and fails the page. */
say("1. --line-ctl against every ground a control sits on");
const GROUNDS = ["--surface", "--ground", "--surface-2", "--zebra", "--over-bg"];
function palettes(text, label) {
  /* A palette is a block that declares --line-ctl; the grounds are read out
     of that same block, so light is never measured against dark. */
  const out = [];
  for (const r of rules(text)) {
    let ctl = /--line-ctl\s*:\s*(#[0-9A-Fa-f]{6})/.exec(r.body);
    if (!ctl) continue;
    const grounds = {};
    for (const g of GROUNDS) {
      const m = new RegExp(g + "\\s*:\\s*(#[0-9A-Fa-f]{3,6})").exec(r.body);
      if (m) grounds[g] = m[1].length === 4
        ? "#" + m[1].slice(1).split("").map((c) => c + c).join("") : m[1];
    }
    out.push({ label: label + " " + r.sel.slice(0, 46), ctl: ctl[1], grounds });
  }
  return out;
}
let pals = [];
for (const c of css) pals = pals.concat(palettes(c.t, c.f));
for (const m of mods) pals = pals.concat(palettes(m.t, m.m));
ck("at least six palettes declare it", pals.length >= 6, pals.length + " found");
for (const p of pals) {
  let ctl = p.ctl;
  /* The break puts the REPORTED fault back — the hairline colour this
     palette actually shipped — chosen by the palette's own ground and
     never by the token's luminance, or half the blocks are handed a
     dark line on a light page and pass for the wrong reason (§113.8). */
  if (BREAK === "weak-token")
    ctl = lum(p.grounds["--surface"] || "#FFFFFF") > 0.5 ? "#D6DCE5" : "#333A45";
  const got = Object.entries(p.grounds).map(([g, v]) => [g, ratio(ctl, v)]);
  const worst = got.reduce((a, b) => (b[1] < a[1] ? b : a));
  ck(p.label, worst[1] >= 3,
    "worst " + worst[1].toFixed(2) + ":1 on " + worst[0] + " (" + ctl + ")");
  say("   " + p.label.padEnd(30) + ctl + "  worst " + worst[1].toFixed(2) +
      " on " + worst[0]);
}

/* ══ 2. NOTHING ELSE MOVED ═════════════════════════════════════════════
   `--line` is still what 250-odd separators are drawn in. A build that had
   "fixed" this by darkening --line would satisfy §1 and §3 perfectly and
   restyle every table in the product, so the control case is asserted
   BESIDE the case that must not change (§94.2). */
say("\n2. --line itself is untouched");
for (const want of ["#D6DCE5", "#333A45"]) {
  const found = css.some((c) => c.t.includes("--line:" + want));
  ck("--line still " + want, found);
}
const sepCount = css.reduce((a, c) => a + rules(c.t)
  .filter((r) => /border[a-z-]*\s*:[^;]*var\(--line\)/.test(r.body)).length, 0);
ck("separators still take --line", sepCount > 100, sepCount + " rules");
say("   " + sepCount + " separator rules still draw in --line — unchanged");

/* ══ 3. NO FORM ELEMENT TAKES A BARE --line BORDER ═════════════════════
   The classes are DERIVED from the sources rather than listed, so this
   covers the next field rather than today's twenty-one. */
say("\n3. every field takes a control boundary");
const fieldClasses = new Set();
for (const f of fs.readdirSync(SRC)) {
  if (!/\.(js|html)$/.test(f)) continue;
  const t = fs.readFileSync(path.join(SRC, f), "utf8");
  const re = /<(input|select|textarea)[^>]*?class=\\?["']([^"'\\]+)/g;
  let m;
  while ((m = re.exec(t))) m[2].split(/\s+/).forEach((c) => c && fieldClasses.add(c));
}
ck("found the field classes", fieldClasses.size > 20, fieldClasses.size + " classes");

/* The one exception, NAMED and PRINTED rather than filtered in silence. */
const EXEMPT = [".fld.off"];
function isField(sel) {
  if (/\b(input|select|textarea)\b/.test(sel)) return true;
  return [...fieldClasses].some((c) =>
    new RegExp("\\." + c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\w-])").test(sel));
}
const bare = [];
for (const c of css) {
  for (const r of rules(c.t)) {
    for (let sel of r.sel.split(",")) {
      sel = sel.replace(/\s+/g, " ").trim();
      if (!sel || sel.startsWith("@") || EXEMPT.includes(sel)) continue;
      if (!isField(sel)) continue;
      let body = r.body;
      if (BREAK === "bare-line" && sel === ".fld") body = body.replace("var(--line-ctl)", "var(--line)");
      if (/border[a-z-]*\s*:[^;]*var\(--line\)(?!-)/.test(body)) bare.push(c.f + "  " + sel);
    }
  }
}
ck("no field draws its boundary in --line", bare.length === 0, bare.join(" · "));
say("   " + EXEMPT.join(", ") + " — exempt, and printed: a disabled control keeps the faint line");
if (bare.length) bare.forEach((b) => say("   BARE: " + b));

/* ══ 4. THE MODULES' FOCUS RING ════════════════════════════════════════ */
say("\n4. the focus ring in the three newest modules");
for (const { m, t } of mods) {
  let text = t;
  if (BREAK === "outline-none" && m === "tracker")
    text = text.replace("button:focus-visible{background:var(--ground)}",
                        "button:focus-visible{background:var(--ground);outline:none}");
  if (BREAK === "no-ring" && m === "notes")
    text = text.replace(":focus-visible{outline:2px solid var(--focus);outline-offset:2px}", "");
  const killed = rules(text).filter((r) =>
    r.sel.includes(":focus-visible") && /outline\s*:\s*none/.test(r.body));
  ck(m + ": no :focus-visible rule removes the outline", killed.length === 0,
    killed.map((k) => k.sel).join(" · "));
  /* AND THE RING IS DECLARED — or "nothing removes it" is true of a module
     that never had one (§113.8: both ends, or the absence passes for the
     wrong reason). */
  ck(m + ": declares the ring",
    /(^|\n):focus-visible\{outline:2px solid var\(--focus\)/.test(text));
  ck(m + ": the bar's ring takes the bar's own ink",
    /\.bar :focus-visible\{outline-color:#EAF0FA\}/.test(text));
  say("   " + m.padEnd(9) + (killed.length ? killed.length + " rules still remove it" : "ring declared, nothing removes it"));
}

/* ══ verdict ═══════════════════════════════════════════════════════════
   The tail is the verdict, and it exits non-zero (§298.3, §328.8). */
say("");
if (BREAK && !BREAKS.includes(BREAK)) {
  say("unknown --break=" + BREAK + " (one of: " + BREAKS.join(", ") + ")");
  process.exit(2);
}
say("MEASURED FROM THE STYLESHEETS, NOT FROM A RENDERED PAGE: no Playwright");
say("in either runtime here. For a flat border on a known ground the two");
say("agree; a ring drawn over a gradient or a pseudo-element would not be");
say("seen by this file at all (§53.7's own blind spot).");
say("");
if (bad) {
  fail.forEach((f) => say("  FAIL  " + f));
  say(n - bad + " passed, " + bad + " FAILED");
  process.exit(1);
}
say(n + " passed, 0 failed");
