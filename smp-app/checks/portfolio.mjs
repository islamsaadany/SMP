/* PORTFOLIO — the rules, before any screen (spec 060).

   WHAT THIS FILE IS FOR. The claims that would hurt if they were false:
   that only a Lead signs an activity off and a reopen is gated the same way
   (§3 №1, §7.6 — theirs needs only the work-on gate, so a Contributor undoes
   a Lead's sign-off); that a Viewer cannot comment, because that is where
   everybody lands (§6.4, §7.4B); that a phase's figure is made of the rows
   under it and nothing stores it (§9.8); that a code is a position, so a
   delete cannot leave a gap (§7.6, §310); that what is owed is a count of
   ROWS and never of reasons (§279); and that one client's plan is not
   another's.

   BOTH ENDS, EVERY TIME (§94.2): every refusal is asserted beside the same
   act ALLOWED to somebody the rule admits, or a build that refused everybody
   passes half of it (§113.8). What is DRIVEN and what is READ (§100.3):
     · §1–§8 RUN the pure rules with no database and no browser, which is
       what §8 of the spec asks for in those words;
     · §9 RUNS every statement as `smp_app` with the tenant set, the way
       withTenant does it in the product, and asserts the constraints §7.6
       adds by ATTEMPTING the row rather than by reading the DDL (§96);
     · §10 READS the catalogue: all eight tables fenced and forced, their
       policy IDENTICAL to an existing tenant table's (§94.8), and none of
       them on the platform's own list (§331).

   NOTHING HERE OPENS A DOOR, and that is asserted too: `portfolio` is still
   `built: false`, so there is no page, no address and no switcher entry to
   test — three of its screens are drawn and not yet signed off (§9.10,
   §9.12, §9.13), and building one before then would be rule 1c unpaid.

     DATABASE_URL_UNPOOLED=postgres://owner@… node checks/portfolio.mjs
     SMP_BREAK=any-build        node checks/portfolio.mjs   # must go red
     SMP_BREAK=team-deletes     node checks/portfolio.mjs   # must go red
     SMP_BREAK=viewer-comments  node checks/portfolio.mjs   # must go red
     SMP_BREAK=anyone-completes node checks/portfolio.mjs   # must go red
     SMP_BREAK=restamp-start    node checks/portfolio.mjs   # must go red
     SMP_BREAK=manual-wins      node checks/portfolio.mjs   # must go red
     SMP_BREAK=equal-only       node checks/portfolio.mjs   # must go red
     SMP_BREAK=no-collapse      node checks/portfolio.mjs   # must go red
     SMP_BREAK=no-cascade       node checks/portfolio.mjs   # must go red
     SMP_BREAK=owed-sums        node checks/portfolio.mjs   # must go red

   Run it from `smp-app/`. */
import pg from "pg";
import { SCHEMA } from "../db/schema-name.mjs";
import { PLATFORM_TABLES } from "../lib/schema-check.ts";
import { MODULE_DEF } from "../lib/modules.ts";
import {
  ROLES, ROLE_WORD, ROLE_DEFAULT, isRole, ACT_STATUSES, ACT_WORD, isActStatus,
  SUB_STATUSES, isSubStatus, CADENCES, isCadence, inOffice,
  maySee, mayReadPlan, mayBuildPlan, mayStartProject, mayDeleteProject, mayNameTeam,
  mayEditCharter, mayReport, mayComment, mayMarkDone, mayComplete, mayReopen, endDateRefused,
  stampDates, progressFromSubs, manualProgressRefused,
  kidsOf, weightsOf, meanPct, rollUp, overall, renumber,
  addDays, daysBetween, cascade,
  waitingSignOff, behind, overdue, nobodyOn, owed, nextCheckpoint,
} from "../lib/portfolio.ts";

let ok = 0;
const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};
const section = (n) => console.log("\n" + n);
/* EVERY PROBE DEGRADES (§215): a thrown probe is a failure carrying the
   throw's own words, never a run that stopped and printed fewer failures. */
const probe = async (what, fn) => { try { return await fn(); } catch (e) { check(what, false, "threw: " + String((e && e.message) || e)); return undefined; } };

