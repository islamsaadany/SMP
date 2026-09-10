/* AN UPLOAD, ALL THE WAY TO THE DATABASE (spec 043 Phase H).

   Phase H ports nothing: the workbook builders and readers are client-side
   and travel with the shell, and `template-round-trip` already proves the
   round trip is a fixed point. But it proves it IN THE BROWSER — it calls the
   builders directly and never saves — so the other half of Phase H's own row,
   "the upload's replace path and the archive land through A's save", was
   measured by nobody. And it is the half most likely to fail on this stack:
   §314.2's writer is ROW-ADDRESSED and refuses an unaddressable shape with a
   400 rather than a silent full rewrite, while a replace is precisely the
   shape that ADDS and REMOVES rows.

   So this drives the real thing: the platform's own workbook, built in a real
   browser on the served app, read back by the reader it ships, applied by the
   replace an upload applies, flushed through the save — and then read back out
   of Postgres THROUGH THE TENANT. Nothing here re-proves the round trip
   (`template-round-trip`'s subject) or the writer's own contract
   (`state-api`'s); the subject is the seam between them.

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/upload-seam.mjs
     … --break=no-inserts   (RED: rows an upload ADDS never land)
     … --break=no-deletes   (RED: rows an upload REMOVES stay behind)

   Needs `next build` first. Re-runnable: the dev tenant is REMADE at the start. */
import { spawn } from "node:child_process";
import { join } from "node:path";
import { chromium } from "playwright-core";
import pg from "pg";
import { devTenant, DEV_PASSWORD } from "../scripts/dev-tenant.mjs";
import { withTenant } from "../lib/tenant.ts";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const CHROME = process.env.SMP_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = 3975, BASE = "http://localhost:" + PORT, SLUG = "raya-trade";
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
/* A DETAIL THAT SAYS NOTHING WASTES THE FAILURE (§123). The neighbouring
   app checks pass objects to `String()`, which prints `[object Object]` — the
   red run that found this file's own bad fixture printed exactly that, twice,
   and the numbers that would have named it were in the object. Recorded rather
   than swept into the other two files, which is their own edit. */
const say = (m) => (typeof m === "string" ? m : (() => { try { return JSON.stringify(m); } catch { return String(m); } })());
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + say(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));

const { tenantId } = await devTenant({ url: URL_, log: () => {} });
const owner = new pg.Pool({ connectionString: URL_, max: 2 });
/* A SECOND TENANT, so "it landed" can be told apart from "it landed
   everywhere" (§94.2). Made the way the app makes one, not by hand. */
const other = (await owner.query(
  "INSERT INTO tenants (key, name) VALUES ('el-abd','El Abd') ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name RETURNING id")).rows[0].id;

/* READ THROUGH THE TENANT, and NEVER through a swallowed shell. The first
   version of this probe ran psql with its stderr thrown away and asked for a
   bare `name` across a join where two tables have one — so an ERROR came back
   as an empty string and read as "the value is not there", which is §93's
   fault wearing a measurement's clothes. */
const rows = (tid, sql, params = []) => withTenant(tid, async (c) => (await c.query(sql, params)).rows);

const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  cwd: join(import.meta.dirname, ".."),
  env: { ...process.env, DATABASE_URL_UNPOOLED: URL_, SMP_BREAK: brk },
  stdio: ["ignore", "pipe", "pipe"], detached: true,
});
server.stdout.on("data", () => {}); server.stderr.on("data", (d) => process.stderr.write(d));
let up = false;
for (let i = 0; i < 60 && !up; i++) { await new Promise((r) => setTimeout(r, 500)); try { up = (await fetch(BASE + "/")).status === 200; } catch {} }
if (!up) { console.log("FAIL  the app did not start"); process.kill(-server.pid); process.exit(1); }

