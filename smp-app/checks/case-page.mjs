/* The Track Record, driven in a real browser against the built app (spec 069,
   which reworks spec 067's case studies). The whole way an assignment gets
   written up — the super user adds it on Clients (and a past client on
   Ended), its lead finds the write-up on My tasks when the end month has
   come, talks it through with the prompt, checks the draft and publishes —
   and then what a new joiner sees: the front with its client cards and
   filters, a client's page with a tab per assignment, and learnings added
   to an assignment with the learnings prompt or typed in. Every step
   asserted on the screen AND in the rows.

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node --experimental-strip-types checks/case-page.mjs
     … --break=no-split      (RED: the page loads no interview splitter)
     … --break=drafts-open   (RED: a new joiner reads somebody's draft)
     … --break=no-writeups   (RED: My tasks does not show the write-up)
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

let boss, writer, reader, pastId, planId, retId;
const rowOf = async (id) => (await owner.query("SELECT * FROM case_studies WHERE id = $1", [id])).rows[0];
const goTab = async (p, tab) => { await p.click('.nav button[data-tab="' + tab + '"]'); await settle(p); await p.waitForTimeout(500); };
const listView = async (p) => { await p.click('.clview button[data-view="list"]'); await p.waitForTimeout(900); };
/* OUR MONTH PICKER (Islam, 2026-10-27: the year needs its arrows): opens on
   the box, walks the year with ‹ and ›, and picks the month from the grid */
async function pickMonth(p, id, ym) {
  await p.click("#" + id);
  await p.waitForSelector(".mppanel", { timeout: 5000 });
  const want = +ym.slice(0, 4);
  for (let i = 0; i < 40; i++) {
    const y = +(await p.textContent(".mppanel .mpyear"));
    if (y === want) break;
    await p.click('.mppanel button[aria-label="' + (y > want ? "Previous year" : "Next year") + '"]');
  }
  await p.click('.mppanel .mpgrid button[data-m="' + ym.slice(5) + '"]');
}
/* fills the open assignment form in the Clients list and presses Add */
async function addAssignment(p, client, a) {
  await p.click('[data-add-assignment="' + client + '"]'); await p.waitForTimeout(900);
  await p.fill("#asg-name", a.name);
  await p.selectOption("#asg-type", a.kind);
  await pickMonth(p, "asg-start", a.start);
  if (a.end) await pickMonth(p, "asg-end", a.end);
  if (a.days != null) await p.fill("#asg-days", String(a.days));
  if (a.lead) await p.selectOption("#asg-lead", { label: a.lead });
  await p.click('tr.asgform button:has-text("Add")'); await p.waitForTimeout(1200);
}

await section("1 · the tab, and the front", async () => {
  reader = await as("reader@forefront.example");
  const tabs = await reader.$$eval(".nav button", (bs) => bs.map((b) => b.textContent.trim()));
  check(tabs.includes("Track Record") && !tabs.includes("Case studies"), "the tab is called Track Record (Islam: case studies \"mean that there is something new\")", JSON.stringify(tabs));
  await openTab(reader);
  check(await reader.$(".cslib .hochd #cs-q") !== null, "the front has one search, in the card's header", "");
  check(!(await reader.$(".cslib .csseg")), "…and no Clients / Learnings switch (Islam: learnings \"are part of the clients work\")", "");
  check(!!(await reader.$('.pgband button:has-text("+ Add to Track Record")')), "…and one + Add to Track Record on the band", "");
  await reader.click('.pgband button:has-text("+ Add to Track Record")');
  const choices = await reader.$$eval(".tramenu button b", (bs) => bs.map((b) => b.textContent.trim()));
  check(JSON.stringify(choices) === JSON.stringify(["Write up an assignment", "Add learnings"]), "…offering its two choices, and no way to add a client here", JSON.stringify(choices));
  check(/Nothing in the Track Record yet/.test(await reader.textContent("#page")), "with nothing added, the front says so and where assignments come from", "");
  await shot(reader, "1-front-empty");
});