/* ══ §1 · the words, and nothing opened ══════════════════════════════ */
section("§1 · the vocabulary, and the door still shut");
check("three roles on the project and nothing else (§6.2)", ROLES.join(",") === "lead,contributor,viewer");
check("...spelt as the product spells them", Object.values(ROLE_WORD).join("|") === "Lead|Contributor|Viewer");
check("...and everybody lands at Viewer (§6.4)", ROLE_DEFAULT === "viewer");
check("a near miss is not a role", isRole("lead") && !isRole("Lead") && !isRole("admin") && !isRole(""));
check("an activity has FOUR states and the fourth is the sign-off (§3 №1)", ACT_STATUSES.join(",") === "not_started,in_progress,done,completed");
check("...spelt as the product spells them", ACT_WORD.done === "Done" && ACT_WORD.completed === "Completed" && ACT_WORD.not_started === "Not started");
check("a sub-activity has THREE — it is never signed off", SUB_STATUSES.join(",") === "todo,in_progress,done" && !isSubStatus("completed") && isSubStatus("done"));
check("a near miss is not a status", isActStatus("completed") && !isActStatus("Completed") && !isActStatus("signed"));
check("the rhythm is weekly or monthly, and never the reporting cycle", CADENCES.join(",") === "weekly,monthly" && isCadence("weekly") && !isCadence("quarterly"));
check("the office is the two seats and nothing else", inOffice("super") && inOffice("smoteam") && !inOffice("none") && !inOffice(null) && !inOffice(""));
/* THE DOOR IS STILL SHUT, asserted rather than assumed: three screens are
   drawn and awaiting sign-off, so a module marked built with nothing behind
   it would be the door onto the wrong room the flag exists to stop (§61). */
check("portfolio is a reserved word and NOT built (§4, rule 1c unpaid on three screens)",
  MODULE_DEF.portfolio && MODULE_DEF.portfolio.built === false, JSON.stringify(MODULE_DEF.portfolio));
check("...while a module that IS built says so, or the assertion above means nothing (§113.8)",
  MODULE_DEF.tracker && MODULE_DEF.tracker.built === true);

/* ══ §2 · who gets in ════════════════════════════════════════════════ */
section("§2 · who gets in (§6), both ends of every rule");
const SUPER = { seat: "super", role: null };
const TEAM = { seat: "smoteam", role: null };
const LEAD = { seat: "none", role: "lead" };
const CONTRIB = { seat: "none", role: "contributor" };
const VIEWER = { seat: "none", role: "viewer" };
const NOBODY = { seat: "none", role: null };
check("a seat reaches every project without a row on it (§6.1)", maySee(SUPER) && maySee(TEAM));
check("...and so does anybody the project names", maySee(LEAD) && maySee(CONTRIB) && maySee(VIEWER));
check("...and nobody else — there is no Portfolio column to hold a third answer", !maySee(NOBODY));
check("a Contributor SEES the whole plan (§7.4A: see the plan, write your own rows)", mayReadPlan(CONTRIB) && mayReadPlan(VIEWER));
check("building it is a Lead's or a seat's", mayBuildPlan(SUPER) && mayBuildPlan(TEAM) && mayBuildPlan(LEAD));
check("...and not a Contributor's or a Viewer's — both ends", !mayBuildPlan(CONTRIB) && !mayBuildPlan(VIEWER) && !mayBuildPlan(NOBODY));
check("starting a project is by seat (§9.2)", mayStartProject(SUPER) && mayStartProject(TEAM) && !mayStartProject(LEAD) && !mayStartProject(CONTRIB));
/* §89's own three: destruction is the one of them that lands in Portfolio. */
check("deleting one is the Super user's alone (§6.1, §89)", mayDeleteProject(SUPER) && !mayDeleteProject(TEAM) && !mayDeleteProject(LEAD));
check("naming people onto it is the seat's (§6.4)", mayNameTeam(SUPER) && mayNameTeam(TEAM) && !mayNameTeam(LEAD) && !mayNameTeam(CONTRIB));
check("the charter's pen is the office's AND the Lead's (§5.1, Islam's widening)",
  mayEditCharter(SUPER) && mayEditCharter(TEAM) && mayEditCharter(LEAD) && !mayEditCharter(CONTRIB) && !mayEditCharter(VIEWER));

/* WHETHER A CONTRIBUTOR REPORTS OR ONLY COMMENTS IS READ OFF THE ACTIVITY
   (§6.2), so the same person is asked about two different rows. */
const MINE = { assignee: "hend", collaborators: [] };
const TAGGED = { assignee: "omar", collaborators: ["hend"] };
const NEITHER = { assignee: "omar", collaborators: [] };
check("a Contributor reports the activity assigned to them", mayReport(CONTRIB, "hend", MINE));
check("...and not one assigned to somebody else — both ends", !mayReport(CONTRIB, "hend", NEITHER));
check("...and not one that merely TAGS them: assigned is one thing, tagged is another", !mayReport(CONTRIB, "hend", TAGGED));
check("a Lead and a seat report anything on the project", mayReport(LEAD, "x", NEITHER) && mayReport(SUPER, null, NEITHER));
check("a Viewer reports nothing, even their own row", !mayReport(VIEWER, "hend", MINE));
check("a Contributor comments on what tags them", mayComment(CONTRIB, "hend", TAGGED));
check("...and on what is assigned to them", mayComment(CONTRIB, "hend", MINE));
check("...and on neither when it is neither — both ends", !mayComment(CONTRIB, "hend", NEITHER));
/* WHERE EVERYBODY LANDS IS WHAT THIS QUIETLY GRANTS (§7.4B), which is why
   it is the assertion worth having: read-only is the only default that
   fails closed, and their own code, matrix and docstring disagree. */
