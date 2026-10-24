/* Case studies, driven in a real browser against the built app (spec 067).
   The whole way a past case study gets written — an admin opens it for a
   past client, the writer finds it on My work, does the interview, reads the
   draft, marks it done — and then what a new joiner sees: the library, the
   report, the insights. Every step asserted on the screen AND in the rows.

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node --experimental-strip-types checks/case-page.mjs
     … --break=no-split      (RED: the page loads no interview splitter)
     … --break=drafts-open   (RED: a new joiner reads somebody's draft)
     … --break=no-writeups   (RED: My work does not show the write-up)
     … --shots=DIR           (a screenshot of each page, for looking at)

   Needs `next build` first. Re-runnable: the dev tenant is remade at the start. */
import { spawn } from "node:child_process";
import { join } from "node:path";
import { mkdirSync, renameSync } from "node:fs";
import pg from "pg";
import { chromium } from "playwright-core";
import { SCHEMA } from "../db/schema-name.mjs";
import { devTenant, DEV_PASSWORD } from "../scripts/dev-tenant.mjs";
import { hashPassword } from "../lib/auth.ts";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const CHROME = process.env.SMP_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = 3985, BASE = "http://localhost:" + PORT;
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
const shots = (process.argv.find((a) => a.startsWith("--shots=")) || "").slice(8);
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));
async function section(name, fn) {
  console.log("── " + name);
  try { await fn(); } catch (e) { fail(name + " — the section died rather than reporting (§215)", e && e.stack ? e.stack.split("\n").slice(0, 2).join(" ") : e); }
}

await devTenant({ url: URL_, log: () => {} });
const owner = new pg.Pool({ connectionString: URL_, max: 2, options: "-c search_path=" + SCHEMA });
await owner.query("DELETE FROM login_attempts");
const mint = async (email, name, isAdmin) => (await owner.query(
  "INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) VALUES ($1,$2,'office',$3,false,$4) RETURNING id",
  [email, name, isAdmin, hashPassword(DEV_PASSWORD)])).rows[0].id;
await mint("boss@forefront.example", "Platform Admin", true);
const writerId = await mint("writer@forefront.example", "Islam Writer", false);
await mint("reader@forefront.example", "New Joiner", false);

async function portFree(port) {
  try { await fetch("http://localhost:" + port + "/", { signal: AbortSignal.timeout(800) }); return false; }
  catch { return true; }
}
async function stopServer(s) {
  try { process.kill(-s.pid); } catch {}
  try { s.kill("SIGKILL"); } catch {}
  for (let i = 0; i < 20; i++) { if (await portFree(PORT)) return; await new Promise((r) => setTimeout(r, 250)); }
  console.log("note  port " + PORT + " is still held after the run");
}
if (!(await portFree(PORT))) {
  console.log("FAIL  something is already listening on " + PORT + " — this check will not measure a server it did not start");
  process.exit(1);
}
/* THE SPLITTER'S BREAK IS ONE THE BUILD COULD MAKE: the file not where the
   page's script tag points (memory-page.mjs's own model, §276). */
const SPLIT_AT = join(import.meta.dirname, "..", "public", "case-split.js");
if (brk === "no-split") renameSync(SPLIT_AT, SPLIT_AT + ".aside");
const putBack = () => { if (brk === "no-split") { try { renameSync(SPLIT_AT + ".aside", SPLIT_AT); } catch {} } };

const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  cwd: join(import.meta.dirname, ".."),
  env: { ...process.env, DATABASE_URL_UNPOOLED: URL_, SMP_BREAK: brk },
  stdio: ["ignore", "pipe", "pipe"], detached: true,
});
server.stdout.on("data", () => {}); server.stderr.on("data", () => {});
let up = false;
for (let i = 0; i < 60 && !up; i++) { await new Promise((r) => setTimeout(r, 500)); try { up = (await fetch(BASE + "/")).status === 200; } catch {} }
if (!up) { console.log("FAIL  the app did not start"); putBack(); await stopServer(server); process.exit(1); }
if (shots) mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const errors = [];
async function as(email, width = 1280) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(email + ": " + String(e.stack || e)));
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await p.fill("#user", email);
  await p.fill("#password", DEV_PASSWORD);
  await p.click("#loginForm button[type=submit]");
  await p.waitForURL(/\/platform/, { timeout: 15000 });
  await p.waitForSelector(".nav button", { timeout: 15000, state: "attached" });
  return p;
}
const shot = async (p, name) => { if (shots) await p.screenshot({ path: join(shots, name + ".png"), fullPage: true }); };
const settle = (p) => p.waitForTimeout(700);
const openTab = async (p) => { await p.click('.nav button[data-tab="memory"]'); await settle(p); };

