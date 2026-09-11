/* The Memory tab, driven in a real browser against the built app (spec 044).
 *
 * WHAT IT IS FOR, beyond "the page renders": a page wired to nothing looks
 * identical to one that works (§96), so every press here is read back THROUGH
 * THE API rather than off the screen — and the two states that decide whether
 * anybody uses this are the ones the demo cannot show, so they are MADE: an
 * insight with one answer filled in (which must look like a finished row, not
 * a broken one — §245) and an empty memory.
 *
 *   DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/memory-page.mjs
 *   … --break=no-split (RED: the build forgot to put the splitter where the page's tag points)
 *   … --shots=<dir>    (also writes list.png, entry.png, wiz.png, empty.png)
 *
 * Needs `next build` first and the chromium this image carries. */
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
const PORT = 3982, BASE = "http://localhost:" + PORT;
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
await owner.query("DELETE FROM users WHERE email = 'second@forefront.example'");
await owner.query(
  "INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) VALUES ($1,$2,'office',false,false,$3)",
  ["second@forefront.example", "Second Consultant", hashPassword(DEV_PASSWORD)]);

/* A CHECK MUST NOT TALK TO A SERVER IT DID NOT START (§105.6, §54.5).
   `next start` on a taken port fails quietly, the wait below then succeeds
   against WHATEVER is listening, and the run measures bytes this working tree
   never wrote — which is exactly what happened while this file was written: a
   server from an earlier run held the port from before a script tag existed,
   so the page's JS was current and its DOCUMENT was four minutes old, and the
   check reported a product fault that was not there. Refused outright. */
async function portFree(port) {
  try { await fetch("http://localhost:" + port + "/", { signal: AbortSignal.timeout(800) }); return false; }
  catch { return true; }
}
/* AND IT LEAVES THE PORT AS IT FOUND IT, or the NEXT run is the one that
   measures the stale server: killed by group, then WAITED for. */
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

const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  cwd: join(import.meta.dirname, ".."),
  env: { ...process.env, DATABASE_URL_UNPOOLED: URL_, SMP_BREAK: brk },
  stdio: ["ignore", "pipe", "pipe"], detached: true,
});
server.stdout.on("data", () => {}); server.stderr.on("data", () => {});
let up = false;
for (let i = 0; i < 60 && !up; i++) { await new Promise((r) => setTimeout(r, 500)); try { up = (await fetch(BASE + "/")).status === 200; } catch {} }
if (!up) { console.log("FAIL  the app did not start"); await stopServer(server); process.exit(1); }
if (shots) mkdirSync(shots, { recursive: true });

/* THE BREAK IS ONE THE BUILD COULD REALLY MAKE: scripts/build-shell.mjs
   refuses if platform.html's script TAG ever goes, and nothing catches the
   copy failing — so that is what is modelled here, by moving the file aside
   and putting it back (§276: broken from the real thing, not from a doctored
   copy of the check). */
const SPLIT_AT = join(import.meta.dirname, "..", "public", "memory-split.js");
if (brk === "no-split") renameSync(SPLIT_AT, SPLIT_AT + ".aside");
const putSplitBack = () => { if (brk === "no-split") { try { renameSync(SPLIT_AT + ".aside", SPLIT_AT); } catch {} } };

const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const pg_ = await ctx.newPage();
const errors = [];
pg_.on("pageerror", (e) => errors.push(String(e.stack || e)));

/* signed in as a consultant with NO admin flag — the person decision 1 is about */
await pg_.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await pg_.fill("#user", "second@forefront.example");
await pg_.fill("#password", DEV_PASSWORD);
await pg_.click("#loginForm button[type=submit]");
await pg_.waitForURL(/\/platform/, { timeout: 15000 });
await pg_.waitForSelector(".nav button", { timeout: 15000 });

const api = (body) => pg_.evaluate((b) =>
  fetch("/api/memory", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json()), body);
const rows = async () => (await owner.query("SELECT count(*)::int n FROM memory_entries")).rows[0].n;
const openMemory = async () => {
  await pg_.click('.nav button[data-tab="memory"]');
  await pg_.waitForTimeout(600);
};

await section("1 · the tab a consultant with no admin flag can reach", async () => {
  const tabs = await pg_.$$eval(".nav button", (bs) => bs.map((b) => b.textContent.trim()));
  check(tabs.includes("Memory"), "Memory is in the navigation — decision 1: no gate", JSON.stringify(tabs));
  /* THE CONTROL IS THE TAB THAT IS ACTUALLY GATED. Written first as "neither
     Consultants nor Who sees what", which was the CHECK being wrong rather
     than the product: any office account may read the consultants list, so
     only `Who sees what` narrows here (§94.5 — a control asserting more than
     the product claims fails honestly and says nothing). */
  check(!tabs.includes("Who sees what"),
    "CONTROL — the gated tab is NOT there for this person, so 'no gate' on Memory means something (§113.8)", JSON.stringify(tabs));
});

