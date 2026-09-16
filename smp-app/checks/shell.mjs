/* The frozen shell on the new stack, driven in a real browser (spec 043
   Phase B, phases.md §1). Starts the BUILT app on its own port against the
   dev tenant (remade), then asserts what Phase B decided:
     · the served document carries NO inline script and a `script-src 'self'`
       policy — §238's net without a hash — proved by injecting an inline
       handler and watching it NOT run;
     · the shell boots on the page its ADDRESS names (unit · tab · section,
       a function, the group, a Setup page), the place becomes the address as
       the person navigates, Back returns, and a refresh stays put (§173);
     · a change made in the shell reaches the server through the frozen
       client and the frozen spelling of the address (/api/state);
     · the shell's own welcome overlay is offered at the module's home and
       not over a page the address named (§357.9)
       (§357: Strategy's welcome is the welcome) and the chrome says who is
       signed in;
     · Forefront's own pages: the cards, the consultants, the table, a
       client's configuration, a client created from the cards and opened —
       and a client's own person refused the outer platform.
   Prints one line per property (§215) and ends RED/GREEN.

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/shell.mjs
     … --break=no-route   (RED: the address no longer names the page)
     … --break=open-csp   (RED: the injected handler runs)

   Needs `npm run build` first and the chromium this image carries. */
import { spawn } from "node:child_process";
import { SCHEMA } from "../db/schema-name.mjs";   /* the shared schema is not `public` (§317.4) */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";
import pg from "pg";
import { devTenant, DEV_PASSWORD } from "../scripts/dev-tenant.mjs";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const CHROME = process.env.SMP_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = 3980, BASE = "http://localhost:" + PORT;
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));

/* THE WORKER IS A BUILD ARTEFACT, so its two falsifications are edits to the
   bytes the browser is actually served, written before `next start` reads
   them and put back on the way out however this process ends (§94.2 — the
   good path is asserted in the same run, so a build that lost the file
   entirely cannot pass). */
const SWFILE = join(import.meta.dirname, "..", "public", "sw.js");
const SWWAS = readFileSync(SWFILE, "utf8");
process.on("exit", () => { try { writeFileSync(SWFILE, SWWAS); } catch {} });
if (brk === "keep-caches") writeFileSync(SWFILE, SWWAS.replace(/caches\.keys\(\)[\s\S]*?\.then\(\(ks\) => Promise\.all\(ks\.map\(\(k\) => caches\.delete\(k\)\)\)\)/, "Promise.resolve()"));
if (brk === "serve-from-disk") writeFileSync(SWFILE, SWWAS + '\nself.addEventListener("fetch", (e) => { if (e.request.method === "GET") e.respondWith(caches.open("smp-shell-again").then((c) => fetch(e.request).then((r) => { if (r.ok && r.type === "basic") c.put(e.request, r.clone()); return r; }))); });\n');

const { tenantId } = await devTenant({ url: URL_, log: () => {} });
const owner = new pg.Pool({ connectionString: URL_, max: 2, options: "-c search_path=" + SCHEMA });
const server = spawn("npx", ["next", "start", "-p", String(PORT)], { cwd: join(import.meta.dirname, ".."), env: { ...process.env, DATABASE_URL_UNPOOLED: URL_, SMP_BREAK: brk }, stdio: ["ignore", "pipe", "pipe"], detached: true });
server.stdout.on("data", () => {}); server.stderr.on("data", (d) => process.stderr.write(d));
let up = false;
for (let i = 0; i < 60 && !up; i++) { await new Promise((r) => setTimeout(r, 500)); try { up = (await fetch(BASE + "/")).status === 200; } catch {} }
if (!up) { console.log("FAIL  the app did not start"); try { process.kill(-server.pid); } catch {} process.exit(1); }

const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
let ctx, page, errs = [];
/* THE WELCOME IS OFFERED AGAIN ON EVERY DEEP ADDRESS (§357), once a
   browser session, and it covers the viewport — so a context that presses a
   control under it waits thirty seconds on a click the overlay takes
   (§167.2's finding, the reason the Next landing once stood it down). Every
   context is born having seen it, through welcome.js's own memory, except
   the one whose subject IS the offer (§2), which asks for it. */
async function fresh(offerWelcome = false) {
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  if (!offerWelcome) await ctx.addInitScript(() => { try { sessionStorage.setItem("smp.welcome.done", "1"); } catch (e) {} });
  page = await ctx.newPage(); errs = [];
  page.on("pageerror", (e) => errs.push("PAGEERROR " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 160)); });
}
const signIn = async (email, pw = DEV_PASSWORD) => {
  await page.goto(BASE + "/raya-trade/sign-in", { waitUntil: "networkidle" });
  await page.waitForSelector(".gate[data-hydrated]", { state: "attached", timeout: 15000 });
  await page.fill("#user", email); await page.fill("#password", pw);
  await page.click("#loginForm button[type=submit]");
  await page.waitForURL((u) => !/sign-in/.test(u.pathname), { timeout: 15000 }).catch(() => {});
};
const booted = async () => { await page.waitForFunction(() => !document.documentElement.classList.contains("booting"), null, { timeout: 20000 }); await page.waitForTimeout(500); };
const open = async (path) => { await page.goto(BASE + path, { waitUntil: "networkidle" }); await booted(); };
const place = () => page.evaluate(() => [current, currentSub, (currentSub && CURSEC[currentSub]) || null]);
const path = () => new URL(page.url()).pathname;
async function section(name, fn) {
  console.log("── " + name);
  try { await fn(); } catch (e) { fail(name + " — the section died rather than reporting (§215)", (e && e.message ? e.message.split("\n")[0] : e) + " @ " + (page ? page.url() : "")); }
  finally { try { if (ctx) await ctx.close(); } catch {} ctx = null; page = null; }
}