check("a VIEWER cannot comment (§7.4B, Islam: 'viewer no commenting just viewing')",
  !mayComment(VIEWER, "hend", TAGGED) && !mayComment(VIEWER, "hend", MINE));
check("...while a Lead and a seat can, or the line above proves nothing (§113.8)",
  mayComment(LEAD, "x", NEITHER) && mayComment(SUPER, null, NEITHER));

/* ══ §3 · two people finish an activity, not one ═════════════════════ */
section("§3 · the sign-off, and the reopen gated like it (§3 №1, §7.6)");
check("whoever is doing the work marks it Done", mayMarkDone(CONTRIB, "hend", MINE));
check("...and only a Lead or a seat COMPLETES it", mayComplete(LEAD) && mayComplete(SUPER) && mayComplete(TEAM));
check("...never the person who did the work — the governance rule, both ends", !mayComplete(CONTRIB) && !mayComplete(VIEWER));
check("AND THE REOPEN IS GATED LIKE THE COMPLETION (§7.6), or a Contributor undoes a Lead's sign-off",
  mayReopen(LEAD) && !mayReopen(CONTRIB) && !mayReopen(VIEWER));
/* A COMPLETION'S DATE IS CHECKED, not merely stored (§3 №1). */
const TODAY = "2026-09-20";
check("a completion with no end date is refused, and says so", !!endDateRefused(null, { today: TODAY }));
check("...an end date in the future is refused", !!endDateRefused("2026-10-01", { today: TODAY }));
check("...an end date before the work began is refused", !!endDateRefused("2026-01-01", { start: "2026-02-01", today: TODAY }));
check("...and a real one is accepted — both ends", endDateRefused("2026-09-18", { start: "2026-09-01", today: TODAY }) === null);
check("...today itself is accepted, because a range that excludes today excludes the normal case", endDateRefused(TODAY, { start: "2026-09-01", today: TODAY }) === null);

/* ══ §4 · real dates are worked out, never typed ═════════════════════ */
section("§4 · one chokepoint for the real dates (§3 №2)");
const before0 = { status: "not_started", progress: 0, actualStart: null, actualEnd: null };
check("nothing is stamped while nothing has happened", JSON.stringify(stampDates(before0, { status: "not_started", progress: 0 }, TODAY)) === JSON.stringify({ actualStart: null, actualEnd: null }));
const started = stampDates(before0, { status: "in_progress", progress: 10 }, TODAY);
check("the real start is stamped the first time progress leaves nought", started.actualStart === TODAY && started.actualEnd === null);
/* AND IT IS NEVER RE-STAMPED: reopening does not move the day work began. */
const later = stampDates({ status: "in_progress", progress: 10, actualStart: "2026-09-01", actualEnd: null }, { status: "in_progress", progress: 40 }, TODAY);
check("...and never re-stamped — reopening does not move the day the work began", later.actualStart === "2026-09-01", JSON.stringify(later));
const done = stampDates({ status: "in_progress", progress: 100, actualStart: "2026-09-01", actualEnd: null }, { status: "completed", progress: 100 }, TODAY);
check("the real end is stamped on Completed", done.actualEnd === TODAY && done.actualStart === "2026-09-01");
const reopened = stampDates({ status: "completed", progress: 100, actualStart: "2026-09-01", actualEnd: "2026-09-10" }, { status: "in_progress", progress: 80 }, TODAY);
check("...and CLEARED on a reopen, which is what keeps the on-time reading honest (§7.6, §9.11)",
  reopened.actualEnd === null && reopened.actualStart === "2026-09-01", JSON.stringify(reopened));
check("a row at Done and waiting for a Lead has no real end yet — that is what the queue IS",
  stampDates({ status: "in_progress", progress: 100, actualStart: "2026-09-01", actualEnd: null }, { status: "done", progress: 100 }, TODAY).actualEnd === null);

/* ══ §5 · progress is computed, and typing over it is refused ════════ */
section("§5 · the breakdown drives the figure (§3 №3)");
const sub = (status, weight) => ({ status, weight });
check("no breakdown reads nought", progressFromSubs([]) === 0);
check("all to do reads nought", progressFromSubs([sub("todo"), sub("todo")]) === 0);
/* THE FLOOR IS THEIRS AND IS PORTED ON PURPOSE (§3 №3): it is how the real
   start date comes to be stamped at all — *which is what trips rule 2*. */
check("one started with none finished reads 10%, which is what trips rule 2", progressFromSubs([sub("in_progress"), sub("todo")]) === 10);
check("by COUNT where the weights do not sum to 100 — two of four is 50", progressFromSubs([sub("done"), sub("done"), sub("todo"), sub("todo")]) === 50);
check("...and a set summing to 90 falls to the count rather than lying (§7)",
  progressFromSubs([sub("done", 45), sub("todo", 45)]) === 50, String(progressFromSubs([sub("done", 45), sub("todo", 45)])));
check("BY WEIGHT where the set sums to 100 — 40 done of 40/40/20 is 40%",
  progressFromSubs([sub("done", 40), sub("todo", 40), sub("todo", 20)]) === 40);