await section("2 · the registry is the Clients page (the super user's)", async () => {
  boss = await as("boss@forefront.example");
  await goTab(boss, "clients"); await listView(boss);
  check(!!(await boss.$('[data-add-assignment="raya-trade"]')), "in the list view, the super user is offered + Add an assignment under a client", "");
  await goTab(reader, "clients"); await listView(reader);
  check(!(await reader.$('[data-add-assignment="raya-trade"]')), "…a consultant is not (Islam: \"registry is from the super user\")", "");
  /* refused on the server, not only hidden */
  const refused = await reader.evaluate(() => fetch("/api/cases", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "assign", client: "raya-trade", name: "Sneaky", kind: "planning", started: "2025-01" }) }).then((r) => r.status));
  check(refused === 403, "…and a consultant's own request to add one is refused by the server", refused);
  await addAssignment(boss, "raya-trade", { name: "Strategy build", kind: "planning", start: "2025-01", end: "2025-06" });
  check(/Pick the lead/.test(await boss.textContent("tr.asgform")), "an assignment with no lead is refused, in words, and the form stays open", await boss.textContent("tr.asgform").catch(() => ""));
  await boss.selectOption("#asg-lead", { label: "Islam Writer" });
  await boss.click('tr.asgform button:has-text("Add")'); await boss.waitForTimeout(1200);
  await addAssignment(boss, "raya-trade", { name: "Strategy follow-up", kind: "retainer", start: "2025-07", days: 24, lead: "Islam Writer" });
  const rows = await boss.$$eval("tr.asgrow", (rs) => rs.map((r) => r.textContent));
  check(rows.length === 2 && rows.some((t) => /Planning.*Strategy build.*Jan – Jun 2025.*Lead: Islam Writer/.test(t)) && rows.some((t) => /Retainer.*Strategy follow-up.*since Jul 2025.*Man-days: 24.*Lead: Islam Writer.*Running/.test(t)),
    "both assignments stand under Raya Trade with their type, months and lead — and the planned man-days where they were given (§696)", JSON.stringify(rows));
  check(!rows.some((t) => /Strategy build.*Man-days/.test(t)), "…an assignment with none recorded says nothing about man-days", JSON.stringify(rows));
  const db = (await owner.query("SELECT id, kind, lead_id, started, ended, state FROM case_studies ORDER BY started")).rows;
  planId = db[0] && db[0].id; retId = db[1] && db[1].id;
  check(db.length === 2 && db[0].kind === "planning" && db[1].kind === "retainer" && db[0].lead_id === writerId && db.every((r) => r.state === "running"),
    "…and in the rows: two assignments, typed, led by the writer, nothing written yet", JSON.stringify(db));
  /* THE LINE AS AGREED (2026-10-27): the label bold, the name plain; one +,
     beside the last line and drawn in the middle of its square; status a word */
  const look = await boss.evaluate(() => {
    const lead = Array.from(document.querySelectorAll("tr.asgrow .facts b")).find((b) => b.textContent === "Lead:");
    const plus = document.querySelectorAll('tr.asgrow .asgplus[data-add-assignment="raya-trade"]');
    const box = plus[0] && plus[0].getBoundingClientRect(), ic = plus[0] && plus[0].querySelector("svg").getBoundingClientRect();
    const last = Array.from(document.querySelectorAll("tr.asgrow")).filter((r) => r.querySelector(".asgplus")).pop();
    return { labelBold: lead && +getComputedStyle(lead).fontWeight >= 600, nameBold: lead && +getComputedStyle(lead.parentNode).fontWeight >= 600,
      plusN: plus.length, onLast: !!last && !last.nextElementSibling?.classList.contains("asgrow"),
      off: box ? [Math.abs((ic.left + ic.width / 2) - (box.left + box.width / 2)), Math.abs((ic.top + ic.height / 2) - (box.top + box.height / 2))] : null,
      ownLine: !!document.querySelector('tr.asgadd [data-add-assignment="raya-trade"]') };
  });
  check(look.labelBold && !look.nameBold, "Lead: is bold and the name after it is not", JSON.stringify(look));
  check(look.plusN === 1 && look.onLast && !look.ownLine, "one + beside the last assignment, and no line of its own", JSON.stringify(look));
  check(look.off && look.off[0] < 0.75 && look.off[1] < 0.75, "…drawn in the middle of its square", JSON.stringify(look.off));
  await shot(boss, "2-registry");
});

