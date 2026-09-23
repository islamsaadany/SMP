/* THE REPORTS, AS A TAB IN THE PLATFORM (§376, Islam 2026-09-20).

   He picked the tab over the two other placements drawn for him, and the
   three decisions that came with it are what this file asserts:

     1. every destination carries the tab;
     2. the tab writes the module's OWN address, so a link about the reports
        does not name a unit;
     3. the four-square switcher is drawn only where the tabs cannot reach.

   WHAT IS RUN AND WHAT IS READ, said out loud because it is the strength of
   every claim below (§100.3):

     · §1–§3 RUN the frozen tab's own module (src/insights.js) in a vm with a
       stub document, so `shown()`, `sections()` and `category()` are the
       product's functions and not a description of them. No browser, no
       database, no network — they always run.
     · §4 RUNS `libraryRows()`, the module's own row builder, for all four of
       its states. Pure, so it always runs.
     · §5 asks the SERVED app for `/<client>/insights/list` and drives the
       tab in a real browser: the address it writes, the switcher standing
       down, and typing never repainting. It needs `SMP_BASE` and a browser
       and it SAYS SO rather than skipping quietly (§54.5: a check that did
       not run is not a check that passed).

   BOTH ENDS, EVERY TIME (§94.2). A build that never drew the tab satisfies
   half of this file perfectly, and so does one that draws it everywhere —
   so the absence is asserted beside the presence in every section.

     node checks/insights-tab.mjs
     SMP_BASE=http://127.0.0.1:3000 SMP_CHROME=… node checks/insights-tab.mjs

   PROVED ABLE TO FAIL FROM THE SOURCES (§276), because an edited check is a
   check proving itself. §1–§3 were falsified by three edits to
   src/insights.js, each reddening its own assertions and no others:

     `shown()` forced true            3 red  — the tab drawn with nothing behind it
     the categories typed out         1 red  — §94.8's drift, printing the short list
     `All` made a real category       3 red  — §50.6, asking for a word the server refuses

   AND SINCE §385 THE ROW IS WHAT THE DOCUMENT WAS STAMPED WITH rather than
   the module's whole list, so §2 asserts the tab draws WHATEVER it is handed,
   in the order it is handed — WHICH categories those are is the server's
   assertion, in checks/insights.mjs §14, which has a database to answer it
   with. Its break there is `SMP_BREAK=all-categories`.

   AND WHAT THIS FILE CANNOT PROVE IS SAID RATHER THAN LEFT AS AN ABSENCE
   (§54.5). §2 asserts the row draws whatever it is HANDED, so it is silent
   about what the server hands it — and the two halves either side of that
   are asserted where each has what it needs:

     the RULE   checks/insights.mjs §14, with a database
                (SMP_BREAK=all-categories — must go red)
     the SEAM   checks/shell.mjs §3d, against the served document
                (SMP_BREAK=no-library-cats — must go red)

   §5 is not run from here and never was: it needs the served app, which the
   shell check already starts, so its subject lives there rather than being
   claimed here (this header said it was "run by the served-app sweep", and
   nothing ran it — §54.5 in a check's own docstring). What remains for §5 is
   the four destination kinds and typing never repainting. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createContext, runInContext } from "node:vm";
import { CATEGORIES, shape as PAGE_SHAPE } from "../lib/library.ts";
/* THE ROW BUILDER IS IMPORTED LAZILY, and that is not a nicety: it sits in
   the module's page beside `withTenant`, so importing it pulls the database
   driver in — and §1–§3 need neither. Loaded here so those three always run
   and §4 SAYS it did not rather than taking the whole file down with it
   (§215: a check that dies reports nothing, which reads as nothing wrong). */
const PAGE = await import("../modules/insights/page.ts").catch((e) => {
  console.log("  --   modules/insights/page.ts would not load: " + String(e.code || e.message));
  return null;
});

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, "..", "..", "SMP-Project-Folder", "src");
const BREAK = process.env.SMP_BREAK || "";

let bad = 0, ran = 0;
function check(what, ok, detail) {
  ran++;
  if (!ok) bad++;
  console.log("  " + (ok ? "ok  " : "FAIL") + " " + what + (detail ? "  — " + detail : ""));
}