check("...and the same three all done is 100", progressFromSubs([sub("done", 40), sub("done", 40), sub("done", 20)]) === 100);
check("a typed figure is REFUSED where a breakdown exists, and says why (§123)",
  /breakdown/i.test(String(manualProgressRefused([sub("todo")]))));
check("...and accepted where there is none — both ends", manualProgressRefused([]) === null);

/* ══ §6 · the roll-up ════════════════════════════════════════════════ */
section("§6 · a phase is made of the rows under it (§9.8)");
/* §243'S BLANK RULE, ASSERTED AS THE RULE AND NEVER AS A NUMBER (§94.8) —
   it is a second copy of koWeights on purpose (Portfolio may not reach into
   Strategy's vocabulary), so what must not drift is the answer. */
check("nothing weighted at all is equal weighting", weightsOf([{ id: "a", lvl: 2 }, { id: "b", lvl: 2 }]) === null);
const mixed = weightsOf([{ id: "a", lvl: 2, weight: 60 }, { id: "b", lvl: 2 }, { id: "c", lvl: 2, weight: 20 }]);
check("a BLANK counts as the average of the weights that were set (§243)", JSON.stringify(mixed) === JSON.stringify([60, 40, 20]), JSON.stringify(mixed));
check("every set weight being nought falls back to equal rather than to a dash (§243)",
  meanPct([{ id: "a", lvl: 2, weight: 0, pct: 100 }, { id: "b", lvl: 2, weight: 0, pct: 0 }]) === 50);
check("an empty level has NO figure — absent is not nought (§35, §93)", meanPct([]) === null);
check("equal weights average plainly", meanPct([{ id: "a", lvl: 2, pct: 100 }, { id: "b", lvl: 2, pct: 0 }]) === 50);
check("...and a weight moves it, or nothing here reads one", meanPct([{ id: "a", lvl: 2, pct: 100, weight: 90 }, { id: "b", lvl: 2, pct: 0, weight: 10 }]) === 90);

/* A PLAN WITH ALL THREE LEVELS, and one phase holding activities straight.
   The figures are DERIVED by the same walk the drawings read (§5.2). */
const plan = () => ([
  { id: "p1", lvl: 0, name: "Discovery" },
  { id: "a1", lvl: 2, name: "Kick-off", pct: 100, status: "completed", assignee: "hend", end: "2026-09-01", start: "2026-08-01" },
  { id: "a2", lvl: 2, name: "Interviews", pct: 100, status: "completed", assignee: "hend", end: "2026-09-10", start: "2026-09-02" },
  { id: "p2", lvl: 0, name: "Design" },
  { id: "w1", lvl: 1, name: "Operating model" },
  { id: "a3", lvl: 2, name: "Draft", pct: 100, status: "done", assignee: "omar", end: "2026-09-15", start: "2026-09-11" },
  { id: "a4", lvl: 2, name: "Review", pct: 0, status: "not_started", assignee: null, end: "2026-09-18", start: "2026-09-16" },
  { id: "p3", lvl: 0, name: "Rollout" },
  { id: "a5", lvl: 2, name: "Train", pct: 0, status: "not_started", assignee: "hend", end: "2026-12-01", start: "2026-11-01" },
]);
const rolled = rollUp(plan());
const by = Object.fromEntries(rolled.map((r) => [r.id, r]));
check("a phase with activities hung straight off it still rolls up (no work package)", by.p1.pct === 100, String(by.p1.pct));
check("...and takes the widest span of them", by.p1.start === "2026-08-01" && by.p1.end === "2026-09-10", by.p1.start + " – " + by.p1.end);
check("a work package rolls its activities", by.w1.pct === 50, String(by.w1.pct));
check("...and its phase rolls the work package, one level at a time", by.p2.pct === 50, String(by.p2.pct));
/* THE TALLY AND THE PERCENTAGE ARE TAKEN FROM ONE SET (§264): a card and
   the table under it that disagree is the fault that whole section is. */
check("the tally counts the ACTIVITIES beneath, however deep", by.p2.total === 2 && by.p2.done === 1, by.p2.done + " of " + by.p2.total);
check("...and a phase's own tally agrees with its figure", by.p1.total === 2 && by.p1.done === 2);
/* AN ACTIVITY AT DONE COUNTS AS 100% (§9.8): progress is how much work is
   done; the sign-off is whether a Lead accepts it. */
check("an activity waiting for a sign-off counts as 100%, not 99 (§9.8)", by.a3.pct === 100 && by.w1.pct === 50);
check("the project's own figure is its phases by the same rule one level up", overall(rolled) === 50, String(overall(rolled)));
/* AND THE WEIGHT IS READ AT EVERY LEVEL, not only the bottom one (§9.8): a
   phase holding a kick-off and a company-wide rollout reads 55% equally
   weighted, which is the shape that section calls wrong in its own words.
   Weighted, the same three phases read differently — asserted as the
   DIFFERENCE, because equal weighting is what a build that ignored the
   column would produce and it would pass every line above. */