const PASTE = `=== IN SHORT
Nile Logistics asked us to redesign how its three regional depots were run after two years of missed delivery targets.
=== THE CLIENT AND WHY THEY CAME TO US
Two years of missed delivery targets across three depots.
=== WHAT WE WERE ASKED TO DO
Redesign the operating model.
=== THEIR TEAM            (one line each: name · role)
Hany M. · COO
=== TIMELINE              (one line each: month · stage)
Mar · Diagnostic
Apr – Jun · Design
=== DELIVERABLES          (one line each: name · what it was · month)
Depot diagnostic · Visits and figures from all three depots · Apr 2023
=== WHO TO ASK            (one line each: name · what to ask them about)
Islam Writer · the depot managers

===
KIND: hiccup
TITLE: The depot managers heard about it from their drivers first
WHAT THE NEXT PERSON SHOULD KNOW: Tell the managers before head office says anything.
===
KIND: lesson
TITLE: Five measures is the most they will look at
===`;

let boss, writer, reader, caseId;

await section("1 · the tab, and the front of the library", async () => {
  reader = await as("reader@forefront.example");
  const tabs = await reader.$$eval(".nav button", (bs) => bs.map((b) => b.textContent.trim()));
  check(tabs.includes("Case studies") && !tabs.includes("Memory"), "the tab is called Case studies, in Memory's place (Islam: \"call it case studies\")", JSON.stringify(tabs));
  await openTab(reader);
  const view = await reader.$eval('.csseg button[aria-pressed="true"]', (b) => b.textContent.trim()).catch(() => "");
  check(view === "Case studies", "it opens on the library, with Insights one press away", view);
  check(await reader.$(".bigsearch input") !== null, "the front has one search", "");
  check(/No case studies on the shelves yet/.test(await reader.textContent("#page")), "with nothing finished, the shelves say so rather than standing empty (§61)", "");
  check(!(await reader.$('.ptitle button:has-text("Open a piece of work")')), "a consultant is not offered Open a piece of work (decision 11)", "");
  boss = await as("boss@forefront.example");
  await openTab(boss);
  check(!!(await boss.$('.ptitle button:has-text("Open a piece of work")')), "…an admin is", "");
  await shot(reader, "1-front-empty");
});

await section("2 · an admin opens a past piece of work, past client and all", async () => {
  await boss.click('.ptitle button:has-text("Open a piece of work")');
  await settle(boss);
  await boss.selectOption("#cs-o-client", "__past");
  check(await boss.isVisible("#cs-o-pname"), "choosing a past client shows its three fields", "");
  await boss.fill("#cs-o-pname", "Nile Logistics");
  await boss.selectOption("#cs-o-pind", "Transportation & Logistics");
  await boss.fill("#cs-o-name", "Operating model 2023");
  await boss.fill("#cs-o-from", "2023-03");
  await boss.fill("#cs-o-to", "2023-11");
  await boss.selectOption("#cs-o-team", writerId);
  await boss.selectOption("#cs-o-writer", writerId);
  await boss.fill("#cs-o-due", "2026-11-13");
  await settle(boss);
  const cover = await boss.textContent(".preview .cover");
  check(/Operating model 2023/.test(cover) && /Nile Logistics/.test(cover) && /Mar – Nov 2023/.test(cover), "the cover it makes fills in as it is typed", cover);
  check(/Transportation & Logistics shelf/.test(await boss.textContent(".preview .where")), "…and says which shelf it will stand on", await boss.textContent(".preview .where"));
  const label = await boss.textContent(".factions .btn.amber");
  check(/Open it and ask Islam/.test(label), "the button says who it will ask", label);
  await shot(boss, "2-open");
  await boss.click(".factions .btn.amber");
  await settle(boss);
  check(/Being written/.test(await boss.textContent(".rhead .chip")), "it opens on its own page, being written", await boss.textContent(".rhead").catch(() => ""));
  const t = (await owner.query("SELECT status, past FROM tenants WHERE key = 'nile-logistics'")).rows[0];
  check(t && t.status === "retired" && t.past, "the past client is made, archived and marked past", JSON.stringify(t));
  caseId = (await owner.query("SELECT id FROM case_studies WHERE name = 'Operating model 2023'")).rows[0].id;
  await boss.click('.nav button[data-tab="clients"]');
  await boss.waitForTimeout(1200);
  check(!/Nile Logistics/.test(await boss.textContent("#page")), "…and NOT on the Clients page, archived band included (Islam: \"I don't want it to be there\")", "");
});

