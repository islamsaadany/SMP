/* The door and the landing, driven in a real browser (spec 043's first screen
   group; §34, §313.36, §148). Starts the BUILT app on its own port against
   the dev tenant (scripts/dev-tenant.mjs), then walks: the root door plain and
   a client's door wearing its mark; a wrong password refused in the one
   sentence; a sign-in landing on the welcome screen with the rows the frozen
   readers give — asserted as AGREEMENT with lib/frozen.cjs's own answer read
   off the same graph, never as literals (§94.8), and the one literal that IS
   the mockup's sign-off (the fourth line); every door on the landing reaching
   a page that says what it is; a temporary password opening on the password
   card with the where-question asked only when the register has not
   answered; the declaration stored; the office's holder; and the refusals —
   a client user sent to their own client, the office refused a client that
   is not theirs identically to one that does not exist, a signed-out person
   sent to the client's own door. Prints one line per property (§215) and
   ends RED/GREEN.

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/door-landing.mjs
     … --break=no-rows        (RED: the landing draws no rows)
     … --break=first-person   (RED: the landing is somebody else's — viewer() falls to PEOPLE[0])
     … --shots=<dir>          (also writes door.png, client-door.png, landing.png, password.png)

   Needs `next build` first and the chromium this image carries. */
import { spawn } from "node:child_process";
import { SCHEMA } from "../db/schema-name.mjs";   /* the shared schema is not `public` (§317.4) */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";
import pg from "pg";
import { devTenant } from "../scripts/dev-tenant.mjs";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const CHROME = process.env.SMP_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = 3977;
const BASE = "http://localhost:" + PORT;
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
const shots = (process.argv.find((a) => a.startsWith("--shots=")) || "").slice(8);
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 200))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));

/* a 1x1 navy PNG for the client's mark */
const MARK = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const owner = new pg.Pool({ connectionString: URL_, max: 2, options: "-c search_path=" + SCHEMA });
/* THE STATE IS MADE, NEVER INHERITED (§255, §94.2). This read whatever the
   last run happened to leave in the dev tenant, and a landing row asserted as
   AGREEMENT with the frozen reader passes vacuously when the reader answers
   none — which is what a sweep's own saves had left it answering, so "a row's
   door" had nothing to press (§113.8). The tenant is remade first. */
await devTenant({ url: URL_, log: () => {} });
const tenant = (await owner.query("SELECT id FROM tenants WHERE key = 'raya-trade'")).rows[0];
if (!tenant) { console.log("FAIL  no dev tenant — run scripts/dev-tenant.mjs first"); process.exit(1); }
await owner.query("UPDATE tenants SET mark = $1 WHERE id = $2", [MARK, tenant.id]);
/* the temporary-password person is UNPLACED for this run so the question is asked (§93.13) */
await owner.query("UPDATE people SET unit_key = NULL WHERE tenant_id = $1 AND key = 'own_mob'", [tenant.id]);
await owner.query("DELETE FROM bu_declarations WHERE tenant_id = $1 AND person_key = 'own_mob'", [tenant.id]);
/* the temporary-password login is PUT BACK to its issued password every run —
   section 4 replaces it, and a check that only passes on a fresh tenant is a
   check that passes once (§94.2) */
const { hashPassword } = await import("../lib/auth.ts");
await owner.query("UPDATE users SET must_change = true, password_hash = $1 WHERE email = 'own_mob@raya.example'", [hashPassword("Temp-2026!")]);
await owner.query("DELETE FROM login_attempts");

/* the frozen readers' own answer, read off the same graph the page reads */
const { createRequire } = await import("node:module");
const frozen = createRequire(import.meta.url)("../lib/frozen.cjs");
const { withTenant } = await import("../lib/tenant.ts");
const { readState } = await import("../lib/state-io.ts");
const graph = await withTenant(tenant.id, (c) => readState(c));
const want = frozen.landing(graph, "mobhead");

const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  cwd: join(import.meta.dirname, ".."),
  env: { ...process.env, DATABASE_URL_UNPOOLED: URL_, SMP_BREAK: brk },
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,   /* its own process group, so the kill below reaches next-server and not only npx */
});
/* DRAINED, or the server blocks the moment its stdout pipe fills (64KB of
   request lines) and every later section times out looking healthy. */
