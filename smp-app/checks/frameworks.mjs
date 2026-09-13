/* The strategy frameworks library, phase A (spec 050).
 *
 * DRIVES THE REAL HANDLER against a real database — `frameworksAction`, the
 * same function the route calls — rather than a stub of it (§100.3). What it
 * does NOT drive is the HTTP door in front of that handler: a session, and a
 * password that is no longer temporary. That door is `app/api/frameworks/route.ts`,
 * it is `/api/memory`'s byte for byte, and it is proved by that endpoint's own
 * check against a built app. Said here rather than left for somebody to
 * assume this file covers it (§113.8).
 *
 * EVERYTHING RUNS INSIDE ONE TRANSACTION THAT ALWAYS ROLLS BACK, which is what
 * lets a break delete a row to prove an assertion can fail without leaving the
 * database short of a framework afterwards.
 *
 *   DATABASE_URL_UNPOOLED=postgres://…/smp_dev node --experimental-strip-types checks/frameworks.mjs
 *   … --break=client-reads    (RED: a client's own staff read Forefront's library)
 *   … --break=alphabetical    (RED: the sections come back in name order, not the book's)
 *   … --break=short-library   (RED: one framework is missing)
 *
 * The eighty are compared against their own INVARIANTS rather than against the
 * upstream dataset, and that is deliberate: once migration 009 has run, this
 * table IS the library — admins edit it — and the toolkit repository is a
 * historical source rather than a second copy to keep in step (plan.md). The
 * invariants are strong enough to catch a truncated, duplicated or scrambled
 * load, which is what could actually go wrong.
 */
import pg from "pg";
import { SCHEMA } from "../db/schema-name.mjs";
import { frameworksAction } from "../lib/frameworks-api.ts";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
if (brk) process.env.SMP_BREAK = brk;

let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));
async function section(name, fn) {
  console.log("\n── " + name);
  try { await fn(); } catch (e) { fail(name + " — the section died rather than reporting (§215)", e && e.stack ? e.stack.split("\n").slice(0, 2).join(" ") : e); }
}

/* The three people every assertion here is about. None is written to the
   database: `frameworksAction` reads the session it is handed and nothing
   else, which is the whole reason it can be driven this way. */
const CONSULTANT = { id: "00000000-0000-0000-0000-000000000001", email: "c@forefront.example", name: "A Consultant", kind: "office", isAdmin: false, mustChange: false };
const ADMIN = { ...CONSULTANT, id: "00000000-0000-0000-0000-000000000002", name: "An Admin", isAdmin: true };
const CLIENT = { ...CONSULTANT, id: "00000000-0000-0000-0000-000000000003", name: "A Client's Own Person", kind: "client" };

const pool = new pg.Pool({ connectionString: URL_, max: 2, options: "-c search_path=" + SCHEMA });
const c = await pool.connect();
await c.query("BEGIN");

