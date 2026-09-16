/* The door, the way in, and the client's own Setup rail, driven in a real
   browser (spec 043's first screen group; §34, §313.36, §148; §357, spec
   055). Starts the BUILT app on its own port against the dev tenant
   (scripts/dev-tenant.mjs), then walks: the root door plain and a client's
   door wearing its mark; a wrong password refused in the one sentence; a
   sign-in REDIRECTED into the first module the person may open (§357 —
   `/<client>` is a door and nothing more) where Strategy's own welcome
   (welcome.js) greets them with the rows the frozen readers give — asserted
   as AGREEMENT with lib/frozen.cjs's own answer read off the same graph,
   never as literals (§94.8), and the one literal that IS the mockup's
   sign-off (the fourth line); a row's door reaching the place it names; a
   temporary password opening on the password card with the where-question
   asked only when the register has not answered; the declaration stored;
   the office's holder; the refusals — a client user sent to their own client,
   the office refused a client that is not theirs identically to one that
   does not exist, a signed-out person sent to the client's own door; and
   THE CLIENT'S SET-UP IN THE PLATFORM'S OWN SETUP RAIL (spec 055): the way
   back to the console, the Getting started strip that counts the data, the
   flow it opens, the registry written from step 1, Done with set-up stored
   as an absence and the strip becoming a row. Prints one line per property
   (§215) and ends RED/GREEN.

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/door-landing.mjs
     … --break=demo-role-key  (RED: the door reads §313.4's retired key — the demo 404s for the team, §337)
     … --break=other-role-key (RED: the same, one column over — the office's `open` never opens, §339)
     … --break=no-creator     (RED: making a client leaves its creator off its own team, §339)
     … --break=no-landing-stamp (RED: the Setup document carries no declaration, so the Landing line page draws nothing to pick, §356.4)
     … --break=done-dropped   (RED: Done with set-up is applied on screen and never reaches the store — lib/save.ts, §357)
     … --shots=<dir>          (also writes door.png, client-door.png, landing.png, password.png)

   THE STRIP HAS NO ENV HOOK AND IS FALSIFIED FROM THE SOURCES (§276): the
   Getting started strip is the frozen shell's (shell.html setupRail), served
   as the generated public/shell.js, and no server variable reaches it. To
   prove §7 can fail: invert the strip's condition in shell.html
   (`if (startDef && !SMPRules.setupDone(GROUP))` → `if (startDef &&
   SMPRules.setupDone(GROUP))`), `node scripts/build-shell.mjs`, run this
   RED (the strip absent before Done and drawn after it, the start row in the
   wrong place), restore the source, rebuild, and `git diff` the generated
   files back to the intended state. Done 2026-09-16: 17 red beyond the
   recorded product-fault line, every probe degrading (§215).

   §7 ALSO ASKS THE BARE ADDRESS, BECAUSE IT WAS A PRODUCT FAULT: the bare
   `/<client>/setup` — what the console's Settings and a module rail's
   "Client settings ›" both point at — landed on the person's entry page
   (shell/route.js writes `{d:"setup", s:null}` and restoreWhere() read a
   place with no page as nothing remembered), measured RED here first and
   fixed at §357.7: restoreWhere() lands a bare Setup place on the scoped
   rail's own first page. The rest of the rail is driven from
   `/<client>/setup/people`.

   Needs `next build` first and the chromium this image carries. */
import { spawn } from "node:child_process";
import { SCHEMA } from "../db/schema-name.mjs";   /* the shared schema is not `public` (§317.4) */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";
import pg from "pg";
import { devTenant } from "../scripts/dev-tenant.mjs";
import { MODULE_DEF, DEFAULT_MODULE } from "../lib/modules.ts";

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
const FFR = createRequire(import.meta.url)("../lib/platform-rules.cjs");
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
/* THE WELCOME IS OFFERED ON EVERY DEEP ADDRESS (§357), once a browser
   session, and it covers the viewport — so a context that presses anything
   under it waits thirty seconds on a click the overlay takes (§167.2's
   finding). Every context is born having seen it, through welcome.js's own
   memory, except the two whose subject IS the offer (§3, §5). */
async function fresh(offerWelcome = false) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
  if (!offerWelcome) await ctx.addInitScript(() => { try { sessionStorage.setItem("smp.welcome.done", "1"); } catch (e) {} });
  return { ctx, page: await ctx.newPage() };
}
const shot = async (page, name) => { if (shots) await page.screenshot({ path: join(shots, name + ".png"), fullPage: true }); };
const text = async (page, sel) => (await page.locator(sel).allTextContents()).map((s) => s.trim());
const hydrated = (page) => page.waitForSelector(".gate[data-hydrated]", { state: "attached", timeout: 15000 });
/* §357: a sign-in, a chosen password and a bounced door all END INSIDE THE
   FIRST MODULE — `/<client>` is a redirect, and the shell then writes the
   place into the address — so "landed" is the module's prefix, never the
   bare client address a check used to wait for. */
