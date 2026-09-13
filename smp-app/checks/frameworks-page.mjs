/* The Frameworks tab, driven in a real browser against the built app
 * (spec 050, phases A, B and C).
 *
 * WHAT IT IS FOR, beyond "the page renders": a page wired to nothing looks
 * identical to one that works (§96). And the fault this file found on its
 * first run is the one it exists for — the filter set `row.hidden = true` and
 * the rows STAYED ON SCREEN, because `.fwrow { display:block }` beats the
 * browser's own `[hidden]` rule (measured, §93.11). The count said "12 of 80"
 * over eighty visible rows, which is the worst shape a filter can take: it
 * looks like it worked.
 *
 * SO EVERY ASSERTION HERE ASKS WHICH ROWS ARE VISIBLE, never which carry the
 * attribute (§94.8). A check written against the attribute would have gone
 * green on the broken build.
 *
 *   DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/frameworks-page.mjs
 *   … --break=no-hidden-rule (RED: the served page loses `.fwrow[hidden]`, which IS the fault above)
 *   … --break=no-admin-gate  (RED: the server says everybody may add, so the door draws for a consultant)
 *
 * THE MODEL IS STOOD IN FRONT OF (§100.3): the app is started with
 * GEMINI_ENDPOINT pointed at a stub in this process, so the drafting screens
 * can be driven without a provider and each one's answer is chosen here.
 *
 * Needs `next build` first and the chromium this image carries. */
import { spawn } from "node:child_process";
import { join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { chromium } from "playwright-core";
import pg from "pg";
import { devTenant, DEV_PASSWORD } from "../scripts/dev-tenant.mjs";
import { SCHEMA } from "../db/schema-name.mjs";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const CHROME = process.env.SMP_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = 3984, BASE = "http://localhost:" + PORT;
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
/* A break that is the SERVER's travels to it; `no-hidden-rule` is the page's
   and is made from the served artefact below. */
if (brk && brk !== "no-hidden-rule") process.env.SMP_BREAK = brk;
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));
async function section(name, fn) {
  console.log("\n── " + name);
  try { await fn(); } catch (e) { fail(name + " — the section died rather than reporting (§215)", e && e.stack ? e.stack.split("\n").slice(0, 2).join(" ") : e); }
}

await devTenant({ url: URL_, log: () => {} });

/* A CHECK MUST NOT TALK TO A SERVER IT DID NOT START (§105.6, §54.5). */
async function portFree(port) {
  try { await fetch("http://localhost:" + port + "/", { signal: AbortSignal.timeout(800) }); return false; }
  catch { return true; }
}
async function stopServer(s) {
  try { process.kill(-s.pid); } catch {}
  try { s.kill("SIGKILL"); } catch {}
  for (let i = 0; i < 20; i++) { if (await portFree(PORT)) return; await new Promise((r) => setTimeout(r, 250)); }
}
if (!(await portFree(PORT))) {
  console.log("FAIL  something is already listening on " + PORT + " — this check will not measure a server it did not start");
  process.exit(1);
}

/* THE BREAK IS MADE FROM THE REAL ARTEFACT (§276), not from a doctored copy
   of the check: the one rule is cut out of the page the server is about to
   serve, and put back in the `finally` whatever happens. */
const DOC = join(import.meta.dirname, "..", "shell", "platform.html");
const RULE = "  .fwrow[hidden]{ display:none }";
let original = null;
if (brk === "no-hidden-rule") {
  original = readFileSync(DOC, "utf8");
  if (original.indexOf(RULE) < 0) { console.log("FAIL  the rule this break removes is not in the served page"); process.exit(1); }
  writeFileSync(DOC, original.replace(RULE, ""));
}
const putItBack = () => { if (original != null) { try { writeFileSync(DOC, original); } catch {} } };

/* ── The stub in front of the model, and what it answers ───────────── */
let reply = null;
const answers = (o) => { reply = o; };
const stub = createServer((req, res) => {
  let b = ""; req.on("data", (d) => { b += d; });
  req.on("end", () => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(reply) }] } }] }));
  });
});
await new Promise((r) => stub.listen(0, r));
const STUB = "http://localhost:" + stub.address().port + "/";