try {
  if (brk === "short-library") await c.query("DELETE FROM frameworks WHERE idx = (SELECT max(idx) FROM frameworks)");

  await section("the table is the platform's own", async () => {
    const col = await c.query(
      "SELECT 1 FROM pg_attribute a JOIN pg_class t ON t.oid = a.attrelid " +
      "WHERE t.relname = 'frameworks' AND a.attname = 'tenant_id' AND NOT a.attisdropped");
    check(col.rowCount === 0, "it carries no tenant_id column at all — a framework is about nobody");
    const r = await c.query(
      "SELECT c.relrowsecurity AS rls, c.relforcerowsecurity AS force, " +
      "(SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid)::int AS pols " +
      "FROM pg_class c WHERE c.relname = 'frameworks' AND c.relnamespace = current_schema()::regnamespace");
    check(r.rowCount === 1, "the table is there");
    check(r.rows[0] && !r.rows[0].force, "row-level security is NOT forced on it", r.rows[0] && r.rows[0].force);
    check(r.rows[0] && r.rows[0].pols === 0, "no tenant policy is attached to it", r.rows[0] && r.rows[0].pols);
    /* BOTH ENDS: a tenant-owned table beside it must still be fenced, or a
       build that switched row-level security off everywhere passes the three
       above perfectly (§94.2). */
    const t = await c.query(
      "SELECT relforcerowsecurity AS force FROM pg_class WHERE relname = 'tactics' AND relnamespace = current_schema()::regnamespace");
    check(t.rowCount === 1 && t.rows[0].force, "and a tenant-owned table beside it IS still forced — the control");
  });

  await section("the eighty, whole", async () => {
    const r = (await c.query("SELECT idx, slug, section FROM frameworks ORDER BY idx")).rows;
    check(r.length === 80, "eighty frameworks", r.length);
    const idxs = r.map((x) => x.idx);
    const wanted = Array.from({ length: 80 }, (_, i) => i + 1);
    check(JSON.stringify(idxs) === JSON.stringify(wanted),
      "their order is exactly 1–80, no gap and nothing twice — which is what catches a truncated or doubled load",
      idxs.length + " values, first " + idxs[0] + " last " + idxs[idxs.length - 1]);
    check(new Set(r.map((x) => x.slug)).size === r.length, "every slug is its own");
    const secs = [...new Set(r.map((x) => x.section))];
    check(secs.length === 8, "eight sections", secs.length);
    /* EACH SECTION IS CONTIGUOUS IN idx — a real property of the dataset, and
       what would catch a load that scrambled the book's teaching order while
       keeping every row. */
    const runs = r.reduce((a, x) => (a.length && a[a.length - 1] === x.section ? a : a.concat(x.section)), []);
    check(runs.length === 8, "and each one is one unbroken run, so the book's order survived", runs.length + " runs");
    const empty = await c.query(
      "SELECT count(*)::int AS n FROM frameworks WHERE btrim(name) = '' OR btrim(section) = '' " +
      "OR btrim(purpose) = '' OR btrim(key_questions) = '' OR btrim(when_to_use) = '' " +
      "OR btrim(when_not_to_use) = '' OR btrim(inputs_required) = '' OR btrim(outputs) = '' " +
      "OR btrim(executive_example) = '' OR btrim(consultant_use_case) = '' OR btrim(facilitation_tips) = ''");
    check(empty.rows[0].n === 0, "not one field is empty on any of them", empty.rows[0].n);
    const authored = await c.query("SELECT count(added_by)::int AS n FROM frameworks");
    check(authored.rows[0].n === 0, "and none of them claims an author — they came with the library (§35)", authored.rows[0].n);
  });

  await section("the list", async () => {
    const a = await frameworksAction(c, CONSULTANT, { action: "list" });
    check(a.code === 200 && a.body.ok, "an ordinary consultant reads it", a.code);
    const rows = a.body.frameworks || [];
    check(rows.length === 80, "all eighty come back", rows.length);
    const f = rows[0] || {};
    check(!!f.name && !!f.section && !!f.purpose && !!f.keyQuestions && !!f.whenToUse,
      "each row carries the five that decide whether this is the right tool");
    check(f.facilitationTips === undefined,
      "and NOT the other four — the list is not the detail page (the whole library travels at once)");
    const secs = a.body.sections || [];
    check(secs.length === 8, "eight sections come with it", secs.length);
    check(secs.reduce((n, s) => n + s.n, 0) === 80, "their counts add up to eighty",
      secs.reduce((n, s) => n + s.n, 0));
    /* THE BOOK'S ORDER, asserted as AGREEMENT with the rows' own idx rather
       than against eight typed names (§94.8): rename a section tomorrow and
       this still holds. */
    const byFirstIdx = [...new Set(rows.map((r) => r.section))];
    check(JSON.stringify(secs.map((s) => s.section)) === JSON.stringify(byFirstIdx),
      "and they are in the book's order, not alphabetical",
      secs.map((s) => s.section).join(" · "));
  });

  await section("one framework", async () => {
    const list = await frameworksAction(c, CONSULTANT, { action: "list" });
    const first = (list.body.frameworks || [])[0];
    const a = await frameworksAction(c, CONSULTANT, { action: "one", id: first.id });
    check(a.code === 200 && a.body.ok, "it reads", a.code);
    const f = a.body.framework || {};
    const nine = ["purpose", "keyQuestions", "whenToUse", "whenNotToUse", "inputsRequired",
                  "outputs", "executiveExample", "consultantUseCase", "facilitationTips"];
    check(nine.every((k) => typeof f[k] === "string" && f[k].length > 0),
      "all nine content fields come back filled",
      nine.filter((k) => !f[k]).join(", ") || "none missing");
    check(f.addedBy === null,
      "its author is null rather than a name invented to fill the column (§35)", f.addedBy);
    const miss = await frameworksAction(c, CONSULTANT, { action: "one", id: "00000000-0000-0000-0000-0000000000ff" });
    check(miss.code === 404, "an id nobody has is a 404 and says so in words", miss.code);
    const bad = await frameworksAction(c, CONSULTANT, { action: "nonsense" });
    check(bad.code === 400, "an action it does not know is a 400", bad.code);
  });

  await section("the one gate, both ends", async () => {
    const cl = await frameworksAction(c, CLIENT, { action: "list" });
    check(cl.code === 403, "a client's own person is refused", cl.code);
    check(cl.body.error === "That is not something this account opens.",
      "in the same words the memory and the console refuse them — never a sentence of its own (§53.5)",
      cl.body.error);
    /* THE OPENNESS IS ASSERTED AS LOUDLY AS THE REFUSAL (§94.2, decision 1):
       a build that gated this to admins would be a library only admins could
       read, and every assertion above would still pass. */
    const con = await frameworksAction(c, CONSULTANT, { action: "list" });
    check(con.code === 200, "an ordinary consultant — no admin flag — reads the whole library", con.code);
    const adm = await frameworksAction(c, ADMIN, { action: "list" });
    check(adm.code === 200, "and so does an admin", adm.code);
  });
} finally {
  await c.query("ROLLBACK").catch(() => {});
  c.release();
  await pool.end();
}

console.log("\n" + oks + " passed, " + fails + " failed");
process.exit(fails ? 1 : 0);