const weighted = rollUp(plan().map((r) => (r.lvl === 0 ? { ...r, weight: r.id === "p3" ? 80 : 10 } : r)));
check("a phase's weight moves the project's figure", overall(weighted) === 15 && overall(rolled) === 50,
  "weighted " + overall(weighted) + " against " + overall(rolled) + " equally");
check("...and a weight one level down moves its phase's", (() => {
  const rows = rollUp(plan().map((r) => (r.id === "a1" ? { ...r, weight: 90 } : r.id === "a2" ? { ...r, weight: 10 } : r)));
  const p1 = rows.find((r) => r.id === "p1");
  const two = rollUp(plan().map((r) => (r.id === "a1" ? { ...r, pct: 0, weight: 90 } : r.id === "a2" ? { ...r, weight: 10 } : r)));
  return p1.pct === 100 && two.find((r) => r.id === "p1").pct === 10;
})(), "a weighted phase should read 10 when its heavy activity is at nought");
check("...and a project with NO plan has no figure — 'No plan yet', never 0% (§9.13)", overall([]) === null);
check("kidsOf takes the level below, or everything beneath where that level is empty",
  kidsOf(rolled, 0).length === 2 && kidsOf(rolled, 3).length === 1);

/* ══ §7 · the numbers renumber themselves ════════════════════════════ */
section("§7 · a code is a position, so a gap cannot happen (§3 №5, §310)");
const codes = renumber(plan());
check("phases, packages and activities are numbered from where they sit",
  codes.join(" ") === "1 1.1 1.2 2 2.1 2.1.1 2.1.2 3 3.1", codes.join(" "));
check("...and an activity straight under a phase collapses 1.2.3 to 1.2 (§3 №5)", codes[1] === "1.1" && codes[2] === "1.2");
check("...while one under a work package keeps its three parts — both ends", codes[5] === "2.1.1");
/* DELETING THE MIDDLE PHASE: theirs never renumbers, so its plans carry
   gaps and stale codes (§7.6). Here the code is derived, so it cannot. */
const short = plan().filter((r) => !["p2", "w1", "a3", "a4"].includes(r.id));
check("removing a phase leaves NO gap — the codes are 1 and 2, never 1 and 3",
  renumber(short).join(" ") === "1 1.1 1.2 2 2.1", renumber(short).join(" "));

/* ══ §8 · the cascade, and what is owed ══════════════════════════════ */
section("§8 · moving a date shows you first (§3 №4), and what is owed (§279)");
check("a day is added as a day", addDays("2026-09-20", 5) === "2026-09-25" && addDays("2026-09-30", 1) === "2026-10-01");
check("...and the distance between two is counted in days", daysBetween("2026-09-20", "2026-09-25") === 5);
const chain = [
  { id: "a", start: "2026-09-01", end: "2026-09-10" },
  { id: "b", dependsOn: "a", start: "2026-09-11", end: "2026-09-20" },
  { id: "c", dependsOn: "b", start: "2026-09-21", end: "2026-09-30" },
  { id: "d", start: "2026-10-01", end: "2026-10-05" },
];
const shifts = cascade(chain, "a", "2026-09-13");
check("moving an end moves everything that depends on it, down the chain", shifts.map((s) => s.id).join(",") === "b,c", JSON.stringify(shifts));
check("...by the same number of days it moved", shifts[0] && shifts[0].to === "2026-09-14" && shifts[1] && shifts[1].to === "2026-09-24", JSON.stringify(shifts));
check("...and nothing that does not depend on it — both ends", !shifts.some((s) => s.id === "d"));
check("a move of nought shifts nothing", cascade(chain, "a", "2026-09-10").length === 0);
/* A PREVIEW, NEVER A COMMIT: the rows it was handed come back untouched. */
check("it is a PREVIEW — the rows themselves are not moved", chain[1].start === "2026-09-11" && chain[1].end === "2026-09-20");
/* A CYCLE IS REFUSED RATHER THAN WALKED FOR EVER: theirs has no referential
   integrity to inherit, so a chain that loops back is assumed (§7.6). */
const loop = [
  { id: "a", dependsOn: "c", start: "2026-09-01", end: "2026-09-10" },
  { id: "b", dependsOn: "a", start: "2026-09-11", end: "2026-09-20" },
  { id: "c", dependsOn: "b", start: "2026-09-21", end: "2026-09-30" },
];
check("a chain that loops back stops rather than hanging the request", cascade(loop, "a", "2026-09-13").map((s) => s.id).join(",") === "b,c");

/* WHAT IS WAITING IS A COUNT OF ROWS, NEVER OF REASONS (§279, §108.1). The
   fixture DEMONSTRATES it rather than claiming it (§255): a4 is past its
   date AND has nobody on it, so three reasons name two rows. */