await section("2c · a client whose assignments have all ended is under Ended", async () => {
  await owner.query("UPDATE case_studies SET ended = '2025-12' WHERE name = 'Strategy follow-up'");
  await goTab(boss, "clients");
  check(!(await boss.$('table[data-grid="clients"] tr.crow[data-client="raya-trade"]')), "with both assignments over, Raya Trade leaves Active", "");
  await boss.click('.clwhich button[data-which="ended"]'); await boss.waitForTimeout(500);
  const row = await boss.textContent('table[data-grid="archived"] tr.crow[data-client="raya-trade"]').catch(() => "");
  check(/Assignments ended/.test(row) && /Strategy/.test(row), "…and stands under Ended, still with its modules: its platform stays open", row);
  const t = (await owner.query("SELECT status FROM tenants WHERE key = 'raya-trade'")).rows[0];
  check(t.status !== "retired", "…and nothing about the client itself changed", JSON.stringify(t));
  await owner.query("UPDATE case_studies SET ended = '' WHERE name = 'Strategy follow-up'");
  await goTab(boss, "clients");
  check(!!(await boss.$('table[data-grid="clients"] tr.crow[data-client="raya-trade"]')), "CONTROL — a running assignment puts it back under Active", "");
});

await section("2b · the month picker", async () => {
  await boss.click('[data-add-assignment="raya-trade"]'); await boss.waitForTimeout(900);
  check(/Still running/.test(await boss.textContent("#asg-end")), "an empty end reads Still running, not a blank box", await boss.textContent("#asg-end"));
  await boss.click("#asg-start");
  const nav = await boss.$$eval(".mppanel .mpnav", (bs) => bs.map((b) => b.getAttribute("aria-label")));
  const months = await boss.$$eval(".mppanel .mpgrid button", (bs) => bs.map((b) => b.textContent));
  check(JSON.stringify(nav) === JSON.stringify(["Previous year", "Next year"]) && months.length === 12,
    "it opens on the year with ‹ and › either side, and the twelve months under it", JSON.stringify([nav, months.length]));
  const y0 = +(await boss.textContent(".mppanel .mpyear"));
  await boss.click('.mppanel button[aria-label="Previous year"]'); await boss.click('.mppanel button[aria-label="Previous year"]');
  check(+(await boss.textContent(".mppanel .mpyear")) === y0 - 2, "‹ goes back a year a press", await boss.textContent(".mppanel .mpyear"));
  await shot(boss, "2b-picker");
  const box = await boss.evaluate(() => { const r = document.querySelector("#asg-start").getBoundingClientRect(), q = document.querySelector(".mppanel").getBoundingClientRect();
    return { gap: Math.round(q.top - r.bottom), dx: Math.round(q.left - r.left) }; });
  check(box.gap >= 0 && box.gap < 16 && Math.abs(box.dx) < 4, "…and the panel opens just under its box, whatever the console's zoom", JSON.stringify(box));
  await boss.click('.mppanel .mpgrid button[data-m="03"]');
  check(/Mar \d{4}/.test(await boss.textContent("#asg-start")) && !(await boss.$(".mppanel")), "a month picked fills the box and closes the panel", await boss.textContent("#asg-start"));
  await boss.click('tr.asgform button:has-text("Cancel")'); await boss.waitForTimeout(500);
});