/* A CONSULTANT WHO IS NOT AN ADMIN, which the dev tenant has none of: every
   other account it makes is either the admin or a client's own person, and
   the assertion that matters most here is that a plain consultant reads the
   whole library and is offered no door to add (§94.2). Made here, removed in
   the `finally`. */
const PLAIN = "check.plain@forefront.example";
const db = new pg.Pool({ connectionString: URL_, max: 1, options: "-c search_path=" + SCHEMA });
const { hashPassword } = await import("../lib/auth.ts");
await db.query("DELETE FROM users WHERE email = $1", [PLAIN]);
await db.query(
  "INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) " +
  "VALUES ($1, 'A Plain Consultant', 'office', false, false, $2)", [PLAIN, hashPassword(DEV_PASSWORD)]);

const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  cwd: join(import.meta.dirname, ".."),
  env: { ...process.env, DATABASE_URL_UNPOOLED: URL_, DATABASE_URL: URL_,
         GEMINI_ENDPOINT: STUB, GEMINI_API_KEY: "AIzaStubStubStubStubStubStubStubStubStu" },
  stdio: ["ignore", "pipe", "pipe"], detached: true,
});
server.stdout.on("data", () => {}); server.stderr.on("data", () => {});
let up = false;
for (let i = 0; i < 60 && !up; i++) { await new Promise((r) => setTimeout(r, 500)); try { up = (await fetch(BASE + "/")).status === 200; } catch {} }
if (!up) { console.log("FAIL  the app did not start"); await stopServer(server); putItBack(); process.exit(1); }

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
page.on("pageerror", (e) => errs.push(String(e)));

const visible = () => page.$$eval(".fwlist .fwrow", (rs) => rs.filter((r) => r.offsetParent !== null).length);

