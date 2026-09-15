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
     … --break=demo-role-key  (RED: the door reads §313.4's retired key — the demo 404s for the team, §337)
     … --break=other-role-key (RED: the same, one column over — the office's `open` never opens, §339)
     … --break=no-creator     (RED: making a client leaves its creator off its own team, §339)
     … --break=setup-any-seat (RED: the Client setup block is drawn for every seat, spec 054 §4.1)
     … --break=modules-unread (RED: Your modules stops reading the client's own list)
     … --break=no-landing-stamp (RED: the Setup document carries no declaration, so the Landing line page draws nothing to pick, §356.4)
     … --shots=<dir>          (also writes door.png, client-door.png, landing.png, password.png)

   Needs `next build` first and the chromium this image carries. */
import { spawn } from "node:child_process";
import { SCHEMA } from "../db/schema-name.mjs";   /* the shared schema is not `public` (§317.4) */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";
import pg from "pg";
import { devTenant } from "../scripts/dev-tenant.mjs";
import { doorHref, landingShape } from "../lib/landing.ts";
import { landingLine, MODULE_DEF } from "../lib/modules.ts";
import { DEFAULT_MODULE } from "../lib/modules.ts";

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
  /* REWRITTEN, NEVER LOOSENED (§218): it held the literal `/raya-trade/mobile`,
     which spec 046 §7 moved under the module. Asserted as AGREEMENT with the
     product's own builder (§94.8), so a later module change stays green — and
     the module asserted PRESENT beside it (§113.8), or a build that dropped it
     from the page and the builder alike agrees with itself perfectly. */
  const exit = await page.locator(".wexit").getAttribute("href");
  check(exit === doorHref("raya-trade", { target: want.home }), "…and goes there", exit + " ⟂ " + doorHref("raya-trade", { target: want.home }));
  check(exit.startsWith("/raya-trade/" + DEFAULT_MODULE + "/"), "…inside a module, which every page but the spine's carries (spec 046 §7)", exit);
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
  await page.goto(BASE + "/" + made, { waitUntil: "networkidle" });
  const now = await text(page, ".wact.wempty b");
  check(!now.some((s) => /not on/.test(s)), "…and the landing never says they are not on its register", now);

  /* THE OTHER END, MADE: an admin opening a client they did NOT make — or one
     made before today — still holds no seat, and that is the state §313.32 is
     about. Take both away and open it again. */
  await owner.query("DELETE FROM tenant_users WHERE tenant_id = $1", [tid]);
  await withTenant(tid, (c) => c.query("DELETE FROM people"));
  ({ ctx, page } = await fresh());
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await signIn(page, "office@forefront.example", "Raya-2026!");
  await page.waitForURL(BASE + "/platform");
  await page.goto(BASE + "/" + made, { waitUntil: "networkidle" });
  const first = await text(page, ".wact.wempty b");
  check(first.some((s) => /not on/.test(s)), "nobody on its register, and the landing says so", first);
  /* the LANDING only reads (registerKeyFor — a reader that creates what it
     looked for is how a phantom change reaches every save, §316.9); the state
     API is what PLACES them, so it is the request that heals this */
  await page.request.get(BASE + "/api/" + made + "/state");
  const who = await withTenant(tid, async (c) => (await c.query("SELECT key FROM people")).rows.map((x) => x.key));
  check(who.length === 1, "…placing the office as exactly one row on the register (§313.32)", who);
  await page.goto(BASE + "/" + made, { waitUntil: "networkidle" });
  const again = await text(page, ".wact.wempty b");
  check(!again.some((s) => /not on/.test(s)), "…so the landing stops saying they are not on it", again);
  await owner.query("DELETE FROM tenants WHERE key = $1", [made]);
});


/* ══ THE LANDING'S CLIENT SETUP BLOCK AND YOUR MODULES (spec 054 §4.1, §9.3) ══
   BOTH ENDS OF EVERY CLAIM (§94.2): the block drawn for the Super user AND
   absent for the SMO team and a unit head — three seats — or a build that
   drew it for nobody passes the absence half, and one that drew it for
   everybody passes the presence half. What is drawn is asserted as
   AGREEMENT with lib/landing.ts's own landingShape() (§94.8), never as a
   list of six words typed here, so a door renamed there stays green and a
   door dropped by the PAGE goes red. Every door is then PRESSED (§70): a
   control in the document is not a control that opens anything. */
await section("7 · the landing's Client setup block and Your modules (spec 054 §4.1)", async () => {
  const shapeFor = (seat, stored) => landingShape("raya-trade", seat, stored);
  const readBlocks = (page) => page.evaluate(() => ({
    doors: [...document.querySelectorAll(".wsetup a")].map((a) => [a.dataset.door, a.querySelector(".wk").textContent.trim(), a.getAttribute("href")]),
    mods: [...document.querySelectorAll(".wmods a")].map((a) => [a.dataset.module, a.querySelector(".wk").textContent.trim(), a.getAttribute("href")]),
    side: [...document.querySelectorAll(".wside > *")].map((e) => e.className),
    only: (document.querySelector(".wsetupbox .wonly") || {}).textContent || "",
  }));
  /* a unit head: no block, one module row */
  ({ ctx, page } = await fresh());
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await signIn(page, "mobhead@raya.example", "Raya-2026!");
  await page.waitForURL(BASE + "/raya-trade");
  let b = await readBlocks(page);
  check(b.doors.length === 0, "a unit head (seat none) is shown NO Client setup block (§61: absent, never disabled)", JSON.stringify(b.doors));
  const oneRow = shapeFor("none", []).modules;
  check(b.mods.length === oneRow.length && oneRow.every((m, i) => b.mods[i][0] === m.key && b.mods[i][1] === m.label && b.mods[i][2] === m.href),
    "…and Your modules is landingShape()'s own row, with ONE module too", JSON.stringify(b.mods));
  check(b.mods[0] && b.mods[0][2] === "/raya-trade/" + DEFAULT_MODULE, "…opening the module at its own address", b.mods[0] && b.mods[0][2]);
  await ctx.close();
  /* the SMO team: a seat, and still no block (the block is the SUPER USER's) */
  await owner.query("UPDATE tenant_users SET seat = 'smoteam' WHERE tenant_id = $1 AND person_key = 'fn_fin'", [tenant.id]);
  try {
    ({ ctx, page } = await fresh());
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await signIn(page, "fn_fin@raya.example", "Raya-2026!");
    await page.waitForURL(BASE + "/raya-trade");
    b = await readBlocks(page);
    check(b.doors.length === 0, "an SMO team seat is shown no block either — it is the Super user's alone (spec 054 §4.4)", JSON.stringify(b.doors));
    await ctx.close();
  } finally { await owner.query("UPDATE tenant_users SET seat = 'none' WHERE tenant_id = $1 AND person_key = 'fn_fin'", [tenant.id]); }
  /* the Super user: the office holds it by rule on a client they made (§339) */
  ({ ctx, page } = await fresh());
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await signIn(page, "office@forefront.example", "Raya-2026!");
  await page.waitForURL(BASE + "/platform");
  await page.goto(BASE + "/raya-trade", { waitUntil: "networkidle" });
  b = await readBlocks(page);
  const wantDoors = shapeFor("super", []).clientSetup;
  check(wantDoors && b.doors.length === wantDoors.length && wantDoors.every((d, i) => b.doors[i][0] === d.key && b.doors[i][1] === d.label && b.doors[i][2] === d.href),
    "the Super user is shown the block — six doors, landingShape()'s own, in its order", JSON.stringify(b.doors));
  check(b.doors.length === 6 && b.doors.every((d) => d[2].startsWith("/raya-trade/setup/")), "…every door a SPINE Setup address (research R2)", JSON.stringify(b.doors.map((d) => d[2])));
  check(b.side[0] === "wsetupbox", "…first in the side column, above Your pages", JSON.stringify(b.side));
  check(/super user/i.test(b.only), "…and it says whose it is", b.only);
  await shot(page, "landing-super");
  /* the page list's first door follows §356 (the Overview went in step 1 and
     the carried reader still named it, §356.3) */
  const firstPage = await page.locator(".wpages a").first();
  check((await firstPage.textContent()).trim().startsWith("Setup — Reporting cycle"), "Your pages opens on the Reporting cycle, the Overview being gone (§356)", await firstPage.textContent());
  /* EVERY DOOR IS PRESSED and lands on the page it names, in the CLIENT's
     rail (data-setup-scope, §356.2) */
  const landed = {};
  for (const [key, , href] of b.doors) {
    await page.goto(BASE + "/raya-trade", { waitUntil: "networkidle" });
    await page.click('.wsetup a[data-door="' + key + '"]');
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => !document.documentElement.classList.contains("booting"));
    await page.waitForTimeout(400);
    landed[key] = await page.evaluate(() => ({ path: location.pathname, scope: document.documentElement.getAttribute("data-setup-scope"), d: current, s: currentSub,
      sec: (typeof CURSEC !== "undefined" && currentSub) ? CURSEC[currentSub] : null,
      seat: (function () { const el = document.getElementById("seat"); if (!el) return null; const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; })() }));
    void href;
  }
  const at = (k) => landed[k] || {};
  check(at("people").s === "people" && at("people").scope === "client", "People opens the register in the client's rail", JSON.stringify(at("people")));
  check(at("access").s === "people" && at("access").seat === true, "Access opens the register SCROLLED to the seat column (#seat, spec 054 §4.4)", JSON.stringify(at("access")));
  check(at("org").s === "companies" && at("org").scope === "client", "Organisation opens Companies, the first of its four pages", JSON.stringify(at("org")));
  check(at("brand").s === "brand" && at("brand").scope === "client", "Branding opens Branding", JSON.stringify(at("brand")));
  check(at("email").s === "send" && at("email").sec === "comms" && at("email").scope === "strategy" && at("email").path === "/raya-trade/strategy/setup/send",
    "Email opens the Email settings section of Strategy's Send an email — a spine door moved to its page's own rail (R2), the hash naming the section", JSON.stringify(at("email")));
  check(at("kb").s === "kb" && at("kb").scope === "client", "Knowledge base opens the knowledge base", JSON.stringify(at("kb")));
  /* YOUR MODULES READS THE CLIENT'S OWN LIST: a second module switched on
     gains a row, in MODULES' order, and its door opens that module — put
     back in a finally (§94.2) */
  await owner.query(`UPDATE tenants SET modules = '["trial"]'::jsonb WHERE id = $1`, [tenant.id]);
  try {
    await page.goto(BASE + "/raya-trade", { waitUntil: "networkidle" });
    b = await readBlocks(page);
    const two = shapeFor("super", ["trial"]).modules;
    check(two.length === 2 && b.mods.length === 2 && two.every((m, i) => b.mods[i][0] === m.key && b.mods[i][2] === m.href),
      "a second module switched on gains a row, in MODULES' order, agreeing with landingShape()", JSON.stringify(b.mods));
    /* guarded, or a build with no row DIES here rather than reporting (§215) */
    if (await page.locator('.wmods a[data-module="trial"]').count()) {
      await page.click('.wmods a[data-module="trial"]'); await page.waitForLoadState("networkidle");
      check(page.url() === BASE + "/raya-trade/trial", "…and its row opens the module", page.url());
    } else fail("…and its row opens the module", "no Trial row to press");
  } finally { await owner.query(`UPDATE tenants SET modules = '[]'::jsonb WHERE id = $1`, [tenant.id]); }
  await ctx.close();
});