const IN_MODULE = "/raya-trade/" + DEFAULT_MODULE + "/";
const inModule = (page, slug = "raya-trade") => page.waitForURL((u) => u.pathname.startsWith("/" + slug + "/" + DEFAULT_MODULE + "/"), { timeout: 20000 }).catch(() => {});
const booted = (page) => page.waitForFunction(() => !document.documentElement.classList.contains("booting"), null, { timeout: 20000 });
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
  ({ ctx, page } = await fresh(true));
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await signIn(page, "mobhead@raya.example", "Raya-2026!");
  /* REWRITTEN, NEVER LOOSENED (§218): this waited for `/raya-trade` and read
     a landing page there. §357 (spec 055) made that address a REDIRECT into
     the first module the person may open, and the welcome is Strategy's own
     welcome.js overlay again — so what is asserted is the redirect itself
     (a request with no redirect-following, the Location read off it) and
     then the overlay's rows as AGREEMENT with the frozen reader, exactly as
     before: the reader (lib/frozen.cjs __smpLanding) is welcome.js's own
     arithmetic, so a row welcome.js draws and the reader does not is a drift
     between the two (§53.5). What the overlay does not draw is dropped and
     not loosened: its rows are BUTTONS pressing the platform's own controls
     and its way out is a button too, so there is no href to read — the
     press is asserted instead (§70). */
  await inModule(page);
  check(page.url().startsWith(BASE + IN_MODULE), "a client user lands inside their first module (§94.6, §357)", page.url());
  const hop = await page.request.get(BASE + "/raya-trade", { maxRedirects: 0 });
  const loc = hop.headers().location || "";
  check(hop.status() >= 300 && hop.status() < 400 && /\/raya-trade\/strategy$/.test(loc), "…/<client> is a redirect into it and no page of its own (§357)", hop.status() + " " + loc);
  check(loc.endsWith("/" + DEFAULT_MODULE), "…the first module the person may open — Strategy, for a unit head (openableModules, §356.5)", loc);
  await booted(page);
  check((await page.locator(".welcomeover").count()) === 1, "Strategy's own welcome is offered there, once a session (welcome.js, §357)");
  check((await page.locator(".welcomeover h2").textContent().catch(() => "")).trim() === "Welcome, " + want.name, "the greeting names the register's first name", await page.locator(".welcomeover h2").textContent().catch(() => ""));
  const chips = await text(page, ".wwho .wchip:not(.wcycle)");
  const wantChips = want.chips.map((c) => c.role + (c.where ? " · " + c.where : ""));
  check(wantChips.length > 0 && wantChips.every((c) => chips.includes(c)), "the role chips are personRoles()'s own", chips.join(" | "));
  check((await page.locator(".wtenant h1").textContent().catch(() => "")).trim() === want.org, "the tenant's name is the graph's org");
  const titles = await text(page, ".wacts .wact:not(.wempty):not(.wact-reply) .wwhat b");
  check(titles.length === want.acts.length && want.acts.every((a, i) => titles[i] === a.title), "the rows are the frozen readers' rows, in their order", titles.join(" | ") + " ⟂ " + want.acts.map((a) => a.title).join(" | "));
  const alerts = await text(page, ".wacts .walert");
  const wantAlerts = want.acts.flatMap((a) => a.sub.filter((p) => p.kind === "alert").map((p) => p.text));
  check(alerts.join("|") === wantAlerts.join("|"), "…with the same alerts under them", alerts.join("|"));
  const pages = await text(page, ".wpages a");
  check(pages.length === want.pages.length && want.pages.every((p, i) => pages[i].startsWith(p.label)), "Your pages are the reader's pages", pages.join(" | "));
  check((await page.locator(".wexit .wexlab").textContent().catch(() => "")).trim() === want.continueWord, "the way out names where it goes (§202)", await page.locator(".wexit .wexlab").textContent().catch(() => ""));
  check((await page.locator(".wcycle").count()) === (want.review.open && !want.cycle ? 1 : 0), "the cycle chip is drawn exactly when the block is not (§200)");
  /* the overlay always builds the card and HIDES it for somebody no story
     fits, so what is asserted is the visible card, folded (§202) */
  check((await page.locator(".wtour:not([hidden])").count()) === (want.tour ? 1 : 0) && (!want.tour || await page.locator(".wtour [data-wtourbody]").getAttribute("hidden") !== null), "the intro round is offered folded (§202)");
  await shot(page, "landing");
  /* a row's door goes somewhere that says what it is — a BUTTON pressing the
     platform's own controls, so the press is the assertion (§70) */
  const firstBtn = page.locator(".wacts .wact:not(.wempty):not(.wact-reply) .wbtn").first();
  if (await firstBtn.count()) {
    await firstBtn.click(); await page.waitForTimeout(800);
    check((await page.locator(".welcomeover").count()) === 0, "a row's door puts the welcome away");
    const at = await page.evaluate(() => [current, currentSub]);
    check(at[0] === "mobile" && !!at[1] && page.url().startsWith(BASE + IN_MODULE + "mobile/"), "…and the shell opens on the place it names, which becomes the address (§173)", JSON.stringify(at) + " " + page.url());
  } else fail("a row's door opens the place it names", "no row to press");
  /* the door bounces a live session straight through (§32) */
  await page.goto(BASE + "/", { waitUntil: "networkidle" }); await inModule(page);
  check(page.url().startsWith(BASE + IN_MODULE), "opening the door signed in goes straight through, into the module", page.url());
  /* another client's slug → their own; sign out → the door */
  await page.goto(BASE + "/somebody-else", { waitUntil: "networkidle" }); await inModule(page);
  check(page.url().startsWith(BASE + IN_MODULE), "a client user at another slug lands on their own (§313.36)", page.url());
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
  await page.click("#changeForm button[type=submit]"); await inModule(page);
  check(page.url().startsWith(BASE + IN_MODULE), "a chosen password lands where the sign-in would have — inside the module (§357)", page.url());
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
  await inModule(page);
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
  ({ ctx, page } = await fresh(true));
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await signIn(page, "office@forefront.example", "Raya-2026!");
  await page.waitForURL(BASE + "/platform");
  check(page.url() === BASE + "/platform", "the office lands on the platform's own address (contracts §2)");
  /* REWRITTEN (§218): a holder listed them; Phase B serves Forefront's own
     page, so the clients are its cards. */
  await page.waitForSelector(".ccard", { timeout: 15000 }).catch(() => {});
  check((await text(page, ".ccard h2")).includes("Raya Trade"), "…which lists the clients they may open");
  await page.goto(BASE + "/raya-trade", { waitUntil: "networkidle" }); await inModule(page); await booted(page);
  check(page.url().startsWith(BASE + IN_MODULE), "the office opening a client is sent into its first module too (§357)", page.url());
  const officeWant = frozen.landing(graph, "smo");
  check((await page.locator(".welcomeover h2").textContent().catch(() => "")).trim() === "Welcome, " + officeWant.name, "the office's welcome on a client is theirs", await page.locator(".welcomeover h2").textContent().catch(() => ""));
  check((await page.locator(".wexit .wexlab").textContent().catch(() => "")).trim() === officeWant.continueWord, "…and continues to the group");
  check(((await text(page, ".wpages a"))[0] || "").startsWith("Setup"), "…with Setup first among their pages");
  const r404 = await page.goto(BASE + "/no-such-client", { waitUntil: "networkidle" });
  const s1 = r404.status(), t1 = (await page.locator(".holder h1").textContent()).trim();
  /* a client that exists and is not theirs: make one */
  await owner.query("INSERT INTO tenants (key, name) VALUES ('other-co', 'Other Co') ON CONFLICT (key) DO NOTHING");
  /* REWRITTEN, NOT LOOSENED (§218): this wrote the RETIRED `consultant` key
     (§313.4), which 001-seats deletes — an UPDATE matching no row, so the
     refusal below was the shipped default's and never the office's setting.
     It writes `everyone` now, so what is asserted is a choice somebody made. */
  await owner.query("INSERT INTO platform_access (role_key, area_key, grant_) VALUES ($1,'other_clients','hidden') ON CONFLICT (role_key, area_key) DO UPDATE SET grant_ = EXCLUDED.grant_", [FFR.EVERYONE]);
  await owner.query("UPDATE users SET is_admin = false WHERE email = 'office@forefront.example'");
  const r2 = await page.goto(BASE + "/other-co", { waitUntil: "networkidle" });
  const s2 = r2.status(), t2 = (await page.locator(".holder h1").textContent()).trim();
  check(s1 === 404 && s1 === s2 && t1 === t2 && t1 === "That client is not available.", "refused and non-existent answer identically (§313)", s1 + " " + t1 + " / " + s2 + " " + t2);
  await owner.query("UPDATE users SET is_admin = true WHERE email = 'office@forefront.example'");
  await owner.query("DELETE FROM tenants WHERE key = 'other-co'");
});
await section("5b · the office's two columns answer for a consultant who holds no seat (§337, §339)", async () => {
  /* THE FAULT THIS EXISTS FOR: the door asked the office's matrix under a
     role key §313.4 retired (`consultant`) and read the miss as a refusal, so
     `/demo` answered 404 *"That client is not available."* for every
     consultant holding no seat — in EVERY state of the table, `edit`
     included, so no setting opened it. The cards are drawn from the frozen
     rules, which said `open`: the screen offered what the door refused.

     ASSERTED AS AGREEMENT WITH lib/platform-rules.cjs, NEVER AS A LITERAL
     (§94.8, §53.5). Two independent implementations of one question have to
     give one answer — which is the property that broke — and a build that
     dropped the demo column entirely cannot satisfy it, because the frozen
     side still answers `open`.

     BOTH ENDS (§94.2): `none` must still REFUSE, or a door flung open for
     everybody passes every assertion about the demo being reachable and
     takes the office's off switch with it.

     NO BROWSER AND NO TENANT ROW HERE, deliberately (§113.8): a demo tenant
     INSERTed for a check holds no graph, and a tenant with no graph answers
     404 at the state API for a reason of its own (§316.9) — so a page-level
     probe would go green on the broken build for the wrong reason. */
  const { clientState, mayOpen } = await import("../lib/door.ts");
  const FF = (await import("node:module")).createRequire(import.meta.url)("../lib/platform-rules.cjs");
  /* AND THE BREAK HAD TO BE MADE TO REACH THIS SECTION (§339). It runs
     IN-PROCESS — the tenant is a literal, deliberately (§113.8) — while
     `--break=` was only ever put in the SERVER's env, so `ffGrant` here read
     an unset variable and these lines have never once been falsifiable: a
     check written to prove it can fail, that could not. Set for this section
     ONLY and restored, because this file also imports `lib/landing.ts`,
     `lib/modules.ts` and `lib/state-io.ts`, which read the same variable for
     their own breaks — leaving it set would break the check's own helpers and
     report a correct build broken (§100.3). */
  const wasBreak = process.env.SMP_BREAK;
  if (brk) process.env.SMP_BREAK = brk;   /* read at call time, so this lands */
  try {
  const demo = { id: "t-demo", key: "demo", name: "Demo", kind: "demo", status: "active", made_here: true, mark: null };
  const other = { id: "t-other", key: "other-co", name: "Other Co", kind: "client", status: "active", made_here: true, mark: null };
  const consultant = { id: "u-x", kind: "office", isAdmin: false, mustChange: false };
  const account = { email: "c@forefront.example", is_admin: false, kind: "office", status: "active" };
  const states = [
    [demo, "nothing stored — the shipped default answers (§30.2)", {}, true],
    [demo, "the office saved demo = edit", { [FF.EVERYONE]: { demo: "edit" } }, true],
    [demo, "the office saved demo = view", { [FF.EVERYONE]: { demo: "view" } }, true],
    [demo, "the office saved demo = none", { [FF.EVERYONE]: { demo: "none" } }, false],
    /* §339 — THE SAME COLUMN ONE AREA OVER, and the both-ends half is the
       point: `open` has to OPEN, or the office's setting is still decoration;
       `listed` and `hidden` have to REFUSE, or a door flung open for
       everybody passes the first line and hands out every client's data. */
    [other, "nothing stored — a client they are not on ships LISTED, so refused", {}, false],
    [other, "the office saved other_clients = open", { [FF.EVERYONE]: { other_clients: "open" } }, true],
    [other, "the office saved other_clients = listed (a name, nothing behind it)", { [FF.EVERYONE]: { other_clients: "listed" } }, false],
    [other, "the office saved other_clients = hidden", { [FF.EVERYONE]: { other_clients: "hidden" } }, false],
  ];
  for (const [tenant, what, access, want] of states) {
    const door = mayOpen(consultant, [], access, tenant);
    const cards = FF.mayOpenClient({ mine: [], access }, account, tenant);
    check(door === want, "the door: " + what + " → " + (want ? "opens" : "refused"), "door=" + door);
    check(door === cards, "…and the cards say the same thing (§42)", "door=" + door + " cards=" + cards);
  }
  /* AND THE DEFAULT IS ASSERTED TO BE THE FROZEN MODULE'S, never a literal
     here: this file must not become the second place that decides what a
     client somebody holds no seat on ships at (§94.8). */
  check(FF.ACCESS_DEFAULTS[FF.EVERYONE].other_clients === "listed",
    "…and the shipped default is still `listed` — nobody's access moved today", FF.ACCESS_DEFAULTS[FF.EVERYONE].other_clients);
  } finally { if (wasBreak === undefined) delete process.env.SMP_BREAK; else process.env.SMP_BREAK = wasBreak; }
  /* NO SOURCE-TEXT ASSERTION HERE, and the first draft's is why: it searched
     door.ts for the retired key and went RED on the fixed build, because
     `--break=demo-role-key` spells that very call to restore the fault. A
     check that cannot tell the defect from the switch that reproduces it
     reports a correct build broken (§100.3, §296.1). The behaviour above is
     the assertion; the break is what proves it can fail. */
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

     BOTH ENDS (§94.2): the empty register IS a real state and the sentence
     is TRUE there, and a check asserting only the second half would pass on
     a build that never draws it.

     REWRITTEN, NOT LOOSENED (§218), FOR §339: the empty state used to be how
     every client started, and the creator is now written onto the register
     and the team as the client is made — so what is asserted first is the
     NEW property, and the empty state is then MADE (the creator's row and
     membership removed) rather than waited for, because it is still reachable
     on a client made before today or one whose creator was taken off the
     team. Deleting that half would have left §313.32's finding unguarded. */
  ({ ctx, page } = await fresh());
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await signIn(page, "office@forefront.example", "Raya-2026!");
  await page.waitForURL(BASE + "/platform");
  const key = "phase-i-" + Date.now().toString(36);
  const mk = await page.request.post(BASE + "/api/platform", { data: { action: "createClient", name: "Phase I " + key } });
  const made = (await mk.json()).key;
  check(mk.status() === 200 && made, "a client is made through Forefront's own page", mk.status());
  const tid = (await owner.query("SELECT id FROM tenants WHERE key = $1", [made])).rows[0].id;

  /* §339 — WITHOUT OPENING IT: the row and the seat are written by the act of
     making the client, not by the first page load, which is the whole of what
     §338's heal was compensating for. Read from the DATA, never the screen. */
  const seat = (await owner.query(
    "SELECT u.email, m.seat, m.person_key FROM tenant_users m JOIN users u ON u.id = m.user_id WHERE m.tenant_id = $1", [tid])).rows;
  check(seat.length === 1 && seat[0].email === "office@forefront.example" && seat[0].seat === "super",
    "whoever made it is on its team as Super user from the start (§339)", JSON.stringify(seat));
  const born = await withTenant(tid, async (c) => (await c.query("SELECT key, role, extra->>'ffrow' AS ff FROM people")).rows);
  check(born.length === 1 && born[0].key === (seat[0] || {}).person_key && born[0].role === "super" && born[0].ff === "true",
    "…with exactly that one row on its register, and nobody invented beside them", JSON.stringify(born));
  const r = await page.request.get(BASE + "/api/" + made + "/state");
  check(r.status() === 200, "…and it OPENS, because a made client starts on the cleared graph (§67)", r.status());
  /* REWRITTEN, NEVER LOOSENED (§218): the landing that said "you are not on
     X's register yet" is gone (§357) — `/<made>` is a redirect into the
     module, whose boot IS a state request. So what is asserted is that the
     client OPENS for its creator: the redirect lands, the shell boots, and
     no refusal is drawn. */
  await page.goto(BASE + "/" + made, { waitUntil: "networkidle" }); await inModule(page, made);
  await booted(page).catch(() => {});
  const nowAt = await page.evaluate(() => (typeof current !== "undefined" ? current : null)).catch(() => null);
  check(page.url().startsWith(BASE + "/" + made + "/" + DEFAULT_MODULE + "/") && !!nowAt && (await page.locator(".holder h1").count()) === 0,
    "…and its creator opening it lands inside the module with the shell booted, refused nothing", page.url() + " " + nowAt);

  /* THE OTHER END, MADE: an admin opening a client they did NOT make — or one
     made before today — still holds no seat, and that is the state §313.32 is
     about. Take both away and open it again. */
  /* THE FIRST CONTEXT IS CLOSED BEFORE THE ROW GOES: its open page polls the
     state API, and every state request re-places the office (officeRow), so
     a count taken with it open reads the row the poll had just put back —
     the check's own first run called a correct build broken here (§100.3). */
  await ctx.close(); ctx = null; page = null;
  await owner.query("DELETE FROM tenant_users WHERE tenant_id = $1", [tid]);
  await withTenant(tid, (c) => c.query("DELETE FROM people"));
  ({ ctx, page } = await fresh());
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await signIn(page, "office@forefront.example", "Raya-2026!");
  await page.waitForURL(BASE + "/platform");
  const none = await withTenant(tid, async (c) => (await c.query("SELECT key FROM people")).rows.length);
  check(none === 0, "nobody on its register (the state MADE, §94.2)", none);
  /* REWRITTEN (§218): the landing that only READ is gone (§357); opening the
     client now goes straight into the module, whose boot asks the state API
     — and THAT is the request that places them (officeRow, §313.32; a reader
     that creates what it looked for is how a phantom change reaches every
     save, §316.9, which is why it was never the landing's to do). */
  await page.goto(BASE + "/" + made, { waitUntil: "networkidle" }); await inModule(page, made);
  await booted(page).catch(() => {});
  const who = await withTenant(tid, async (c) => (await c.query("SELECT key FROM people")).rows.map((x) => x.key));
  check(who.length === 1, "…and opening it places the office as exactly one row on the register (§313.32)", who);
  const at2 = await page.evaluate(() => (typeof current !== "undefined" ? current : null)).catch(() => null);
  check(page.url().startsWith(BASE + "/" + made + "/" + DEFAULT_MODULE + "/") && !!at2, "…with the shell booted rather than a refusal drawn", page.url() + " " + at2);
  await owner.query("DELETE FROM tenants WHERE key = $1", [made]);
});