await section("2 · nothing yet", async () => {
  await openMemory();
  const txt = await pg_.textContent(".wrap");
  check(/Nothing here yet/.test(txt), "an empty memory says so", txt.slice(0, 120));
  check(/names the client it came from and the person who wrote it/.test(txt),
    "…and the one sentence on the page is a FACT, not a description of the page (rule 1b-ii)", "");
  check((await pg_.$$(".filters")).length === 0, "…and no filters over nothing to filter (§61)", "filters drawn over an empty memory");
  if (shots) await pg_.screenshot({ path: join(shots, "empty.png"), fullPage: true });
});

await section("3 · writing one through the form, read back from the DATA", async () => {
  await pg_.click('.ptitle .right button:has-text("Add one insight")');
  await pg_.waitForSelector("#m-title", { timeout: 10000 });
  await pg_.selectOption("#m-kind", "hiccup");
  await pg_.fill("#m-title", "The workshop ran twice");
  await pg_.fill("#m-when", "August 2026");
  await pg_.fill("#m-happened", "ran it without the CEO in the room");
  const before = await rows();
  await pg_.click('.ptitle .right button:has-text("Save")');
  await pg_.waitForTimeout(1200);
  const after = await rows();
  check(after === before + 1, "the press writes a row", before + " → " + after);
  const stored = (await owner.query("SELECT kind, title, occurred, happened, did FROM memory_entries ORDER BY created_at DESC LIMIT 1")).rows[0];
  check(stored && stored.title === "The workshop ran twice" && stored.kind === "hiccup" && stored.occurred === "August 2026"
        && stored.happened === "ran it without the CEO in the room",
    "…and every field reaches the STORED row, not just the screen (§96)", JSON.stringify(stored));
  check(stored && stored.did === "", "…with the three unanswered questions stored empty rather than invented", JSON.stringify(stored && stored.did));
});

await section("4 · the list, and a one-answer insight looking finished (§245)", async () => {
  await openMemory();
  const rowsOn = await pg_.$$(".erow");
  check(rowsOn.length === 1, "the insight is on the list", rowsOn.length);
  const t = await pg_.textContent(".erow");
  check(/HICCUP/i.test(t) && /The workshop ran twice/.test(t), "…wearing its kind and its title", t.replace(/\s+/g, " ").slice(0, 100));
  check(/Second Consultant/.test(t), "…and its AUTHOR, which is what a reader acts on (decision 3)", t.replace(/\s+/g, " ").slice(0, 140));
  check(/Raya Trade/.test(t), "…and the client it came from", "");
  const snip = await pg_.$(".erow .snip");
  check(!!snip, "a one-answer insight still draws a snippet — a quick one must look finished, not broken", "no snippet");
  const h = await pg_.$eval(".erow", (e) => e.getBoundingClientRect().height);
  check(h > 60 && h < 200, "…and the row is an ordinary row, not a collapsed one", h);
  if (shots) await pg_.screenshot({ path: join(shots, "list.png"), fullPage: true });
});

await section("5 · reading one — the author is a block, and nobody is watched", async () => {
  const beforeRows = await rows();
  const beforeLog = (await owner.query("SELECT count(*)::int n FROM tenant_log")).rows[0].n;
  await pg_.click(".erow");
  await pg_.waitForSelector(".ecard", { timeout: 10000 });
  const card = await pg_.textContent(".ecard");
  check(/What happened/.test(card), "the answered question is a heading", card.replace(/\s+/g, " ").slice(0, 120));
  check(!/What we did/.test(card), "…and an unanswered one is NOT a heading over nothing", "an empty question was drawn");
  check((await pg_.$$(".byline .who .nm")).length === 1, "the author is a block at the foot, not a byline under the title", "");
  const ask = await pg_.$(".byline a.btn");
  check(!!ask && /^mailto:/.test(await ask.getAttribute("href")),
    "…with a way to write to them, so 'go and ask' is something you can do", ask ? await ask.getAttribute("href") : "no link");
  check((await rows()) === beforeRows && (await owner.query("SELECT count(*)::int n FROM tenant_log")).rows[0].n === beforeLog,
    "OPENING IT WRITES NO ROW ANYWHERE — decision 4, asserted as an absence", "something was logged");
  if (shots) await pg_.screenshot({ path: join(shots, "entry.png"), fullPage: true });
});