await section("3 · a past client, added on Ended, with its assignment", async () => {
  await boss.click('.clwhich button[data-which="ended"]'); await boss.waitForTimeout(500);
  await boss.click('button:has-text("+ Add a past client")'); await boss.waitForTimeout(500);
  await boss.fill("#past-name", "Nile Logistics");
  await boss.click('button:has-text("Add the past client")'); await boss.waitForTimeout(2500);
  const t = (await owner.query("SELECT key, past, status FROM tenants WHERE name = 'Nile Logistics'")).rows[0];
  check(!!t && t.past && t.status === "retired", "it is made ended, with nothing behind its door", JSON.stringify(t));
  await boss.click('.clwhich button[data-which="ended"]').catch(() => {}); await boss.waitForTimeout(500);
  await addAssignment(boss, t.key, { name: "Operating model 2023", kind: "planning", start: "2023-03", end: "2023-11", lead: "Islam Writer" });
  pastId = (await owner.query("SELECT id FROM case_studies WHERE name = 'Operating model 2023'")).rows[0]?.id;
  check(!!pastId, "…and its assignment is added under it the same way", "");
});

await section("4 · the write-up lands on the lead's My tasks", async () => {
  writer = await as("writer@forefront.example");
  await goTab(writer, "mywork");
  const rows = await writer.$$eval(".mwcase", (rs) => rs.map((r) => r.textContent));
  check(rows.some((t) => /Write up the assignment · Operating model 2023/.test(t)) && rows.some((t) => /Strategy build/.test(t)),
    "the two ended assignments are on their lead's My tasks, with nobody asking", JSON.stringify(rows));
  check(!rows.some((t) => /Strategy follow-up/.test(t)), "…the running Retainer is not", JSON.stringify(rows));
  const late = await writer.$eval('.mwcase[data-case="' + pastId + '"]', (r) => r.classList.contains("late")).catch(() => null);
  check(late === true, "…and the one that ended in 2023 is late", late);
  await goTab(reader, "mywork");
  check((await reader.$$(".mwcase")).length === 0, "CONTROL — somebody who leads none has none", "");
  await goTab(writer, "mywork");
  await writer.click('.mwcase[data-case="' + pastId + '"]'); await writer.waitForTimeout(2000);
  const prompt = await writer.textContent("pre.prompt").catch(() => "");
  check(/Nile Logistics/.test(prompt) && /Operating model 2023 \(Planning\)/.test(prompt) && /Lead:\s+Islam Writer/.test(prompt),
    "pressing it opens the prompt straight away, filled from the registry", prompt.slice(0, 300));
  const href = await writer.getAttribute('a:has-text("Open in Claude")', "href").catch(() => "");
  check(/^https:\/\/claude\.ai\/new\?q=/.test(href) && decodeURIComponent(href.split("q=")[1] || "").includes("Operating model 2023"),
    "…with Open in Claude beside Copy the prompt, carrying the same prompt", href.slice(0, 120));
  await shot(writer, "4-write");
});

await section("5 · paste, check, publish", async () => {
  await writer.fill("#cs-paste", PASTE);
  await writer.click('button:has-text("Fill the write-up")'); await writer.waitForTimeout(1200);
  const found = await writer.textContent(".found").catch(() => "");
  check(brk === "no-split" ? true : /Read 7 of 8 sections and 2 learnings/.test(found), "the paste is read into seven sections and two learnings", found);
  check(/Learnings found in the answer/.test(await writer.textContent("#page")), "…the learnings are listed under the draft, tied to this assignment", "");
  check(!(await writer.$("#cs-d-name")), "…and the name and months are not typed again: they are the registry's", "");
  await shot(writer, "5-check");
  await writer.click('.pubbar button:has-text("Publish")'); await writer.waitForTimeout(2500);
  const r = await rowOf(pastId);
  check(r.state === "done" && r.writer_id === writerId && /three regional depots/.test(r.in_short), "Publish saves it and marks it published, the writer named", JSON.stringify({ state: r.state, w: r.writer_id === writerId }));
  const n = (await owner.query("SELECT count(*)::int AS n FROM memory_entries WHERE case_id = $1", [pastId])).rows[0].n;
  check(n === 2, "…its two learnings saved into this assignment", n);
  check(/three regional depots/.test(await writer.textContent("#page")) && !!(await writer.$('.trtabs button[aria-selected="true"]')),
    "…and it lands on the client's page, on its tab", "");
});