const owedRows = owed(rolled, TODAY);
check("three predicates name their own rows", waitingSignOff(rolled).map((r) => r.id).join(",") === "a3"
  && overdue(rolled, TODAY).map((r) => r.id).join(",") === "a4"
  && nobodyOn(rolled).map((r) => r.id).join(",") === "a4",
  JSON.stringify([waitingSignOff(rolled).length, overdue(rolled, TODAY).length, nobodyOn(rolled).length]));
check("...and a row owed for TWO reasons is owed ONCE — 3 reasons, 2 rows (§279)",
  owedRows.length === 2 && owedRows.map((r) => r.id).join(",") === "a3,a4", JSON.stringify(owedRows.map((r) => r.id)));
/* LATE IS A FACT ABOUT A DATE AND NEVER ABOUT A PERCENTAGE (§344). */
check("late is a date, so a row at 100% is never late whatever its end", !behind(by.a2, TODAY) && behind(by.a4, TODAY));
check("...and a row with no end date is never late (§35)", !behind({ id: "x", lvl: 2, pct: 0, end: null }, TODAY));
/* A PROJECT CAN BE HALF DONE AND BEHIND, which is why the two are drawn
   apart on the landing (§9.13). */
check("a project can be 50% AND behind — two readings, never one", overall(rolled) === 50 && owedRows.length > 0);

/* ══ §8b · the checkpoint ════════════════════════════════════════════ */
section("§8b · a checkpoint is a date and nothing else (§9.10)");
check("nothing set means no next one — never a guess (§35)", nextCheckpoint(null, null, TODAY) === null && nextCheckpoint("weekly", null, TODAY) === null);
/* 2026-09-20 is a Sunday. */
check("weekly gives the next one of that weekday, never today", nextCheckpoint("weekly", 0, TODAY) === "2026-09-27", String(nextCheckpoint("weekly", 0, TODAY)));
check("...and a day later this week is this week's", nextCheckpoint("weekly", 3, TODAY) === "2026-09-23", String(nextCheckpoint("weekly", 3, TODAY)));
check("monthly gives this month's day where it is still ahead", nextCheckpoint("monthly", 28, TODAY) === "2026-09-28", String(nextCheckpoint("monthly", 28, TODAY)));
check("...and next month's where it has passed", nextCheckpoint("monthly", 5, TODAY) === "2026-10-05", String(nextCheckpoint("monthly", 5, TODAY)));
check("a day nobody could have chosen is refused rather than guessed at", nextCheckpoint("monthly", 30, TODAY) === null && nextCheckpoint("weekly", 9, TODAY) === null);

/* ══ the database ════════════════════════════════════════════════════ */
const URL_ = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
if (!URL_) {
  console.log("\nNo DATABASE_URL — §9–§10 need one. A check that cannot run is not a check that passed (§54.5).");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: URL_, max: 4, options: "-c search_path=" + SCHEMA });
const appUrl = new URL(URL_);
appUrl.username = "smp_app";
appUrl.password = process.env.SMP_APP_PASSWORD || "smp_app";
const appPool = new pg.Pool({ connectionString: appUrl.toString(), max: 4, options: "-c search_path=" + SCHEMA });
const owner = async (sql, args) => (await pool.query(sql, args)).rows;
/* THE WAY withTenant DOES IT IN THE PRODUCT (§314): the tenant is set per
   request inside a transaction, on the app's non-owner role. */
async function asTenant(tenantId, fn) {
  const c = await appPool.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } catch (e) { await c.query("ROLLBACK").catch(() => {}); throw e; } finally { c.release(); }
}
/* A ROW THE DATABASE MUST REFUSE. Its own transaction, because a violation
   aborts the one it is in — and the CONSTRAINT's name is asserted, or a row
   refused for some other reason reads as the rule working (§113.8). */
async function refused(what, name, sql, args) {
  try {
    await asTenant(args.tenant, (c) => c.query(sql, args.values));
    check(what, false, "accepted — the constraint did not bite");
  } catch (e) {
    const msg = String((e && e.message) || e);
    check(what, msg.includes(name), "refused by something else: " + msg.slice(0, 90));
  }
}

const TABLES = ["portfolio_projects", "portfolio_members", "portfolio_phases", "portfolio_work_packages",
  "portfolio_activities", "portfolio_sub_activities", "portfolio_collaborators", "portfolio_terminology"];

