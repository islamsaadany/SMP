/* THE LIBRARY — Insights and Processes, one machine (spec 053).

   WHAT THIS FILE IS FOR. Forefront publishes a client's research and the
   client reads it (spec 046 decision #9, confirmed by Islam 2026-09-13), so
   the two claims worth proving are the two that would hurt: that one client
   cannot reach another's library, and that a report we have taken back cannot
   be reached by anybody in the client at all — by its list, by its id, or by
   its file.

   BOTH ENDS, EVERY TIME (§94.2). A query that returns nothing satisfies a
   working policy and a broken read equally well (§113.8), so every absence
   here is asserted beside a presence: the second client's row EXISTS and is
   invisible; the draft EXISTS and is invisible; the published one is visible
   in the same breath.

   WHAT IS DRIVEN AND WHAT IS READ, said out loud because it is the strength
   of the claim (§100.3):
     · §1–§2 RUN the pure rules with no database;
     · §3–§8 RUN every statement against a real Postgres, as `smp_app` with
       the tenant set — the role and the setting production uses, not the
       owner, because an owner who happens to bypass a policy proves nothing
       (FORCE is what stops that, and §8 asserts FORCE rather than assuming
       it);
     · §9 READS the catalogue to compare this table's policy with an existing
       tenant table's, which is the one thing schema-check.ts does not do
       (it checks a policy named tenant_rows EXISTS and covers ALL; it never
       reads the expression). Migration 008 writes that expression a second
       time by hand, because schema.sql's loop is not re-run on a database
       that is already up — so this is the assertion that catches the two
       spellings drifting.

     DATABASE_URL_UNPOOLED=postgres://owner@… node checks/insights.mjs
     SMP_BREAK=client-sees-drafts node checks/insights.mjs   # must go red
     SMP_BREAK=leak-file-path     node checks/insights.mjs   # must go red
     SMP_BREAK=version-always     node checks/insights.mjs   # must go red   */
import pg from "pg";
import { usePools, endPools } from "../lib/db.ts";
import { SCHEMA } from "../db/schema-name.mjs";
import { insightsDocument, readableDay } from "../modules/insights/page.ts";
import {
  CATEGORIES, KINDS, normalizeCategories, isCategory, isKind, safeFileName, looksLikePdf,
  filePath, sizeLabel, calendarDay, dayOut, oneLine, shape, shelfWhere,
  listItems, oneItem, draftOf, insertItem, updateItem, setFile, setState, deleteItem, countDownload,
  normalizeSeen, seenOf, seenLabel, setSeen, SEEN_KEY,
} from "../lib/library.ts";
import { placesFor, placeOf, placeLabel } from "../lib/place.ts";

/* Everyone, and nobody — the two ends of the new control, named once so the
   sections below read as the decision rather than as two object literals. */
const ALL = { place: null, seesAll: true };
const NOWHERE = { place: null, seesAll: false };
const at = (place) => ({ place, seesAll: false });

let ok = 0;
const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};
const section = (n) => console.log("\n" + n);
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/* ══ §1 · the vocabulary, and the file ═════════════════════════════════ */
section("§1 · the vocabulary, and what a file has to be");

check("the categories are the five we set, in order",
  CATEGORIES.join(",") === "Analysis,Macro,Market,Sector,Governance", CATEGORIES.join(","));
check("`Other` is not one of them",
  !CATEGORIES.includes("Other"));
check("both kinds are named — one machine, two names",
  KINDS.join(",") === "insights,processes", KINDS.join(","));
check("a picked set is re-sorted into the list's own order",
  normalizeCategories(["Sector", "Macro"]).join(",") === "Macro,Sector");
check("...and de-duplicated",
  normalizeCategories(["Macro", "Macro"]).join(",") === "Macro");
check("an unknown word is dropped, never kept and never thrown",
  normalizeCategories(["Macro", "Nonsense"]).join(",") === "Macro");
check("nothing picked is an empty set, not a default",
  normalizeCategories([]).length === 0 && normalizeCategories(null).length === 0);
check("isCategory and isKind refuse a near miss",
  !isCategory("macro") && !isKind("Insights"));

check("a PDF is recognised by its first bytes",
  looksLikePdf(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31])));
check("a JPEG renamed .pdf is refused",
  !looksLikePdf(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00])));
check("something too short to tell is refused, never assumed",
  !looksLikePdf(new Uint8Array([0x25, 0x50])) && !looksLikePdf(null));

const nasty = safeFileName('../../etc/x\r\nContent-Type: text/html";a.pdf');
check("a filename cannot carry a newline into a header",
  !/[\r\n]/.test(nasty), JSON.stringify(nasty));