await section("3 · the writer finds it on My work, and does the interview", async () => {
  writer = await as("writer@forefront.example");
  await writer.click('.nav button[data-tab="mywork"]');
  await writer.waitForTimeout(1200);
  const row = await writer.$(".mwrow.mwcase");
  check(!!row, "the write-up is on the writer's My work (decision 7)", "");
  if (!row) return;
  check(/Write up the case study · Operating model 2023/.test(await row.textContent()) && /Case study/.test(await row.textContent()), "…named as a write-up, with Case study where a status would be", await row.textContent());
  check(!(await row.$(".mwtick")), "…and NO tick: it is finished on the case study, never from a list (§61)", "");
  await shot(writer, "3-mywork");
  await row.click();
  await settle(writer);
  check(!!(await writer.$(".twostep")), "pressing it opens the interview, since nothing is written yet", "");
  const prompt = await writer.textContent(".stepcard .prompt");
  check(/Client:\s+Nile Logistics \(Transportation & Logistics\)/.test(prompt) && /March 2023 to November 2023/.test(prompt) && /Islam Writer/.test(prompt),
    "the prompt already holds the client, its industry, the months and the team", prompt.slice(0, 300));
  await shot(writer, "4-interview");
  await writer.fill("#cs-paste", PASTE);
  await writer.click('.stepcard button:has-text("Read it into the draft")');
  await settle(writer);
  const found = await writer.textContent(".found").catch(() => "");
  check(/Read 7 of 8 sections and 2 insights/.test(found) && /What came of it/.test(found), "the draft says what was read, and names the section that came back empty", found);
  check((await writer.inputValue("#cs-d-inShort")).startsWith("Nile Logistics asked us"), "In short is in its box, ready to change", "");
  check((await writer.$$(".dcard")).length === 2, "the two insights wait in the draft, unsaved", "");
  const before = (await owner.query("SELECT in_short FROM case_studies WHERE id = $1", [caseId])).rows[0].in_short;
  check(before === "", "NOTHING IS SAVED UNTIL IT IS SAVED — the row is still empty after reading the paste (§94.2)", before);
  await shot(writer, "5-draft");
  await writer.click('.draftbar button:has-text("Save the draft")');
  await writer.waitForTimeout(1200);
  const row2 = (await owner.query("SELECT in_short, stages, deliverables, their_team FROM case_studies WHERE id = $1", [caseId])).rows[0];
  check(row2.in_short.startsWith("Nile Logistics") && row2.stages.length === 2 && row2.deliverables.length === 1 && row2.their_team.length === 1,
    "Save the draft stores the sections, the timeline, the deliverables and the team", JSON.stringify(row2).slice(0, 200));
  const ins = (await owner.query("SELECT count(*)::int n FROM memory_entries WHERE case_id = $1", [caseId])).rows[0].n;
  check(ins === 2, "…and the interview's insights, IN this piece of work", ins);
  await writer.click('.draftbar button:has-text("Mark it done")');
  await writer.waitForTimeout(1500);
  check(/Done/.test(await writer.textContent(".rhead .chip").catch(() => "")), "Mark it done puts it on the shelves", await writer.textContent(".rhead").catch(() => ""));
});