await section("6 · somebody else's insight offers no pen", async () => {
  const id = (await owner.query("SELECT id FROM memory_entries LIMIT 1")).rows[0].id;
  const otherAuthor = (await owner.query("SELECT id FROM users WHERE email = 'office@forefront.example'")).rows[0].id;
  await owner.query("UPDATE memory_entries SET author_id = $2 WHERE id = $1", [id, otherAuthor]);
  await openMemory();
  await pg_.click(".erow");
  await pg_.waitForSelector(".ecard", { timeout: 10000 });
  const btns = await pg_.$$eval(".byline .sp .btn", (bs) => bs.map((b) => b.textContent.trim()));
  check(!btns.some((b) => /Edit|Remove/.test(b)), "no Edit and no Remove on somebody else's", JSON.stringify(btns));
  check(btns.some((b) => /^Ask /.test(b)), "…and the way to ask them is still there, which is the whole point of it", JSON.stringify(btns));
  /* CONTROL: put it back and the pen returns, or "no buttons" would pass on a
     build that drew none for anybody (§94.2). */
  const mineAuthor = (await owner.query("SELECT id FROM users WHERE email = 'second@forefront.example'")).rows[0].id;
  await owner.query("UPDATE memory_entries SET author_id = $2 WHERE id = $1", [id, mineAuthor]);
  await openMemory();
  await pg_.click(".erow");
  await pg_.waitForSelector(".ecard", { timeout: 10000 });
  const mineBtns = await pg_.$$eval(".byline .sp .btn", (bs) => bs.map((b) => b.textContent.trim()));
  check(mineBtns.some((b) => b === "Edit"), "CONTROL — the author's own DOES offer Edit", JSON.stringify(mineBtns));
});

await section("7 · removing one asks twice", async () => {
  const before = await rows();
  await pg_.click('.byline .sp button:has-text("Remove")');
  await pg_.waitForTimeout(300);
  check((await rows()) === before, "the first press changes nothing — it is not `confirm()` and it is not a dialog (§95)", before + " → " + (await rows()));
  const word = await pg_.textContent('.byline .sp button:has-text("Remove")');
  check(/cannot be undone/.test(word), "…the button says what the second press does", word);
  await pg_.click('.byline .sp button:has-text("Remove")');
  await pg_.waitForTimeout(1200);
  check((await rows()) === before - 1, "…and the second press removes it", before + " → " + (await rows()));
});

await section("8 · a period debrief, end to end", async () => {
  await openMemory();
  /* THE PAGE DEPENDS ON A FILE, so the check asserts the file arrived — a
     dependency that silently does not load is a button that throws (§96). */
  const loaded = await pg_.evaluate(() => ({ t: typeof window.MemorySplit, n: document.scripts.length,
    srcs: Array.from(document.scripts).map((s) => s.getAttribute("src")) }));
  check(loaded.t === "object", "the splitter the page loads is THERE (spec 044: its own file, so node and the browser run the same bytes)", JSON.stringify(loaded));
  await pg_.click('.ptitle .right button:has-text("Write up a period")');
  await pg_.waitForSelector("#d-paste", { timeout: 10000 });
  await pg_.fill("#d-from", "1 August 2026");
  await pg_.fill("#d-to", "11 September 2026");
  await pg_.waitForTimeout(200);
  const prompt = await pg_.textContent(".prompt");
  check(/Raya Trade/.test(prompt) && /1 August 2026 to 11 September 2026/.test(prompt),
    "the prompt carries the client and the period the page was given", prompt.slice(0, 90));
  check(/ONE question at a time/.test(prompt), "…and asks for one question at a time, which is what makes it a debrief", "");
  check(/Use my words, not yours/.test(prompt), "…and forbids invention, which is why the drafts screen exists", "");

  await pg_.fill("#d-paste", `===
KIND: hiccup
TITLE: The weighting workshop ran twice
WHAT HAPPENED: We ran it with the heads and not the owner.
===
KIND: practice
TITLE: Rehearse the first review
WHAT HAPPENED: Nothing exposes a half-filled plan like presenting it.
===
Also worth saying, finance moved faster with a named contact.
===`);
  const before = await rows();
  await pg_.click('button:has-text("Read what came back")');
  /* DEGRADES RATHER THAN DYING (§215): if the split produced nothing the rest
     of this section still reports, instead of one timeout hiding ten
     assertions — which is how the stale server above read as one fault. */
  const drew = await pg_.waitForSelector(".dcard", { timeout: 8000 }).then(() => true, () => false);
  check(drew, "the press splits the paste into drafts", "no draft was drawn — the rest of this section cannot report");
  if (!drew) return;
  check((await rows()) === before, "READING is not saving — nothing is stored by the press that splits it", before + " → " + (await rows()));
  const cards = await pg_.$$(".dcard");
  check(cards.length === 3, "three drafts, the unreadable block among them", cards.length);
  check((await pg_.$$(".dcard.raw")).length === 1, "…and the one it could not read is MARKED, not dropped (§184)", "");
  /* THE WORDS ARE IN A TEXTAREA'S VALUE, and `textContent` cannot see one —
     asked first that way, which reported a correct build broken (§100.3). */
  const raw = await pg_.$eval(".dcard.raw textarea", (t) => t.value);
  check(/finance moved faster/.test(raw), "…with its own words still in it, ready to be given a title", JSON.stringify(raw).slice(0, 120));
  const found = await pg_.textContent(".found");
  check(/2 insights read/.test(found) && /1 block it could not/.test(found),
    "the count says what was read AND what was not (§108.1)", found.replace(/\s+/g, " "));

  /* A DROP CHANGES THE COUNT ABOVE IT, or the strip and the rows disagree */
  await pg_.click('.dcard.raw button:has-text("Drop")');
  await pg_.waitForTimeout(400);
  check((await pg_.$$(".dcard")).length === 2, "dropping one takes it out", (await pg_.$$(".dcard")).length);
  check(/2 insights read/.test(await pg_.textContent(".found")) && !/could not/.test(await pg_.textContent(".found")),
    "…and the count above follows it", (await pg_.textContent(".found")).replace(/\s+/g, " "));

  await pg_.click('.ptitle .right button:has-text("Save all")');
  await pg_.waitForTimeout(1500);
  check((await rows()) === before + 2, "…and Save all lands both, together", before + " → " + (await rows()));
  const kinds = (await owner.query("SELECT kind FROM memory_entries ORDER BY created_at DESC LIMIT 2")).rows.map((r) => r.kind).sort();
  check(kinds.join(",") === "hiccup,practice", "…each under the kind the block named", JSON.stringify(kinds));
  if (shots) await pg_.screenshot({ path: join(shots, "drafts.png"), fullPage: true });
});