try {
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.fill("#user", "office@forefront.example");
  await page.fill("#password", DEV_PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL("**/platform*", { timeout: 20000 });
  await page.waitForSelector("body.ready", { timeout: 20000 });

  await section("the tab, and what it opens on", async () => {
    const tab = await page.$('.nav button[data-tab="frameworks"]');
    check(!!tab, "Frameworks is in the console's nav");
    await tab.click();
    await page.waitForSelector(".fwlist .fwrow", { timeout: 20000 });
    check((await page.$$(".fwlist .fwrow")).length === 80, "eighty rows are drawn");
    check((await page.innerText(".fwcount")).trim() === "80 frameworks",
      "and the count says eighty", await page.innerText(".fwcount"));
    const chips = await page.$$eval(".fwchip", (cs) => cs.map((c) => c.textContent.trim()));
    check(chips.length === 9, "one chip per section, plus All", chips.length);
    check(chips[1].startsWith("Knowing Your Business"),
      "and the first section is the book's first, not the alphabet's", chips[1]);
  });

  await section("the search narrows it, and does not rebuild it", async () => {
    /* The first row is MARKED before typing and looked for afterwards: a
       filter that rebuilt the list would lose the mark, and the cursor with
       it (constitution XV). */
    await page.$eval(".fwlist .fwrow", (r) => { r.dataset.mark = "one"; });
    await page.fill(".fwbox input", "pricing");
    await page.waitForTimeout(150);
    const shown = await visible();
    check(shown > 0 && shown < 80, "typing narrows the list — measured as what is VISIBLE", shown);
    check((await page.innerText(".fwcount")).indexOf("of 80") > 0,
      "and the count says how many of how many", await page.innerText(".fwcount"));
    check((await page.$$(".fwlist .fwrow")).length === 80,
      "every row is still in the document — they were hidden, not removed");
    check(!!(await page.$('.fwlist .fwrow[data-mark="one"]')),
      "and the marked row survived, so nothing repainted under the typing hand");
    check(await page.evaluate(() => document.activeElement === document.querySelector(".fwbox input")),
      "the box still has the cursor");

    await page.fill(".fwbox input", "zzzznotathing");
    await page.waitForTimeout(150);
    check(await visible() === 0, "nothing matching hides them all");
    check((await page.innerText(".fwcount")).trim() === "Nothing matches that.",
      "and it SAYS so rather than leaving a blank box to read as a page that failed (§45.2)",
      await page.innerText(".fwcount"));

    await page.fill(".fwbox input", "");
    await page.waitForTimeout(150);
    check(await visible() === 80, "clearing it brings all eighty back");
  });

  await section("the section chips", async () => {
    const chips = await page.$$(".fwchip");
    await chips[1].click(); await page.waitForTimeout(150);
    check(await visible() === 6, "a chip narrows to that section's own count", await visible());
    check(await page.$eval(".fwchip:nth-child(2)", (c) => c.getAttribute("aria-pressed")) === "true",
      "the pressed one says it is pressed");
    await chips[1].click(); await page.waitForTimeout(150);
    check(await visible() === 80,
      "and pressing the lit one clears it — the only way back to All without reaching for it");
  });

  await section("one framework, and the way back", async () => {
    const rows = await page.$$(".fwlist .fwrow");
    await rows[30].click();
    await page.waitForSelector(".band .fwsec", { timeout: 20000 });
    check((await page.innerText(".ptitle h1")).indexOf("Three Generic Strategies") >= 0,
      "pressing a row opens that framework", await page.innerText(".ptitle h1"));
    check((await page.$$(".band .fwsec h3")).length === 9, "nine headed sections",
      (await page.$$(".band .fwsec h3")).length);
    check((await page.innerText(".band .apart")).indexOf("Came with the library") >= 0,
      "and it says it came with the library rather than naming an author (§35)");
    await page.click(".cback");
    await page.waitForSelector(".fwlist .fwrow", { timeout: 20000 });
    check(await visible() === 80, "the way back returns to all eighty");
  });

  /* ── Phase C: asking it ────────────────────────────────────────── */

  await section("asking it, in the search's own box", async () => {
    const ways = await page.$$eval(".fwbox .cell button", (bs) => bs.map((b) => b.textContent.trim()));
    check(ways.join(" | ") === "Search | Ask it",
      "one field under a segmented pair — decision 2, and never two boxes stacked", ways.join(" | "));
    check(await page.$eval('.fwbox .cell button:has-text("Search")', (b) => b.getAttribute("aria-pressed")) === "true",
      "and it opens on searching, which is what the page is for");

    answers({ answered: true, reply: "Two of these bear on it.", source: "" });
    await page.click('.fwbox .cell button:has-text("Ask it")');
    await page.waitForSelector(".fwask button.solid", { timeout: 20000 });
    check(!(await page.$(".fwchips")), "the section chips go — they narrow a list that is not on screen");
    check(!(await page.$(".fwlist")), "and so does the list");
    check((await page.innerText(".note")).indexOf("only from the library") >= 0,
      "with the one thing worth saying before somebody types", await page.innerText(".note"));
  });

  await section("an answer names its sources, and each is a door", async () => {
    /* The stub cites two REAL ids, read out of the page's own rows — an
       answer citing something nobody has is its own assertion below. */
    const two = (await db.query("SELECT id, name FROM frameworks ORDER BY idx LIMIT 2")).rows;
    answers({ answered: true, reply: "Three bear on this, in this order.",
              source: "[" + two[0].id + "], " + two[1].id + ", 00000000-0000-0000-0000-0000000000ff" });
    await page.fill(".fwask input", "We are losing share to a cheaper entrant.");
    await page.click(".fwask button.solid");
    await page.waitForSelector(".fwans", { timeout: 20000 });
    check((await page.innerText(".fwans > p")).indexOf("Three bear on this") >= 0,
      "the answer is drawn", await page.innerText(".fwans > p"));
    const cites = await page.$$eval(".fwcite .nm", (ns) => ns.map((n) => n.textContent.trim()));
    check(cites.length === 2,
      "two sources, and the id nobody has was dropped rather than drawn as a door to a 404 (§96.2)",
      cites.length + ": " + cites.join(" | "));
    check(cites[0] === two[0].name, "each named", cites[0]);
    check((await page.$$(".fwcite .wy")).length === 2, "each saying what it is for before it is opened");

    await page.click(".fwcite");
    await page.waitForSelector(".band .fwsec", { timeout: 20000 });
    check((await page.innerText(".ptitle h1")).indexOf(two[0].name) >= 0,
      "and pressing one opens that framework — the next step is to go and read it",
      await page.innerText(".ptitle h1"));
    await page.click(".cback");
    await page.waitForSelector(".fwans", { timeout: 20000 });
    /* THE ANSWER SURVIVES THE ROUND TRIP. Losing it on the way back would
       mean reading one of three sources costs the other two. */
    check((await page.innerText(".fwans > p")).indexOf("Three bear on this") >= 0,
      "the way back finds the answer still there, with its other sources");
  });

  await section("when the library has nothing", async () => {
    answers({ answered: false, reply: "I have nothing on pre-mortems.", source: "" });
    await page.fill(".fwask input", "How do we run a pre-mortem before sign-off?");
    await page.click(".fwask button.solid");
    await page.waitForTimeout(400);
    await page.waitForSelector(".fwans", { timeout: 20000 });
    const said = await page.innerText(".fwans > p");
    check(said.indexOf("Nothing in the library covers") >= 0,
      "it says so, in the product's words and not the model's (§125)", said);
    check(said.indexOf("pre-mortems") < 0, "the model's own sentence is not what is shown");
    check((await page.$$(".fwcite")).length === 0, "a decline draws no sources");
    /* THE THIRD WAY IN, and it is the whole reason the page has two add
       buttons rather than three. */
    const door = await page.$('.fwans button.amber');
    check(!!door, "an admin is offered the door to add it");
    await door.click();
    await page.waitForSelector(".band input.fld", { timeout: 20000 });
    check((await page.innerText(".ptitle h1")).trim() === "Add a framework", "which opens the add screen");
    check((await page.inputValue(".band input.fld")) === "",
      "with the name box EMPTY — a question is not what the framework is called (§96.2)",
      await page.inputValue(".band input.fld"));
    await page.click('.row button:has-text("Cancel")');
    await page.waitForSelector(".fwbox", { timeout: 20000 });

    /* BOTH ENDS (§94.2): the sentence differs for somebody who cannot act on
       it, and a build that drew the door for everybody would pass above. */
    const p3 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      answers({ answered: false, reply: "x", source: "" });
      await p3.goto(BASE + "/", { waitUntil: "networkidle" });
      await p3.fill("#user", PLAIN);
      await p3.fill("#password", DEV_PASSWORD);
      await p3.click("button[type=submit]");
      await p3.waitForSelector("body.ready", { timeout: 20000 });
      await p3.click('.nav button[data-tab="frameworks"]');
      await p3.waitForSelector(".fwbox .cell button", { timeout: 20000 });
      await p3.click('.fwbox .cell button:has-text("Ask it")');
      await p3.fill(".fwask input", "How do we run a pre-mortem?");
      await p3.click(".fwask button.solid");
      await p3.waitForSelector(".fwans", { timeout: 20000 });
      const theirs = await p3.innerText(".fwans > p");
      check(theirs.indexOf("asking the office") >= 0,
        "a consultant is told to ask the office rather than offered a door they cannot open", theirs);
      check(!(await p3.$(".fwans button.amber")), "and is offered no door (§61)");
    } finally { await p3.close().catch(() => {}); }

    /* Back to searching, for the sections after this one. */
    await page.click('.fwbox .cell button:has-text("Search")');
    await page.waitForSelector(".fwlist .fwrow", { timeout: 20000 });
    check(await visible() === 80, "the switch goes back to searching, whole");
  });

  /* ── Phase B: adding one ───────────────────────────────────────── */

  await section("the door to adding, both ends", async () => {
    check(!!(await page.$(".ptitle .right button")),
      "an admin is offered + Add a framework on the list");
    check((await page.innerText(".ptitle .right button")).indexOf("Add a framework") >= 0,
      "and it says what it does", await page.innerText(".ptitle .right button"));

    /* THE END THAT MATTERS (§94.2): a build that drew the door for everybody
       passes every other assertion in this file. A second context, because a
       second person is a second session. */
    const p2 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await p2.goto(BASE + "/", { waitUntil: "networkidle" });
      await p2.fill("#user", PLAIN);
      await p2.fill("#password", DEV_PASSWORD);
      await p2.click("button[type=submit]");
      await p2.waitForSelector("body.ready", { timeout: 20000 });
      await p2.click('.nav button[data-tab="frameworks"]');
      await p2.waitForSelector(".fwlist .fwrow", { timeout: 20000 });
      check((await p2.$$(".fwlist .fwrow")).length === 80,
        "a consultant who is not an admin reads the whole library — decision 1");
      check(!(await p2.$(".ptitle .right button")),
        "and is offered no door to add one — never one drawn and refusing (§94.15)");
    } finally { await p2.close().catch(() => {}); }
  });

  await section("adding by name", async () => {
    /* COUNTED AS A DIFFERENCE, never as 81 (§94.8): a run that left a row
       behind would otherwise redden an assertion about something else. */
    const was = await visible();
    answers({ known: true, why: "",
      name: "The Endurance Lens (Forefront)", section: "Knowing Your Business",
      purpose: "To read how long a business can hold its position.",
      keyQuestions: "What would have to stay true for five years?",
      whenToUse: "When a plan assumes durability nobody has tested.",
      whenNotToUse: "Not for a decision due this quarter.",
      inputsRequired: "Three years of margin and share.",
      outputs: "A statement of what must hold.",
      executiveExample: "A board uses it to test an assumption.",
      consultantUseCase: "A consultant uses it before a strategy review.",
      facilitationTips: "Run it after the numbers are agreed." });

    await page.click(".ptitle .right button");
    await page.waitForSelector(".cell button", { timeout: 20000 });
    check((await page.innerText(".ptitle h1")).trim() === "Add a framework",
      "the door opens the add screen", await page.innerText(".ptitle h1"));
    const ways = await page.$$eval(".cell button", (bs) => bs.map((b) => b.textContent.trim()));
    check(ways.join(" | ") === "By name | Paste the source", "with the two ways in", ways.join(" | "));
    check(!!(await page.$(".band input.fld")), "by name is the one it opens on");

    await page.fill(".band input.fld", "The Endurance Lens");
    await page.click(".row button.solid");
    await page.waitForSelector(".fwdraft", { timeout: 20000 });
    /* THE AMBER BAND IS THE WHOLE OF DECISION 3 MADE VISIBLE. */
    check((await page.innerText(".fwdraft")).indexOf("nothing is in the library yet") >= 0,
      "the draft says it is one, and that nothing is saved", await page.innerText(".fwdraft"));
    const labs = await page.$$eval(".fwfields .lab", (ls) => ls.map((l) => l.textContent.trim()));
    check(labs.length === 11, "eleven fields, every one of them editable", labs.length);
    check((await page.inputValue(".fwfields input.fld")) === "The Endurance Lens (Forefront)",
      "carrying what came back", await page.inputValue(".fwfields input.fld"));
    check((await page.$eval(".fwfields select.fld", (e) => e.value)) === "Knowing Your Business",
      "with the section as a picker over the eight that exist — never a box that makes a ninth",
      await page.$eval(".fwfields select.fld", (e) => e.value));

    /* AN EDIT IN THE DRAFT IS WHAT IS SAVED, which is the point of the step
       existing at all — a build that posted what the model said would pass
       every assertion above. */
    const tas = await page.$$(".fwfields textarea.fld");
    await tas[0].fill("Corrected by the person reading it.");
    await page.click(".row button.amber");
    await page.waitForSelector(".band .fwsec", { timeout: 20000 });
    check((await page.innerText(".ptitle h1")).indexOf("Endurance Lens") >= 0,
      "saving lands on the framework it just made", await page.innerText(".ptitle h1"));
    check((await page.innerText(".band")).indexOf("Corrected by the person reading it.") >= 0,
      "holding the correction rather than what the model sent");
    check((await page.innerText(".band .apart")).indexOf("Added by") >= 0,
      "and saying who added it", await page.innerText(".band .apart"));
    check((await page.innerText(".said")).indexOf("Added to the library") >= 0,
      "with the word said on the page it landed on (§63)", await page.innerText(".said").catch(() => "none"));

    await page.click(".cback");
    await page.waitForSelector(".fwlist .fwrow", { timeout: 20000 });
    check(await visible() === was + 1, "and the library is one longer", was + " → " + await visible());
  });

  await section("when it will not draft one", async () => {
    answers({ known: false, why: "I do not know that one well enough to write it up.",
      name: "", section: "", purpose: "", keyQuestions: "", whenToUse: "", whenNotToUse: "",
      inputsRequired: "", outputs: "", executiveExample: "", consultantUseCase: "", facilitationTips: "" });
    await page.click(".ptitle .right button");
    await page.waitForSelector(".band input.fld", { timeout: 20000 });
    await page.fill(".band input.fld", "The Forefront Endurance Lens");
    await page.click(".row button.solid");
    await page.waitForSelector(".fwdecl", { timeout: 20000 });
    check((await page.innerText(".fwdecl")).indexOf("well enough") >= 0,
      "it says so in its own words", await page.innerText(".fwdecl"));
    check(!(await page.$(".fwdraft")), "and no draft is offered — a decline is not a half-answer");
    /* DECISION 3's OTHER HALF, drawn: the decline carries the door that
       answers it rather than being a dead end (§61). */
    const other = await page.$$eval(".row button.solid", (bs) => bs.map((b) => b.textContent.trim()));
    check(other.some((t) => t.indexOf("Paste the source instead") >= 0),
      "the way past it is on the screen", other.join(" | "));
    await page.click('.row button.solid:has-text("Paste the source")');
    await page.waitForSelector(".band textarea.fld", { timeout: 20000 });
    check(!!(await page.$(".band textarea.fld")), "pressing it opens the paste box");
    check(!(await page.$(".fwdecl")),
      "and the decline goes with the ask that produced it, rather than standing over its own answer");
  });

  await section("discard writes nothing", async () => {
    answers({ known: true, why: "", name: "A Discarded One", section: "Knowing Your Business",
      purpose: "x", keyQuestions: "x", whenToUse: "x", whenNotToUse: "x", inputsRequired: "x",
      outputs: "x", executiveExample: "x", consultantUseCase: "x", facilitationTips: "x" });
    await page.click('.cell button:has-text("By name")');
    await page.waitForSelector(".band input.fld", { timeout: 20000 });
    await page.fill(".band input.fld", "A Discarded One");
    await page.click(".row button.solid");
    await page.waitForSelector(".fwdraft", { timeout: 20000 });
    await page.click('.row button:not(.amber):has-text("Discard")');
    await page.waitForSelector(".band input.fld", { timeout: 20000 });
    check(!(await page.$(".fwdraft")), "Discard puts the draft away with no question asked — nothing was written");
    const n = (await db.query("SELECT count(*)::int AS n FROM frameworks WHERE name = 'A Discarded One'")).rows[0].n;
    check(n === 0, "and the library never held it", n);
  });

  await section("nothing threw", async () => {
    check(errs.length === 0, "no console error anywhere in that", errs.slice(0, 2).join(" | "));
  });
} finally {
  await browser.close().catch(() => {});
  await stopServer(server);
  putItBack();
  stub.close();
  await db.query("DELETE FROM frameworks WHERE added_by IS NOT NULL").catch(() => {});
  await db.query("DELETE FROM users WHERE email = $1", [PLAIN]).catch(() => {});
  await db.end().catch(() => {});
}

console.log("\n" + oks + " passed, " + fails + " failed");
process.exit(fails ? 1 : 0);