await section("4 · a new joiner reads it", async () => {
  await reader.click('.nav button[data-tab="clients"]'); await reader.waitForTimeout(500);
  await openTab(reader);
  const shelves = await reader.$$eval(".shelf .shh h2", (h) => h.map((x) => x.textContent.trim()));
  check(shelves.includes("Newest") && shelves.includes("Transportation & Logistics"), "the library has a Newest shelf and one for its industry", JSON.stringify(shelves));
  const cats = await reader.$$eval(".catrow button", (b) => b.map((x) => x.textContent.trim()));
  check(cats.length === 2 && /^All/.test(cats[0]), "the industries row offers only what is on the shelves (§61)", JSON.stringify(cats));
  check(/New/.test(await reader.textContent(".shelf .cover")), "a case study finished in the last thirty days is marked New", "");
  await shot(reader, "6-front");
  await reader.click(".shelf .cover");
  await settle(reader);
  const head = await reader.textContent(".rhead");
  check(/Operating model 2023/.test(head) && /written by Islam Writer/.test(head) && /past client/.test(head), "the report's header: the work, the client, who wrote it", head);
  check((await reader.textContent(".stand")).startsWith("Nile Logistics asked"), "In short is the opening paragraph", "");
  const secs = await reader.$$eval(".rsec h2", (h) => h.map((x) => x.textContent.replace(/\s+/g, " ").trim()));
  check(secs.some((s) => /Timeline/.test(s)) && secs.some((s) => /Deliverables/.test(s)) && !secs.some((s) => /What came of it/.test(s)),
    "the sections are numbered, and one with nothing in it is left out", JSON.stringify(secs));
  check(!!(await reader.$(".tlbar i")), "the timeline is drawn as a strip of months where the stages name them", "");
  check(/No file attached/.test(await reader.textContent(".files")), "a deliverable with no file says so", "");
  check((await reader.$$(".icards .icard")).length === 2, "the insights from this work are inside it, as cards", "");
  check(/Tell the managers before head office/.test(await reader.textContent(".icards")), "…each leading with what the next person should know", "");
  check(!(await reader.$('.rhead button:has-text("Edit")')), "a new joiner gets no Edit", "");
  await shot(reader, "7-report");
});

await section("5 · somebody else's draft stays theirs", async () => {
  const id = (await owner.query(
    "INSERT INTO case_studies (about_tenant_id, name, state, opened_by, writer_id, due, in_short) " +
    "SELECT t.id, 'Reporting cycle 2026', 'writing', $1, $1, '2026-12-01', 'A secret draft sentence' FROM tenants t WHERE t.key = 'raya-trade' RETURNING id",
    [writerId])).rows[0].id;
  await openTab(reader);
  check(/Reporting cycle 2026/.test(await reader.textContent(".desk")), "a draft is on the desk, by name, for everybody", "");
  await reader.click('.desk .drow:has-text("Reporting cycle 2026")');
  await settle(reader);
  const txt = await reader.textContent("#page");
  check(!/A secret draft sentence/.test(txt) && /is writing it up/.test(txt), "…but opening it shows who is writing it, not what they wrote (decision 10)", txt.slice(0, 200));
  await owner.query("DELETE FROM case_studies WHERE id = $1", [id]);
});

await section("6 · insights: the other half of the library", async () => {
  await openTab(reader);
  await reader.click('.csseg button[data-view="list"]');
  await settle(reader);
  check(!!(await reader.$('.ptitle .right button:has-text("Add one insight")')), "Insights keeps today's ways in: Add one insight", "");
  const facts = await reader.$$eval(".erow .facts", (f) => f.map((x) => x.textContent));
  check(facts.some((f) => /in Operating model 2023/.test(f)), "each insight names the case study it is in", JSON.stringify(facts));
  await reader.click('.csseg button[data-view="lib"]');
  await settle(reader);
  await reader.click(".shelf .cover");
  await settle(reader);
  await reader.fill("#cs-add-insight", "Ask the drivers what they heard");
  await reader.press("#cs-add-insight", "Enter");
  await reader.waitForTimeout(1200);
  check(/Ask the drivers what they heard/.test(await reader.textContent(".icards")), "an insight written inside a case study lands in it at once", "");
  const e = (await owner.query("SELECT case_id FROM memory_entries WHERE title = 'Ask the drivers what they heard'")).rows[0];
  check(e && e.case_id === caseId, "…stored in this piece of work", JSON.stringify(e));
});

await section("7 · a phone", async () => {
  const p = await as("reader@forefront.example", 400);
  /* the tab named in the address, read when the page loads — a reload,
     since changing only the hash of the page already open loads nothing */
  await p.goto(BASE + "/platform#memory"); await p.reload(); await p.waitForTimeout(1500);
  let w = await p.evaluate(() => document.documentElement.scrollWidth);
  check(w <= 400, "the library is no wider than a 400px screen", w);
  await shot(p, "8-phone-front");
  const n = await p.$$eval(".shelf .cover", (c) => c.length);
  check(n > 0, "the covers are on the phone's shelves", n);
  await p.locator(".shelf .cover").first().click({ timeout: 8000 }); await settle(p);
  w = await p.evaluate(() => document.documentElement.scrollWidth);
  check(w <= 400, "…nor is the report", w);
  await shot(p, "8-phone-report");
});