/* ══ THE CLIENT'S SET-UP IN THE PLATFORM'S OWN SETUP RAIL (§357, spec 055) ══
   REWRITTEN, NEVER LOOSENED (§218): this section asserted spec 054 §4.1's
   Client setup block and Your modules list on the landing, both of which
   went with the landing. What replaced them is the client's own Setup rail
   at `/<client>/setup/…`, scope `client`: a way back to the console, the
   Getting started strip while the set-up is not done — its count asserted
   as AGREEMENT with CLIENTSETUP.progress() read in the page (§94.8), never a
   number typed here — the flow it opens, step 1 reading the registry the
   database holds and WRITING it (a typed name read back off `tenants`,
   §96), Branding and the modules band inside the flow, and Done with set-up
   stored as an absence on the group and read by the next paint: the strip
   gone, the def a row in the last group under its second name. Both ends
   (§94.2): the strip present BEFORE and absent AFTER, the row absent BEFORE
   and present AFTER, or a build that never drew either passes half. Put
   back in a finally. A module's rail is asserted to carry the reverse door
   and NO strip, and a client's own person asking for the client's rail is
   measured rather than assumed. */
await section("7 · the client's set-up lives in its own Setup rail (§357, spec 055)", async () => {
  const goto = async (path) => { await page.goto(BASE + path, { waitUntil: "load" }); await booted(page); await page.waitForTimeout(700); };
  const readRail = () => page.evaluate(() => {
    const q = (s) => document.querySelector(s), t = (s) => (q(s) ? q(s).textContent.trim() : null);
    const start = q('.setuprail .rgitems .ritem[data-setupgo="start"]');
    return { path: location.pathname, d: typeof current !== "undefined" ? current : null, s: typeof currentSub !== "undefined" ? currentSub : null,
      scope: document.documentElement.getAttribute("data-setup-scope"), rail: !!q(".setuprail"),
      back: q(".setuprail .railback") ? { text: t(".setuprail .railback"), href: q(".setuprail .railback").getAttribute("href"), fwd: q(".setuprail .railback").classList.contains("railfwd") } : null,
      strip: q(".setuprail .railstart") ? { go: q(".setuprail .railstart").dataset.setupgo, lab: t(".setuprail .rslab"), prog: t(".setuprail .rsprog") } : null,
      progress: (typeof CLIENTSETUP !== "undefined" && CLIENTSETUP.progress) ? CLIENTSETUP.progress() : null,
      groups: [...document.querySelectorAll(".setuprail [data-railgrp]")].map((e) => e.dataset.railgrp),
      startRow: start ? { grp: (start.closest("[data-railitems]") || { dataset: {} }).dataset.railitems, label: (start.querySelector(".rilab") || {}).textContent } : null,
      csetup: !!q(".csetup"), step: (q('.wzstep[aria-current="step"]') || { dataset: {} }).dataset.step,
      steps: [...document.querySelectorAll(".wzstep")].map((e) => e.dataset.step),
      wzdone: !!q("[data-wzdone]"), brand: document.querySelectorAll(".csetup [data-brand]").length, glogo: document.querySelectorAll(".csetup [data-glogo]").length,
      band: t(".csetup .band .lab"), name: (q(".csetup .rowset input.fld") || {}).value,
      done: (typeof GROUP !== "undefined" && GROUP) ? GROUP.setupDone : undefined, head: t("#panel .secttl, #panel h1") };
  });
  const storedDone = async () => { const st = await (await page.request.get(BASE + "/api/raya-trade/state")).json(); return st.state && st.state.group ? st.state.group.setupDone : null; };
  const regName = async () => (await owner.query("SELECT name FROM tenants WHERE id = $1", [tenant.id])).rows[0].name;
  const nameBefore = await regName();
  ({ ctx, page } = await fresh());
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await signIn(page, "office@forefront.example", "Raya-2026!");
  await page.waitForURL(BASE + "/platform");
  /* THE BARE DOOR FIRST, in a fresh context so no remembered place can
     answer for it: the console's Settings and a module rail's Client settings
     both assign `/<client>/setup`. */
  await goto("/raya-trade/setup");
  let r = await readRail();
  check(r.d === "setup" && r.scope === "client" && r.rail, "the bare address the console's Settings and a module rail's Client settings › both point at opens the client's rail", JSON.stringify([r.path, r.d, r.s, r.scope]));
  /* THE RAIL, from a page that is the client's */
  await goto("/raya-trade/setup/people");
  r = await readRail();
  check(r.d === "setup" && r.s === "people" && r.scope === "client" && r.rail, "a client page opens in the client's rail (data-setup-scope client)", JSON.stringify([r.d, r.s, r.scope]));
  check(!!r.back && !r.back.fwd && r.back.href === "/platform" && /Back to the console/.test(r.back.text), "…whose way back is the console (§357: there is no landing to go back to)", JSON.stringify(r.back));
  check(!!r.strip && r.strip.go === "start" && r.strip.lab === "Getting started", "…and Getting started is a STRIP under the head while the set-up is not done", JSON.stringify(r.strip));
  check(!!r.strip && !!r.progress && r.strip.prog.startsWith(r.progress.done + " of " + r.progress.total + " done"), "…counting what the data holds an answer for — AGREEMENT with CLIENTSETUP.progress(), never a number (§94.8, §129)", JSON.stringify([r.strip && r.strip.prog, r.progress]));
  check(!!r.progress && r.progress.total === 7, "…out of the flow's seven steps", JSON.stringify(r.progress));
  check(r.startRow === null && !r.groups.includes("look"), "…with the start def OUT of the groups, and no Branding group (it lives inside the flow now)", JSON.stringify([r.startRow, r.groups]));
  /* THE STRIP OPENS THE FLOW */
  const strip = page.locator('.setuprail .railstart[data-setupgo="start"]');
  if (await strip.count()) { await strip.click(); await page.waitForTimeout(1200); }
  else fail("pressing the strip", "no strip to press");
  r = await readRail();
  check(r.s === "start" && r.csetup && r.path === "/raya-trade/setup/start", "pressing it opens the flow at the client's own address", JSON.stringify([r.s, r.csetup, r.path]));
  check(r.steps.join(",") === "client,units,cos,fns,caps,words,office" && r.step === "client", "…on step 1 of seven, the client itself", JSON.stringify([r.steps, r.step]));
  check(r.name === nameBefore, "step 1 shows the name the registry holds — AGREEMENT with tenants.name", JSON.stringify([r.name, nameBefore]));
  check(r.brand > 0 && r.glogo > 0, "Branding's colour and mark controls are inside the flow (the brand def is gone)", JSON.stringify([r.brand, r.glogo]));
  check(r.band === "Modules this client has", "…and so is the modules band, on step 1", r.band);
  check(r.wzdone, "…and Done with set-up is offered while it is not done");
  /* STEP 1 WRITES THE REGISTRY: a typed name, blurred, posts saveClient */
  const nameBox = page.locator(".csetup .rowset input.fld").first();
  try {
    if (await nameBox.count()) {
      await nameBox.fill(nameBefore + " (renamed)"); await nameBox.press("Tab"); await page.waitForTimeout(1500);
      check((await regName()) === nameBefore + " (renamed)", "a name typed into step 1 and left is the registry's (saveClient on change, §35)", await regName());
    } else fail("typing a name into step 1", "no name box");
  } finally { await owner.query("UPDATE tenants SET name = $2 WHERE id = $1", [tenant.id, nameBefore]); }
  /* DONE WITH SET-UP */
  try {
    const done = page.locator("[data-wzdone]");
    if (await done.count()) { await done.click(); await page.waitForTimeout(800); }
    else fail("pressing Done with set-up", "no button");
    r = await readRail();
    check(r.done === true, "Done with set-up marks the group in the page (SMPRules.SETUP_DONE)", String(r.done));
    let st = null;
    for (let i = 0; i < 16 && st !== true; i++) { await page.waitForTimeout(500); st = await storedDone(); }
    check(st === true, "…and the autosave carries it to the store (read off the state API)", String(st));
    check(r.strip === null && !!r.startRow && r.startRow.grp === "client" && r.startRow.label === "Client set-up", "…so the strip is gone and the def is a row in the last group, The client, named Client set-up", JSON.stringify([r.strip, r.startRow, r.groups]));
    check(r.groups[r.groups.length - 1] === "client", "…which is the LAST group on the rail", JSON.stringify(r.groups));
    check(!r.wzdone && r.head === "Client set-up", "…and the page wears its second name with no Done to press again", JSON.stringify([r.wzdone, r.head]));
    /* the next PAINT reads it — a reload draws the rail from the store */
    await goto("/raya-trade/setup/people");
    r = await readRail();
    check(r.strip === null && !!r.startRow && r.startRow.label === "Client set-up", "…and a fresh paint draws the same, from the store", JSON.stringify([r.strip, r.startRow]));
  } finally {
    await owner.query("UPDATE org SET extra = extra - 'setupDone' WHERE tenant_id = $1", [tenant.id]).catch(() => {});
  }
  check((await storedDone()) == null, "put back: the key is DELETED, so the tenant is not-done again (§50.6, §94.2)", String(await storedDone()));
  /* A MODULE'S RAIL carries the reverse door and no strip */
  await goto("/raya-trade/strategy/setup/cycle");
  r = await readRail();
  check(r.scope === "strategy" && !!r.back && r.back.fwd && r.back.href === "/raya-trade/setup" && /Client settings/.test(r.back.text), "a module's rail carries Client settings › to the client's rail", JSON.stringify([r.scope, r.back]));
  check(r.strip === null && r.startRow === null && !r.groups.includes("client"), "…and neither the strip nor the row — the set-up is the client's, not the module's", JSON.stringify([r.strip, r.startRow, r.groups]));
  check(r.groups.includes("help"), "…while the Knowledge base is back on Strategy's rail (kb is mod strategy)", JSON.stringify(r.groups));
  await ctx.close();
  /* A CLIENT'S OWN PERSON asking for the client's rail: MEASURED. The route
     gates a MODULE's address and serves the spine's pages to anybody the
     door let in (route.ts), and the shell then lands them where they work
     because no def of that rail is theirs — so nothing of the rail is drawn
     and nothing is refused in words. Asserted as what it does, not as a
     refusal invented here. */
  ({ ctx, page } = await fresh());
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await signIn(page, "mobhead@raya.example", "Raya-2026!");
  await inModule(page);
  const served = await page.request.get(BASE + "/raya-trade/setup/people", { maxRedirects: 0 });
  await goto("/raya-trade/setup/people");
  r = await readRail();
  check(served.status() === 200 && r.d === "mobile" && !r.rail && !r.csetup, "a unit head asking for the client's rail is served the document and landed on their own place, with none of the rail drawn", JSON.stringify([served.status(), r.d, r.s, r.rail, r.csetup]));
  await ctx.close();
});