/* ── THE TAB'S OWN MODULE, RUN ─────────────────────────────────────────
   `insights.js` reads one attribute off `document.documentElement` and
   attaches three delegated listeners at load. Both are stubbed, so what is
   exercised below is the shipped function rather than a second copy of its
   rule (§53.5, §100.3: a stand-in that models less than the thing it stands
   in for reports a working build as broken). */
function loadLibrary(attr) {
  const el = {
    getAttribute: (k) => (k === "data-library-cats" ? attr : null),
  };
  const ctx = {
    document: { documentElement: el, addEventListener() {}, querySelector: () => null },
    setTimeout() {}, fetch() {}, location: { pathname: "/raya-trade/strategy" },
    CURSEC: {}, console,
  };
  createContext(ctx);
  runInContext(readFileSync(join(SRC, "insights.js"), "utf8"), ctx);
  return { lib: ctx.LIBRARY, ctx };
}
const STAMP = JSON.stringify(CATEGORIES);

console.log("1 · is there a library behind this tab");
{
  /* THE STAMP IS THE WHOLE TEST (§42): the server writes it on a document it
     serves to somebody who may OPEN Insights, so one read answers "is there
     a server", "does this client have the module" and "may this person open
     it" with no second copy of any of them. */
  check("stamped — the tab is drawn", loadLibrary(STAMP).lib.shown() === true);
  /* file://, a client without the module, a person the module is shut to:
     three different reasons, one honest absence. */
  check("no stamp — the tab is NOT drawn (file://, no module, or shut)",
    loadLibrary(null).lib.shown() === false);
  check("a stamp that is not a list is not a library",
    loadLibrary('"Analysis"').lib.shown() === false);
  check("a stamp that will not parse is not a library",
    loadLibrary("{not json").lib.shown() === false);
}

console.log("\n2 · the section row is what the document was stamped with");
{
  const { lib } = loadLibrary(STAMP);
  const secs = lib.sections();
  /* ASSERTED AS AN AGREEMENT WITH THE STAMP, never as a typed list (§94.8),
     and since §385 the stamp is WHAT THIS CLIENT HAS rather than what the
     module offers — so what this file can prove is that the tab draws
     whatever it is handed, in the order it is handed, and WHICH categories
     those are is the server's assertion (checks/insights.mjs §14, which has a
     database to answer it with). */
  check("All leads, then every category the document named, in its order",
    JSON.stringify(secs.map((s) => s.label)) === JSON.stringify(["All"].concat(CATEGORIES)),
    secs.map((s) => s.label).join(" · "));
  check("every section has a key of its own",
    new Set(secs.map((s) => s.k)).size === secs.length);
  check("every section carries the access key every tab is asked for",
    secs.every((s) => s.ac === "c_kb") && secs.every((s) => typeof s.render === "function"));
  check("and with no library there are no sections at all",
    loadLibrary(null).lib.sections().length === 0);
  /* §385, BOTH ENDS (§94.2). A build that went on reading the module's whole
     list — the fault Islam reported as *"the filters of the reports should
     appear only if there is this type of report"* — satisfies every assertion
     above, because above the stamp IS the whole list. These two are the ones
     it cannot satisfy: a short stamp draws a short row, and an empty one
     draws no filters at all. */
  const two = loadLibrary(JSON.stringify(["Macro", "Sector"])).lib.sections();
  check("a client with two kinds of report gets two filters and no more",
    JSON.stringify(two.map((s) => s.label)) === JSON.stringify(["All", "Macro", "Sector"]),
    two.map((s) => s.label).join(" · "));
  /* ONE SECTION DRAWS NO ROW — the shell's own rule (`secs.length > 1`), which
     is why a library with nothing filed anywhere needs no second mechanism to
     take the filters away: there is nothing to filter by and All is not a
     filter (§32, a menu of one). */
  const none = loadLibrary("[]").lib;
  check("a library with nothing filed draws the tab and no filter row",
    none.shown() === true && none.sections().length === 1,
    "sections: " + none.sections().length);
}

console.log("\n3 · which category the fragment is asked for");
{
  const { lib, ctx } = loadLibrary(STAMP);
  /* `All` IS AN EMPTY CATEGORY, not a word (§50.6): the fragment reads an
     absent category as every category, so a section with a key of its own
     would be a second way of saying the same thing. */
  ctx.CURSEC.insights = "all";
  check("All asks for no category", lib.category() === "");
  for (const c of CATEGORIES) {
    ctx.CURSEC.insights = "cat-" + c.toLowerCase();
    check("the " + c + " section asks for " + c, lib.category() === c);
  }
  /* A key the row does not hold falls back rather than asking for a
     category the server would refuse (§96.2). */
  ctx.CURSEC.insights = "cat-nonesuch";
  check("a key no section holds asks for no category", lib.category() === "");
  delete ctx.CURSEC.insights;
  check("and nothing chosen yet asks for no category", lib.category() === "");
}