/* ── contrast, measured in BOTH palettes (§38.5, §40) ───────────────────
   Every colour on these screens is one of platform.html's own tokens, which
   are measured where they were declared — and "it uses an existing token" is
   an argument, not a measurement (§38.4 has been re-learned seven times by
   putting a FILL colour on TYPE). The page's own surfaces are sampled, in
   light and in dark, because a token checked against the whitest ground it
   ever meets is checked against the one case that was never in doubt. */
await section("9 · it can be read, in both palettes", async () => {
  const lum = (c) => {
    const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const parse = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);

  for (const theme of ["light", "dark"]) {
    await pg_.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    await openMemory();
    await pg_.waitForSelector(".erow", { timeout: 8000 }).catch(() => {});
    const worst = await pg_.evaluate(() => {
      const out = [];
      const grounds = (el) => {
        let n = el, bg = null;
        while (n && n !== document.documentElement) {
          const c = getComputedStyle(n).backgroundColor;
          if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) { bg = c; break; }
          n = n.parentElement;
        }
        return bg || getComputedStyle(document.body).backgroundColor;
      };
      document.querySelectorAll(".erow h3, .erow .snip, .erow .facts, .erow .tag, .count, .askrow .fld, .filters .fld, .cell button, .found, .dcard .lab")
        .forEach((el) => {
          const t = (el.textContent || "").trim();
          if (!t) return;
          const cs = getComputedStyle(el);
          out.push({ what: el.className || el.tagName, fg: cs.color, bg: grounds(el),
            size: parseFloat(cs.fontSize), weight: cs.fontWeight });
        });
      return out;
    });
    let bad = [];
    for (const m of worst) {
      const r = ratio(parse(m.fg), parse(m.bg));
      /* 3.0 is the large-text floor (18.66px bold or 24px); everything else 4.5 */
      const big = m.size >= 24 || (m.size >= 18.66 && Number(m.weight) >= 700);
      if (r < (big ? 3 : 4.5)) bad.push(m.what + " " + r.toFixed(2) + " (" + m.fg + " on " + m.bg + ")");
    }
    check(bad.length === 0 && worst.length > 4,
      "every word on the memory reads in " + theme + " — measured, not argued from the token (§38.5)",
      worst.length < 5 ? "only " + worst.length + " samples — it measured nothing" : bad.join(" | "));
  }
  await pg_.evaluate(() => document.documentElement.removeAttribute("data-theme"));
});

await section("10 · nothing threw", async () => {
  check(errors.length === 0, "no page error anywhere in the walk (§118: a throw mid-paint leaves the last page on screen)", JSON.stringify(errors.slice(0, 2)));
});

await browser.close();
putSplitBack();
await owner.query("DELETE FROM memory_entries");
await owner.end();
await stopServer(server);
console.log((fails ? "RED  " : "GREEN  ") + oks + " ok, " + fails + " failed");
process.exit(fails ? 1 : 0);