/* ══ THE LANDING LINE (spec 054 §4.5, §356.4) ═══════════════════════════
   Declared on the module, chosen on its Landing line page, stored on the
   group, drawn in two places — and the three must AGREE (§53.5): what the
   page offers is the document's own stamp, what the landing says is the
   one reader's answer for the pick, and what the console's card says is the
   same. Driven through the real page, the pick read back off the STORED
   graph (§96), and put back to the default in a finally (§94.2). */
await section("8 · the landing line, chosen on Strategy's Setup and read on the card", async () => {
  ({ ctx, page } = await fresh());
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await signIn(page, "office@forefront.example", "Raya-2026!");
  await page.waitForURL(BASE + "/platform");
  const booted = () => page.waitForFunction(() => !document.documentElement.classList.contains("booting"));
  const readPage = () => page.evaluate(() => {
    const raw = document.documentElement.getAttribute("data-landing");
    let stamp = null; try { stamp = raw ? JSON.parse(raw) : null; } catch (e) {}
    return { stamp, sub: currentSub, scope: document.documentElement.getAttribute("data-setup-scope"),
      radios: [...document.querySelectorAll("[data-landpick]")].map((r) => [r.dataset.landpick, r.checked, r.disabled]),
      labels: [...document.querySelectorAll(".lopt b")].map((b) => b.textContent),
      prev: (document.querySelector(".lrow .lll") || {}).textContent, prevKey: (document.querySelector(".lrow") || { dataset: {} }).dataset.landprev,
      none: !!document.querySelector(".lnone"), stored: (typeof GROUP !== "undefined" && GROUP.landing) || null };
  });
  /* the state API answers `{ ok, state }` (sync.js hydrates `data.state`) —
     the first draft read `st.group` and the default's "key deleted" passed on
     null either way (§113.8), so the pick is asserted PRESENT first */
  const stored = async () => { const st = await (await page.request.get(BASE + "/api/raya-trade/state")).json(); const g = st.state && st.state.group; return (g && g.landing) || null; };
  const cardLine = async () => { const j = await (await page.request.post(BASE + "/api/platform", { data: { action: "cards" } })).json();
    const c = (j.cards || []).find((x) => x.key === "raya-trade"); const m = c && (c.modules || []).find((x) => x.key === "strategy"); return m ? m.line : null; };
  /* the landing's own row went with the landing (§357); what is left to
     agree are the Setup page and the console's card (§53.5) */
  await page.goto(BASE + "/raya-trade/strategy/setup/landing", { waitUntil: "networkidle" }); await booted(); await page.waitForTimeout(500);
  let r = await readPage();
  check(r.sub === "landing" && r.scope === "strategy", "the Landing line page is on Strategy's own rail", JSON.stringify([r.sub, r.scope]));
  check(!!r.stamp && r.stamp.module === "strategy", "the Setup document carries Strategy's declaration", JSON.stringify(r.stamp && r.stamp.module));
  const decl = MODULE_DEF.strategy.lines.map((l) => l.key);
  check(!!r.stamp && r.stamp.lines.map((l) => l.key).join(",") === decl.join(","), "…the module's own lines, in its order", JSON.stringify(r.stamp && r.stamp.lines.map((l) => l.key)));
  check(r.radios.length === decl.length && r.radios.every((x, i) => x[0] === decl[i] && !x[2]), "the page offers exactly those, live for the office", JSON.stringify(r.radios));
  check(!r.none, "…and never the no-stamp sentence", r.none);
  check(r.radios[0] && r.radios[0][1] === true && (await stored()) === null, "with nothing stored the FIRST line is lit — the default is an absence (§50.6)", JSON.stringify([r.radios, await stored()]));
  check(!!r.stamp && r.prev === r.stamp.lines[0].text && !!r.prev, "the preview under the list is the stamp's own text for it", JSON.stringify([r.prev, r.stamp && r.stamp.lines[0].text]));
  const before = await cardLine();
  check(!!r.stamp && before === r.stamp.lines[0].text, "the console's card says the same sentence (one reader, §53.5)", JSON.stringify([before, r.stamp && r.stamp.lines[0].text]));
  /* THE PICK */
  const want = r.stamp ? r.stamp.lines[1] : null;
  /* EVERY PRESS IS GUARDED (§215): on the no-stamp build there is nothing to
     press, and a click that waits thirty seconds on it takes the six
     assertions after it down without reporting them. */
  const pick = async (key) => {
    const row = page.locator('.lopt:has([data-landpick="' + key + '"])');
    if (!(await row.count())) { fail("pressing the " + key + " line", "no such row to press"); return false; }
    await row.click(); await page.waitForTimeout(2500); return true;
  };
  try {
    await pick("waiting");
    r = await readPage();
    const lit = r.radios.find((x) => x[0] === "waiting");
    check(!!lit && lit[1] === true && r.prevKey === "waiting" && !!want && r.prev === want.text, "a pick lights its row and moves the preview to that line's text", JSON.stringify([r.radios, r.prev]));
    const st = await stored();
    check(!!st && st.strategy === "waiting", "…and is STORED on the group under the module's key (read off the server)", JSON.stringify(st));
    check(want && (await cardLine()) === want.text, "…and the console's card now says that line (the landing's row went with the landing, §357)", JSON.stringify(await cardLine()));
    /* THE DEFAULT DELETES THE KEY */
    await page.goto(BASE + "/raya-trade/strategy/setup/landing", { waitUntil: "networkidle" }); await booted(); await page.waitForTimeout(500);
    await pick("cycle");
    check((await stored()) === null, "picking the default again DELETES the key, so never-set and set-then-cleared are the same bytes (§50.6)", JSON.stringify(await stored()));
    /* NOTHING is a choice, drawn as a row with no line */
    await pick("none");
    check((await cardLine()) === "", "Nothing keeps the card's row and draws no line under it", JSON.stringify(await cardLine()));
  } finally {
    await owner.query("UPDATE org SET extra = extra - 'landing' WHERE tenant_id = $1", [tenant.id]).catch(() => {});
  }
  await ctx.close();
});