await section("8 · the Clients page: Active, Ended, Demo, Mine, cards or list", async () => {
  const p = boss;
  const goClients = async () => { await p.click('.nav button[data-tab="clients"]'); await p.waitForTimeout(1200); };
  await goClients();
  const on = await p.$eval('.clwhich button[aria-pressed="true"]', (b) => b.dataset.which).catch(() => null);
  check(on === "active", "the Clients page opens on Active (Islam: \"default is active\")", on);
  check(!/Nile Logistics/.test(await p.textContent("#page")), "a past client is not among the Active ones", "");
  await p.click('.clwhich button[data-which="ended"]'); await p.waitForTimeout(400);
  const past = await p.$('[data-grid="archived"] .ccard[data-client="nile-logistics"]');
  check(!!past && /Past client/i.test(await past.textContent()), "under Ended, the past client, marked Past client", past ? await past.textContent() : "");
  check(past && !(await past.$(".cback")), "…with no Bring back: there is no platform to return to", "");
  check(!!(await p.$('[data-grid="archived"] [data-add-past]')), "…and + Add a past client lives here", "");
  if (past) {
    await (await past.$(".mrow")).click(); await p.waitForTimeout(1200);
    check((await p.inputValue("#cs-q").catch(() => "")) === "Nile Logistics" && !!(await p.$(".shelf .cover")),
      "its Case studies row opens the library on its case studies", await p.inputValue("#cs-q").catch(() => ""));
  }
  await goClients();
  await p.click('.clwhich button[data-which="ended"]'); await p.waitForTimeout(400);
  await p.click('[data-grid="archived"] [data-add-past]'); await p.waitForTimeout(1200);
  check((await p.inputValue("#cs-o-client").catch(() => "")) === "__past" && await p.isVisible("#cs-o-pname"),
    "+ Add a past client opens Open a piece of work with a past client chosen", await p.inputValue("#cs-o-client").catch(() => ""));
  /* MINE, BOTH ENDS: the admin has no seat here, the office's SMO has one */
  await goClients();
  const back = await p.$eval('.clwhich button[aria-pressed="true"]', (b) => b.dataset.which).catch(() => null);
  check(back === "active", "coming back to Clients after Ended opens on Active again, every visit", back);
  await p.click(".clmine"); await p.waitForTimeout(300);
  check(/Active0/.test(await p.textContent(".clwhich")) && !(await p.$('[data-grid="clients"] .ccard[data-client="raya-trade"]')),
    "Mine, for somebody with no seat anywhere, shows none — and its count says so first", await p.textContent(".clwhich"));
  const smo = await as("office@forefront.example");
  await smo.click('.nav button[data-tab="clients"]'); await smo.waitForTimeout(1200);
  await smo.click(".clmine"); await smo.waitForTimeout(300);
  check(!!(await smo.$('[data-grid="clients"] .ccard[data-client="raya-trade"]')), "CONTROL — Mine, for somebody with a seat, shows their client", await smo.textContent(".clwhich"));
  /* CARDS OR LIST, remembered on this device */
  await p.click(".clmine"); await p.waitForTimeout(200);
  await p.click('.clview button[data-view="list"]'); await p.waitForTimeout(300);

  const rowsNow = await p.$$eval('table[data-grid="clients"] tr.crow', (r) => r.map((x) => x.dataset.client));
  check(rowsNow.includes("raya-trade"), "the list draws one line a client", JSON.stringify(rowsNow) + " " + (await p.textContent(".clwhich")));
  check(!!(await p.$('tr.crow[data-client="raya-trade"] .clmod')), "…with a button per module", "");
  await p.reload(); await p.waitForTimeout(1500);
  await goClients();
  check(!!(await p.$('table[data-grid="clients"]')), "…and the list is still the view after a reload", "");
  await p.click('.clview button[data-view="cards"]'); await p.waitForTimeout(300);
  check(!!(await p.$('.cards[data-grid="clients"]')), "CONTROL — and back to cards", "");
  await shot(p, "9-clients");
});

await section("9 · nothing threw", async () => {
  check(errors.length === 0, "no page error anywhere in the walk (§118)", errors.join(" | "));
});

await browser.close();
putBack();
await stopServer(server);
await owner.end();
console.log((fails ? "RED  " : "GREEN  ") + oks + " ok, " + fails + " failed");
process.exit(fails ? 1 : 0);