/* ══ THE LANDING LINE (spec 054 §4.5, §356.4) ═══════════════════════════
   Declared on the module, chosen on its Landing line page, stored on the
   group, drawn in two places — and the three must AGREE (§53.5): what the
   page offers is the document's own stamp, what the landing says is the
   one reader's answer for the pick, and what the console's card says is the
   same. Driven through the real page, the pick read back off the STORED
   graph (§96), and put back to the default in a finally (§94.2). */
await section("8 · the landing line, chosen on Strategy's Setup and read on the landing and the card", async () => {
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
  const landingLineOn = async () => { await page.goto(BASE + "/raya-trade", { waitUntil: "networkidle" });
    return page.$eval('.wmods a[data-module="strategy"] .wll', (e) => e.textContent).catch(() => null); };
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
    const onLanding = await landingLineOn();
    check(want && onLanding === want.text, "the landing's Strategy row now says that line", JSON.stringify([onLanding, want && want.text]));
    check(want && (await cardLine()) === want.text, "…and so does the console's card", JSON.stringify(await cardLine()));
    /* THE DEFAULT DELETES THE KEY */
    await page.goto(BASE + "/raya-trade/strategy/setup/landing", { waitUntil: "networkidle" }); await booted(); await page.waitForTimeout(500);
    await pick("cycle");
    check((await stored()) === null, "picking the default again DELETES the key, so never-set and set-then-cleared are the same bytes (§50.6)", JSON.stringify(await stored()));
    /* NOTHING is a choice, drawn as a row with no line */
    await pick("none");
    check((await landingLineOn()) === "", "Nothing keeps the row and draws no line under it", JSON.stringify(await landingLineOn()));
  } finally {
    await owner.query("UPDATE org SET extra = extra - 'landing' WHERE tenant_id = $1", [tenant.id]).catch(() => {});
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