await section("6 · what a new joiner sees", async () => {
  await openTab(reader);
  const cards = await reader.$$eval(".trcard", (cs) => cs.map((c) => c.dataset.client));
  check(cards.length === 2, "the front draws one card per client", JSON.stringify(cards));
  const nile = await reader.textContent('.trcard:has-text("Nile Logistics")').catch(() => "");
  check(/Operating model 2023/.test(nile) && /Written up/i.test(nile) && /2 learnings/.test(nile), "…each with its assignments, where each stands, and its learnings", nile);
  const raya = await reader.textContent('.trcard[data-client="raya-trade"]').catch(() => "");
  check(/Strategy build/.test(raya) && /Not written/i.test(raya) && /Strategy follow-up/.test(raya) && /Running/i.test(raya), "…an ended one not yet written says so, a running one says Running", raya);
  await reader.click('.trchips button[data-kind="hiccup"]'); await reader.waitForTimeout(1200);
  const res = await reader.$$eval(".trlr", (rs) => rs.map((r) => r.textContent));
  check(res.length === 1 && /drivers first/.test(res[0]) && /Nile Logistics/.test(res[0]) && /Operating model 2023/.test(res[0]),
    "picking Hiccup lists the hiccups across clients, each naming its client and assignment", JSON.stringify(res));
  check(!(await reader.$(".trcards")), "…in place of the cards", "");
  await reader.click('.trchips button:has-text("Clear")'); await reader.waitForTimeout(1000);
  await reader.click('.trcard:has-text("Nile Logistics") .trhd'); await reader.waitForTimeout(1500);
  check(/three regional depots/.test(await reader.textContent("#page")) && /The depot managers heard about it/.test(await reader.textContent("#page")),
    "a client's page opens on its write-up, with the assignment's learnings under it", "");
  await shot(reader, "6-client");
});

await section("7 · a draft is its writer's, the lead's and the super users'", async () => {
  /* the writer starts the Raya Planning write-up and saves a draft */
  await writer.evaluate((id) => fetch("/api/cases", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "save", id, inShort: "A DRAFT SENTENCE NOBODY ELSE READS" }) }), planId);
  const r = await rowOf(planId);
  check(r.state === "writing" && r.writer_id === writerId, "the first save makes its saver the writer", JSON.stringify({ s: r.state }));
  await openTab(reader);
  await reader.click('.trcard[data-client="raya-trade"] .trasg button[data-case="' + planId + '"]'); await reader.waitForTimeout(1500);
  const txt = await reader.textContent("#page");
  check(brk === "drafts-open" ? /A DRAFT SENTENCE/.test(txt) === false : !/A DRAFT SENTENCE/.test(txt) && /is writing it up/.test(txt),
    "a new joiner sees that it is being written, not the draft", txt.slice(0, 200));
  const asked = await reader.evaluate((id) => fetch("/api/cases", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "case", id }) }).then((x) => x.json()), planId);
  check(asked.case && asked.case.inShort === "", "…and the server does not send it to them either", JSON.stringify(asked.case && asked.case.inShort));
});