/* ══ INSIGHTS' OWN SETUP: ACCESS AND LANDING LINE (spec 054 §4.4, §356.5) ══
   The first page that READS a module's declared areas. Driven through the
   REAL page as the Super user, the grant read back off the STORED graph
   through the tenant (§96), and then the door pressed by the people the
   grant is about — BOTH ENDS (§94.2): shut, a unit head is refused by the
   module's own address, its Setup address, its landing row and the switcher;
   opened again, served; the seat served over a shut row; the SMO team shown
   the table and given no button (§89). Strategy's matrix is asserted
   byte-identical before and after (spec 054 §6.4). Put back in a finally. */
await section("9 · Insights' Setup: Access writes a grant the door reads (spec 054 §4.4)", async () => {
  const booted = () => page.waitForFunction(() => !document.documentElement.classList.contains("booting"));
  const storedAccess = async () => { const st = await (await page.request.get(BASE + "/api/raya-trade/state")).json(); return (st.state && st.state.access) || null; };
  /* KEY ORDER IS NOT CONTENT (§249.3): the store reads access_grants with no
     ORDER BY, so a rewrite may hand the same rows back in another order.
     Compared CANONICALLY — roles and keys sorted — never by raw stringify. */
  const canon = (acc, drop) => JSON.stringify(Object.fromEntries(Object.keys(acc || {}).sort().map((r) => [r, Object.fromEntries(Object.keys(acc[r]).filter((k) => k !== drop).sort().map((k) => [k, acc[r][k]]))]).filter(([, row]) => Object.keys(row).length)));
  const stripIns = (acc) => canon(acc, "a_insights");
  const readAccessPage = () => page.evaluate(() => ({
    sub: currentSub, scope: document.documentElement.getAttribute("data-setup-scope"),
    head: (document.querySelector(".setuprail .rhead") || {}).textContent || "",
    rail: [...document.querySelectorAll(".setuprail [data-setupgo]")].map((e) => e.dataset.setupgo),
    areas: document.documentElement.getAttribute("data-areas"),
    cols: [...document.querySelectorAll(".macgrid thead th")].map((t) => t.textContent.trim()),
    rows: document.querySelectorAll(".macgrid tbody tr").length, roles: typeof matrixRows === "function" ? matrixRows().length : -1,
    btns: [...document.querySelectorAll("[data-mac]")].map((b) => b.dataset.mac),
    lit: [...document.querySelectorAll(".macgrid .stbtn.on")].length,
    spans: document.querySelectorAll(".macgrid .st").length,
    none: !!document.querySelector(".mnone"),
    owner: (function () { const b = document.querySelector('[data-mac^="owner|a_insights|"]'); return b ? { press: b.dataset.mac, on: b.classList.contains("on"), off: !!b.closest(".stset.off") } : null; })(),
  }));
  const goSetup = async (path) => { await page.goto(BASE + path, { waitUntil: "networkidle" }); await booted(); await page.waitForTimeout(500); };
  /* the client holds Insights for this section */
  await owner.query(`UPDATE tenants SET modules = '["insights"]'::jsonb WHERE id = $1`, [tenant.id]);
  try {
    ({ ctx, page } = await fresh());
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await signIn(page, "office@forefront.example", "Raya-2026!");
    await page.waitForURL(BASE + "/platform");
    /* Strategy's matrix, before */
    await goSetup("/raya-trade/strategy/setup/access");
    const stratBefore = await page.evaluate(() => (document.querySelector("#panel .acgrid") || {}).innerHTML || "");
    const accBefore = await storedAccess();
    check(stratBefore.length > 1000 && !!accBefore, "Strategy's own matrix is drawn on its rail before anything is written", stratBefore.length);
    /* Insights' Access page */
    await goSetup("/raya-trade/insights/setup/access");
    let r = await readAccessPage();
    check(r.sub === "access" && r.scope === "insights", "Insights' Roles & access is on Insights' own rail — the same key as Strategy's, told apart by the scope", JSON.stringify([r.sub, r.scope]));
    check(/Insights/.test(r.head) && /Setup/.test(r.head), "…headed Insights · Setup", r.head);
    check(r.rail.join(",") === "access,landing", "…whose rail is exactly Insights' two pages and none of Strategy's (spec 054 §4.2)", r.rail.join(","));
    const decl = MODULE_DEF.insights.areas;
    check(!!r.areas && JSON.parse(r.areas).map((a) => a.key).join(",") === decl.map((a) => a.key).join(","), "the Setup document carries Insights' declared areas (data-areas)", r.areas);
    check(!r.none && r.cols.length === decl.length + 1 && r.cols[1] === decl[0].label, "the table has the module's areas as its columns — one, Insights — and never the no-stamp sentence", JSON.stringify(r.cols));
    check(r.rows > 0 && r.rows === r.roles, "…and the matrix's own roles down, the floor row included (matrixRows, §53.5)", JSON.stringify([r.rows, r.roles]));
    check(r.btns.length === r.rows && r.btns.every((b) => /^[a-z]+\|a_insights\|(view|none)\|view$/.test(b)), "every cell is ONE toggle carrying the shipped state — view | none, no edit (§94.15)", JSON.stringify(r.btns.slice(0, 3)));
    check(r.lit === r.rows, "with nothing stored every eye is lit: absent is the shipped state, not a refusal (§30.2)", JSON.stringify([r.lit, r.rows]));
    check(!!accBefore && !Object.values(accBefore).some((row) => "a_insights" in row), "…and the stored map holds no a_insights key at all", JSON.stringify(Object.keys(accBefore || {})));
    /* PRESS the owner's eye */
    const ownerBtn = page.locator('[data-mac^="owner|a_insights|"]');
    if (await ownerBtn.count()) { await ownerBtn.click(); await page.waitForTimeout(2500); }
    else fail("pressing the BU owner's eye", "no such button to press");
    r = await readAccessPage();
    let acc = await storedAccess();
    check(!!r.owner && !r.owner.on && r.owner.off, "pressing the lit eye turns the cell off — nothing lit IS the answer", JSON.stringify(r.owner));
    check(!!acc && acc.owner && acc.owner.a_insights === "none", "…and is STORED under the module's key on the owner row (read off the server through the tenant)", JSON.stringify(acc && acc.owner));
    check(!!acc && stripIns(acc) === stripIns(accBefore), "Strategy's cells are byte-identical either side of it (spec 054 §6.4)", acc && stripIns(acc) === stripIns(accBefore) ? "" : stripIns(acc).slice(0, 200) + " vs " + stripIns(accBefore).slice(0, 200));
    await goSetup("/raya-trade/strategy/setup/access");
    const stratAfter = await page.evaluate(() => (document.querySelector("#panel .acgrid") || {}).innerHTML || "");
    check(stratAfter === stratBefore, "…and so is Strategy's own matrix as drawn", stratAfter.length + " vs " + stratBefore.length);
    /* Insights' Landing line page, on the same rail */
    await goSetup("/raya-trade/insights/setup/landing");
    const ll = await page.evaluate(() => { let st = null; try { st = JSON.parse(document.documentElement.getAttribute("data-landing") || "null"); } catch (e) {}
      return { sub: currentSub, scope: document.documentElement.getAttribute("data-setup-scope"), mod: st && st.module, keys: st ? st.lines.map((l) => l.key) : null, radios: document.querySelectorAll("[data-landpick]").length }; });
    check(ll.sub === "landing" && ll.scope === "insights" && ll.mod === "insights", "Insights' Landing line page is on its rail and carries Insights' own declaration", JSON.stringify(ll));
    check(!!ll.keys && ll.keys.join(",") === MODULE_DEF.insights.lines.map((l) => l.key).join(",") && ll.radios === ll.keys.length, "…offering Insights' three lines and no other module's", JSON.stringify(ll.keys));
    await ctx.close();
    /* THE DOOR: the unit head (BU owner, seat none) is refused everywhere the module is */
    ({ ctx, page } = await fresh());
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await signIn(page, "mobhead@raya.example", "Raya-2026!");
    await inModule(page); await booted(page);
    /* REWRITTEN (§218): the landing's Your modules list went with the landing
       (§357); the same answer (openableModules) is now the served document's
       own `data-modules` stamp — the switcher's list, absent when there is
       one module (§32), so absent IS "Strategy alone". */
    const modsOf = () => page.evaluate(() => { const raw = document.documentElement.getAttribute("data-modules"); if (!raw) return [document.documentElement.getAttribute("data-module")]; try { return JSON.parse(raw).map((m) => m.key); } catch (e) { return null; } });
    let mods = await modsOf();
    check(mods.join(",") === "strategy", "shut, the BU owner's document offers Strategy alone — no Insights entry (spec 054 §6.4)", mods.join(","));
    await page.goto(BASE + "/raya-trade/insights", { waitUntil: "networkidle" });
    check(!page.url().startsWith(BASE + "/raya-trade/insights"), "…and Insights' own address is refused, exactly as an unknown module word is (§320.5)", page.url());
    await page.goto(BASE + "/raya-trade/insights/setup/access", { waitUntil: "networkidle" });
    check(!page.url().startsWith(BASE + "/raya-trade/insights"), "…its Setup address too", page.url());
    await page.goto(BASE + "/raya-trade/strategy/mobile/strategy", { waitUntil: "networkidle" }); await booted();
    check((await page.locator(".topmark").count()) === 0, "…and the switcher offers no menu, one module being all they may open (§32)");
    await ctx.close();
    /* the function head, whose row is untouched, is served */
    ({ ctx, page } = await fresh());
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await signIn(page, "fn_fin@raya.example", "Raya-2026!");
    await inModule(page); await booted(page);
    mods = await modsOf();
    check(mods.join(",") === "strategy,insights", "the function head, whose row is untouched, still has the Insights entry", mods.join(","));
    await page.goto(BASE + "/raya-trade/insights", { waitUntil: "networkidle" });
    check(page.url() === BASE + "/raya-trade/insights" && /<title>[^<]*Insights/.test(await page.content()), "…and is served the module at its address", page.url());
    await ctx.close();
    /* THE OFFICE IS SERVED OVER A SHUT ROW (spec 046 §4.10), and shown the
       table with no button (§89). A client's own SMO team member holds that
       role on the REGISTER ROW (`people.role`, the register's picker) — a
       client login never carries a seat in `tenant_users`, which is the
       consultants' route (platform-api setTeam) — and the register row is
       what the frozen page reads its roles off. So the fixture writes the
       role there: the owner row stays shut and the best grant across the
       person's roles wins (§33); the SEAT short-circuit is modules.mjs §4c's.
       The first draft wrote `tenant_users.seat` instead, a state the product
       cannot produce for a client login, and the page rightly drew nothing. */
    await owner.query("UPDATE people SET role = 'smoteam' WHERE tenant_id = $1 AND key = 'mobhead'", [tenant.id]);
    try {
      ({ ctx, page } = await fresh());
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      await signIn(page, "mobhead@raya.example", "Raya-2026!");
      await inModule(page);
      await page.goto(BASE + "/raya-trade/insights", { waitUntil: "networkidle" });
      check(page.url() === BASE + "/raya-trade/insights", "given the SMO team role on the register, the same person is served over their shut owner row — the best grant across their roles wins (§33)", page.url());
      await goSetup("/raya-trade/insights/setup/access");
      r = await readAccessPage();
      check(r.sub === "access" && r.scope === "insights" && r.rows > 0 && r.btns.length === 0 && r.spans === r.rows,
        "…and the SMO team is SHOWN Insights' table and given no button: the matrix is the Super user's (§89)", JSON.stringify([r.rows, r.btns.length, r.spans]));
      await ctx.close();
    } finally { await owner.query("UPDATE people SET role = '' WHERE tenant_id = $1 AND key = 'mobhead'", [tenant.id]); }
    /* OPENED AGAIN: the key is DELETED (§50.6) and the door opens */
    ({ ctx, page } = await fresh());
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await signIn(page, "office@forefront.example", "Raya-2026!");
    await page.waitForURL(BASE + "/platform");
    await goSetup("/raya-trade/insights/setup/access");
    /* a NEW locator: the earlier one was bound to a page since closed, and a
       locator on a closed page throws rather than reporting (§215) */
    const ownerBtn2 = page.locator('[data-mac^="owner|a_insights|"]');
    if (await ownerBtn2.count()) { await ownerBtn2.click(); await page.waitForTimeout(2500); }
    else fail("pressing the BU owner's eye again", "no such button to press");
    acc = await storedAccess();
    check(!!acc && acc.owner && !("a_insights" in acc.owner) && canon(acc) === canon(accBefore),
      "pressing it again puts the SHIPPED state back by deleting the key — never-set and set-then-cleared are the same bytes (§50.6)", JSON.stringify(acc && acc.owner));
    await ctx.close();
    ({ ctx, page } = await fresh());
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await signIn(page, "mobhead@raya.example", "Raya-2026!");
    await inModule(page); await booted(page);
    mods = await modsOf();
    await page.goto(BASE + "/raya-trade/insights", { waitUntil: "networkidle" });
    check(mods.join(",") === "strategy,insights" && page.url() === BASE + "/raya-trade/insights", "…and the BU owner has the entry and the address back", JSON.stringify([mods, page.url()]));
  } finally {
    await owner.query(`UPDATE tenants SET modules = '[]'::jsonb WHERE id = $1`, [tenant.id]).catch(() => {});
    await owner.query("DELETE FROM access_grants WHERE tenant_id = $1 AND page_key = 'a_insights'", [tenant.id]).catch(() => {});
  }
  await ctx.close();
});

{
  await browser.close();
  try { process.kill(-server.pid, "SIGTERM"); } catch { server.kill(); }
  await owner.query("UPDATE people SET unit_key = 'mobile' WHERE tenant_id = $1 AND key = 'own_mob'", [tenant.id]).catch(() => {});
  await owner.end();
}
console.log((fails ? "RED   " : "GREEN ") + oks + " ok, " + fails + " failed");
process.exit(fails ? 1 : 0);