const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
try {
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 }, bypassCSP: true });
  const page = await ctx.newPage();
  /* §167.2: the welcome screen covers the viewport, set in an init script
     because after `goto` is too late. */
  await page.addInitScript(() => { try {
    sessionStorage.setItem("smp.tour.later", "1");
    sessionStorage.setItem("smp.welcome.done", "1");
  } catch (e) {} });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto(BASE + "/" + SLUG + "/sign-in", { waitUntil: "networkidle" });
  await page.waitForSelector(".gate[data-hydrated]", { state: "attached", timeout: 20000 });
  await page.fill("#user", "office@forefront.example");
  await page.fill("#password", DEV_PASSWORD);
  await Promise.all([page.waitForURL(BASE + "/" + SLUG), page.click("#loginForm button[type=submit]")]);
  await page.goto(BASE + "/" + SLUG + "/mobile/strategy", { waitUntil: "networkidle" });
  await page.waitForFunction(() => !document.documentElement.classList.contains("booting"), null, { timeout: 25000 });

  const was = await rows(tenantId, "SELECT id, idx, name FROM pillars WHERE unit_key = 'mobile' ORDER BY idx");
  const archWas = await rows(tenantId, "SELECT id FROM plan_archives");

  console.log("── an upload that renames, adds and removes");
  /* ONE PLAN CARRYING ALL THREE KINDS OF DIFFERENCE, and the FIRST version of
     this carried only one while claiming three. A plan row's id is minted BY
     POSITION on arrival (§22), so dropping the last pillar and appending a new
     one leaves the id set `mobile-P1…P4` exactly as it was: every row an
     UPDATE, no insert and no delete, with two labels above them saying
     otherwise. `--break=no-inserts` said so — it went red on the ARCHIVE and
     green on both pillar claims (§94.5, and the reason a break is written
     before a green run is believed). What actually moves the row set is the
     COUNT: a fifth pillar is an insert, and one fewer measure under the first
     is a delete. */
  const r = await page.evaluate(async () => {
    const u = unitLike("mobile");
    u.items[0].name = "H SEAM RENAMED";
    const wasM = u.items[0].measures.length;
    u.items[0].measures.pop();                       /* one fewer measure → a DELETE */
    const born = JSON.parse(JSON.stringify(u.items[0]));
    born.name = "H SEAM ADDED"; born.id = null; born.code = "";
    born.measures = born.measures.slice(0, 1); born.tactics = born.tactics.slice(0, 1);
    u.items.push(born);                              /* a fifth pillar → an INSERT */
    const bytes = buildXlsx(planWorkbook(u));
    const sheets = await readXlsx(bytes.buffer ? bytes.buffer : bytes);
    const fromFile = planFromWorkbook(u, sheets);
    applyPlanReplace(u, fromFile);
    const saved = await new Promise((done) => SYNC.saveNow((x) => done(x)));
    return { saved: String(saved), wasM, nowM: u.items[0].measures.length,
             names: u.items.map((p) => p.name) };
  });
  check(r.saved === "saved", "the save answered, through the row-addressed writer", r);
  const now = await rows(tenantId, "SELECT id, idx, name FROM pillars WHERE unit_key = 'mobile' ORDER BY idx");
  const names = now.map((x) => x.name);
  check(JSON.stringify(names) === JSON.stringify(r.names),
    "and the database holds exactly the plan the page holds", { db: names, page: r.names });
  check(names.includes("H SEAM RENAMED"), "the renamed pillar landed — an update", names);
  check(names.includes("H SEAM ADDED") && now.length === was.length + 1,
    "the ADDED pillar landed — an INSERT, and the count grew by exactly one",
    { before: was.length, after: now.length, db: names });
  const ms = await rows(tenantId, "SELECT id FROM measures WHERE pillar_id = $1", [now[0].id]);
  check(r.nowM === r.wasM - 1 && ms.length === r.nowM,
    "and the dropped measure is GONE — a delete, not a leftover",
    { was: r.wasM, page: r.nowM, db: ms.length });

  console.log("── the archive, and nowhere else");
  const arch = await rows(tenantId, "SELECT id, kind, key, why FROM plan_archives");
  check(arch.length === archWas.length + 1,
    "replacing a plan archived the outgoing one, exactly once (§22, §49.2)", arch.map((a) => a.why));
  /* THE PRODUCT'S OWN REASON, never this file's: the first version of this
     probe called `archiveUnitPlan` ITSELF and read two rows back, so it was
     measuring its own call (§100.3). `applyPlanReplace` goes through
     `clearUnitPlan`, which archives. */
  const mine = arch.filter((a) => !archWas.some((b) => b.id === a.id))[0];
  check(mine && mine.kind === "unit" && mine.key === "mobile" && /upload/i.test(mine.why || ""),
    "...written by the replace path itself, naming the upload", mine);
  const elsewhere = await rows(other, "SELECT id FROM pillars WHERE unit_key = 'mobile'");
  check(elsewhere.length === 0, "and none of it reached the other client", elsewhere.length);
  check(errs.length === 0, "no page errors in any of it", errs.slice(0, 2));
  await ctx.close();
} catch (e) {
  /* §215: a file that drives a browser can throw at every wait. It reports. */
  fail("the seam — the file died rather than reporting (§215)", e && e.message ? e.message.split("\n")[0] : e);
} finally {
  await browser.close();
  try { process.kill(-server.pid); } catch {}
  await owner.query("DELETE FROM tenants WHERE key = 'el-abd'").catch(() => {});
  await owner.end();
}
console.log("\n" + (fails ? "RED   " : "GREEN ") + oks + " ok, " + fails + " failed");
process.exit(fails ? 1 : 0);
