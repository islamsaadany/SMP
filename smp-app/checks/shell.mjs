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
       not over a page the address named (§360.9)
       (§360: Strategy's welcome is the welcome) and the chrome says who is
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
import { MODULE_DEF } from "../lib/modules.ts";
import { categoriesPresent, insertItem, setState, draftOf, CATEGORIES } from "../lib/library.ts";

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
/* THE WELCOME IS OFFERED AGAIN ON EVERY DEEP ADDRESS (§360), once a
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
/* EVERY STATEMENT ABOUT A CLIENT'S OWN ROWS RUNS AS `smp_app` WITH THE TENANT
   SET (§314), never as the owner: the policies are FORCED, so a probe that
   read as the owner would be measuring a boundary it is standing outside of. */
async function asTenant(id, fn) {
  const c = await owner.connect();
  try {
    await c.query("BEGIN");
    await c.query("SET LOCAL search_path TO " + SCHEMA);
    await c.query("SET LOCAL ROLE smp_app");
    await c.query("SELECT set_config('app.tenant_id', $1, true)", [id]);
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } catch (e) { await c.query("ROLLBACK").catch(() => {}); throw e; }
  finally { c.release(); }
}
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
     own welcome down because the Next landing was the welcome; §360 removed
     that landing and this asserted the overlay on a DEEP address; §360.9
     then stood it down there, on Islam's report that pressing Continue over
     the client's Setup rail read as the press having opened the settings.
     So what is asserted is the decision that survived both: the welcome is
     the MODULE'S HOME SCREEN — offered where the address names no page, and
     never over one it does. Both ends in one session, or a build that lost
     the overlay altogether passes the half that matters here (§113.8). */
  await open("/raya-trade/strategy");
  check(await page.evaluate(() => !!document.querySelector(".welcomeover")), "the shell's own welcome overlay is offered at the module's home — Strategy's welcome is the welcome (§360, §360.9)");
  /* REWRITTEN, NEVER LOOSENED (§218, §400). Home stopped being an overlay
     with a Continue bar: it is a page inside the chrome, the house is lit
     while it is open, and the way out is the navigation itself. So the claim
     is that there is NO Continue left, that the house says Home is open, and
     that pressing a tab takes Home down — both ends, or a build that simply
     never drew Home passes the last one (§113.8). */
  check(await page.evaluate(() => !document.querySelector(".welcomeover .wexit") && document.documentElement.getAttribute("data-home-open") === "1"),
    "…with no Continue bar, and the house marks Home as open (§400)");
  await page.locator("#tabrow button").first().click({ timeout: 5000 }).catch(() => {});
  await page.waitForFunction(() => !document.querySelector(".welcomeover")).catch(() => {});
  check(await page.evaluate(() => !document.querySelector(".welcomeover") && !document.documentElement.hasAttribute("data-home-open")),
    "…and pressing a tab takes it down, the house going quiet with it");
  await open("/raya-trade/strategy/mobile/strategy");
  let p = await place();
  check(p[0] === "mobile" && p[1] === "strategy", "/raya-trade/strategy/mobile/strategy opens Mobile's Strategy", JSON.stringify(p));
  check(/^\/raya-trade\/strategy\/mobile\/strategy\/[a-z]+$/.test(path()), "…and the address gains the section the shell opened (the place is the address)", path());
  check(await page.evaluate(() => !document.querySelector(".welcomeover") && document.documentElement.getAttribute("data-deep-address") === "1"), "…and no welcome over a page the address NAMED (§360.9), so the rest of this section measures the page itself (§167.2)");
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
     belong to no module (spec 056 §4.1) — while a module's own Setup is
     served under its word (spec 056 §4.2), both as the same document */
  r = await hit("/raya-trade/setup/people");
  check(r.status === 200, "the client's Setup is NOT redirected — it is the client's page, in no module", r.status + " " + (r.headers.get("location") || ""));
  r = await hit("/raya-trade/strategy/setup/cycle");
  check(r.status === 200 && /data-module='strategy'/.test(await r.text()), "…and Strategy's own Setup is served under its word, as the shell (§359.2)", r.status + " " + (r.headers.get("location") || ""));
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
     module form (spec 056 §4.2), and the walk between them is the scope
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
  /* REWRITTEN, NEVER LOOSENED (§218, §400). The way back was a pill
     (#clientback) reading "Save & close" here and the client's name on a
     module page; §400 replaces it with the TRAIL — Forefront › client ›
     where you are — for the office alone. What the line was ABOUT survives:
     the office always has a way back, and it says where they are. Both ends:
     the client's settings end in the plain words "Client settings", a
     module's page ends in the module's own menu, and the old pill is gone
     from both (a build drawing both is two ways back, §87). */
  const back = async () => await page.evaluate(() => {
    const t = document.querySelector("nav.trail"), b = document.getElementById("clientback");
    return { trail: t ? t.innerText.replace(/\s+/g, " ").trim() : null,
      /* §401: the third step is always a menu; on the client's settings its
         summary reads "Client settings" and carries aria-current */
      here: t && t.querySelector(".trmod > summary[aria-current]") ? t.querySelector(".trmod > summary").textContent.trim() : null,
      mod: t && t.querySelector(".trmod > summary:not([aria-current])") ? t.querySelector(".trmod > summary").textContent.trim() : null,
      ff: !!(t && t.querySelector("a.trff[href='/platform']")), pill: !!(b && !b.hidden && b.offsetParent) };
  });
  let bk = await back();
  check(bk.ff && /Raya Trade/.test(bk.trail || "") && bk.here === "Client settings" && !bk.pill,
    "the client's own settings end the trail in \"Client settings\", with Forefront as the way back", JSON.stringify(bk));
  await open("/raya-trade/strategy/group/performance"); bk = await back();
  check(bk.ff && /Raya Trade/.test(bk.trail || "") && bk.here === null && /Strategy/.test(bk.mod || "") && !bk.pill,
    "…and a module's page ends it in that module's own menu", JSON.stringify(bk));
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

await section("3b \u00b7 the client's own settings wear the client's bar (\u00a7362, spec 058)", async () => {
  await fresh(); await signIn("office@forefront.example");
  /* THE SCOPE IS THE SERVER'S ANSWER, READ OFF THE RAW HTML. The browser
     writes the same attribute from the address on arrival (shell/route.js
     placeOf), so a DOM probe passes on a build where nothing is stamped at
     all \u2014 and the whole reason it is stamped is that it must be there before
     the module switcher is built, which happens at load, ABOVE placeOf. */
  /* THE SECOND MODULE IS MADE, or the switcher's absence is asserted over a
     client that could never have one: the switcher is drawn only where there
     is a CHOICE (\u00a732, shell/route.js since \u00a7362.1), so on the dev tenant's
     single module the line below went green on a build that drew it
     everywhere (\u00a7113.8 \u2014 it did, until this was added). It is what makes
     the way across measurable too: two modules mean two rows at the foot of
     the client's rail, so a build that hardcoded one module's name goes red.
     Put back in the `finally`, because every section after this one reads
     the same tenant (\u00a794.2). */
  /* AND A THIRD, BECAUSE THE SECOND IS ON THE TAB ROW (\u00a7383). REWRITTEN,
     NEVER LOOSENED (\u00a7218, \u00a7214.3): with exactly `strategy` and
     `insights` the switcher below is correctly NOT drawn \u2014 \u00a7383 drops a
     module the tab row already reaches, so for anybody who HAS a tab row the
     list comes down to the one they are standing in and \u00a732 says a menu of
     one is a door behind a door. The assertion this section is about is that
     a module's own Setup does not STAND the switcher DOWN the way the
     client's settings do, and that property needs somewhere else to go to be
     measurable at all. `tracker` is the office's own module and is not on the
     tab row, so it stays in the list; this section signs in as the office.
     The two-module case is asserted in its own right further down, so the
     decision \u00a7383 made is guarded rather than merely worked around. */
  await owner.query("update tenants set modules = $1 where id = $2", [JSON.stringify(["strategy", "insights", "tracker"]), tenantId]);
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
      /* MEASURED AS PAINT, WHICH IS WHAT THE BLOCK ABOVE ALREADY SAYS IT DOES
         (§94.8) — REWRITTEN, NEVER LOOSENED (§218). This asked whether the
         ELEMENT was there, which said "not offered" only while the switcher
         was structurally impossible on the client's scope (shell/route.js's
         early return). §367 made the crossing a press, so the switcher follows
         the scope by the same CSS the rest of the chrome does and IS in the
         document on both rails — `seen()` is false for `display:none` exactly
         as it is for absent, so the claim that survives is the one that was
         always meant: it is not on the screen and not reachable. */
      /* §400: FOR THE OFFICE THE BAR IS THE TRAIL. `switcher` asked for the
         four-square mark, which §400 DELETED — the modules are offered by the
         trail's client step now — so it counts what that step offers, and
         the heading is what the trail says rather than a brand the office no
         longer wears. REWRITTEN, NEVER LOOSENED (§218): every claim below
         is still about what the office can see and reach. */
      switcher: seen(document.querySelector(".top-in .topmark")),
      trail: seen(document.querySelector("nav.trail")),
      client: ((document.querySelector("nav.trail .trclient > summary span") || {}).textContent || "").trim(),
      /* §401: the modules moved from the client step to the MODULE step, and
         the client step lists the other clients */
      where: ((document.querySelector("nav.trail .trmod > summary span") || {}).textContent || "").trim(),
      mods: Array.from(document.querySelectorAll("nav.trail .trmod [data-trgo]")).map((e) => e.dataset.trgo).filter((g) => /^\/raya-trade\/[a-z]+$/.test(g)),
      sets: Array.from(document.querySelectorAll("nav.trail .trmod [data-trgo]")).map((e) => e.dataset.trgo).filter((g) => /^cross:(?!client$)/.test(g)),
      clientGo: Array.from(document.querySelectorAll("nav.trail .trclient [data-trgo]")).map((e) => e.dataset.trgo),
      h1: seen(document.querySelector(".brand")) ? ((document.querySelector(".brand h1") || {}).textContent || "") : "",
      mark: seen(document.querySelector("nav.trail img")) || seen(document.getElementById("clientlogo")),
    };
  });
  await open("/raya-trade/setup/people");
  let b = await bar();
  check(b.scope === "client" && b.row === false && b.dests === 0, "the module's navigation is not drawn over the client's own pages", JSON.stringify(b));
  check(b.viewer === false, "\u2026nor the viewer strip \u2014 looking as somebody is a question about a module's pages", JSON.stringify(b));
  check(b.switcher === false && b.trail === true && b.h1 === "",
        "\u2026nor the retired four-square switcher: the office's bar is the trail, and the brand stands down for it (\u00a7400)", JSON.stringify(b));
  /* REWRITTEN, NEVER LOOSENED (\u00a7218, \u00a7214.3). This asked whether the
     attribute was PRESENT, which said "this client holds more than one" only
     while the attribute carried the switcher's rule in its name \u2014 \u00a7362.1
     stamps it for every client, so presence would now be true of a client
     with one and the absence above would pass for the wrong reason
     (\u00a7113.8). It asks the CONTENT, which is what it was always for. */
  /* AND THE APOSTROPHE IS DECODED, WHICH IS NOT A DETAIL: these stamps are
     SINGLE-quoted attributes and `MODULE_DEF.tracker.note` holds one, so
     before lib/shell.ts learned §235's rule the attribute ENDED there and
     this line threw on a document the browser had already mis-parsed. The
     note is asserted whole below, or the decode could quietly go missing
     again and the only symptom would be a switcher that is not drawn. */
  const unesc = (v) => String(v).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  /* AND IT DEGRADES RATHER THAN DYING (§215, in a file that carries that
     rule). An unescaped apostrophe ends the attribute mid-string, so this
     THREW — and a throw here takes the whole section down and reports one
     failure where the truth is this one plus every assertion after it
     unmade. The malformed stamp is a FAILURE with the fragment printed, and
     the section carries on. */
  let clMods = [];
  try { clMods = JSON.parse(unesc((cl.match(/data-modules='([^']*)'/) || [])[1] || "[]")); }
  catch (e) { fail("the client's document carries a parseable list of its modules", (cl.match(/data-modules='([^']*)'/) || [])[1] || "—"); }
  const apos = clMods.find((m) => /'/.test(MODULE_DEF[m.key] ? MODULE_DEF[m.key].note : ""));
  check(!!apos && apos.note === MODULE_DEF[apos.key].note,
        "a module whose note holds an apostrophe survives the stamp whole — the attribute is single-quoted (§235)",
        JSON.stringify(apos || clMods.map((m) => m.key)));
  check(clMods.length >= 2, "\u2026and this client HAS a second module, so that absence is a decision (\u00a7113.8)", JSON.stringify(clMods));
  check(b.client === "Raya Trade" && b.where === "Client settings", "the trail names the client and what you are looking at", b.client + " / " + b.where);

  /* BOTH ENDS (\u00a794.2). A build that deleted the row outright satisfies every
     assertion above, so the module's own Setup is measured in the same run \u2014
     and the heading is asserted PUT BACK, because this is the first thing in
     the platform to rewrite it and a one-way write leaves the client's name
     over Strategy's navigation for the rest of the session. */
  await open("/raya-trade/strategy/setup/cycle");
  b = await bar();
  check(b.scope === "strategy" && b.row === true && b.dests > 0, "a module's own Setup keeps its navigation", JSON.stringify(b));
  check(b.viewer === true, "\u2026and its viewer strip", JSON.stringify(b));
  /* §401: the MODULE step offers the OTHER modules — never the one you are
     in, which is the step's own name — then a rule, then Client settings */
  check(clMods.filter((m) => m.key !== "strategy").every((m) => b.mods.includes("/raya-trade/" + m.key)) &&
        b.mods.length === clMods.length - 1 && !b.mods.includes("/raya-trade/strategy"),
        "\u2026and the trail's module step offers every OTHER module this person may open (\u00a7401)", JSON.stringify(b.mods));
  check(b.clientGo.length > 0 && b.clientGo[b.clientGo.length - 1] === "/platform#clients" &&
        !b.clientGo.some((g) => /^\/raya-trade(\/|$)/.test(g)) && b.clientGo.every((g) => /^\/[a-z0-9-]+$|^\/platform#clients$/.test(g)),
        "\u2026and the client step offers the OTHER clients and all of them, never this one or its modules (\u00a7401)", JSON.stringify(b.clientGo));
  check(b.where === "Strategy" && b.client === "Raya Trade", "\u2026and the trail ends in the module, not in Client settings", b.client + " / " + b.where);

  /* AND THE OTHER END OF \u00a7383'S OWN RULE, MADE (\u00a794.2, \u00a7255). Take the
     third module away and the switcher must go with it: the only place left
     to go is the reports, and they are on the tab row of the page you are
     standing on. Without this the fixture above would simply be a bigger
     client \u2014 with it, a build that went back to offering a module the tab
     row already reaches goes red here, which is the fault \u00a7383 removed
     (a menu whose one live entry is the page under it, \u00a732).

     THE PRESENCE ABOVE IS WHAT MAKES THIS ABSENCE MEAN ANYTHING (\u00a7113.8):
     measured alone it passes on a build that lost the switcher entirely. */
  await owner.query("update tenants set modules = $1 where id = $2", [JSON.stringify(["strategy", "insights"]), tenantId]);
  await open("/raya-trade/strategy/setup/cycle");
  const two = await bar();
  /* REWRITTEN, NEVER LOOSENED (\u00a7218). \u00a7383 took the switcher down when
     its only other entry was a module the tab row already reaches, because a
     menu of one is a door behind a door (\u00a732). The trail's client step is
     never a menu of one \u2014 it always carries Client settings and Switch
     client \u2014 so what survives is that it offers EXACTLY the modules this
     client has, no more: with two, two. */
  check(two.mods.length === 1 && two.row === true && two.switcher === false,
        "\u2026and with two modules the trail offers exactly the other one, and no retired switcher comes back (\u00a7383, \u00a7400, \u00a7401)", JSON.stringify(two));
  await owner.query("update tenants set modules = $1 where id = $2", [JSON.stringify(["strategy", "insights", "tracker"]), tenantId]);
  await open("/raya-trade/strategy/setup/cycle");

  /* AND THE SPINE-FORM ADDRESS STILL ENDS AT THE MODULE'S SETUP, WEARING ITS
     BAR. This is the one case the ORDER of the scope resolution decides: the
     landing's doors write `/<client>/setup/<page>` for every page and let the
     shell resolve which rail the page belongs to (\u00a7359.2's research R2), so
     a chrome that asked the question before `paintUnits()` had settled the
     place drew the CLIENT's bar over Strategy's Reporting cycle \u2014 and
     landed on the client's first page while it was at it (\u00a7362.6). Asserted
     here as well as in setup-per-module, because from this file it is the
     bar that is wrong and that is what this section is about. */
  await open("/raya-trade/setup/cycle");
  b = await bar();
  check(path() === "/raya-trade/strategy/setup/cycle" && b.scope === "strategy" && b.row === true && b.where === "Strategy",
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
  check(b.where === "Strategy" && b.mark === false,
        "\u2026and the trail stops saying Client settings on the way, never left standing (\u00a794.2)", b.where + " / mark " + b.mark);

  /* THE MARK IS MADE, because the demo seed carries none on purpose (\u00a7259.2:
     a client must never inherit Raya's), so every assertion about it would
     pass on a build that lost it (\u00a7255). Put back in the same run. */
  await open("/raya-trade/setup/people");
  check((await bar()).mark === false, "a client with no mark gets no empty box (\u00a715.1)");
  const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  await page.evaluate((src) => { GROUP.logo = src; paint(); }, PNG);
  await page.waitForTimeout(200);
  b = await bar();
  /* §401, REVERSED AND REWRITTEN (§218): Islam — "the logo of the client
     shouldn't appear in the top navigation bar". The office's bar is the
     trail and it names the client in words; the made state is what makes
     this absence mean anything (§113.8). */
  check(b.mark === false && b.client === "Raya Trade",
        "\u2026and one that HAS uploaded a mark still does not wear it on the office's bar \u2014 the trail names it in words (\u00a7401)", JSON.stringify(b));
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

  /* ── THE WAY ACROSS RUNS BOTH WAYS (\u00a7362.1) ───────────────────────
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
     list, because it is a place to go ON to (\u00a7360.9) \u2014 and outside
     `.raillist`, which is the one thing that scrolls, or the door scrolls
     away (\u00a7290.1). */
  await open("/raya-trade/setup/people");
  /* §400: THE WAY ACROSS IS THE TRAIL'S NOW. REWRITTEN, NEVER LOOSENED
     (§218): what this block is FOR is §362.1 — from the client's
     settings, every module's settings is one press away, and the press is not
     a page load (§367). The rail rows that carried it are stood down for the
     office (the trail says the same thing once, §87), so they are asserted
     GONE and the crossings are asserted where they moved: one "<Module>
     settings" per module in the client step, as an AGREEMENT with
     `data-modules` (§94.8), never listed on a module's own page, where its
     settings are the third step's. */
  const railRows = await page.evaluate(() => Array.from(document.querySelectorAll(".setuprail .railback")).filter((a) => a.checkVisibility && a.checkVisibility()).length);
  check(railRows === 0, "the rail's own back and across rows are stood down for the office \u2014 the trail carries them (\u00a7400)", railRows);
  b = await bar();
  check(b.sets.length === clMods.length && clMods.every((m) => b.sets.includes("cross:" + m.key)),
        "the client step carries one way across per module this person may open (\u00a7362.1, kept)", JSON.stringify(b.sets));
  await page.evaluate(() => { window.__stay = 1; });
  const pressTrail = async (go) => {
    if (!(await page.locator("nav.trail [data-trgo='" + go + "']").count())) { fail("a trail entry to press", go); return false; }
    await page.evaluate((g) => { const d = document.querySelector("nav.trail [data-trgo='" + g + "']").closest("details"); if (d) d.open = true; }, go);
    await page.click("nav.trail [data-trgo='" + go + "']", { timeout: 5000 }).catch((e) => fail("pressing " + go, e.message.split("\n")[0]));
    return true;
  };
  if (await pressTrail("cross:strategy")) {
    await page.waitForURL(/\/raya-trade\/strategy\/setup/, { timeout: 8000 }).catch(() => {});
    await booted();
  }
  b = await bar();
  const reached = await page.evaluate(() => Array.from(document.querySelectorAll(".setuprail [data-setupgo]")).map((e) => e.dataset.setupgo));
  check(/^\/raya-trade\/strategy\/setup/.test(path()) && b.scope === "strategy" && b.row === true && b.where === "Strategy",
        "\u2026and pressing it lands on the module's Setup, the trail ending in the module", path() + " / " + JSON.stringify(b));
  check(reached.includes("access"), "\u2026which is the rail Roles & access is on \u2014 the page he could not reach (\u00a761)", reached.join(","));
  check(await page.evaluate(() => window.__stay === 1), "\u2026and it crossed WITHOUT reloading the platform (\u00a7367)", "the page was rebuilt");
  check(b.sets.length === 0 && b.mods.length === clMods.length - 1,
        "\u2026and on a module's page the module step lists the other modules, not their settings (\u00a787, \u00a7401)", JSON.stringify(b));
  const third = await page.evaluate(() => Array.from(document.querySelectorAll("nav.trail .trmod .menu > *")).map((e) => e.dataset && e.dataset.trgo ? e.dataset.trgo : (e.className === "trrule" ? "|" : "?")));
  check(third[third.length - 1] === "cross:client" && third[third.length - 2] === "|" && !third.includes("cross:strategy"),
        "\u2026and it ends in a rule and Client settings (\u00a7401)", JSON.stringify(third));

  /* AND THE OTHER DIRECTION CROSSES IN PLACE TOO (\u00a7367). BOTH ENDS
     (\u00a794.2): the way back is the half Islam presses most. */
  await page.evaluate(() => { window.__stay = 2; });
  if (await pressTrail("cross:client")) await page.waitForURL(/\/raya-trade\/setup\//, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(400);
  b = await bar();
  const mine = await page.evaluate(() => Array.from(document.querySelectorAll(".setuprail [data-setupgo]")).map((e) => e.dataset.setupgo));
  check(await page.evaluate(() => window.__stay === 2), "the way back crosses without reloading either (\u00a7367)", "the page was rebuilt");
  check(/^\/raya-trade\/setup\/[\w-]+$/.test(path()) && b.scope === "client",
        "\u2026and the address it writes is the client's own spine form", path() + " / " + b.scope);
  check(b.row === false && b.viewer === false && b.where === "Client settings",
        "\u2026with the module's navigation stood down and the trail ending in Client settings", JSON.stringify(b));
  const mods = await page.evaluate((ks) => ks.map((k) => {
    const d = setupDefsAll().filter((x) => x.k === k)[0]; return d ? (d.mod || "client") : "?";
  }), mine);
  check(mine.length > 0 && mods.every((m) => m === "client"), "\u2026and every page on it is the client's own", JSON.stringify(mine) + " / " + JSON.stringify(mods));

  /* AND BACK WALKS THE CROSSING (\u00a7359.2, research R2). */
  await page.goBack();
  await page.waitForTimeout(500);
  b = await bar();
  check(/^\/raya-trade\/strategy\/setup/.test(path()) && b.scope === "strategy" && b.row === true,
        "\u2026and Back returns to the module's Setup, wearing its bar again", path() + " / " + JSON.stringify(b));

  await open("/raya-trade/setup/people");
  /* AND THE WAY OUT GOES WHERE IT SAYS. *Save & close* was \u00a7362's word for
     the pill \u00a7400 retired; the trail's first step is that way out now,
     pressed rather than read (\u00a796). */
  await page.click("nav.trail a.trff", { timeout: 5000 }).catch((e) => fail("pressing Forefront", e.message.split("\n")[0]));
  await page.waitForURL(/\/platform/, { timeout: 8000 }).catch(() => {});
  check(/^\/platform$/.test(path()), "the trail's Forefront goes back to the console", path());
  check(errs.filter((e) => /PAGEERROR/.test(e)).length === 0, "no page error on the way", errs.join(" | "));
  } finally { await owner.query("update tenants set modules = $1 where id = $2", [JSON.stringify(["strategy"]), tenantId]); }
});

await section("3c · Forefront team is the store, the register is a reader (spec 058 §3a)", async () => {
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
             /* §364: the page is a setup table now — the rows were the
                flow's own `.teamrow`, written for its 760px column, and on a
                full-width Setup page they laid out side by side. The names
                and addresses are the same two facts in a different shape. */
             rows: Array.from(document.querySelectorAll("[data-cteam] table.teamcfg td.tmname b")).map((e) => e.textContent.trim()),
             mails: Array.from(document.querySelectorAll("[data-cteam] table.teamcfg td.tmmail")).map((e) => e.textContent.trim()) };
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

await section("3d · the reports tab is stamped with what this client HAS (§385)", async () => {
  /* THE SEAM, AND IT WAS MEASURED BY NOBODY (§316.7's own finding, one
     feature over). §385 has two halves and each is asserted in its own
     place: the RULE is `categoriesPresent`, asserted against a database in
     checks/insights.mjs §14, and the ROW is `sections()`, asserted with no
     database in checks/insights-tab.mjs §2 — which draws whatever it is
     handed and therefore cannot say what it is handed. Between them is this
     attribute, written by lib/shell.ts on the served document. Nothing read
     it, so a build whose stamp was the module's whole list satisfied both
     files perfectly and drew Islam's six filters (§113.8). */
  await fresh(); await signIn("office@forefront.example");
  const ck = (await ctx.cookies()).map((c) => c.name + "=" + c.value).join("; ");
  const raw = async (u) => await (await fetch(BASE + u, { headers: { cookie: ck } })).text();
  const stamp = (h) => { const m = h.slice(0, 900).match(/data-library-cats='([^']*)'/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")) : null; };
  /* READ OFF THE RAW HTML, never off the DOM: the tab row is built at paint
     time, before any answer from the server could arrive, and the whole
     reason the list is stamped rather than fetched is that it must already
     be there (§376). A DOM probe passes on a build that fetched it late. */
  const was = (await owner.query("select modules from tenants where id = $1", [tenantId])).rows[0].modules;
  try {
    await owner.query("update tenants set modules = $1 where id = $2", [JSON.stringify(["strategy", "insights"]), tenantId]);

    /* A LIBRARY WITH NOTHING FILED IS `[]`, NOT ABSENT, and the difference is
       the feature: absent draws no tab at all (§61), `[]` draws the tab and
       no filters, because the module IS this client's and an empty library is
       a beginning rather than a fault (§45.2). */
    const bare = stamp(await raw("/raya-trade/strategy"));
    check(Array.isArray(bare) && bare.length === 0,
          "a client with nothing published is stamped with an empty list — the tab, no filters", JSON.stringify(bare));

    /* THE STATE IS MADE (§255): the dev tenant publishes nothing, so every
       assertion here would pass on a build that stamped the empty list
       always — which is the other way to get Islam's fault wrong. */
    const put = await asTenant(tenantId, (c) => insertItem(c, "insights",
      draftOf({ title: "Egypt retail 2026", summary: "", categories: ["Sector"], reportDate: "2026-09-04" })));
    await asTenant(tenantId, (c) => setState(c, put.id, "published", "office@forefront.example"));

    const one = stamp(await raw("/raya-trade/strategy"));
    /* ASSERTED AS AN AGREEMENT WITH THE RULE, never against a typed list
       (§94.8): it stays true the day a category is added to the module, and
       it is the one thing a build that stamped `CATEGORIES` cannot satisfy. */
    const rule = await asTenant(tenantId, (c) => categoriesPresent(c, "insights", { place: null, seesAll: true }));
    check(JSON.stringify(one) === JSON.stringify(rule),
          "…and once one report is published the stamp is what the RULE answered", JSON.stringify(one) + " vs " + JSON.stringify(rule));
    check(Array.isArray(one) && one.length === 1 && one[0] === "Sector",
          "…which is the one category it is filed under and not the module's five (§113.8)", JSON.stringify(one));
    check(Array.isArray(one) && one.length < CATEGORIES.length,
          "…so the row offers fewer filters than the module has categories", JSON.stringify(one) + " of " + CATEGORIES.length);

    /* BOTH ENDS (§94.2). A build that stamped nothing at all satisfies every
       "it is not the whole list" assertion above perfectly. */
    await owner.query("update tenants set modules = $1 where id = $2", [JSON.stringify(["strategy"]), tenantId]);
    check(stamp(await raw("/raya-trade/strategy")) === null,
          "a client WITHOUT the module carries no stamp, so there is no tab (§61)");
  } finally {
    await owner.query("update tenants set modules = $1 where id = $2", [JSON.stringify(was), tenantId]).catch(() => {});
    await asTenant(tenantId, (c) => c.query("delete from library_items where kind = 'insights'")).catch(() => {});
  }
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
  /* \u00a7400: THE CONSOLE OPENS ON *MY WORK*, which is the first tab \u2014 so the
     cards are one press away rather than the landing. REWRITTEN, NEVER
     LOOSENED (\u00a7218): the landing is asserted as the new decision, and the
     cards are still asserted, by pressing Clients, and by the address that
     names them (a link to the cards must keep working). */
  check(ffTabs[0] === "My work" && (await page.locator("#page").textContent()).includes("My work"),
    "the console opens on My work, its first tab (\u00a7400)", ffTabs.join("|"));
  await page.locator("#nav button", { hasText: "Clients" }).click();
  await page.waitForSelector(".ccard[data-client]", { timeout: 8000 }).catch(() => {});
  check((await page.locator("#page").textContent()).includes("Raya Trade") && (await page.locator("#page").textContent()).includes("Add a client"), "the cards: Raya Trade, and Add a client");
  check(new URL(page.url()).hash === "#clients", "\u2026and the address names the cards, so a link back to them lands there", page.url());

  /* \u00a74b \u2014 MY WORK (\u00a7400). The state is MADE (\u00a7255): the dev tenant
     holds no Tracker actions and no tracker module, so every assertion below
     would pass on a build that lost the list. Three of the office's open
     actions in the three buckets, one of theirs DONE and one belonging to
     somebody else \u2014 the two that must NOT appear, or a build that read the
     whole tracker passes every presence assertion (\u00a794.2). Put back after. */
  const was = (await owner.query("SELECT modules FROM tenants WHERE id = $1", [tenantId])).rows[0].modules;
  await owner.query("UPDATE tenants SET modules = $1 WHERE id = $2", [JSON.stringify(["strategy", "tracker"]), tenantId]);
  await owner.query("DELETE FROM tracker_actions WHERE tenant_id = $1", [tenantId]);
  const ta = (title, who, days, status) => owner.query(
    "INSERT INTO tracker_actions (tenant_id, title, owner_key, due, first_due, status) VALUES ($1,$2,$3,current_date + $4::int, current_date + $4::int, $5)",
    [tenantId, title, who, days, status]);
  await ta("MW late one", "smo", -14, "in_progress");
  await ta("MW this week", "smo", 0, "not_started");
  await ta("MW far off", "smo", 30, "not_started");
  await ta("MW finished", "smo", -3, "done");
  await ta("MW not mine", "mobhead", 0, "not_started");
  try {
    await page.locator("#nav button", { hasText: "My work" }).click();
    await page.waitForSelector("table.work tr.wrow", { timeout: 8000 }).catch(() => {});
    const w = await page.evaluate(() => ({
      rows: Array.from(document.querySelectorAll("table.work tr.wrow td.act")).map((e) => e.textContent),
      groups: Array.from(document.querySelectorAll("table.work tr.grp")).map((e) => e.textContent.trim()),
      late: Array.from(document.querySelectorAll("table.work td.late")).length,
    }));
    check(w.rows.length === 3 && w.rows.includes("MW late one") && w.rows.includes("MW this week") && w.rows.includes("MW far off"),
      "My work lists the office's three open actions on this client", JSON.stringify(w.rows));
    check(!w.rows.includes("MW finished") && !w.rows.includes("MW not mine"),
      "\u2026and neither a finished action nor somebody else's (\u00a794.2)", JSON.stringify(w.rows));
    check(JSON.stringify(w.groups) === JSON.stringify(["Late", "This week", "Next week and later"]) && w.rows[0] === "MW late one" && w.late === 1,
      "\u2026grouped Late, This week, Next week and later, with the late one said in the alarm ink", JSON.stringify(w));
    await page.click("table.work tr.wrow >> nth=0");
    await page.waitForURL(/\/raya-trade\/tracker/, { timeout: 8000 }).catch(() => {});
    check(path() === "/raya-trade/tracker", "\u2026and a row opens that client's Tracker", path());
    await page.goto(BASE + "/platform#clients", { waitUntil: "networkidle" });
    await page.waitForSelector(".ccard[data-client]", { timeout: 8000 }).catch(() => {});
    const card = (await page.locator(".ccard[data-client]").first().textContent()) || "";
    check(/3 open\s*\u00b7\s*1 late/.test(card), "the client's card says how many of yours are open and late on its Tracker row", card.replace(/\s+/g, " ").slice(0, 200));
  } finally {
    await owner.query("DELETE FROM tracker_actions WHERE tenant_id = $1", [tenantId]);
    await owner.query("UPDATE tenants SET modules = $1 WHERE id = $2", [JSON.stringify(was), tenantId]);
  }

  /* \u00a74c \u2014 A CLIENT'S OWN PERSON HAS NO TRAIL (\u00a7400): they do not travel
     between clients or modules, so their bar names their company and nothing
     leads anywhere. Both ends \u2014 the office's trail is asserted in \u00a73. */
  await fresh(); await signIn("mobhead@raya.example");
  await open("/raya-trade/strategy/mobile/strategy");
  const staff = await page.evaluate(() => ({
    trail: !!document.querySelector("nav.trail"),
    h1: ((document.querySelector(".brand h1") || {}).textContent || "").trim(),
    sub: ((document.getElementById("orgname") || {}).textContent || "").trim(),
    switcher: !!(document.querySelector(".topmark") && document.querySelector(".topmark").checkVisibility()),
  }));
  check(!staff.trail && !staff.switcher && staff.h1 === "Raya Trade" && /Strategy Management Platform/.test(staff.sub),
    "a client's own person gets no trail and no switcher; their bar names their company", JSON.stringify(staff));
  /* §401 — AND THE TRAIL'S CLIENT LIST IS REFUSED TO THEM ON THE SERVER, not
     only undrawn: the list names every client, which is the office's. */
  const staffList = await page.evaluate(async () => (await fetch("/api/platform", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "clients" }) })).status);
  check(staffList === 403, "…and the trail's client list is refused to them by the server (§401)", staffList);
  /* Back to the office for the rest of this section, on the page it expects. */
  await fresh(); await signIn("office@forefront.example");
  await page.goto(BASE + "/platform#clients", { waitUntil: "networkidle" }); await page.waitForSelector("body.ready", { timeout: 15000 });
  const post = (body) => page.evaluate(async (b) => (await (await fetch("/api/platform", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) })).json()), body);
  /* §401: the office's list for the trail is the cards' own two rules — every
     client it names is one the cards say may be OPENED, and none it omits is */
  { const [cl, cd] = [await post({ action: "clients" }), await post({ action: "cards" })];
    const openable = (cd.cards || []).filter((c) => c.canOpen).map((c) => c.key).sort();
    const listed = (cl.clients || []).map((c) => c.key).sort();
    check(listed.length > 0 && JSON.stringify(listed) === JSON.stringify(openable),
      "the trail's client list is exactly the clients the cards say may be opened (§401)", JSON.stringify({ listed, openable })); }
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