await section("1 · the document and its policy", async () => {
  await fresh(); await signIn("office@forefront.example");
  const r = await fetch(BASE + "/raya-trade/strategy/mobile/strategy", { headers: { cookie: (await ctx.cookies()).map((c) => c.name + "=" + c.value).join("; ") } });
  const html = await r.text(), csp = r.headers.get("content-security-policy") || "";
  check(r.status === 200 && /<script src="\/shell\.js"><\/script>/.test(html) && /<script src="\/theme\.js"><\/script>/.test(html), "the shell is served as its own document with the product's scripts as FILES", r.status);
  check(!/<script>/.test(html) && !/ on[a-z]+=/i.test(html.replace(/<!--[\s\S]*?-->/g, "")), "…and no inline script or handler anywhere in it");
  check(/script-src 'self';/.test(csp) && !/unsafe-inline'[^;]*;\s*style/.test(csp.split("script-src")[1] || "x"), "the policy is script-src 'self' — no hash, no unsafe-inline (§238's net, tighter)", csp.slice(0, 80));
  check(/<link rel="stylesheet" href="\/platform\.css">/.test(html) && /<title>Raya Trade — Strategy Management Platform<\/title>/.test(html), "the product's stylesheet is linked and the title is the tenant's");
  await open("/raya-trade/strategy/mobile/strategy");
  const pwned = await page.evaluate(async () => { window.__pwned = 0; const d = document.createElement("div"); d.innerHTML = '<img src="x" onerror="window.__pwned=1">'; document.body.appendChild(d); await new Promise((r) => setTimeout(r, 400)); return window.__pwned; });
  check(pwned === 0, "an injected inline handler does NOT run (§235's hole, closed by the policy)", pwned);
});