server.stdout.on("data", () => {}); server.stderr.on("data", (d) => process.stderr.write(d));
let up = false;
for (let i = 0; i < 60 && !up; i++) {
  await new Promise((r) => setTimeout(r, 500));
  try { up = (await fetch(BASE + "/")).status === 200; } catch {}
}
if (!up) { console.log("FAIL  the app did not start"); server.kill(); process.exit(1); }
if (shots) mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
async function fresh() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
  return { ctx, page: await ctx.newPage() };
}
const shot = async (page, name) => { if (shots) await page.screenshot({ path: join(shots, name + ".png"), fullPage: true }); };
const text = async (page, sel) => (await page.locator(sel).allTextContents()).map((s) => s.trim());
const hydrated = (page) => page.waitForSelector(".gate[data-hydrated]", { state: "attached", timeout: 15000 });
const signIn = async (page, email, pw) => {
  await hydrated(page);
  await page.fill("#user", email); await page.fill("#password", pw);
  await Promise.all([page.waitForLoadState("networkidle"), page.click("#loginForm button[type=submit]")]);
};

let ctx, page;
async function section(name, fn) {
  try { await fn(); }
  catch (e) { fail(name + " — the section died rather than reporting (§215)", (e && e.message ? e.message.split("\n")[0] : e) + " @ " + (page ? page.url() : "")); }
  finally { try { if (ctx) await ctx.close(); } catch {} ctx = null; page = null; }
}
await section("1 · the root door", async () => {
  ({ ctx, page } = await fresh());
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  check((await page.locator("#login").count()) === 1 && (await page.locator("#change").count()) === 0, "the root opens on the sign-in card and nothing else");
  check((await text(page, "label[for=user]"))[0] === "Email", "the email box is the field's name (§69.11)");
  check((await page.locator(".clientmark").count()) === 0, "the root door wears no client's mark (§313.15)");
  const props = await text(page, ".props li b");
  check(props.length === 4 && props[3] === "Presented from the same place", "four wall lines, the fourth Islam's (2026-09-09)", props.join(" | "));
  check((await page.locator(".brand h2 em").textContent()).trim() === "measured the same way", "the hero is the door's own");
  check(await page.evaluate(() => document.body.classList.contains("ready") && getComputedStyle(document.querySelector(".gate")).opacity === "1"), "the gate is painted (body.ready)");
  await shot(page, "door");
  /* wrong password → one sentence, card stays */
  await signIn(page, "mobhead@raya.example", "not-it");
  await page.waitForSelector("#error", { state: "visible" });
  check((await page.locator("#error").textContent()).trim() === "That email and password do not match.", "a wrong password is refused in the one sentence (§43)");
  check((await page.locator("#password").inputValue()) === "", "…and the password box is emptied");
});
await section("2 · a client's door", async () => {
  ({ ctx, page } = await fresh());
  await page.goto(BASE + "/raya-trade/sign-in", { waitUntil: "networkidle" });
  check((await page.locator("#login .clientmark").count()) === 1 && (await page.locator("#login .clientmark").getAttribute("src")) === MARK, "a client's door wears that client's mark (§313.36)");
  check((await page.title()) === "Raya Trade — Strategy Management Platform", "…and its name in the title", await page.title());
  await shot(page, "client-door");
  await page.goto(BASE + "/no-such-client/sign-in", { waitUntil: "networkidle" });
  check((await page.locator("#login").count()) === 1 && (await page.locator(".clientmark").count()) === 0, "an unknown slug answers a plain door, not a refusal");
});
await section("3 · sign in and land", async () => {
  ({ ctx, page } = await fresh());
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await signIn(page, "mobhead@raya.example", "Raya-2026!");
  await page.waitForURL(BASE + "/raya-trade");
  check(page.url() === BASE + "/raya-trade", "a client user lands on their client (§94.6)", page.url());
  check((await page.locator(".welcomeover h2").textContent()).trim() === "Welcome, " + want.name, "the greeting names the register's first name", await page.locator(".welcomeover h2").textContent());
  const chips = await text(page, ".wwho .wchip");
  const wantChips = want.chips.map((c) => c.role + (c.where ? " · " + c.where : ""));
  check(wantChips.every((c) => chips.includes(c)), "the role chips are personRoles()'s own", chips.join(" | "));
  check((await page.locator(".wtenant h1").textContent()).trim() === want.org, "the tenant's name is the graph's org");
  const titles = await text(page, ".wacts .wact:not(.wempty) .wwhat b");
  check(titles.length === want.acts.length && want.acts.every((a, i) => titles[i] === a.title), "the rows are the frozen readers' rows, in their order", titles.join(" | ") + " ⟂ " + want.acts.map((a) => a.title).join(" | "));
  const alerts = await text(page, ".wacts .walert");
  const wantAlerts = want.acts.flatMap((a) => a.sub.filter((p) => p.kind === "alert").map((p) => p.text));
  check(alerts.join("|") === wantAlerts.join("|"), "…with the same alerts under them", alerts.join("|"));
  const pages = await text(page, ".wpages a");
  check(pages.length === want.pages.length && want.pages.every((p, i) => pages[i].startsWith(p.label)), "Your pages are the reader's pages", pages.join(" | "));
  check((await page.locator(".wexit .wexlab").textContent()).trim() === want.continueWord, "the way out names where it goes (§202)");
  check((await page.locator(".wexit").getAttribute("href")) === "/raya-trade/mobile", "…and goes there");
  check((await page.locator(".wcycle").count()) === (want.review.open && !want.cycle ? 1 : 0), "the cycle chip is drawn exactly when the block is not (§200)");
  check((await page.locator(".wtour").count()) === (want.tour ? 1 : 0) && !(await page.locator(".wtour").getAttribute("open")), "the intro round is offered folded (§202)");
  await shot(page, "landing");
  /* a door goes somewhere that says what it is */
  const firstBtn = page.locator(".wacts .wact .wbtn").first();
  if (await firstBtn.count()) {
    const href = await firstBtn.getAttribute("href");
    await firstBtn.click(); await page.waitForLoadState("networkidle");
    check(page.url().startsWith(BASE + href), "a row's door opens its address", page.url());
    /* REWRITTEN, never loosened (§218): behind that door was a holder saying
       "not built"; Phase B put the product there, so what is asserted is that
       it opened THE PLACE THE ROW NAMES — the shell's own place, which then
       becomes the address (§173). */
    await page.waitForFunction(() => !document.documentElement.classList.contains("booting"));
    const at = await page.evaluate(() => [current, currentSub]);
    check(at[0] === "mobile" && !!at[1], "…and the shell opens on the place it names", JSON.stringify(at) + " " + page.url());
  } else fail("a row's door opens its address", "no row to press");
  /* the door bounces a live session straight through (§32) */
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  check(page.url() === BASE + "/raya-trade", "opening the door signed in goes straight through", page.url());
  /* another client's slug → their own; sign out → the door */
  await page.goto(BASE + "/somebody-else", { waitUntil: "networkidle" });
  check(page.url() === BASE + "/raya-trade", "a client user at another slug lands on their own (§313.36)", page.url());
  await page.goto(BASE + "/raya-trade/mobile/strategy", { waitUntil: "networkidle" });
  await page.waitForFunction(() => !document.documentElement.classList.contains("booting"));
  /* The holder's form is gone; sign out is the shell's own control, drawn by
     sync.js into the chrome, and it lands on the CLIENT's door (§313.36). */
  await Promise.all([page.waitForURL(BASE + "/raya-trade/sign-in"),
                     page.click('button:has-text("Sign out")')]);
  check((await page.locator("#login").count()) === 1, "sign out returns to the door");
  await page.goto(BASE + "/raya-trade", { waitUntil: "networkidle" });
  check(page.url() === BASE + "/raya-trade/sign-in", "signed out, a client's address sends you to that client's door (§313.36)", page.url());
});
await section("4 · a temporary password", async () => {
  ({ ctx, page } = await fresh());
  await page.goto(BASE + "/raya-trade/sign-in", { waitUntil: "networkidle" });
  await signIn(page, "own_mob@raya.example", "Temp-2026!");
  try { await page.waitForSelector("#change", { timeout: 10000 }); }
  catch { fail("the temporary password did not open the password card", "url " + page.url() + " cards " + JSON.stringify(await page.evaluate(() => [...document.querySelectorAll(".card")].map((c) => c.id))) + " error " + (await page.evaluate(() => document.querySelector("#error")?.textContent))); }
  check((await page.locator("#login").count()) === 0 && (await page.locator("#change .clientmark").count()) === 1, "a temporary password opens the password card, wearing the mark");
  await page.waitForSelector("#whereSel");
  const groups = await text(page, "#whereSel optgroup");
  const labels = await page.locator("#whereSel optgroup").evaluateAll((gs) => gs.map((g) => g.label));
  check(labels.length >= 2 && (await page.locator("#whereSel option").count()) > 5, "the where-question is asked of somebody the register has not placed", labels.join(" | "));
  await page.goto(BASE + "/raya-trade", { waitUntil: "networkidle" });
  check(page.url() === BASE + "/raya-trade/sign-in" && (await page.locator("#change").count()) === 1, "a temporary password reaches no page but the card (§43.2)", page.url());
  await page.fill("#newpw", "weak"); await page.fill("#newpw2", "weak");
  await page.click("#changeForm button[type=submit]"); await page.waitForSelector("#changeError", { state: "visible" });
  check((await page.locator("#changeError").textContent()).includes("at least 8 characters"), "the policy answers in words");
  await page.fill("#newpw", "Strong-Pass1!"); await page.fill("#newpw2", "Strong-Pass2!");
  await page.click("#changeForm button[type=submit]"); await page.waitForTimeout(200);
  check((await page.locator("#changeError").textContent()).trim() === "The two entries differ.", "two different entries are refused before anything is sent");
  await page.fill("#newpw2", "Strong-Pass1!");
  await page.selectOption("#whereSel", "mobile");
  await Promise.all([page.waitForURL(BASE + "/raya-trade"), page.click("#changeForm button[type=submit]")]);
  check(page.url() === BASE + "/raya-trade", "a chosen password lands where the sign-in would have", page.url());
  const decl = (await owner.query("SELECT at FROM bu_declarations WHERE tenant_id = $1 AND person_key = 'own_mob'", [tenant.id])).rows[0];
  check(decl && decl.at === "mobile", "the declaration is stored (§56)", JSON.stringify(decl));
  const mc = (await owner.query("SELECT must_change FROM users WHERE email = 'own_mob@raya.example'")).rows[0];
  check(mc && mc.must_change === false, "must_change is cleared");
  await shot(page, "landing-custodian");
});
await section("4b · a settled password", async () => {
  ({ ctx, page } = await fresh());
  await page.goto(BASE + "/raya-trade/sign-in", { waitUntil: "networkidle" });
  await signIn(page, "own_mob@raya.example", "Strong-Pass1!");
  await page.waitForURL(BASE + "/raya-trade");
  const r = await page.evaluate(async () => (await fetch("/api/auth/password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ next: "Another-Pass1!" }) })).status);
  check(r === 403, "a settled password is not changed without the current one", r);
});
await section("4c · already placed", async () => {
  await owner.query("UPDATE users SET must_change = true WHERE email = 'own_mob@raya.example'");
  await owner.query("UPDATE people SET unit_key = 'mobile' WHERE tenant_id = $1 AND key = 'own_mob'", [tenant.id]);
  ({ ctx, page } = await fresh());
  await page.goto(BASE + "/raya-trade/sign-in", { waitUntil: "networkidle" });
  await signIn(page, "own_mob@raya.example", "Strong-Pass1!");
  await page.waitForSelector("#change"); await page.waitForTimeout(600);
  check((await page.locator("#whereWrap").count()) === 0, "…and not asked of somebody already placed (§93.13)");
  await shot(page, "password");
  await owner.query("UPDATE users SET must_change = false WHERE email = 'own_mob@raya.example'");
});
await section("5 · the office", async () => {
  ({ ctx, page } = await fresh());
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await signIn(page, "office@forefront.example", "Raya-2026!");
  await page.waitForURL(BASE + "/platform");
  check(page.url() === BASE + "/platform", "the office lands on the platform's own address (contracts §2)");
  /* REWRITTEN (§218): a holder listed them; Phase B serves Forefront's own
     page, so the clients are its cards. */
  await page.waitForSelector(".ccard", { timeout: 15000 }).catch(() => {});
  check((await text(page, ".ccard h2")).includes("Raya Trade"), "…which lists the clients they may open");
  await page.goto(BASE + "/raya-trade", { waitUntil: "networkidle" });
  const officeWant = frozen.landing(graph, "smo");
  check((await page.locator(".welcomeover h2").textContent()).trim() === "Welcome, " + officeWant.name, "the office's landing on a client is theirs", await page.locator(".welcomeover h2").textContent());
  check((await page.locator(".wexit .wexlab").textContent()).trim() === officeWant.continueWord, "…and continues to the group");
  check((await text(page, ".wpages a"))[0].startsWith("Setup"), "…with Setup first among their pages");
  const r404 = await page.goto(BASE + "/no-such-client", { waitUntil: "networkidle" });
  const s1 = r404.status(), t1 = (await page.locator(".holder h1").textContent()).trim();
  /* a client that exists and is not theirs: make one */
  await owner.query("INSERT INTO tenants (key, name) VALUES ('other-co', 'Other Co') ON CONFLICT (key) DO NOTHING");
  await owner.query("UPDATE platform_access SET grant_ = 'none' WHERE role_key = 'consultant' AND area_key = 'other_clients'");
  await owner.query("UPDATE users SET is_admin = false WHERE email = 'office@forefront.example'");
  const r2 = await page.goto(BASE + "/other-co", { waitUntil: "networkidle" });
  const s2 = r2.status(), t2 = (await page.locator(".holder h1").textContent()).trim();
  check(s1 === 404 && s1 === s2 && t1 === t2 && t1 === "That client is not available.", "refused and non-existent answer identically (§313)", s1 + " " + t1 + " / " + s2 + " " + t2);
  await owner.query("UPDATE users SET is_admin = true WHERE email = 'office@forefront.example'");
  await owner.query("DELETE FROM tenants WHERE key = 'other-co'");
});
await section("6 · a client made here, opened by rule", async () => {
  /* THE LANDING ASKS THE REGISTER, NOT THE MEMBERSHIP. A Forefront admin
     opens a client BY RULE and holds no `tenant_users` row, and the landing
     read that row — so it told them *"You are not on X's register yet — the
     SMO places you from People"* on every such client, for ever, while
     `people` already held the row the state API places. Found by making the
     two empty clients Phase I asks for and OPENING one.

     THE CLIENT IS MADE THE PRODUCT'S OWN WAY, through Forefront's page,
     which is the other half of the same finding: a tenant INSERTed by hand
     holds no graph, and a tenant with no graph answers 404 at the state API
     and cannot be opened at all (`createClient` says so in its own comment
     and deletes the row if the load fails).

     BOTH ENDS (§94.2): before it is opened nobody IS on the register and the
     sentence is TRUE, and a check asserting only the second half would pass
     on a build that never draws it. */
  ({ ctx, page } = await fresh());
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await signIn(page, "office@forefront.example", "Raya-2026!");
  await page.waitForURL(BASE + "/platform");
  const key = "phase-i-" + Date.now().toString(36);
  const mk = await page.request.post(BASE + "/api/platform", { data: { action: "createClient", name: "Phase I " + key } });
  const made = (await mk.json()).key;
  check(mk.status() === 200 && made, "a client is made through Forefront's own page", mk.status());
  await page.goto(BASE + "/" + made, { waitUntil: "networkidle" });
  const first = await text(page, ".wact.wempty b");
  check(first.some((s) => /not on/.test(s)), "nobody on its register yet, and the landing says so", first);
  const r = await page.request.get(BASE + "/api/" + made + "/state");
  check(r.status() === 200, "…and it OPENS, because a made client starts on the cleared graph (§67)", r.status());
  const tid = (await owner.query("SELECT id FROM tenants WHERE key = $1", [made])).rows[0].id;
  const who = await withTenant(tid, async (c) => (await c.query("SELECT key FROM people")).rows.map((x) => x.key));
  check(who.length === 1, "…placing the office as exactly one row on the register (§313.32)", who);
  await page.goto(BASE + "/" + made, { waitUntil: "networkidle" });
  const again = await text(page, ".wact.wempty b");
  check(!again.some((s) => /not on/.test(s)), "…so the landing stops saying they are not on it", again);
  await owner.query("DELETE FROM tenants WHERE key = $1", [made]);
});


{
  await browser.close();
  try { process.kill(-server.pid, "SIGTERM"); } catch { server.kill(); }
  await owner.query("UPDATE people SET unit_key = 'mobile' WHERE tenant_id = $1 AND key = 'own_mob'", [tenant.id]).catch(() => {});
  await owner.end();
}
console.log((fails ? "RED   " : "GREEN ") + oks + " ok, " + fails + " failed");
process.exit(fails ? 1 : 0);