await section("8 · adding learnings to an assignment, with the prompt", async () => {
  await openTab(reader);
  await reader.click('.pgband button:has-text("+ Add to Track Record")');
  await reader.click('.tramenu button[data-add="learn"]'); await reader.waitForTimeout(1500);
  await reader.selectOption("#tr-p-client", "raya-trade"); await reader.waitForTimeout(200);
  await reader.selectOption("#tr-p-asg", retId); await reader.waitForTimeout(200);
  const prompt = await reader.textContent("pre.prompt");
  check(/Raya Trade/.test(prompt) && /Strategy follow-up \(Retainer/.test(prompt), "the learnings prompt carries the client and the assignment picked", prompt.slice(0, 260));
  await reader.fill("#d-paste", "===\nKIND: hiccup\nTITLE: Monthly review slipped when the CEO travelled\nWHAT THE NEXT PERSON SHOULD KNOW: Agree a second chair.\n===");
  await reader.click('button:has-text("Read the learnings")'); await reader.waitForTimeout(800);
  await reader.click('button:has-text("Save all 1")'); await reader.waitForTimeout(2000);
  const e = (await owner.query("SELECT case_id FROM memory_entries WHERE title LIKE 'Monthly review%'")).rows[0];
  check(!!e && e.case_id === retId, "it is saved into the Retainer, never under the client alone", JSON.stringify(e));
  check(/Monthly review slipped/.test(await reader.textContent("#page")) && !!(await reader.$('.trtabs button[aria-selected="true"][data-case="' + retId + '"]')),
    "…and the page lands on that assignment's tab, showing it", "");
  const tabTxt = await reader.textContent(".trgrid");
  check(/Running since Jul 2025/.test(tabTxt) && !/being written up/.test(tabTxt) && !(await reader.$('.gacts button:has-text("Write it up")')),
    "…a running Retainer reads as running, with no write-up offered until it ends", tabTxt.slice(0, 160));
  await shot(reader, "8-learnings");
});

await section("9 · or typed in by hand", async () => {
  await reader.click('.trlearn button:has-text("+ Add learnings")'); await reader.waitForTimeout(1500);
  await reader.click('.trhow button[data-how="type"]'); await reader.waitForTimeout(800);
  check(/Raya Trade/.test(await reader.textContent(".trctx").catch(() => "")), "Type one in names the client and assignment it goes to", "");
  await reader.fill("#m-title", "Agree who chairs the review");
  await reader.selectOption("#m-kind", "practice");
  await reader.click('button:has-text("Save the learning")'); await reader.waitForTimeout(2000);
  const e = (await owner.query("SELECT case_id, kind FROM memory_entries WHERE title = 'Agree who chairs the review'")).rows[0];
  check(!!e && e.case_id === retId && e.kind === "practice", "…and it is saved into that assignment", JSON.stringify(e));
});

await section("10 · Write up an assignment, from the front", async () => {
  await openTab(boss);
  await boss.click('.pgband button:has-text("+ Add to Track Record")');
  await boss.click('.tramenu button[data-add="pick"]'); await boss.waitForTimeout(1500);
  await boss.selectOption("#tr-p-client", "raya-trade"); await boss.waitForTimeout(200);
  await boss.selectOption("#tr-p-asg", retId); await boss.waitForTimeout(200);
  await boss.click('.trpickcard button:has-text("Write it up")'); await boss.waitForTimeout(1500);
  check(/Strategy follow-up \(Retainer\)/.test(await boss.textContent("pre.prompt").catch(() => "")), "picking a client and assignment opens its prompt", "");
});

await section("11 · on a phone", async () => {
  const p = await as("reader@forefront.example", 390);
  await p.click("#sbopen").catch(() => {});
  await p.click('.nav button[data-tab="memory"]').catch(() => {}); await p.waitForTimeout(1500);
  const wide = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(wide <= 1, "the front does not scroll sideways at 390px", wide);
  await shot(p, "11-phone-front");
  await p.click('.trcard[data-client="raya-trade"] .trhd').catch(() => {}); await p.waitForTimeout(1500);
  const wide2 = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(wide2 <= 1, "…nor does a client's page", wide2);
  await shot(p, "11-phone-client");
});

await section("12 · nothing threw", async () => {
  check(errors.length === 0, "no page error anywhere in the walk (§118)", errors.join(" | "));
});

await browser.close();
putBack();
await stopServer(server);
await owner.end();
console.log((fails ? "RED  " : "GREEN  ") + oks + " ok, " + fails + " failed");
process.exit(fails ? 1 : 0);