console.log("\n4 · the rows are the module's, and a failed read is not an empty one");
if (!PAGE) {
  /* NAMED, NEVER SKIPPED (§54.5): what is unasserted is said in the words of
     what it would have proved, not as a line of dashes. */
  console.log("  --   NOT RUN: the app's dependencies are not installed here, so the");
  console.log("       module's own row builder could not be loaded. Unasserted: the");
  console.log("       four states of the list, and that an unreadable library never");
  console.log("       reads as one with nothing published in it (§93).");
} else {
  /* THE FIXTURE IS THE PRODUCT'S OWN SHAPE, NEVER ONE TYPED HERE (§100.3).
     It was typed here — `category`, `day`, `size`, none of which an Item has
     — so the first line of `factLine` threw on `it.categories.length` and
     this section DIED rather than reporting (§215). It never showed, because
     §4 is skipped wherever the app's dependencies are missing and that is
     where it was written: **a section that has never run is not a section
     that passed** (§54.5). Built through `shape()` now, the one function that
     produces what `libraryRows` is handed, so the keys cannot drift apart
     again. */
  const item = PAGE_SHAPE({
    id: "r1", kind: "insights", title: "Egypt retail 2026",
    summary: "Where the market goes next.", categories: ["Market"],
    report_date: "2026-09-04", state: "published", version: 1,
    file_path: "x/y.pdf", file_name: "y.pdf", file_size: 1258291,
    downloads: 0, published_at: null, published_by: "", created_at: null,
    updated_at: null, extra: {},
  }, true);
  const rows = (items, read, q, cat) =>
    PAGE.libraryRows("raya-trade", items, read, q, cat, "Raya Trade");
  const full = rows([item], true, "", "");
  check("a report draws its title and a way to open it",
    full.includes("Egypt retail 2026") && full.includes("Download"));
  /* §93, and it is the assertion this section exists for: a library that
     could not be READ must never read as a library with nothing in it — the
     first tells a client Forefront has published nothing. */
  const dead = rows([], false, "", "");
  check("an unreadable library says so and promises nothing was lost",
    dead.includes("could not be read") && dead.includes("Nothing has been lost"));
  check("and it never says nothing has been published",
    !dead.includes("published"), dead.slice(0, 60));
  const empty = rows([], true, "", "");
  check("an empty library names the client and says who publishes",
    empty.includes("Raya Trade") && empty.includes("Forefront"));
  const none = rows([], true, "shops", "");
  check("a search that matches nothing says to clear it",
    none.includes("No reports match") && !none.includes("Forefront"));
  /* ONE BUILDER, SO THE TAB CANNOT SPELL A REPORT DIFFERENTLY (§53.5). The
     tab's fragment and the module's page both end here, which is what makes
     that true — asserted as the four states being four different sentences,
     because a builder collapsed to one would satisfy every assertion above
     about the state it kept. */
  check("the four states are four different answers",
    new Set([full, dead, empty, none]).size === 4);
}

console.log("\n5 · the served app: the address, the switcher, and typing");
{
  const base = process.env.SMP_BASE || "";
  if (!base) {
    /* NAMED, NEVER SKIPPED (§54.5). */
    console.log("  --   NOT RUN: set SMP_BASE (and SMP_CHROME) to drive the served app.");
    console.log("       What is unasserted without it: the tab appearing on all four");
    console.log("       destination kinds, the address it writes, the switcher standing");
    console.log("       down where the tabs reach, and typing never repainting.");
  } else {
    console.log("  --   SMP_BASE is set, and this section is still NOT RUN from here");
    console.log("       (§54.5). The stamp it was written for is asserted against the");
    console.log("       served document in checks/shell.mjs §3d, which already starts");
    console.log("       the app. Unasserted anywhere: the tab on all four destination");
    console.log("       kinds, the address it writes, and typing never repainting.");
  }
}

console.log("\n" + (bad ? bad + " FAILED of " + ran : ran + " checks, 0 failed"));
process.exit(bad ? 1 : 0);