check("...nor a slash, a quote or a climbing run",
  !/[\\/"']/.test(nasty) && !/\.\./.test(nasty), JSON.stringify(nasty));
check("an empty name still returns something openable",
  safeFileName("") === "report.pdf" && safeFileName(null) === "report.pdf");
check("a name with no extension gains .pdf",
  safeFileName("august macro") === "august macro.pdf");
check("an ordinary name survives intact",
  safeFileName("egypt-outlook-h2.pdf") === "egypt-outlook-h2.pdf");

check("the tenant is IN the file's path, so an address cannot cross clients",
  filePath("insights", "TEN-1", "ID-1", "x.pdf") === "insights/TEN-1/ID-1.pdf");
/* THE PROPERTY, NOT THE STRING (§94.8): what matters is that nothing typed
   can add a segment — a slash is the only thing that makes one, so a scrubbed
   value cannot climb however many dots it carries. Asserting the exact output
   would fail the day the safe alphabet changed for a reason nobody minded. */
const climbed = filePath("insights", "../../etc", "a/b", "x.pdf");
check("nothing typed can add a segment to the file's path",
  climbed.split("/").length === 3 && climbed.startsWith("insights/"), climbed);
check("the size is said once, in words",
  sizeLabel(2516582) === "2.4 MB" && sizeLabel(0) === "" && sizeLabel(900) === "900 B");

check("a date is a calendar day or nothing — never today",
  calendarDay("2026-08-01") === "2026-08-01" && calendarDay("01/08/2026") === null &&
  calendarDay("") === null && calendarDay(null) === null);
check("a day read back from a Date keeps its own date",
  dayOut(new Date(2026, 7, 1)) === "2026-08-01", dayOut(new Date(2026, 7, 1)));
check("a title pasted over three lines comes back as one",
  oneLine("Egypt\n  Consumer\nOutlook") === "Egypt Consumer Outlook");

/* ══ §2 · what a client receives, and what it does not ═════════════════ */
/* ══ §1b · who may see one report, as a rule ═══════════════════════════ */
section("§1b · who may see one report (spec 046 §4.10)");

const PLACES = ["mobile", "retail", "fn:finance", "fn:treasury"];

check("absent is EVERYONE, and that is the whole model — null out, never []",
  normalizeSeen(undefined, PLACES) === null && normalizeSeen(null, PLACES) === null &&
  normalizeSeen("fn:finance", PLACES) === null);
/* THE TWO ENDS OF THE CONTROL, and they must not collapse: All hands a report
   back to everyone INCLUDING a unit made next month, None gives it to nobody
   at all. A build that read [] as absent would make the two presses one. */
check("an empty list is NOBODY, which is a different thing from absent",
  Array.isArray(normalizeSeen([], PLACES)) && normalizeSeen([], PLACES).length === 0);
check("the stored list is the KNOWN list's own order, never the order somebody ticked",
  normalizeSeen(["fn:treasury", "mobile"], PLACES).join(",") === "mobile,fn:treasury",
  normalizeSeen(["fn:treasury", "mobile"], PLACES).join(","));
check("...so two reports narrowed to the same places are byte-identical",
  JSON.stringify(normalizeSeen(["fn:finance", "mobile"], PLACES)) ===
  JSON.stringify(normalizeSeen(["mobile", "fn:finance"], PLACES)));
check("a place this client does not have is DROPPED, never refused",
  normalizeSeen(["mobile", "fn:nowhere", "made-up"], PLACES).join(",") === "mobile");
check("a place ticked twice is one place",
  normalizeSeen(["mobile", "mobile"], PLACES).join(",") === "mobile");
check("a row hand-edited into a shape nothing writes reads as EVERYONE, not nobody",
  seenOf({ seen: "fn:finance" }) === null && seenOf({}) === null && seenOf(null) === null);
check("...and a real list reads back as itself",
  (seenOf({ seen: ["mobile"] }) || []).join(",") === "mobile");
check("the words: everyone says nothing at all, so the row wears no mark",
  seenLabel(null) === "", seenLabel(null));
check("...one place is singular, several are plural, and none is Nobody",
  seenLabel(["mobile"]) === "1 department" && seenLabel(["a", "b", "c"]) === "3 departments" &&
  seenLabel([]) === "Nobody",
  [seenLabel(["mobile"]), seenLabel(["a", "b", "c"]), seenLabel([])].join(" | "));
/* §65's suffix, load-bearing for exactly one row on Raya Trade — a unit called
   Care and a function called Care — and drawn on every function rather than on
   the pair, or it reads as a note about two rows instead of a rule. */
check("a function says it is one, and a unit does not",
  placeLabel("Care", "fn") === "Care (function)" && placeLabel("Care", "unit") === "Care",
  placeLabel("Care", "fn"));

section("§2 · what a client receives, and what the console receives");

const row = {
  id: "i1", kind: "insights", title: "T", summary: "S", categories: ["Macro"],
  report_date: new Date(2026, 7, 1), state: "published", version: 2,
  file_path: "insights/t/i1.pdf", file_name: "x.pdf", file_size: 2516582,
  downloads: 31, published_at: new Date(), published_by: "islam@forefront.consulting",
};
const mine = shape(row, true);
const ours = shape(row, false);

for (const k of ["filePath", "downloads", "publishedBy", "state"]) {
  check("a client is not told `" + k + "` — the key is ABSENT, not null",
    !has(mine, k), JSON.stringify(mine[k]));
}
check("...and the console IS told all four, or the absence above proves nothing",
  has(ours, "filePath") && has(ours, "downloads") && has(ours, "publishedBy") && has(ours, "state"));
check("a client is told what the report is",
  mine.title === "T" && mine.categories.join(",") === "Macro" && mine.reportDate === "2026-08-01" &&
  mine.version === 2 && mine.sizeLabel === "2.4 MB");
check("hasFile says there is something to open without saying where it is",
  mine.hasFile === true && !has(mine, "filePath"));
check("the client's read carries `published` in the WHERE",
  /state = 'published'/.test(shelfWhere(true)) && shelfWhere(false) === "",
  JSON.stringify(shelfWhere(true)));

/* ══ the database ═════════════════════════════════════════════════════ */
const URL_ = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
if (!URL_) {
  console.log("\nNo DATABASE_URL — §3–§9 need one. A check that cannot run is not a check that passed (§54.5).");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: URL_, max: 4, options: "-c search_path=" + SCHEMA });

/* §11 RENDERS THE REAL PAGE, and that page reads its rows through withTenant
   on the APP pool (lib/tenant.ts) — so both pools are pointed at this
   throwaway database, the way the spike harness does it. Without this the
   document falls to its own "could not be read" state and §11 would be
   measuring the degrade path while claiming to measure the screen (§93: an
   error counted as absence). The app pool connects as `smp_app`, which is
   also what makes §11's boundary assertion worth anything. */
const appUrl = new URL(URL_);
appUrl.username = "smp_app";
appUrl.password = process.env.SMP_APP_PASSWORD || "smp_app";
const appPool = new pg.Pool({ connectionString: appUrl.toString(), max: 4, options: "-c search_path=" + SCHEMA });
usePools(pool, appPool);
const owner = async (sql, args) => (await pool.query(sql, args)).rows;

/* Every tenant statement runs as the app role with the tenant set, which is
   what withTenant does in the product (lib/tenant.ts). Never as the owner:
   the point of §3 is the policy, and a role that could bypass it would prove
   the opposite of what is claimed.

   AND IT IS withTenant's OWN SHAPE — BEGIN, a TRANSACTION-LOCAL setting,
   COMMIT — rather than a session-level one, because the first draft of this
   file used `set_config(…, false)` and §3's last assertion went red: the
   setting outlived the checkout and came back on a pooled connection that had
   asked for no tenant at all. §289, in a check, against the check's own
   fixture — and a harness that leaks state proves a different product from
   the one that ships. */
async function asTenant(tenantId, fn) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query("SET LOCAL search_path TO " + SCHEMA);
    await c.query("SET LOCAL ROLE smp_app");
    await c.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

let failed = false;
try {
  await owner("SET search_path TO " + SCHEMA);
  const stamp = "chk" + Date.now().toString(36);
  const [a] = await owner(
    "INSERT INTO " + SCHEMA + ".tenants (key, name) VALUES ($1, $2) RETURNING id", [stamp + "-a", "Client A"]);
  const [b] = await owner(
    "INSERT INTO " + SCHEMA + ".tenants (key, name) VALUES ($1, $2) RETURNING id", [stamp + "-b", "Client B"]);

  /* ══ §3 · one client's library is not another's ═════════════════════ */
  section("§3 · one client's library is not another's");

  const aPub = await asTenant(a.id, (c) => insertItem(c, "insights",
    draftOf({ title: "Egypt Consumer Spending Outlook", summary: "Basket size and inflation.", categories: ["Macro"], reportDate: "2026-08-01" })));
  await asTenant(a.id, (c) => setState(c, aPub.id, "published", "islam@forefront.consulting"));
  const bPub = await asTenant(b.id, (c) => insertItem(c, "insights",
    draftOf({ title: "RHI Cement Demand Note", summary: "Demand by governorate.", categories: ["Sector"], reportDate: "2026-07-01" })));
  await asTenant(b.id, (c) => setState(c, bPub.id, "published", "islam@forefront.consulting"));

  const aList = await asTenant(a.id, (c) => listItems(c, { kind: "insights", forClient: true }));
  const bList = await asTenant(b.id, (c) => listItems(c, { kind: "insights", forClient: true }));
  check("A sees A's report", aList.length === 1 && aList[0].title === "Egypt Consumer Spending Outlook",
    aList.map((r) => r.title).join("|"));
  check("B sees B's — so 'A sees one row' is not passing because there is only one",
    bList.length === 1 && bList[0].title === "RHI Cement Demand Note", bList.map((r) => r.title).join("|"));
  check("A cannot reach B's report BY ITS ID, which is the address somebody would have",
    (await asTenant(a.id, (c) => oneItem(c, "insights", bPub.id, true))) === null);
  check("...and A can reach its own by id, or the refusal above is not about the client",
    (await asTenant(a.id, (c) => oneItem(c, "insights", aPub.id, true))) !== null);
  check("A cannot WRITE over B's report either",
    (await asTenant(a.id, (c) => updateItem(c, bPub.id, draftOf({ title: "taken over" })))) === null);
  check("...and B's title is untouched",
    (await asTenant(b.id, (c) => oneItem(c, "insights", bPub.id, false))).title === "RHI Cement Demand Note");
  const noTenant = await (async () => {
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      await c.query("SET LOCAL search_path TO " + SCHEMA);
      await c.query("SET LOCAL ROLE smp_app");
      const n = (await c.query("SELECT count(*)::int AS n FROM library_items")).rows[0].n;
      await c.query("COMMIT");
      return n;
    } finally { c.release(); }
  })();
  check("with no tenant set at all, the table is empty rather than open", noTenant === 0, String(noTenant));

  /* ══ §4 · a report we have taken back ═══════════════════════════════ */
  section("§4 · a draft, and a report taken back");

  const draft = await asTenant(a.id, (c) => insertItem(c, "insights",
    draftOf({ title: "Governance Review", summary: "Board pack practice.", categories: ["Governance"], reportDate: "2026-09-04" })));
  check("an item is born a draft, so nothing reaches a client by being saved", draft.state === "draft");
  const seen = await asTenant(a.id, (c) => listItems(c, { kind: "insights", forClient: true }));
  check("the client's list does not carry it", !seen.some((r) => r.id === draft.id) && seen.length === 1,
    seen.map((r) => r.title).join("|"));
  check("the client cannot reach it by its id — the same answer as a report that never existed",
    (await asTenant(a.id, (c) => oneItem(c, "insights", draft.id, true))) === null);
  check("the console CAN see it, or the two absences above prove only that it is gone",
    (await asTenant(a.id, (c) => oneItem(c, "insights", draft.id, false))) !== null);
  const officeList = await asTenant(a.id, (c) => listItems(c, { kind: "insights", forClient: false }));
  check("the console's list holds both the published and the draft", officeList.length === 2);
  check("a client asking for drafts by name is IGNORED, never obeyed",
    (await asTenant(a.id, (c) => listItems(c, { kind: "insights", forClient: true, state: "draft" }))).length === 1);

  /* withdraw the published one */
  await asTenant(a.id, (c) => setState(c, aPub.id, "draft", "islam@forefront.consulting"));
  check("a withdrawn report leaves the client's library at once",
    (await asTenant(a.id, (c) => listItems(c, { kind: "insights", forClient: true }))).length === 0);
  check("...and its id answers nothing, rather than refusing",
    (await asTenant(a.id, (c) => oneItem(c, "insights", aPub.id, true))) === null);

  /* ══ §5 · the stamp ════════════════════════════════════════════════ */
  section("§5 · published once, and the stamp that does not move");

  const first = await asTenant(a.id, (c) => oneItem(c, "insights", aPub.id, false));
  check("withdrawing keeps the day it first went out", !!first.published_at);
  const stampWas = new Date(first.published_at).getTime();
  await new Promise((r) => setTimeout(r, 25));
  const again = await asTenant(a.id, (c) => setState(c, aPub.id, "published", "someone.else@forefront.consulting"));
  check("republishing does not move a report's place in history",
    new Date(again.published_at).getTime() === stampWas);
  check("...nor rewrite who first published it",
    again.published_by === "islam@forefront.consulting", again.published_by);
  check("and it is back in the client's library",
    (await asTenant(a.id, (c) => listItems(c, { kind: "insights", forClient: true }))).length === 1);

  /* ══ §6 · a new edition of the same report ═════════════════════════ */
  section("§6 · replacing the file");

  const v1 = await asTenant(a.id, (c) => setFile(c, aPub.id, filePath("insights", a.id, aPub.id, "a.pdf"), "a.pdf", 1200));
  check("the FIRST file is not a new edition — it is v1", v1.version === 1, String(v1.version));
  await asTenant(a.id, (c) => countDownload(c, aPub.id));
  await asTenant(a.id, (c) => countDownload(c, aPub.id));
  const v2 = await asTenant(a.id, (c) => setFile(c, aPub.id, filePath("insights", a.id, aPub.id, "b.pdf"), "b.pdf", 9900));
  check("replacing it moves the edition by one", v2.version === 2, String(v2.version));
  check("...and keeps the same id, so the link a client holds still works", v2.id === aPub.id);
  check("...and keeps the download count", Number(v2.downloads) === 2, String(v2.downloads));
  check("...and keeps the categories", normalizeCategories(v2.categories).join(",") === "Macro");
  check("the new file's name and size are what was stored",
    v2.file_name === "b.pdf" && Number(v2.file_size) === 9900);
  const edited = await asTenant(a.id, (c) => updateItem(c, aPub.id, draftOf({ title: "Egypt Consumer Spending Outlook — H2", summary: "Revised.", categories: ["Macro", "Market"], reportDate: "2026-08-01" })));
  check("editing the words does not move the edition", edited.version === 2, String(edited.version));
  check("...and does not touch the file", edited.file_name === "b.pdf");

  /* ══ §7 · the count ════════════════════════════════════════════════ */
  section("§7 · the count, which is a count and never a log");

  const before = Number((await asTenant(a.id, (c) => oneItem(c, "insights", aPub.id, false))).downloads);
  await asTenant(a.id, (c) => countDownload(c, aPub.id));
  const after = Number((await asTenant(a.id, (c) => oneItem(c, "insights", aPub.id, false))).downloads);
  check("a download counts once", after === before + 1, before + " → " + after);
  const dBefore = Number((await asTenant(a.id, (c) => oneItem(c, "insights", draft.id, false))).downloads);
  await asTenant(a.id, (c) => countDownload(c, draft.id));
  const dAfter = Number((await asTenant(a.id, (c) => oneItem(c, "insights", draft.id, false))).downloads);
  check("a report nobody may open cannot be counted", dAfter === dBefore, dBefore + " → " + dAfter);
  check("no table records WHO downloaded — the count is the whole of it",
    (await owner("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema = $1 " +
      "AND table_name = 'library_items' AND column_name IN ('downloaded_by','last_download_by')",
      [SCHEMA]))[0].n === 0);

  /* ══ §8 · searching, and the categories ════════════════════════════ */
  section("§8 · the search, and the categories as navigation");

  await asTenant(a.id, (c) => setState(c, draft.id, "published", "islam@forefront.consulting"));
  const byCat = await asTenant(a.id, (c) => listItems(c, { kind: "insights", forClient: true, category: "Governance" }));
  check("a category narrows to the reports carrying it", byCat.length === 1 && byCat[0].id === draft.id);
  check("an item carrying two categories is found under either",
    (await asTenant(a.id, (c) => listItems(c, { kind: "insights", forClient: true, category: "Market" }))).length === 1 &&
    (await asTenant(a.id, (c) => listItems(c, { kind: "insights", forClient: true, category: "Macro" }))).length === 1);
  check("a category nobody set returns nothing rather than everything",
    (await asTenant(a.id, (c) => listItems(c, { kind: "insights", forClient: true, category: "Analysis" }))).length === 0);
  check("an invented category is ignored, and the shelf is not narrowed by it",
    (await asTenant(a.id, (c) => listItems(c, { kind: "insights", forClient: true, category: "Nonsense" }))).length === 2);
  check("the search reads the title, whatever the case",
    (await asTenant(a.id, (c) => listItems(c, { kind: "insights", forClient: true, q: "governance" }))).length === 1);
  check("...and the summary",
    (await asTenant(a.id, (c) => listItems(c, { kind: "insights", forClient: true, q: "board pack" }))).length === 1);
  check("a % typed into the search is a per-cent sign and not a wildcard",
    (await asTenant(a.id, (c) => listItems(c, { kind: "insights", forClient: true, q: "%" }))).length === 0);
  const ordered = await asTenant(a.id, (c) => listItems(c, { kind: "insights", forClient: true }));
  check("newest report first, by the report's own date",
    ordered.map((r) => dayOut(r.report_date)).join(",") === "2026-09-04,2026-08-01",
    ordered.map((r) => dayOut(r.report_date)).join(","));
  const undated = await asTenant(a.id, (c) => insertItem(c, "insights", draftOf({ title: "Undated" })));
  await asTenant(a.id, (c) => setState(c, undated.id, "published", "x@forefront.consulting"));
  check("a report with no date sorts LAST rather than leading the shelf",
    (await asTenant(a.id, (c) => listItems(c, { kind: "insights", forClient: true }))).slice(-1)[0].id === undated.id);
  check("the other library is a different shelf, not a filter on this one",
    (await asTenant(a.id, (c) => listItems(c, { kind: "processes", forClient: true }))).length === 0);

  /* ══ §9 · the fence itself ═════════════════════════════════════════ */
  section("§9 · the fence, and the two spellings of it");

  const [fence] = await owner(
    "SELECT c.relrowsecurity AS rls, c.relforcerowsecurity AS force, " +
    "(SELECT count(*)::int FROM pg_policy p WHERE p.polrelid = c.oid) AS policies " +
    "FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace " +
    "WHERE n.nspname = $1 AND c.relname = 'library_items'", [SCHEMA]);
  check("row-level security is enabled", fence && fence.rls === true);
  check("...and FORCED, or the owner walks past it", fence && fence.force === true);
  check("exactly one policy", fence && fence.policies === 1, fence && String(fence.policies));
  const [same] = await owner(
    "SELECT pg_get_expr(p.polqual, p.polrelid) = pg_get_expr(o.polqual, o.polrelid) AS using_same, " +
    "       pg_get_expr(p.polwithcheck, p.polrelid) = pg_get_expr(o.polwithcheck, o.polrelid) AS check_same " +
    "FROM pg_policy p, pg_policy o " +
    "WHERE p.polrelid = ($1 || '.library_items')::regclass AND o.polrelid = ($1 || '.org')::regclass", [SCHEMA]);
  check("its policy is WORD FOR WORD an existing tenant table's — migration 008 " +
        "writes this a second time by hand and nothing else compares them",
    same && same.using_same === true && same.check_same === true, JSON.stringify(same));

  /* ══ §10 · deleting ════════════════════════════════════════════════ */
  section("§10 · deleting one");

  const path = await asTenant(a.id, (c) => deleteItem(c, aPub.id));
  check("deleting hands back the file's path, so the store can be told",
    path === filePath("insights", a.id, aPub.id, "b.pdf"), path);
  check("...and the row is gone for the console as well as the client",
    (await asTenant(a.id, (c) => oneItem(c, "insights", aPub.id, false))) === null);
  check("A cannot delete B's report",
    (await asTenant(a.id, (c) => deleteItem(c, bPub.id))) === "" &&
    (await asTenant(b.id, (c) => oneItem(c, "insights", bPub.id, false))) !== null);

  /* ══ §11 · the client's screen ═════════════════════════════════════
     RENDERED, not read: whether a control is drawn is not a question the
     source can answer (§96 — a page that renders nothing and one that renders
     everything read identically in the code). */
  section("§11 · the screen a client opens");

  const have = ["strategy", "insights"];
  /* ONE WITH A FILE AND ONE WITHOUT, made on purpose: the first draft of this
     section asserted a Download on every row and went red on a correct page,
     because §6 had deleted the only report that had one. A report with nothing
     attached is a real state — a process has no file at all — so both are
     asserted rather than the fixture being bent to the happier one (§94.2). */
  await asTenant(a.id, (c) => setFile(c, draft.id, filePath("insights", a.id, draft.id, "gov.pdf"), "gov.pdf", 921600));
  const page = await insightsDocument("client-a", a.id, "Client A", have, {}, ALL);
  check("the reports are on it",
    page.includes("Governance Review") && page.includes("Undated"), String(page.length));
  check("a report with a file has a way to open it",
    (page.match(/class="dl"/g) || []).length === 1, String((page.match(/class="dl"/g) || []).length));
  check("...and one with nothing attached SAYS so rather than offering a button that 404s (§61)",
    page.includes("No file yet"));
  check("the download address is this client's, this report's, and ours — never the store's",
    page.includes('href="/client-a/insights/' + draft.id + '/file"'), "the file link is wrong");
  check("the count says what is there",
    page.includes("2 reports"));
  check("the categories are the navigation row",
    CATEGORIES.every((c) => page.includes(">" + c + "</a>")));
  check("NOTHING ON IT CAN WRITE — no upload, no publish, no delete, no form but the search",
    !/type="file"/.test(page) && !/Publish|Withdraw|Delete|Upload/i.test(page) &&
    (page.match(/<form/g) || []).length === 1);
  check("the file's path is nowhere in the document, which is §2's absence end to end",
    !page.includes("insights/" + a.id), "the blob path reached the page");
  check("no script at all, so the shell's script-src has nothing to admit",
    !/<script/i.test(page));
  check("the module switcher is its way back out",
    page.includes('href="/client-a/strategy"'), "no way back to Strategy");
  check("a date is written the way the rest of the product writes one",
    page.includes(readableDay("2026-09-04")) && readableDay("2026-09-04") === "4 Sep 2026",
    readableDay("2026-09-04"));

  const filtered = await insightsDocument("client-a", a.id, "Client A", have, { q: "nothing like this" }, ALL);
  check("a search that matches nothing says so",
    filtered.includes("No reports match"));
  check("...and KEEPS the categories, or there is no way back to the reports (§61)",
    filtered.includes(">Macro</a>"));

  const emptyPage = await insightsDocument("client-b2", b.id, "Client B", have, {}, ALL);
  /* B's own report is still published, so the empty state is made rather than
     waited for — a library emptied by the check is not the library a new
     client opens. */
  await asTenant(b.id, (c) => setState(c, bPub.id, "draft", "x@forefront.consulting"));
  const virgin = await insightsDocument("client-b2", b.id, "Client B", have, {}, ALL);
  check("B's page is B's, not A's — the boundary holds through the screen too",
    emptyPage.includes("RHI Cement Demand Note") && !emptyPage.includes("Governance Review"));
  check("a client with nothing published is told so, and told who publishes",
    virgin.includes("Nothing has been published here yet") && virgin.includes("Forefront publishes them"));
  check("...and is not shown a row of categories that could only return nothing",
    !virgin.includes(">Macro</a>"));

  /* ══ §12 · a report narrowed to one function ════════════════════════ */
  section("§12 · a report narrowed to one function, and one to nobody");

  /* THE STATE IS MADE, because nothing in the fixture above carries it and
     every assertion here would pass on a build that lost the feature
     (§255, §94.5). Client A gets an org: two units, two functions — and the
     `(function)` suffix has a job, because one of each is called Care. */
  await owner("SET search_path TO " + SCHEMA);
  for (const [k, n, i] of [["mobile", "Mobile", 0], ["care", "Care", 1]])
    await owner("INSERT INTO " + SCHEMA + ".units (tenant_id, key, idx, name) VALUES ($1,$2,$3,$4)", [a.id, k, i, n]);
  for (const [k, n, i] of [["finance", "Finance", 0], ["care", "Care", 1]])
    await owner("INSERT INTO " + SCHEMA + ".functions (tenant_id, key, idx, name) VALUES ($1,$2,$3,$4)", [a.id, k, i, n]);
  for (const [k, n, u, f] of [["hoda", "Hoda", null, "finance"], ["karim", "Karim", "mobile", null],
                              ["nour", "Nour", null, null]])
    await owner("INSERT INTO " + SCHEMA + ".people (tenant_id, key, idx, name, unit_key, fn_key) VALUES ($1,$2,0,$3,$4,$5)",
      [a.id, k, n, u, f]);

  const places = await asTenant(a.id, (c) => placesFor(c));
  check("the tick list is this client's units and then its functions, in the navigation's order",
    places.map((p) => p.at).join(",") === "mobile,care,fn:finance,fn:care",
    places.map((p) => p.at).join(","));
  check("...and a unit called Care and a function called Care are told apart",
    places.filter((p) => p.label.startsWith("Care")).map((p) => p.label).join(" | ") === "Care | Care (function)",
    places.filter((p) => p.label.startsWith("Care")).map((p) => p.label).join(" | "));
  check("where somebody sits is read off the register, unit and function alike",
    (await asTenant(a.id, (c) => placeOf(c, "karim"))) === "mobile" &&
    (await asTenant(a.id, (c) => placeOf(c, "hoda"))) === "fn:finance");
  check("...and somebody the register has not placed is NULL, never a guess (§35)",
    (await asTenant(a.id, (c) => placeOf(c, "nour"))) === null &&
    (await asTenant(a.id, (c) => placeOf(c, "nobody-at-all"))) === null);

  /* Two published reports: one everybody can see, one narrowed to Finance and
     Treasury — which on this client is Finance alone, because there is no
     Treasury, and a place the client does not have is dropped. */
  const openOne = await asTenant(a.id, (c) => insertItem(c, "insights",
    draftOf({ title: "Everyone Outlook", categories: ["Macro"], reportDate: "2026-08-01" })));
  await asTenant(a.id, (c) => setState(c, openOne.id, "published", "islam@forefront.consulting"));
  const narrow = await asTenant(a.id, (c) => insertItem(c, "insights",
    draftOf({ title: "FX Cost Exposure", categories: ["Macro"], reportDate: "2026-08-12" })));
  await asTenant(a.id, (c) => setState(c, narrow.id, "published", "islam@forefront.consulting"));
  const known = places.map((p) => p.at);
  const wrote = await asTenant(a.id, (c) => setSeen(c, narrow.id, normalizeSeen(["fn:finance", "fn:treasury"], known)));
  check("a place the client does not have is dropped on the way in, and the rest is stored",
    JSON.stringify(seenOf(wrote.extra)) === '["fn:finance"]', JSON.stringify(seenOf(wrote.extra)));

  const titles = (rows) => rows.map((r) => r.title).sort().join("|");
  const listFor = (v) => asTenant(a.id, (c) => listItems(c, { kind: "insights", forClient: true, viewer: v }));

  /* BOTH ENDS, EVERY TIME (§94.2): the narrowed report is invisible to Karim
     AND visible to Hoda in the same run, and the open one is visible to both —
     or "Karim sees one report" is equally true of a build that lost the
     library altogether (§113.8). */
  const hoda = await listFor(at("fn:finance"));
  const karim = await listFor(at("mobile"));
  const nour = await listFor(NOWHERE);
  const office = await listFor(ALL);
  check("somebody in Finance sees the narrowed report",
    titles(hoda).includes("FX Cost Exposure"), titles(hoda));
  check("somebody in Mobile does not",
    !titles(karim).includes("FX Cost Exposure"), titles(karim));
  check("...and both of them see the one nobody narrowed, or the rule is hiding everything",
    titles(hoda).includes("Everyone Outlook") && titles(karim).includes("Everyone Outlook"));
  /* ASSERTED ABOUT THE NARROWED REPORT AND NOT AS A WHOLE LIST: §11 leaves
     two more published reports in this library, so the first draft of this
     compared against "Everyone Outlook" alone and reported a correct build
     broken (§100.3 — a probe that assumes a state the fixture does not have).
     The everyone report is asserted beside it as the control, or "they cannot
     see the narrowed one" is equally true of an empty library (§113.8). */
  check("somebody the register has not placed sees the everyone reports and no narrowed one",
    !titles(nour).includes("FX Cost Exposure") && titles(nour).includes("Everyone Outlook"), titles(nour));
  check("the office reads everything, whatever a list says (the seat, never who employs them)",
    titles(office).includes("FX Cost Exposure") && titles(office).includes("Everyone Outlook"), titles(office));

  /* THE ID IS THE ADDRESS SOMEBODY WOULD BE SENT, which is the whole reason
     the rule is in the WHERE: a narrowed report missing from a list and
     reachable by its own link would be no rule at all (spec 046 §4.10). */
  check("a narrowed report cannot be reached BY ITS ID by somebody it is not for",
    (await asTenant(a.id, (c) => oneItem(c, "insights", narrow.id, true, at("mobile")))) === null);
  check("...and CAN be by somebody it is for, or the refusal above is not about the narrowing",
    (await asTenant(a.id, (c) => oneItem(c, "insights", narrow.id, true, at("fn:finance")))) !== null);
  check("...and by the office",
    (await asTenant(a.id, (c) => oneItem(c, "insights", narrow.id, true, ALL))) !== null);

  /* NOBODY IS A REAL STATE and is not the same row as everyone. */
  await asTenant(a.id, (c) => setSeen(c, narrow.id, []));
  const shutHoda = await listFor(at("fn:finance")), shutKarim = await listFor(at("mobile"));
  check("None takes it from the person it was just narrowed TO, which is the whole of it",
    !titles(shutHoda).includes("FX Cost Exposure") && !titles(shutKarim).includes("FX Cost Exposure"),
    titles(shutHoda));
  check("...and leaves every other report exactly where it was, so None is not a delete",
    titles(shutHoda).includes("Everyone Outlook") &&
    titles(await listFor(ALL)).includes("FX Cost Exposure"), titles(await listFor(ALL)));
  const shut = await asTenant(a.id, (c) => oneItem(c, "insights", narrow.id, false));
  check("...and it is MARKED rather than looking like any other report",
    shape(shut, false).seenLabel === "Nobody", shape(shut, false).seenLabel);

  /* ALL DELETES THE KEY. This is the one that would have bitten in six months:
     a list of today's four places would EXCLUDE a unit made next month, and
     nobody would ever connect the two. */
  const back = await asTenant(a.id, (c) => setSeen(c, narrow.id, null));
  check("All hands it back to everyone by REMOVING the key, never by ticking today's places",
    !has(back.extra, SEEN_KEY) && seenOf(back.extra) === null, JSON.stringify(back.extra));
  check("...so a unit created afterwards can read it, which ticking them all would not give",
    titles(await listFor(at("made-up-later"))).includes("FX Cost Exposure"));

  /* NO MIGRATION, PROVED RATHER THAN CLAIMED (§172: four layers once agreed
     about a value the database had never been offered). */
  const cols = await owner(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'library_items'",
    [SCHEMA]);
  check("it rides `extra`, so the table gained no column",
    !cols.some((r) => /seen|visib/i.test(r.column_name)) && cols.some((r) => r.column_name === "extra"),
    cols.map((r) => r.column_name).join(","));

  /* ══ §13 · two people, two libraries ════════════════════════════════ */
  section("§13 · what two people see");

  await asTenant(a.id, (c) => setSeen(c, narrow.id, ["fn:finance"]));
  const pgHoda = await insightsDocument("client-a", a.id, "Client A", have, {}, at("fn:finance"));
  const pgKarim = await insightsDocument("client-a", a.id, "Client A", have, {}, at("mobile"));
  check("the narrowed report is simply not in the other list — not greyed, not named",
    pgHoda.includes("FX Cost Exposure") && !pgKarim.includes("FX Cost Exposure"));
  /* A COUNT THAT DISAGREES WITH ITS OWN LIST IS A BUG REPORT WAITING TO
     HAPPEN (§108.1's shape), so it is asserted rather than assumed. */
  const countOn = (p) => (p.match(/>(\d+) reports?</) || [])[1];
  const rowsOn = (p) => (p.match(/class="item"/g) || []).length;
  check("the count follows what that person can see, on both pages",
    Number(countOn(pgHoda)) === rowsOn(pgHoda) && Number(countOn(pgKarim)) === rowsOn(pgKarim) &&
    Number(countOn(pgHoda)) === Number(countOn(pgKarim)) + 1,
    countOn(pgHoda) + "/" + rowsOn(pgHoda) + " vs " + countOn(pgKarim) + "/" + rowsOn(pgKarim));
  check("...and the file's address is not on the page it is not for either",
    !pgKarim.includes(narrow.id), "the narrowed report's id reached the wrong page");
  const pgOffice = await insightsDocument("client-a", a.id, "Client A", have, {}, ALL);
  check("the office's page carries both",
    pgOffice.includes("FX Cost Exposure") && pgOffice.includes("Everyone Outlook"));

  /* the fixture goes, whatever happened above (§94.2) */
  await owner("DELETE FROM " + SCHEMA + ".tenants WHERE key LIKE $1", [stamp + "%"]);
} catch (e) {
  /* A RUN THAT DIED SAID "0 failed" (§298.3, §215). The summary counts `bad`
     and this branch only set a flag, so a falsification that CRASHED the run
     printed `109 passed, 0 failed` and read, in a batch, exactly like a guard
     that works (§54.5) — which is how the `everyone-sees-everything` break
     came back green while proving nothing. The death is a failure now, and it
     is in the list the tail prints. */
  failed = true;
  bad.push("the run itself — " + (e && e.message));
  console.log("\n  FAIL the run itself — " + (e && e.message));
} finally {
  await pool.end();
  await endPools().catch(() => {});
}

console.log("\n" + ok + " passed, " + bad.length + " failed");
if (bad.length) console.log(bad.map((b) => "  · " + b).join("\n"));
process.exit(bad.length || failed ? 1 : 0);
