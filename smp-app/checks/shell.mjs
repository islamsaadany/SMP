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

const { tenantId } = await devTenant({ url: URL_, log: () => {} });
const owner = new pg.Pool({ connectionString: URL_, max: 2 });
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
  const r = await fetch(BASE + "/raya-trade/mobile/strategy", { headers: { cookie: (await ctx.cookies()).map((c) => c.name + "=" + c.value).join("; ") } });
  const html = await r.text(), csp = r.headers.get("content-security-policy") || "";
  check(r.status === 200 && /<script src="\/shell\.js"><\/script>/.test(html) && /<script src="\/theme\.js"><\/script>/.test(html), "the shell is served as its own document with the product's scripts as FILES", r.status);
  check(!/<script>/.test(html) && !/ on[a-z]+=/i.test(html.replace(/<!--[\s\S]*?-->/g, "")), "…and no inline script or handler anywhere in it");
  check(/script-src 'self';/.test(csp) && !/unsafe-inline'[^;]*;\s*style/.test(csp.split("script-src")[1] || "x"), "the policy is script-src 'self' — no hash, no unsafe-inline (§238's net, tighter)", csp.slice(0, 80));
  check(/<link rel="stylesheet" href="\/platform\.css">/.test(html) && /<title>Raya Trade — Strategy Management Platform<\/title>/.test(html), "the product's stylesheet is linked and the title is the tenant's");
  await open("/raya-trade/mobile/strategy");
  const pwned = await page.evaluate(async () => { window.__pwned = 0; const d = document.createElement("div"); d.innerHTML = '<img src="x" onerror="window.__pwned=1">'; document.body.appendChild(d); await new Promise((r) => setTimeout(r, 400)); return window.__pwned; });
  check(pwned === 0, "an injected inline handler does NOT run (§235's hole, closed by the policy)", pwned);
});

await section("2 · the address names the page, and the page names the address", async () => {
  await fresh(); await signIn("mobhead@raya.example");
  await open("/raya-trade/mobile/strategy");
  let p = await place();
  check(p[0] === "mobile" && p[1] === "strategy", "/raya-trade/mobile/strategy opens Mobile's Strategy", JSON.stringify(p));
  check(/^\/raya-trade\/mobile\/strategy\/[a-z]+$/.test(path()), "…and the address gains the section the shell opened (the place is the address)", path());
  check(await page.evaluate(() => !document.querySelector(".welcomeover")), "the shell's own welcome overlay is stood down — the landing is the welcome (§315)");
  check((await page.locator(".viewer-note b").textContent().catch(() => "")) === "Ashraf Laithy", "the chrome says who is signed in (a client's person has no switcher)");
  await open("/raya-trade/mobile/strategy/plan"); p = await place();
  check(p[2] === "plan", "…/plan opens the Plan section", JSON.stringify(p));
  await open("/raya-trade/mobile/performance"); p = await place();
  check(p[1] === "performance", "…/performance opens Performance", JSON.stringify(p));
  await page.click('#subtabs button[data-s="strategy"]'); await page.waitForTimeout(400);
  check(/^\/raya-trade\/mobile\/strategy/.test(path()), "pressing a tab writes the address", path());
  await page.reload({ waitUntil: "networkidle" }); await booted(); p = await place();
  check(p[0] === "mobile" && p[1] === "strategy", "a refresh stays where you are (§173, by address)", JSON.stringify(p));
  /* AND THE SECOND DOOR NEEDS SOMEBODY WHO HOLDS TWO. A unit head reaches
     one destination, so pressing another unit and walking Back are asserted
     as the office — the person who has more than one place to be (§94.6). */
  await fresh(); await signIn("office@forefront.example");
  await open("/raya-trade/mobile/strategy");
  await page.click('#units button[data-u="retailstores"]'); await page.waitForTimeout(400);
  check(/^\/raya-trade\/retailstores\//.test(path()), "pressing a unit writes the address", path());
  await page.goBack(); await page.waitForTimeout(600); p = await place();
  check(p[0] === "mobile" && /^\/raya-trade\/mobile\//.test(path()), "Back returns to the place before it", JSON.stringify(p) + " " + path());
  check(errs.filter((e) => /PAGEERROR/.test(e)).length === 0, "no page error on the way", errs.join(" | "));
});

await section("3 · the office's addresses, and a change that reaches the server", async () => {
  await fresh(); await signIn("office@forefront.example");
  await open("/raya-trade/fn/finance/strategy"); let p = await place();
  check(p[0] === "fn:finance" && p[1] === "fnstrat", "/fn/finance/strategy opens Finance's Strategy", JSON.stringify(p));
  await open("/raya-trade/group/performance"); p = await place();
  check(p[0] === "group" && p[1] === "performance", "/group/performance opens the group", JSON.stringify(p));
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
  const r2 = await fetch(BASE + "/raya-trade/mobile/strategy", { redirect: "manual" });
  check(r2.status === 302 && /\/raya-trade\/sign-in$/.test(r2.headers.get("location") || ""), "signed out, the shell's address sends you to the client's own door", r2.status + " " + r2.headers.get("location"));
});

try { process.kill(-server.pid); } catch {}
await browser.close(); await owner.end();
console.log((fails ? "RED   " : "GREEN ") + oks + " ok, " + fails + " failed" + (brk ? "  (--break=" + brk + ")" : ""));
process.exit(fails ? 1 : 0);