let failed = false;
try {
  await owner("SET search_path TO " + SCHEMA);
  const stamp = "pf" + Date.now().toString(36);
  const [{ id: A }] = await owner("INSERT INTO tenants (key, name) VALUES ($1,$2) RETURNING id", [stamp + "-a", "Raya Trade"]);
  const [{ id: B }] = await owner("INSERT INTO tenants (key, name) VALUES ($1,$2) RETURNING id", [stamp + "-b", "RHI"]);
  const person = async (t, key, name, idx) => owner("INSERT INTO people (tenant_id, key, idx, name) VALUES ($1,$2,$3,$4)", [t, key, idx, name]);
  await person(A, "hend", "Hend Adel", 0);
  await person(A, "omar", "Omar Khalil", 1);
  await person(B, "rhi_one", "Somebody Else", 0);

  /* ══ §9 · the rows, and the constraints §7.6 adds ═════════════════ */
  section("§9 · the tables, run as smp_app with the tenant set");
  const projA = await probe("a project is written under the tenant being looked at", () =>
    asTenant(A, async (c) => (await c.query("INSERT INTO portfolio_projects (name, brief) VALUES ($1,$2) RETURNING id", ["Culture Transformation", "Why it exists"])).rows[0].id));
  check("...and it landed", !!projA, String(projA));
  const phaseA = await probe("a phase is written under it", () =>
    asTenant(A, async (c) => (await c.query("INSERT INTO portfolio_phases (project_id, name) VALUES ($1,$2) RETURNING id", [projA, "Discovery"])).rows[0].id));
  const wpA = await probe("a work package is written under the phase", () =>
    asTenant(A, async (c) => (await c.query("INSERT INTO portfolio_work_packages (phase_id, name) VALUES ($1,$2) RETURNING id", [phaseA, "Operating model"])).rows[0].id));
  await probe("an activity with EXACTLY ONE parent is accepted", () =>
    asTenant(A, (c) => c.query("INSERT INTO portfolio_activities (phase_id, name) VALUES ($1,$2)", [phaseA, "Kick-off"])));
  check("...and so is one under a work package", !!(await probe("under a work package", () =>
    asTenant(A, (c) => c.query("INSERT INTO portfolio_activities (work_package_id, name) VALUES ($1,$2)", [wpA, "Draft"])))));
  /* §7.6'S FIRST ROW: *an activity has two nullable parents and nothing says
     exactly one is set.* Asserted by ATTEMPTING the row, never by reading
     the DDL (§96). */
  await refused("an activity with NO parent is refused", "portfolio_activity_parent",
    "INSERT INTO portfolio_activities (name) VALUES ($1)", { tenant: A, values: ["Orphan"] });
  await refused("...and one with BOTH is refused", "portfolio_activity_parent",
    "INSERT INTO portfolio_activities (phase_id, work_package_id, name) VALUES ($1,$2,$3)", { tenant: A, values: [phaseA, wpA, "Two parents"] });
  await refused("a real end with no real start is refused", "portfolio_activity_actual",
    "INSERT INTO portfolio_activities (phase_id, name, status, actual_end) VALUES ($1,$2,'completed','2026-01-01')", { tenant: A, values: [phaseA, "Ended but never began"] });
  await refused("a sign-off on a row that is not completed is refused", "portfolio_activity_signed",
    "INSERT INTO portfolio_activities (phase_id, name, status, signed_off_at) VALUES ($1,$2,'in_progress', now())", { tenant: A, values: [phaseA, "Signed but open"] });
  await refused("a blank name is refused", "portfolio_activity_name",
    "INSERT INTO portfolio_activities (phase_id, name) VALUES ($1,$2)", { tenant: A, values: [phaseA, "   "] });
  await refused("an activity depending on itself is refused", "portfolio_activity_self_dep",
    "INSERT INTO portfolio_activities (tenant_id, id, phase_id, name, depends_on) VALUES ($1, '11111111-1111-1111-1111-111111111111', $2, $3, '11111111-1111-1111-1111-111111111111')",
    { tenant: A, values: [A, phaseA, "Itself"] });
  await refused("a monthly checkpoint on the 30th is refused, so February cannot be skipped", "portfolio_checkpoint_day",
    "INSERT INTO portfolio_projects (name, checkpoint_cadence, checkpoint_day) VALUES ($1,'monthly',30)", { tenant: A, values: ["Bad cadence"] });
  check("...while a weekly one on a real weekday is accepted — both ends", !!(await probe("a weekly cadence", () =>
    asTenant(A, (c) => c.query("INSERT INTO portfolio_projects (name, checkpoint_cadence, checkpoint_day) VALUES ($1,'weekly',3)", ["Good cadence"])))));
  await refused("an agreed window that ends before it starts is refused", "portfolio_agreed_window",
    "INSERT INTO portfolio_projects (name, agreed_start, agreed_end) VALUES ($1,'2026-06-01','2026-01-01')", { tenant: A, values: ["Backwards"] });
  await refused("a member at a role that is not one of the three is refused", "portfolio_member_role",
    "INSERT INTO portfolio_members (project_id, person_key, role) VALUES ($1,$2,'admin')", { tenant: A, values: [projA, "hend"] });
  const landed = await probe("a member with no role named lands at Viewer (§6.4)", () =>
    asTenant(A, async (c) => (await c.query("INSERT INTO portfolio_members (project_id, person_key) VALUES ($1,$2) RETURNING role", [projA, "hend"])).rows[0].role));
  check("...and it IS Viewer, which is what the default quietly grants", landed === "viewer", String(landed));
  /* NAMING SOMEBODY ON THE CHARTER GRANTS NOTHING (§5.1a): the reach is
     portfolio_members and nothing else, which is §56's own rule. */
  await probe("a charter names people and the team list is untouched by it", () =>
    asTenant(A, (c) => c.query("UPDATE portfolio_projects SET sponsors = $2 WHERE id = $1", [projA, JSON.stringify([{ key: "omar" }, { name: "HR Director/Head" }])])));
  const members = await asTenant(A, async (c) => (await c.query("SELECT person_key FROM portfolio_members WHERE project_id = $1 ORDER BY 1", [projA])).rows.map((r) => r.person_key));
  check("...so a sponsor is NOT on the team (§5.1a, Islam: 'not related to the roles of accessability')",
    members.join(",") === "hend", JSON.stringify(members));

  /* ONE CLIENT'S PLAN IS NOT ANOTHER'S, read back through withTenant. */
  const seenByB = await asTenant(B, async (c) => (await c.query("SELECT count(*)::int n FROM portfolio_projects")).rows[0].n);
  const seenByA = await asTenant(A, async (c) => (await c.query("SELECT count(*)::int n FROM portfolio_projects")).rows[0].n);
  check("B sees none of A's projects", seenByB === 0, String(seenByB));
  check("...while A sees its own — both ends (§113.8)", seenByA >= 2, String(seenByA));
  const crossed = await probe("a phase cannot be hung on another client's project", async () => {
    try { await asTenant(B, (c) => c.query("INSERT INTO portfolio_phases (project_id, name) VALUES ($1,$2)", [projA, "Stolen"])); return false; }
    catch { return true; }
  });
  check("...and it is refused", crossed === true);

  /* ══ §10 · the catalogue ══════════════════════════════════════════ */
  section("§10 · every table fenced, and none of them the platform's");
  const cat = await owner(
    "SELECT c.relname t, c.relrowsecurity rls, c.relforcerowsecurity force, " +
    "(SELECT count(*)::int FROM pg_policy p WHERE p.polrelid = c.oid AND p.polname = 'tenant_rows') pol " +
    "FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace " +
    "WHERE n.nspname = $1 AND c.relkind = 'r' AND c.relname LIKE 'portfolio%' ORDER BY 1", [SCHEMA]);
  check("all eight tables exist", cat.length === 8, cat.map((r) => r.t).join(","));
  check("...every one with row-level security ENABLED and FORCED (§331's loop)", cat.every((r) => r.rls && r.force),
    JSON.stringify(cat.filter((r) => !(r.rls && r.force)).map((r) => r.t)));
  check("...and every one carrying the tenant_rows policy", cat.every((r) => r.pol === 1));
  /* THE POLICY TEXT IS THE LOOP'S OWN, and migration 015 copies it — so the
     two spellings are asserted IDENTICAL by reading them back (§94.8). */
  const same = await owner(
    "SELECT c.relname t, pg_get_expr(p.polqual, p.polrelid) q, pg_get_expr(p.polwithcheck, p.polrelid) w " +
    "FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid JOIN pg_namespace n ON n.oid = c.relnamespace " +
    "WHERE n.nspname = $1 AND p.polname = 'tenant_rows' AND (c.relname LIKE 'portfolio%' OR c.relname = 'tracker_actions')", [SCHEMA]);
  const ref = same.find((r) => r.t === "tracker_actions");
  check("an existing tenant table is there to compare against", !!ref);
  check("...and every portfolio policy is IDENTICAL to it, both halves (§94.8)",
    !!ref && same.filter((r) => r.t !== "tracker_actions").every((r) => r.q === ref.q && r.w === ref.w));
  check("none of them is on the platform's own list (§331)", !TABLES.some((t) => PLATFORM_TABLES.includes(t)));
  /* A TABLE HERE MUST CASCADE WITH ITS CLIENT, or deleteTenant refuses the
     whole delete — it counts every tenant-owned table back to zero. */
  const fk = await owner(
    "SELECT c.relname t FROM pg_constraint k JOIN pg_class c ON c.oid = k.conrelid " +
    "JOIN pg_class f ON f.oid = k.confrelid JOIN pg_namespace n ON n.oid = c.relnamespace " +
    "WHERE n.nspname = $1 AND k.contype = 'f' AND f.relname = 'tenants' AND k.confdeltype = 'c' AND c.relname LIKE 'portfolio%'", [SCHEMA]);
  check("every one cascades from its client, or deleting one would refuse (lib/tenant-delete.ts)",
    TABLES.every((t) => fk.some((r) => r.t === t)), JSON.stringify(TABLES.filter((t) => !fk.some((r) => r.t === t))));

  await owner("DELETE FROM tenants WHERE id = ANY($1)", [[A, B]]);
} catch (e) {
  failed = true;
  console.log("\n  FAIL the database sections threw — " + String((e && e.message) || e));
} finally {
  await pool.end().catch(() => {});
  await appPool.end().catch(() => {});
}

console.log("\n" + ok + " passed, " + (bad.length + (failed ? 1 : 0)) + " failed");
if (bad.length) bad.forEach((b) => console.log("  - " + b));
process.exit(bad.length || failed ? 1 : 0);