await section("2 · the address names the page, and the page names the address", async () => {
  await fresh(true); await signIn("mobhead@raya.example");
  /* REWRITTEN TWICE, NEVER LOOSENED (§218, §214.3). §315 stood the shell's
     own welcome down because the Next landing was the welcome; §357 removed
     that landing and this asserted the overlay on a DEEP address; §357.9
     then stood it down there, on Islam's report that pressing Continue over
     the client's Setup rail read as the press having opened the settings.
     So what is asserted is the decision that survived both: the welcome is
     the MODULE'S HOME SCREEN — offered where the address names no page, and
     never over one it does. Both ends in one session, or a build that lost
     the overlay altogether passes the half that matters here (§113.8). */
  await open("/raya-trade/strategy");
  check(await page.evaluate(() => !!document.querySelector(".welcomeover")), "the shell's own welcome overlay is offered at the module's home — Strategy's welcome is the welcome (§357, §357.9)");
  await page.evaluate(() => { const b = document.querySelector(".welcomeover .wexit"); if (b) b.click(); });
  await page.waitForFunction(() => !document.querySelector(".welcomeover")).catch(() => {});
  check(await page.evaluate(() => !document.querySelector(".welcomeover")), "…and its own way out takes it down");
  await open("/raya-trade/strategy/mobile/strategy");
  let p = await place();
  check(p[0] === "mobile" && p[1] === "strategy", "/raya-trade/strategy/mobile/strategy opens Mobile's Strategy", JSON.stringify(p));
  check(/^\/raya-trade\/strategy\/mobile\/strategy\/[a-z]+$/.test(path()), "…and the address gains the section the shell opened (the place is the address)", path());
  check(await page.evaluate(() => !document.querySelector(".welcomeover") && document.documentElement.getAttribute("data-deep-address") === "1"), "…and no welcome over a page the address NAMED (§357.9), so the rest of this section measures the page itself (§167.2)");
  check((await page.locator(".viewer-note b").textContent().catch(() => "")) === "Ashraf Laithy", "the chrome says who is signed in (a client's person has no switcher)");
  await open("/raya-trade/strategy/mobile/strategy/plan"); p = await place();
  check(p[2] === "plan", "…/plan opens the Plan section", JSON.stringify(p));
  await open("/raya-trade/strategy/mobile/performance"); p = await place();
  check(p[1] === "performance", "…/performance opens Performance", JSON.stringify(p));
  await page.click('#subtabs button[data-s="strategy"]'); await page.waitForTimeout(400);
  check(/^\/raya-trade\/strategy\/mobile\/strategy/.test(path()), "pressing a tab writes the address", path());
  await page.reload({ waitUntil: "networkidle" }); await booted(); p = await place();
  check(p[0] === "mobile" && p[1] === "strategy", "a refresh stays where you are (§173, by address)", JSON.stringify(p));
  /* AND THE SECOND DOOR NEEDS SOMEBODY WHO HOLDS TWO. A unit head reaches
     one destination, so pressing another unit and walking Back are asserted
     as the office — the person who has more than one place to be (§94.6). */
  await fresh(); await signIn("office@forefront.example");
  await open("/raya-trade/strategy/mobile/strategy");
  await page.click('#units button[data-u="retailstores"]'); await page.waitForTimeout(400);
  check(/^\/raya-trade\/strategy\/retailstores\//.test(path()), "pressing a unit writes the address", path());
  await page.goBack(); await page.waitForTimeout(600); p = await place();
  check(p[0] === "mobile" && /^\/raya-trade\/strategy\/mobile\//.test(path()), "Back returns to the place before it", JSON.stringify(p) + " " + path());
  check(errs.filter((e) => /PAGEERROR/.test(e)).length === 0, "no page error on the way", errs.join(" | "));
});

/* THE MODULE IN THE ADDRESS (spec 046 §7). Both ends every time (§94.2): the
   word is there where it belongs AND absent on the spine, or a build that
   prefixed everything — Setup included — passes half of this. */
await section("2b · the module leads the address, and the spine carries none", async () => {
  await fresh(); await signIn("office@forefront.example");
  const cook = (await ctx.cookies()).map((c) => c.name + "=" + c.value).join("; ");
  const hit = (path) => fetch(BASE + path, { headers: { cookie: cook }, redirect: "manual" });

  /* the shape a link made before today has */
  let r = await hit("/raya-trade/mobile/strategy/plan");
  check(r.status === 302 && (r.headers.get("location") || "").endsWith("/raya-trade/strategy/mobile/strategy/plan"),
    "an address with no module 302s to the default one, whole (spec 046 §7)", r.status + " " + r.headers.get("location"));
  r = await hit("/raya-trade/fn/finance/strategy");
  check(r.status === 302 && (r.headers.get("location") || "").endsWith("/raya-trade/strategy/fn/finance/strategy"),
    "…a function's too, its own two segments intact", r.status + " " + r.headers.get("location"));

  /* …and the spine is served where it stands rather than being pushed under
     a module it does not belong to — the CLIENT'S Setup, the pages that
     belong to no module (spec 054 §4.1) — while a module's own Setup is
     served under its word (spec 054 §4.2), both as the same document */
  r = await hit("/raya-trade/setup/people");
  check(r.status === 200, "the client's Setup is NOT redirected — it is the client's page, in no module", r.status + " " + (r.headers.get("location") || ""));
  r = await hit("/raya-trade/strategy/setup/cycle");
  check(r.status === 200 && /data-module='strategy'/.test(await r.text()), "…and Strategy's own Setup is served under its word, as the shell (§356.2)", r.status + " " + (r.headers.get("location") || ""));
  r = await hit("/raya-trade/tour");
  check(r.status === 200, "…nor is the intro round, which the landing offers", r.status + " " + (r.headers.get("location") || ""));

  /* THE ORDER, which is the reason the redirect is here and not in the
     browser: signed out, an old address is answered by the DOOR and never by
     the module — a redirect that ran first would tell a stranger which
     addresses this client has. */
  const anon = await fetch(BASE + "/raya-trade/mobile/strategy", { redirect: "manual" });
  check(anon.status === 302 && /\/raya-trade\/sign-in$/.test(anon.headers.get("location") || ""),
    "…and signed out, an old address goes to the door rather than through the redirect", anon.status + " " + anon.headers.get("location"));

  r = await hit("/raya-trade/strategy/mobile/strategy");
  const html = await r.text();
  check(r.status === 200 && /<html[^>]* data-module='strategy'/.test(html),
    "the document is stamped with its module, so the browser keeps no second list (§53.5)", r.status + " " + (html.match(/<html[^>]*>/) || [""])[0]);

  /* the browser half: an old address opens the page it named, at the new one */
  await open("/raya-trade/mobile/strategy/plan");
  let pl = await place();
  check(pl[0] === "mobile" && pl[1] === "strategy" && pl[2] === "plan" && path() === "/raya-trade/strategy/mobile/strategy/plan",
    "…and opening an old address lands on the page it names, at the address the product now writes", JSON.stringify(pl) + " " + path());

  /* a module with no target opens where the person works (§94.6) */
  await open("/raya-trade/strategy");
  pl = await place();
  check(!!pl[0] && /^\/raya-trade\/strategy\//.test(path()), "the module alone opens where the person works, and says so in the address", JSON.stringify(pl) + " " + path());

  /* the address the SHELL writes, on both sides of the spine line: the
     client's rail writes the spine form and Strategy's rail writes the
     module form (spec 054 §4.2), and the walk between them is the scope
     moving with the page (checks/setup-per-module.py owns the rest) */
  await open("/raya-trade/setup/people");
  await page.click('.setuprail [data-setupgo="mainbu"]').catch(() => {});
  await page.waitForTimeout(400);
  check(/^\/raya-trade\/setup\/mainbu$/.test(path()), "pressing inside the client's Setup writes an address with no module in it", path());
  await open("/raya-trade/strategy/setup/cycle");
  await page.click('.setuprail [data-setupgo="access"]').catch(() => {});
  await page.waitForTimeout(400);
  check(/^\/raya-trade\/strategy\/setup\/access$/.test(path()), "…pressing inside Strategy's Setup writes the module's own form", path());
  await page.evaluate(() => { current = "mobile"; currentSub = "strategy"; paint(); });
  await page.waitForTimeout(400);
  check(/^\/raya-trade\/strategy\/mobile\//.test(path()), "…and walking from Setup to a unit writes the module back", path());
  check(errs.filter((e) => /PAGEERROR/.test(e)).length === 0, "no page error on the way", errs.join(" | "));
});

await section("3 · the office's addresses, and a change that reaches the server", async () => {
  await fresh(); await signIn("office@forefront.example");
  await open("/raya-trade/strategy/fn/finance/strategy"); let p = await place();
  check(p[0] === "fn:finance" && p[1] === "fnstrat", "/strategy/fn/finance/strategy opens Finance's Strategy", JSON.stringify(p));
  await open("/raya-trade/strategy/group/performance"); p = await place();
  check(p[0] === "group" && p[1] === "performance", "/strategy/group/performance opens the group", JSON.stringify(p));
  await open("/raya-trade/setup/people"); p = await place();
  check(p[0] === "setup" && p[1] === "people" && (await page.locator("#panel").textContent()).includes("People register"), "/setup/people opens the register", JSON.stringify(p));
  /* REWRITTEN, NEVER LOOSENED (§218, §214.3 for the eighth time). This
     asserted the control reads "Raya Trade" — measured HERE, on
     `/setup/people`, which §359 made the client's own settings, where it
     deliberately reads *Save & close* instead (the client is named in the
     heading there, so naming it on the control too would be the second copy
     §120 took off the register's own header). What the line is ABOUT is that
     the office has a way back and that it says something — asserted at BOTH
     ENDS, because a build that stopped naming the client anywhere satisfies
     half of it (§94.2). */
  const back = async () => await page.evaluate(() => {
    const b = document.getElementById("clientback");
    return { shown: !b.hidden, word: document.getElementById("clientbackname").textContent };
  });
  let bk = await back();
  check(bk.shown && bk.word === "Save & close", "the client's own settings say what the way back DOES", JSON.stringify(bk));
  await open("/raya-trade/strategy/group/performance"); bk = await back();
  check(bk.shown && bk.word === "Raya Trade", "…and a module's page names the client it goes back from", JSON.stringify(bk));
  await open("/raya-trade/setup/people");
  const word = "shell " + Date.now();
  await page.evaluate((w) => { REVIEW.note.mobile = w; paint(); }, word);
  await page.waitForTimeout(1500);
  const stored = (await owner.query("SELECT notes->>'mobile' AS n FROM review WHERE tenant_id = $1", [tenantId])).rows[0];
  check(stored && stored.n === word, "a change made in the shell reaches the database through the frozen client (sync.js, /api/state)", JSON.stringify(stored));
  const logged = (await owner.query("SELECT person_key, email FROM change_log WHERE tenant_id = $1 ORDER BY id DESC LIMIT 1", [tenantId])).rows[0];
  check(logged && logged.person_key === "smo" && logged.email === "office@forefront.example", "…and is recorded as the signer", JSON.stringify(logged));
  check(errs.filter((e) => /PAGEERROR/.test(e)).length === 0, "no page error on the way", errs.join(" | "));
});

await section("3b \u00b7 the client's own settings wear the client's bar (\u00a7359, spec 056)", async () => {
  await fresh(); await signIn("office@forefront.example");
  /* THE SCOPE IS THE SERVER'S ANSWER, READ OFF THE RAW HTML. The browser
     writes the same attribute from the address on arrival (shell/route.js
     placeOf), so a DOM probe passes on a build where nothing is stamped at
     all \u2014 and the whole reason it is stamped is that it must be there before
     the module switcher is built, which happens at load, ABOVE placeOf. */
  /* THE SECOND MODULE IS MADE, or the switcher's absence is asserted over a
     client that could never have one: the switcher is drawn only where there
     is a CHOICE (\u00a732, shell/route.js since \u00a7359.1), so on the dev tenant's
     single module the line below went green on a build that drew it
     everywhere (\u00a7113.8 \u2014 it did, until this was added). It is what makes
     the way across measurable too: two modules mean two rows at the foot of
     the client's rail, so a build that hardcoded one module's name goes red.
     Put back in the `finally`, because every section after this one reads
     the same tenant (\u00a794.2). */
  await owner.query("update tenants set modules = $1 where id = $2", [JSON.stringify(["strategy", "insights"]), tenantId]);
  try {
  const ck = (await ctx.cookies()).map((c) => c.name + "=" + c.value).join("; ");
  const raw = async (u) => await (await fetch(BASE + u, { headers: { cookie: ck } })).text();
  const cl = await raw("/raya-trade/setup/people"), md = await raw("/raya-trade/strategy/setup/cycle");
  check(/<html[^>]* data-setup-scope='client'/.test(cl), "the client's own Setup document is stamped `client` by the SERVER", (cl.slice(0, 200).match(/data-setup-scope='[^']*'/) || ["\u2014"])[0]);
  check(/<html[^>]* data-setup-scope='strategy'/.test(md), "\u2026and a module's own Setup is stamped with the module \u2014 the control (\u00a7113.8)", (md.slice(0, 200).match(/data-setup-scope='[^']*'/) || ["\u2014"])[0]);

  /* WHAT THE BAR DRAWS, MEASURED AS PAINT AND AS A HIT TEST, never as a
     class (\u00a794.8): a row hidden by opacity renders identically to one that
     is gone and still takes the keyboard (\u00a73.2). */
  const bar = () => page.evaluate(() => {
    const seen = (el) => !!(el && el.checkVisibility && el.checkVisibility());
    const nav = document.querySelector("nav.units");
    return {
      scope: document.documentElement.getAttribute("data-setup-scope") || "",
      row: seen(nav),
      dests: Array.from(document.querySelectorAll("#units [data-u], #units [data-fold], #units [data-setup], #units .homebtn")).filter(seen).length,
      viewer: seen(document.querySelector(".viewer")),
      switcher: !!document.querySelector(".top-in .topmark"),
      h1: (document.querySelector(".brand h1") || {}).textContent || "",
      sub: (() => { const o = document.getElementById("orgname"); return seen(o) ? o.textContent : ""; })(),
      mark: seen(document.getElementById("clientlogo")),
    };
  });
  await open("/raya-trade/setup/people");
  let b = await bar();
  check(b.scope === "client" && b.row === false && b.dests === 0, "the module's navigation is not drawn over the client's own pages", JSON.stringify(b));
  check(b.viewer === false, "\u2026nor the viewer strip \u2014 looking as somebody is a question about a module's pages", JSON.stringify(b));
  check(b.switcher === false, "\u2026nor the module switcher, which is built at load and cannot be repainted away", JSON.stringify(b));
  /* REWRITTEN, NEVER LOOSENED (\u00a7218, \u00a7214.3). This asked whether the
     attribute was PRESENT, which said "this client holds more than one" only
     while the attribute carried the switcher's rule in its name \u2014 \u00a7359.1
     stamps it for every client, so presence would now be true of a client
     with one and the absence above would pass for the wrong reason
     (\u00a7113.8). It asks the CONTENT, which is what it was always for. */
  const clMods = JSON.parse(((cl.match(/data-modules='([^']*)'/) || [])[1] || "[]").replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
  check(clMods.length >= 2, "\u2026and this client HAS a second module, so that absence is a decision (\u00a7113.8)", JSON.stringify(clMods));
  check(b.h1 === "Raya Trade" && /Client settings/.test(b.sub), "the heading names the client and what you are looking at", b.h1 + " / " + b.sub);

  /* BOTH ENDS (\u00a794.2). A build that deleted the row outright satisfies every
     assertion above, so the module's own Setup is measured in the same run \u2014
     and the heading is asserted PUT BACK, because this is the first thing in
     the platform to rewrite it and a one-way write leaves the client's name
     over Strategy's navigation for the rest of the session. */
  await open("/raya-trade/strategy/setup/cycle");
  b = await bar();
  check(b.scope === "strategy" && b.row === true && b.dests > 0, "a module's own Setup keeps its navigation", JSON.stringify(b));
  check(b.viewer === true, "\u2026and its viewer strip", JSON.stringify(b));
  check(b.switcher === true, "\u2026and the switcher, because there a module IS what you are in", JSON.stringify(b));
  check(b.h1 === "Strategy Management Platform", "\u2026and its document is headed by the product", b.h1);

  /* AND THE SPINE-FORM ADDRESS STILL ENDS AT THE MODULE'S SETUP, WEARING ITS
     BAR. This is the one case the ORDER of the scope resolution decides: the
     landing's doors write `/<client>/setup/<page>` for every page and let the
     shell resolve which rail the page belongs to (\u00a7356.2's research R2), so
     a chrome that asked the question before `paintUnits()` had settled the
     place drew the CLIENT's bar over Strategy's Reporting cycle \u2014 and
     landed on the client's first page while it was at it (\u00a7359.6). Asserted
     here as well as in setup-per-module, because from this file it is the
     bar that is wrong and that is what this section is about. */
  await open("/raya-trade/setup/cycle");
  b = await bar();
  check(path() === "/raya-trade/strategy/setup/cycle" && b.scope === "strategy" && b.row === true && b.h1 === "Strategy Management Platform",
        "\u2026and a spine-form address naming a MODULE's page ends there, wearing the module's bar", path() + " / " + JSON.stringify(b));

  /* AND BOTH HALVES OF THE TEST ARE LOAD-BEARING, which is the one thing no
     address can show: `data-setup-scope` is written on arrival and is NOT
     cleared by walking to a unit \u2014 it is what addressOf reads to keep
     writing the right Setup address \u2014 so a rule keyed on the scope ALONE
     hides the navigation on every unit page reached from here. */
  await open("/raya-trade/setup/people");
  await page.evaluate(() => { current = "mobile"; currentSub = "strategy"; paint(); });
  await page.waitForTimeout(400);
  b = await bar();
  check(b.scope === "client" && b.row === true && b.dests > 0, "walking from the client's settings to a unit brings the navigation back, with the scope still standing", JSON.stringify(b));
  /* AND THE HEADING AND THE MARK COME BACK WITH IT. Measured on the WALK and
     never on a second page load, which serves the product's name out of the
     static markup whatever paint() does \u2014 so a one-way write passes there
     perfectly (\u00a794.5: the first draft of this asserted it after an `open()`
     and could not fail). This is the only place a build that writes the
     client's name and never takes it off can be caught: it would stand over
     Strategy's navigation for the rest of the session. */
  check(b.h1 === "Strategy Management Platform" && b.sub === "" && b.mark === false,
        "\u2026and the product's own name is PUT BACK on the way, never left standing (\u00a794.2)", b.h1 + " / " + b.sub + " / mark " + b.mark);

  /* THE MARK IS MADE, because the demo seed carries none on purpose (\u00a7259.2:
     a client must never inherit Raya's), so every assertion about it would
     pass on a build that lost it (\u00a7255). Put back in the same run. */
  await open("/raya-trade/setup/people");
  check((await bar()).mark === false, "a client with no mark gets no empty box (\u00a715.1)");
  const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  await page.evaluate((src) => { GROUP.logo = src; paint(); }, PNG);
  await page.waitForTimeout(200);
  b = await bar();
  check(b.mark === true, "\u2026and one that has uploaded a mark wears it on its own bar", JSON.stringify(b));
  await page.evaluate(() => { delete GROUP.logo; paint(); });
  /* AND THE CLIENT'S OWN COLOUR STILL REACHES THE PAGE. The bar these pages
     wear is the product's own surface \u2014 `header.top` is
     `background:var(--surface)` on every page and always was, so the navy
     Islam photographed was the destination row this removes, not the header
     under it. What carries the tenant's brand here is the rail's head and the
     table headers, which take `--panel`, and that is asserted rather than
     assumed: measured as the PAINT and compared with the token, never named
     as a hex (\u00a7259's own rule \u2014 a tenant who rebrands must take it with
     them). */
  await open("/raya-trade/setup/people");
  const brand = await page.evaluate(() => {
    const px = (el) => el ? getComputedStyle(el).backgroundColor : "";
    const tok = getComputedStyle(document.documentElement).getPropertyValue("--panel").trim();
    const probe = document.createElement("div");
    probe.style.background = "var(--panel)"; document.body.appendChild(probe);
    const want = getComputedStyle(probe).backgroundColor; probe.remove();
    return { tok: tok, want: want, head: px(document.querySelector(".setuprail .rhead")),
             top: px(document.querySelector("header.top")) };
  });
  check(brand.head === brand.want && brand.want !== "", "the client's own colour still reaches the page \u2014 the rail's head is --panel", JSON.stringify(brand));
  check(brand.top !== brand.want, "\u2026and the bar above it is the product's surface, as every page's is", JSON.stringify(brand));

  /* ── THE WAY ACROSS RUNS BOTH WAYS (\u00a7359.1) ───────────────────────
     Islam, having opened the client's settings from the console's card:
     *"I ca't find the access page in the strategy module"*. Roles & access
     was exactly where it belongs \u2014 on Strategy's rail \u2014 and there was no
     door to it from the rail he was standing on: a module's rail could cross
     to the client's and the client's could only go back to the console.

     BOTH ENDS, OR HALF A BUILD PASSES (\u00a794.2): the rows on the client's
     rail AND the one row still on the module's. ONE PER MODULE, asserted as
     an AGREEMENT with `data-modules` rather than against the word "Strategy"
     (\u00a794.8) \u2014 and this tenant holds TWO for the length of this section, so
     a build that hardcoded one module's name goes red here and could not on
     the dev tenant's own single module (\u00a7113.8). AT THE FOOT, after the
     list, because it is a place to go ON to (\u00a7357.9) \u2014 and outside
     `.raillist`, which is the one thing that scrolls, or the door scrolls
     away (\u00a7290.1). */
  await open("/raya-trade/setup/people");
  const doors = await page.evaluate(() => {
    const list = document.querySelector(".setuprail .raillist");
    return Array.from(document.querySelectorAll(".setuprail .railback")).map((a) => ({
      text: a.textContent.trim(), href: a.getAttribute("href") || "",
      fwd: a.classList.contains("railfwd"),
      inList: !!(list && list.contains(a)),
      afterList: !!(list && (list.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING)),
      seen: !!(a.checkVisibility && a.checkVisibility()),
    }));
  });
  const across = doors.filter((d) => d.fwd);
  check(across.length === clMods.length && clMods.every((m) => across.some((d) => d.href === "/raya-trade/" + m.key + "/setup" && d.text === m.label + " settings \u203a")),
        "the client's rail carries one way across per module this person may open", JSON.stringify(across));
  check(across.length > 0 && across.every((d) => d.seen && !d.inList && d.afterList),
        "\u2026drawn, outside the scrolling list, and after it \u2014 a place to go ON to (\u00a7357.9, \u00a7290.1)", JSON.stringify(across));
  check(doors.some((d) => !d.fwd && /Back to the console/.test(d.text)),
        "\u2026and the way OUT is still above the list, where a back link belongs", JSON.stringify(doors.map((d) => d.text)));
  /* AND IT LANDS ON THE MODULE'S OWN SETUP, WEARING THE MODULE'S BAR \u2014
     pressed, never read: a door wired to nothing renders perfectly (\u00a796). */
  /* DEGRADES RATHER THAN DIES (\u00a7215): a click on a door that is not there
     waits thirty seconds and takes every assertion after it down, which on
     the one-way build reported the fault as a DEATH rather than as the two
     it is. */
  if (await page.locator(".setuprail .railfwd").count()) {
    await page.click(".setuprail .railfwd");
    await page.waitForURL(/\/raya-trade\/strategy\/setup/, { timeout: 8000 }).catch(() => {});
    await booted();
  }
  b = await bar();
  const reached = await page.evaluate(() => Array.from(document.querySelectorAll(".setuprail [data-setupgo]")).map((e) => e.dataset.setupgo));
  check(/^\/raya-trade\/strategy\/setup/.test(path()) && b.scope === "strategy" && b.row === true,
        "\u2026and pressing it lands on the module's Setup, wearing the module's bar", path() + " / " + JSON.stringify(b));
  check(reached.includes("access"), "\u2026which is the rail Roles & access is on \u2014 the page he could not reach (\u00a761)", reached.join(","));
  /* THE OTHER END. A build that moved the row rather than adding one would
     satisfy every assertion above. */
  const back = await page.evaluate(() => Array.from(document.querySelectorAll(".setuprail .railback")).map((a) => a.textContent.trim() + " -> " + (a.getAttribute("href") || "")));
  check(back.length === 1 && /Client settings/.test(back[0]) && /\/raya-trade\/setup$/.test(back[0]),
        "\u2026and a module's rail still carries its own one row the other way", JSON.stringify(back));

  await open("/raya-trade/setup/people");
  /* AND *Save & close* GOES WHERE IT SAYS. The handler is \u00a7313.23's and is
     untouched here; what is asserted is that the reworded control is still
     that control \u2014 a word changed on a button that no longer navigates is
     \u00a796's family, and renders perfectly. */
  await page.click("#clientback");
  await page.waitForURL(/\/platform$/, { timeout: 8000 }).catch(() => {});
  check(/^\/platform$/.test(path()), "Save & close goes back to the console", path());
  check(errs.filter((e) => /PAGEERROR/.test(e)).length === 0, "no page error on the way", errs.join(" | "));
  } finally { await owner.query("update tenants set modules = $1 where id = $2", [JSON.stringify(["strategy"]), tenantId]); }
});

await section("3c · Forefront team is the store, the register is a reader (spec 056 §3a)", async () => {
  /* THE HALF file:// CANNOT SEE. `checks/forefront-team.py` makes its two
     kinds in the browser and proves the marks, the menu and the count; what
     it cannot reach is a REAL consultant — the page is empty off the served
     platform by construction, and `officeRow` is the only thing that mints
     or adopts one (§94.11). So this asserts the seam: the team the console
     holds is what the page draws and what the register reads. */
  await fresh(); await signIn("office@forefront.example");
  await open("/raya-trade/setup/team");
  const team = await page.evaluate(() => {
    const h = document.querySelector("[data-cteam]");
    return { host: !!h,
             rows: Array.from(document.querySelectorAll("[data-cteam] .teamrow .nm")).map((e) => e.textContent.trim()),
             mails: Array.from(document.querySelectorAll("[data-cteam] .teamrow .em")).map((e) => e.textContent.trim()) };
  });
  check(team.host, "the page mounts the flow's own renderer", JSON.stringify(team).slice(0, 160));
  check(team.rows.length > 0, "\u2026and draws this client's actual team", JSON.stringify(team.rows));
  check(team.mails.some((m) => /@/.test(m)), "\u2026by name and address", JSON.stringify(team.mails));

  /* AND THE REGISTER READS FROM IT. One screen showing everybody who can
     touch this client (§3a) — asserted as an AGREEMENT with the team above
     rather than against a typed name (§94.8), and BOTH ENDS: the client's
     own people are still there and still editable, or a build that drew the
     consultants alone passes half (§94.2). */
  await open("/raya-trade/setup/people");
  const reg = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll(".peoplecfg tbody tr")).filter((r) => !r.classList.contains("newrow"));
    const nameOf = (r) => { const b = r.querySelector(".namecell b"); return b ? b.textContent.trim() : ""; };
    const ff = rows.filter((r) => r.querySelector(".ffrow, .ffmark"));
    const own = rows.filter((r) => !r.querySelector(".ffrow, .ffmark"));
    const split = document.querySelector(".psplit");
    return { ffNames: ff.map(nameOf), ownN: own.length,
             split: split ? split.textContent.trim() : null,
             ruleFF: (typeof SMPRules !== "undefined") && ff.every((r) => {
               const k = (r.querySelector("[data-pmenu]") || {}).dataset;
               const p = k && PEOPLE.filter((x) => x.key === k.pmenu)[0];
               return p && SMPRules.isForefrontRow(p); }) };
  });
  check(reg.ffNames.length > 0 && team.rows.every((n) => reg.ffNames.includes(n)),
        "every consultant on the team is on the register too", JSON.stringify(reg.ffNames) + " vs " + JSON.stringify(team.rows));
  check(reg.ruleFF === true, "\u2026and each is marked by the shared rule, not by a name (\u00a742)", String(reg.ruleFF));
  check(reg.ownN > 0, "\u2026beside the client's own people, who are still there (\u00a794.2)", String(reg.ownN));
  check(reg.split !== null && reg.split.includes("from Forefront") && reg.split.startsWith(String(reg.ownN)),
        "\u2026and the count says both, agreeing with what is drawn (\u00a794.8)", String(reg.split) + " / own " + reg.ownN);
  check(errs.filter((e) => /PAGEERROR/.test(e)).length === 0, "no page error on either page", errs.join(" | "));
});

await section("4 · Forefront's own pages", async () => {
  await fresh(); await signIn("office@forefront.example");
  await page.goto(BASE + "/platform", { waitUntil: "networkidle" }); await page.waitForSelector("body.ready", { timeout: 15000 });
  check((await page.locator("#who").textContent()) === "Mohamed Essam · Super user", "the platform's chrome names the admin");
  /* REWRITTEN, NOT LOOSENED (§218, §214.3): this held the literal
     "Clients|Consultants|Who sees what" and spec 045 added a fourth page, so
     a deliberate decision read as a regression. What it is FOR is that an
     admin gets Forefront's own pages and that the gated one is among them —
     asserted as the set, with the gated page named, so a build that dropped
     `Who sees what` still fails and a page added next month does not. */
  const ffTabs = await page.locator("#nav button, #nav a").allTextContents();
  check(ffTabs.includes("Clients") && ffTabs.includes("Consultants") && ffTabs.includes("Who sees what"),
    "Forefront's own pages, the gated one among them for an admin", ffTabs.join("|"));
  check(ffTabs.includes("Memory"), "…and the consulting memory, which every consultant reaches (spec 045)", ffTabs.join("|"));
  check((await page.locator("#page").textContent()).includes("Raya Trade") && (await page.locator("#page").textContent()).includes("Add a client"), "the cards: Raya Trade, and Add a client");
  const post = (body) => page.evaluate(async (b) => (await (await fetch("/api/platform", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) })).json()), body);
  let j = await post({ action: "consultants" });
  check(j.ok && j.people.some((x) => x.email === "office@forefront.example" && x.seats.some((s) => s.key === "raya-trade" && s.seat === "super")), "the consultants list carries the seats", JSON.stringify(j).slice(0, 160));
  j = await post({ action: "access" }); check(j.ok && j.canEdit === true && j.areas.length === 4, "the table is the admin's", JSON.stringify(j).slice(0, 120));
  j = await post({ action: "createClient", name: "RHI", industry: "Manufacturing" }); check(j.ok && j.key === "rhi", "a client is created from the cards", JSON.stringify(j));
  /* REWRITTEN, NOT LOOSENED (§218) FOR §339: this asked for an EMPTY register,
     which was right while a made client started with nobody on it and its
     creator was on its team only BY RULE — the absence §338 had to heal. The
     creator is written now, so what the line is FOR — that nobody is invented
     beside them — is what is asserted: exactly one row, and it is theirs. */
  j = await post({ action: "client", key: "rhi" });
  check(j.ok && j.client.made_here === true && j.register.length === 1 && j.register[0].ff === "true" && j.register[0].role === "super"
    && j.team.length === 1 && j.team[0].seat === "super",
    "…made here, holding its creator and nobody invented beside them (§339)", JSON.stringify({ register: j.register, team: j.team }));
  j = await post({ action: "setTeam", key: "rhi", email: "office@forefront.example", seat: "smoteam" }); check(j.ok, "…the admin joins its team", JSON.stringify(j));
  j = await post({ action: "client", key: "rhi" });
  check(j.team.length === 1 && j.team[0].seat === "smoteam" && j.register.length === 1 && j.register[0].role === "smoteam" && j.register[0].ff === "true", "…and the team IS the register on a client made here (§313.31)", JSON.stringify(j.register));
  await open("/rhi/mobile/strategy");
  /* REWRITTEN, NOT LOOSENED (§218, §214.3): this asked for TEN units, which is
     §67's cleared graph — Raya's own names with their content emptied — and
     `createClient` stopped handing that out when the set-up flow landed: it
     calls `frozen.bare()`, which clears and THEN empties the shapes, because
     a client born holding somebody else's ten unit names had nothing to set
     up (its own comment quotes Islam on it). So the check was asserting ten
     against the change that removed them, and read `RHI,0,1`.
     WHAT IT IS FOR IS THAT A NEW CLIENT OPENS AS ITSELF, and that is what is
     asserted: its own name, its own single person, and no shapes at all.
     The name and the register are the control beside the three absences
     (§113.8) — a build serving no graph, or the wrong client's, fails them
     before the counts are ever read. */
  check(await page.evaluate(() => GROUP.org === "RHI" && UNIT_KEYS.length === 0 && FUNCTION_KEYS.length === 0 && (GROUP.capabilities || []).length === 0 && PEOPLE.length === 1), "the new client opens as itself: its own name, one person, and no shapes to inherit", await page.evaluate(() => [GROUP.org, UNIT_KEYS.length, FUNCTION_KEYS.length, (GROUP.capabilities || []).length, PEOPLE.length].join(",")));
  await ctx.close(); await fresh(); await signIn("mobhead@raya.example");
  j = await post({ action: "cards" }); check(j.ok === false && !j.cards, "a client's own person is refused the outer platform (403)", JSON.stringify(j));
  const r = await fetch(BASE + "/rhi/mobile/strategy", { headers: { cookie: (await ctx.cookies()).map((c) => c.name + "=" + c.value).join("; ") }, redirect: "manual" });
  check(r.status === 302 && /\/raya-trade$/.test(r.headers.get("location") || ""), "…and a client that is not theirs sends them to their own (§313.36)", r.status + " " + r.headers.get("location"));
  await ctx.close(); await fresh();
  const r2 = await fetch(BASE + "/raya-trade/strategy/mobile/strategy", { redirect: "manual" });
  check(r2.status === 302 && /\/raya-trade\/sign-in$/.test(r2.headers.get("location") || ""), "signed out, the shell's address sends you to the client's own door", r2.status + " " + r2.headers.get("location"));
});

await section("9 · the worker carries the notifications and stores nothing (Phase J, stop point C)", async () => {
  /* WHAT IS SERVED, first, because a worker answered as text/html is refused
     by the browser and reads exactly like a worker that does nothing
     (§231.5's own trap, in a check this time). */
  const r = await fetch(BASE + "/sw.js");
  const body = await r.text();
  check(r.status === 200, "/sw.js is served at all — the 404 every page load logged (§316.7) is gone", r.status);
  check(/javascript|ecmascript/i.test(r.headers.get("content-type") || ""), "…as JavaScript, or the browser refuses it", r.headers.get("content-type"));
  check(body.includes('addEventListener("push"') && body.includes('addEventListener("notificationclick"'),
        "…and it carries the notification half (Phase G's row: a push cannot arrive without it)");
  check(!/addEventListener\("fetch"/.test(body),
        "…and NO fetch handler: nothing here is served from disk (the plan's line 47, kept)");

  /* THE BOTH-ENDS HALF (§94.2): it is not enough that the frozen caches are
     gone — a build that served no worker at all would satisfy that. So the
     cache is MADE first, and the clearing is watched. */
  await fresh();
  await page.goto(BASE + "/raya-trade/sign-in", { waitUntil: "domcontentloaded" });
  const before = await page.evaluate(async () => {
    await (await caches.open("smp-shell-v4.86-client-doors")).put("/frozen-shell", new Response("the platform, as it was"));
    return (await caches.keys());
  });
  check(before.length === 1 && before[0].startsWith("smp-shell-"), "a returning browser's frozen cache, made on purpose", JSON.stringify(before));

  const reg = await page.evaluate(async () => {
    /* A HANG IS NOT A FAILURE (§231.5), so the wait races a clock rather
       than being the only thing the outcome depends on. */
    const clock = new Promise((d) => setTimeout(() => d("slow"), 15000));
    const mine = navigator.serviceWorker.register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then(async (r) => {
        for (let i = 0; i < 100 && !navigator.serviceWorker.controller; i++) await new Promise((d) => setTimeout(d, 100));
        return { state: r.active && r.active.state, controlled: !!navigator.serviceWorker.controller, keys: await caches.keys() };
      })
      .catch((e) => ({ threw: String(e && e.message || e) }));
    return Promise.race([mine, clock]);
  });
  check(reg && reg.state === "activated", "it registers and activates in a real browser", JSON.stringify(reg));
  check(reg && reg.controlled === true, "…and claims the tab, so §258's 'a newer version is ready' fires at the cutover", JSON.stringify(reg && reg.keys));
  check(reg && Array.isArray(reg.keys) && reg.keys.length === 0, "…and every frozen cache is gone (§91: nobody is served the old platform off their own disk)", JSON.stringify(reg && reg.keys));

  /* AND IT STORES NOTHING AFTERWARDS — a fetch handler that cached would
     satisfy every assertion above and put the shell back on disk. */
  await page.goto(BASE + "/raya-trade", { waitUntil: "networkidle" });
  const after = await page.evaluate(() => caches.keys());
  check(after.length === 0, "…and a navigation under it stores nothing", JSON.stringify(after));

  /* AND THE HALF THE WORKER IS FOR ON AN IPHONE (§26): a push is only ever
     delivered to a platform that has been ADDED TO A HOME SCREEN, which
     needs a manifest — so the manifest crosses with the worker or Islam's
     "notifications keep working" is true on a laptop and nowhere else. */
  const mr = await fetch(BASE + "/manifest.webmanifest");
  check(mr.status === 200 && /manifest\+json/.test(mr.headers.get("content-type") || ""), "the manifest is served, as a manifest", mr.status + " " + mr.headers.get("content-type"));
  const man = await mr.json();
  const icons = await Promise.all((man.icons || []).map((i) => fetch(BASE + i.src).then((x) => x.status)));
  check(icons.length === 3 && icons.every((s) => s === 200), "…and every icon it names answers", JSON.stringify(icons));
  check((await fetch(BASE + "/icons/apple-touch-icon.png")).status === 200, "…and the touch icon the door and the shell link");
  const doorHtml = await (await fetch(BASE + "/raya-trade/sign-in")).text();
  check(/rel="manifest"/.test(doorHtml), "the door links it (index.html does)");

  /* THE REPORTED SYMPTOM, in its own words. */
  await ctx.close(); await fresh(); await signIn("office@forefront.example");
  await open("/raya-trade/strategy/mobile/strategy");
  check(!errs.some((e) => /404/.test(e) && /script/i.test(e)), "an ordinary page load logs no bad-response error for a script", JSON.stringify(errs.slice(0, 3)));
  check(await page.evaluate(() => !!document.querySelector('link[rel="manifest"]')), "…and the shell links the manifest too (the frozen platform file does)");
});

await section("10 · the security headers cross with it, read from vercel.json (§43.6)", async () => {
  /* AGREEMENT WITH THE FROZEN FILE, never a list typed here (§94.8): the
     rule that came with these headers is that they are written once and read
     from there, so a check holding its own copy would be the third. */
  const froz = JSON.parse(readFileSync(join(import.meta.dirname, "..", "..", "vercel.json"), "utf8"));
  const all = froz.headers.find((h) => h.source === "/(.*)").headers;
  const want = all.map((h) => h.key.toLowerCase());
  const got = async (p) => {
    const r = await fetch(BASE + p, { redirect: "manual" });
    const out = {};
    for (const [k, v] of r.headers) out[k.toLowerCase()] = (out[k.toLowerCase()] === undefined ? v : out[k.toLowerCase()] + " ⧺ " + v);
    return out;
  };
  const door = await got("/raya-trade/sign-in");
  const missing = want.filter((k) => door[k] === undefined);
  check(missing.length === 0, "the door carries every header the frozen site sets — " + want.length + " of them", JSON.stringify(missing));
  /* EXACTLY ONCE is the control rather than the alarm, and it says so
     (§113.8): next.config.ts and the routes are kept disjoint, so nothing in
     the product can send one twice today. It is here because the day they
     overlap is the day a policy is quietly replaced or intersected, and that
     is the one fault a header set in two places produces. */
  const twice = want.filter((k) => (door[k] || "").includes("⧺"));
  check(twice.length === 0, "…each exactly once — the control: the config and the routes are disjoint", JSON.stringify(twice));

  /* A STATIC FILE IS A SURFACE TOO — nosniff on a stylesheet is the one that
     matters, and before this it carried nothing at all. */
  const asset = await got("/platform.css");
  const six = want.filter((k) => k !== "content-security-policy" && k !== "referrer-policy");
  check(six.every((k) => asset[k] !== undefined), "…and so does a served stylesheet (the six that are the same everywhere)", JSON.stringify(six.filter((k) => asset[k] === undefined)));
  check(asset["content-security-policy"] === undefined, "…while the two that are per surface are not put on files", asset["content-security-policy"]);

  /* BOTH ENDS OF THE ONE THAT DIFFERS (§94.2): the door needs Next's own
     inline bootstrap, the shell forbids inline outright (§315.3), and each
     must carry ONE policy or the browser enforces the intersection. */
  await fresh(); await signIn("office@forefront.example");
  const cook = (await ctx.cookies()).map((c) => c.name + "=" + c.value).join("; ");
  const shell = await (async () => {
    const r = await fetch(BASE + "/raya-trade/strategy/mobile/strategy", { headers: { cookie: cook }, redirect: "manual" });
    const out = {}; for (const [k, v] of r.headers) out[k.toLowerCase()] = (out[k.toLowerCase()] === undefined ? v : out[k.toLowerCase()] + " ⧺ " + v);
    return out;
  })();
  check(/'unsafe-inline'/.test(door["content-security-policy"] || ""), "the door's policy admits Next's own bootstrap script", (door["content-security-policy"] || "").slice(0, 60));
  const sc = /script-src ([^;]+)/.exec(shell["content-security-policy"] || "");
  check(sc && sc[1].trim() === "'self'" && !/⧺/.test(shell["content-security-policy"] || ""), "…and the shell's ONE policy still forbids it (§315.3)", JSON.stringify(sc && sc[1]));
  check(door["referrer-policy"] === "no-referrer" && shell["referrer-policy"] === "same-origin", "…and each says its own referrer rule, once", door["referrer-policy"] + " / " + shell["referrer-policy"]);
  /* AND THE SHELL IS THE SURFACE THAT SETS ITS OWN, so it is the one that
     can send a header twice — the six it stopped repeating are the whole
     point of the trim (--break=double-headers puts them back). */
  const smiss = want.filter((k) => shell[k] === undefined);
  check(smiss.length === 0, "the shell document carries all " + want.length + " too", JSON.stringify(smiss));
  const sdup = want.filter((k) => (shell[k] || "").includes("⧺"));
  check(sdup.length === 0, "…and repeats not one of them", JSON.stringify(sdup));
});

try { process.kill(-server.pid); } catch {}
await browser.close(); await owner.end();
console.log((fails ? "RED   " : "GREEN ") + oks + " ok, " + fails + " failed" + (brk ? "  (--break=" + brk + ")" : ""));
process.exit(fails ? 1 : 0);
