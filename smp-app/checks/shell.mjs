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
     · the shell's own welcome overlay is stood down (the landing is the
       welcome, §315) and the chrome says who is signed in;
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
async function fresh() {
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); page = await ctx.newPage(); errs = [];
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
  await fresh(); await signIn("mobhead@raya.example");
  await open("/raya-trade/strategy/mobile/strategy");
  let p = await place();
  check(p[0] === "mobile" && p[1] === "strategy", "/raya-trade/strategy/mobile/strategy opens Mobile's Strategy", JSON.stringify(p));
  check(/^\/raya-trade\/strategy\/mobile\/strategy\/[a-z]+$/.test(path()), "…and the address gains the section the shell opened (the place is the address)", path());
  check(await page.evaluate(() => !document.querySelector(".welcomeover")), "the shell's own welcome overlay is stood down — the landing is the welcome (§315)");
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

/* THE MODULE IN THE ADDRESS (spec 044 §7). Both ends every time (§94.2): the
   word is there where it belongs AND absent on the spine, or a build that
   prefixed everything — Setup included — passes half of this. */
await section("2b · the module leads the address, and the spine carries none", async () => {
  await fresh(); await signIn("office@forefront.example");
  const cook = (await ctx.cookies()).map((c) => c.name + "=" + c.value).join("; ");
  const hit = (path) => fetch(BASE + path, { headers: { cookie: cook }, redirect: "manual" });

  /* the shape a link made before today has */
  let r = await hit("/raya-trade/mobile/strategy/plan");
  check(r.status === 302 && (r.headers.get("location") || "").endsWith("/raya-trade/strategy/mobile/strategy/plan"),
    "an address with no module 302s to the default one, whole (spec 044 §7)", r.status + " " + r.headers.get("location"));
  r = await hit("/raya-trade/fn/finance/strategy");
  check(r.status === 302 && (r.headers.get("location") || "").endsWith("/raya-trade/strategy/fn/finance/strategy"),
    "…a function's too, its own two segments intact", r.status + " " + r.headers.get("location"));

  /* …and the spine is served where it stands rather than being pushed under
     a module it does not belong to (spec 044 §4.5) */
  r = await hit("/raya-trade/setup/people");
  check(r.status === 200, "Setup is NOT redirected — it is the client's page, in no module", r.status + " " + (r.headers.get("location") || ""));
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

  /* the address the SHELL writes, on both sides of the spine line */
  await open("/raya-trade/setup/people");
  await page.click('#subtabs button[data-s="access"]').catch(() => {});
  await page.waitForTimeout(400);
  check(/^\/raya-trade\/setup\//.test(path()), "pressing inside Setup writes an address with no module in it", path());
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
  check(await page.evaluate(() => !document.getElementById("clientback").hidden && document.getElementById("clientbackname").textContent === "Raya Trade"), "the office sees the way back to the cards, named");
  const word = "shell " + Date.now();
  await page.evaluate((w) => { REVIEW.note.mobile = w; paint(); }, word);
  await page.waitForTimeout(1500);
  const stored = (await owner.query("SELECT notes->>'mobile' AS n FROM review WHERE tenant_id = $1", [tenantId])).rows[0];
  check(stored && stored.n === word, "a change made in the shell reaches the database through the frozen client (sync.js, /api/state)", JSON.stringify(stored));
  const logged = (await owner.query("SELECT person_key, email FROM change_log WHERE tenant_id = $1 ORDER BY id DESC LIMIT 1", [tenantId])).rows[0];
  check(logged && logged.person_key === "smo" && logged.email === "office@forefront.example", "…and is recorded as the signer", JSON.stringify(logged));
  check(errs.filter((e) => /PAGEERROR/.test(e)).length === 0, "no page error on the way", errs.join(" | "));
});

await section("4 · Forefront's own pages", async () => {
  await fresh(); await signIn("office@forefront.example");
  await page.goto(BASE + "/platform", { waitUntil: "networkidle" }); await page.waitForSelector("body.ready", { timeout: 15000 });
  check((await page.locator("#who").textContent()) === "Mohamed Essam · Super user", "the platform's chrome names the admin");
  check((await page.locator("#nav button, #nav a").allTextContents()).join("|") === "Clients|Consultants|Who sees what", "three pages", await page.locator("#nav").textContent());
  check((await page.locator("#page").textContent()).includes("Raya Trade") && (await page.locator("#page").textContent()).includes("Add a client"), "the cards: Raya Trade, and Add a client");
  const post = (body) => page.evaluate(async (b) => (await (await fetch("/api/platform", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) })).json()), body);
  let j = await post({ action: "consultants" });
  check(j.ok && j.people.some((x) => x.email === "office@forefront.example" && x.seats.some((s) => s.key === "raya-trade" && s.seat === "super")), "the consultants list carries the seats", JSON.stringify(j).slice(0, 160));
  j = await post({ action: "access" }); check(j.ok && j.canEdit === true && j.areas.length === 4, "the table is the admin's", JSON.stringify(j).slice(0, 120));
  j = await post({ action: "createClient", name: "RHI", industry: "Manufacturing" }); check(j.ok && j.key === "rhi", "a client is created from the cards", JSON.stringify(j));
  j = await post({ action: "client", key: "rhi" }); check(j.ok && j.client.made_here === true && j.register.length === 0, "…made here, with an EMPTY register (nobody is invented)", JSON.stringify(j.register));
  j = await post({ action: "setTeam", key: "rhi", email: "office@forefront.example", seat: "smoteam" }); check(j.ok, "…the admin joins its team", JSON.stringify(j));
  j = await post({ action: "client", key: "rhi" });
  check(j.team.length === 1 && j.team[0].seat === "smoteam" && j.register.length === 1 && j.register[0].role === "smoteam" && j.register[0].ff === "true", "…and the team IS the register on a client made here (§313.31)", JSON.stringify(j.register));
  await open("/rhi/mobile/strategy");
  check(await page.evaluate(() => GROUP.org === "RHI" && UNIT_KEYS.length === 10 && UNITS.mobile.items.length === 0 && PEOPLE.length === 1), "the new client opens: its own name, §67's cleared graph, one person", await page.evaluate(() => [GROUP.org, UNIT_KEYS.length, PEOPLE.length]));
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
