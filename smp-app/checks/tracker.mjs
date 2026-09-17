/* THE INTERNAL TRACKER — the office's weekly list, per client (spec 054).

   WHAT THIS FILE IS FOR. The four claims that would hurt if they were false:
   that a client's person cannot open or write to it (decision 2); that an
   action is owned by an office row and by nothing else (decision 5); that
   being late and being carried are worked out from the FIRST date the action
   was given, so rescheduling cannot reset the count; and that one client's
   list is not another's.

   BOTH ENDS, EVERY TIME (§94.2): every refusal is asserted beside the same
   act ALLOWED to somebody the rule admits, or a build that refused everybody
   passes half of it (§113.8). What is DRIVEN and what is READ (§100.3):
     · §1–§2 RUN the pure rules with no database;
     · §3–§7 RUN every statement as `smp_app` with the tenant set, the way
       withTenant does it in the product; §8 drives the module's own SERVER
       and reads its answers; §10 serves it over a port and PRESSES it in
       Chromium, reading the database back after every press (§96);
     · §9 READS the catalogue: both tables fenced and forced, their policy
       IDENTICAL to an existing tenant table's (§94.8), and neither on the
       platform's own list (§331).

     DATABASE_URL_UNPOOLED=postgres://owner@… node checks/tracker.mjs
     SMP_BREAK=no-office-gate node checks/tracker.mjs   # must go red
     SMP_BREAK=reset-carried  node checks/tracker.mjs   # must go red
     SMP_BREAK=owner-anyone   node checks/tracker.mjs   # must go red
     SMP_BREAK=who-everyone   node checks/tracker.mjs   # must go red (§356.11)
     SMP_BREAK=reload-on-add  node checks/tracker.mjs   # must go red (§356.12)
     SMP_BREAK=back-on-blur   node checks/tracker.mjs   # must go red (§356.14)
     SMP_BREAK=week-numbers   node checks/tracker.mjs   # must go red (§356.15)
     SMP_BREAK=note-standing  node checks/tracker.mjs   # must go red (§356.15)
     SMP_BREAK=week-of-year   node checks/tracker.mjs   # must go red (§356.16)
     SMP_BREAK=card-count     node checks/tracker.mjs   # must go red (§356.16)
     SMP_BREAK=card-jumps     node checks/tracker.mjs   # must go red (§356.16)
     SMP_BREAK=details-always node checks/tracker.mjs   # must go red (§356.16)
     SMP_BREAK=wide-names     node checks/tracker.mjs   # must go red (§356.16)

   SINCE §356.14 DATES ARE WEEKS: a row reads its week's number in the year
   (W38, this week's in bold) and picking a week stores its THURSDAY; Exact
   dates is a choice behind the dots beside Group by, remembered on the
   browser; the add line takes the week, the owner and a note before Enter;
   the pill is ONE box whether it is a select or a span (measured, both);
   the date box stays until a change, Escape or a press elsewhere — never
   blur, which is what the calendar popup causes; and the way back to the
   client sits above the title.

   SINCE §356.11 THE ROW IS THE SECOND MOCKUP'S: one action, one owner (no
   collaborators anywhere — the act, the column, the rule); the owner cell a
   FIRST NAME that opens the office to hand the action on, for the owner and
   the Super user only (both ends); the arrow that opens and folds a row; a
   double-click that renames in place; late as one short word; the grouping
   a choice; and every press SILENT — §10 plants a mark on the window before
   the first press and reads it after the last, because a page that reloaded
   answers every other assertion here perfectly (§113.8).                   */
import pg from "pg";
import { usePools } from "../lib/db.ts";
import { SCHEMA } from "../db/schema-name.mjs";
import { PLATFORM_TABLES } from "../lib/schema-check.ts";
import { serve } from "../modules/tracker/index.ts";
import { trackerDocument, whenText } from "../modules/tracker/page.ts";
import {
  STATUSES, STATUS_WORD, VIEWS, GROUPS, GROUP_WORD, FORMATS, FORMAT_WORD, isFormat, isStatus, isView, isGroup, isOffice, calendarDay, addDays, weekday, weekOf, isLate, carriedWeeks,
  lateWord, readableDay, weekLabel, inView, summary, mayChange, shape, oneLine, shortNames, todayIn, thursdayOf, weekNumber, weekWord, weekOptions, weekDays, sameWeek,
  officeRows, listActions, oneAction, addAction, setFields, setStatus, deleteAction, eventsOf, isOfficeRow, namesOf,
} from "../lib/tracker.ts";

let ok = 0;
const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};
const section = (n) => console.log("\n" + n);
/* EVERY PROBE DEGRADES (§215): a thrown probe is a failure with the throw's
   own words, never a run that stopped and printed fewer failures. */
const probe = async (what, fn) => { try { return await fn(); } catch (e) { check(what, false, "threw: " + String(e && e.message || e)); return undefined; } };

/* ══ §1 · the week, and being late ═══════════════════════════════════ */
section("§1 · the week is Sunday to Thursday, and being late");
/* 2026-09-15 is a Tuesday; the week is Sun 13 – Thu 17 (the mockup's own). */
const TODAY = "2026-09-15";
check("today is a Tuesday, or every date below is measured against the wrong week", weekday(TODAY) === 2);
const w = weekOf(TODAY);
check("this week runs Sun 13 to Thu 17", w.from === "2026-09-13" && w.to === "2026-09-17", JSON.stringify(w));
for (const [d, name] of [["2026-09-13", "Sunday"], ["2026-09-14", "Monday"], ["2026-09-16", "Wednesday"], ["2026-09-17", "Thursday"]])
  check(name + " is in the same week", weekOf(d).from === "2026-09-13", JSON.stringify(weekOf(d)));
check("a FRIDAY belongs to the week that follows it (decision 8)", weekOf("2026-09-18").from === "2026-09-20", JSON.stringify(weekOf("2026-09-18")));
check("...and so does a Saturday", weekOf("2026-09-19").from === "2026-09-20", JSON.stringify(weekOf("2026-09-19")));
check("a week is five days long, never seven", addDays(w.from, 4) === w.to);
check("the label says the two dates without the year in the same year", weekLabel(w, TODAY) === "13 Sep – 17 Sep", weekLabel(w, TODAY));
check("a day reads as the product's own three letters", readableDay("2026-09-17", TODAY) === "Thu 17 Sep", readableDay("2026-09-17", TODAY));
check("...and carries its year when it is not this year", readableDay("2027-01-04", TODAY) === "Mon 4 Jan 2027", readableDay("2027-01-04", TODAY));
check("a date the list cannot read is refused, never guessed at", calendarDay("15/09/2026") === null && calendarDay("2026-02-31") === null && calendarDay("") === null);
check("...and a real one comes back as itself", calendarDay("2026-09-15") === "2026-09-15");
check("late is due BEFORE today, never today", isLate("2026-09-14", TODAY) && !isLate("2026-09-15", TODAY) && !isLate("2026-09-16", TODAY));
check("no date is never late (§35)", !isLate(null, TODAY));
check("carried is counted in WEEKS from the first date — 3 Sep is two weeks back", carriedWeeks("2026-09-03", TODAY) === 2, String(carriedWeeks("2026-09-03", TODAY)));
check("...a date last week is one", carriedWeeks("2026-09-10", TODAY) === 1, String(carriedWeeks("2026-09-10", TODAY)));
check("...and a date this week, even if past, is nought", carriedWeeks("2026-09-14", TODAY) === 0);
check("...and a date in the future is nought, never negative", carriedWeeks("2026-10-01", TODAY) === 0);
check("the three words are the product's own (§300)",
  STATUSES.join(",") === "not_started,in_progress,done" && Object.values(STATUS_WORD).join("|") === "Not started|In progress|Done");
check("a near miss is not a status or a view", !isStatus("Done") && !isView("Week") && !isStatus("blocked"));
check("the office is the two seats and nothing else", isOffice("super") && isOffice("smoteam") && !isOffice("none") && !isOffice(null) && !isOffice(""));
check("a title pasted over lines comes back as one line", oneLine("Chase\n  Finance") === "Chase Finance");
/* THE SHORT NAME IS THE REGISTER'S OWN FIRST NAME (§356.11, §130.7): a
   particle is not a name, a clashing pair is lengthened for exactly that
   pair (§81.1), and a pair still equal at two words gets the whole name. */
const sn = (people) => Array.from(shortNames(people.map((n, i) => ({ key: "k" + i, name: n }))).values()).join("|");
check("the owner reads as a first name", sn(["Islam Saadany", "Noran Essam", "Omar Khalil"]) === "Islam|Noran|Omar", sn(["Islam Saadany", "Noran Essam", "Omar Khalil"]));
check("...a particle is not a name — Abd El Moniem is one word of it", sn(["Abd El Moniem Mohamed", "Hend Adel"]) === "Abd El Moniem|Hend", sn(["Abd El Moniem Mohamed", "Hend Adel"]));
check("...two Ahmeds are told apart by their second word, and only those two", sn(["Ahmed Mostafa", "Ahmed Ali", "Noran Essam"]) === "Ahmed Mostafa|Ahmed Ali|Noran", sn(["Ahmed Mostafa", "Ahmed Ali", "Noran Essam"]));
check("...and a pair still equal at two words gets the whole name", sn(["Ahmed Ali Hassan", "Ahmed Ali Youssef"]) === "Ahmed Ali Hassan|Ahmed Ali Youssef", sn(["Ahmed Ali Hassan", "Ahmed Ali Youssef"]));
check("...a lone word is itself", sn(["Madonna"]) === "Madonna");
/* LATE IS ONE SHORT WORD, the weeks riding on it (Islam: "carried 1 week is long"). */
check("late reads Late, Late 1 w, Late 2 w — never 'carried'", lateWord(0) === "Late" && lateWord(1) === "Late 1 w" && lateWord(2) === "Late 2 w" && !/carried/.test(lateWord(3)));
const lateRow = shape({ id: "l", title: "t", description: "", owner_key: "islam", due: "2026-09-03", first_due: "2026-09-03", status: "in_progress", created_by: "islam" });
check("...and as exact dates the row says the word, then the date", whenText(lateRow, TODAY, "dates").text === "Late 2 w · Thu 3 Sep" && whenText(lateRow, TODAY, "dates").late, whenText(lateRow, TODAY, "dates").text);
check("a row due this week but past says Late alone, as dates", whenText(shape({ ...lateRow, due: "2026-09-14", first_due: "2026-09-14" }), TODAY, "dates").text === "Late · Mon 14 Sep");
/* AS WEEKS (§356.15): This week, Next week, then the number in the year, a
   late row the word alone, and Weeks is what an unasked page reads as. The
   NUMBER is still asserted, because it is what the third week onward reads
   and what a past week falls back to — the words did not replace it, they
   went in front of it. */
check("dates are two formats, Weeks first, and a near miss is not one", FORMATS.join(",") === "weeks,dates" && FORMAT_WORD.dates === "Exact dates" && !isFormat("Weeks") && isFormat("dates"));
check("a week is stored as its Thursday — Sunday's, Wednesday's and Friday's week alike", thursdayOf("2026-09-13") === "2026-09-17" && thursdayOf("2026-09-16") === "2026-09-17" && thursdayOf("2026-09-18") === "2026-09-24", thursdayOf("2026-09-18"));
check("the week's number is the year's — 17 Sep 2026 is W38, and the last week of 2026 is W53", weekNumber("2026-09-16") === 38 && weekNumber("2026-12-30") === 53 && weekNumber("2026-01-01") === 1, weekNumber("2026-09-16") + " " + weekNumber("2026-12-30"));
/* THE WORDS, AND BOTH ENDS OF THEM (§94.2, §356.15): two weeks have one and
   everything else is its number, or a build that said "This week" about every
   week would pass the half that matters. A week BEFORE this one is asserted
   to read its NUMBER and never a word — it is the only way that case can be
   reached (a list grouped by due week), and "Previous week" is what must not
   appear there. */
check("this week and next week are words", weekWord("2026-09-13", TODAY) === "This week" && weekWord("2026-09-17", TODAY) === "This week" &&
  weekWord("2026-09-20", TODAY) === "Next week" && weekWord("2026-09-24", TODAY) === "Next week",
  [weekWord("2026-09-13", TODAY), weekWord("2026-09-20", TODAY)].join(" · "));
/* AND EVERY WEEK AFTER THEM IS ITS PLACE IN ITS MONTH (§356.16, Islam's own
   two examples): the month is the THURSDAY's, so the week running 27 Sep –
   1 Oct is W1 Oct — asserted on that straddling week, which is the only case
   where the rule can be got wrong. */
check("...and every week after them is its place in its month", weekWord("2026-10-01", TODAY) === "W1 Oct" && weekWord("2026-10-08", TODAY) === "W2 Oct" &&
  weekWord("2026-10-29", TODAY) === "W5 Oct" && weekWord("2026-12-17", TODAY) === "W3 Dec" && weekWord("2027-01-07", TODAY) === "W1 Jan",
  [weekWord("2026-10-01", TODAY), weekWord("2026-10-29", TODAY), weekWord("2026-12-17", TODAY)].join(" · "));
check("...the straddling week takes the month it ENDS in, which is where its Thursday is", weekWord("2026-09-27", TODAY) === "W1 Oct" && thursdayOf("2026-09-27") === "2026-10-01",
  weekWord("2026-09-27", TODAY) + " / " + thursdayOf("2026-09-27"));
check("...and a week gone by reads its month too, never a word", weekWord("2026-09-10", TODAY) === "W2 Sep" && weekWord("2026-09-03", TODAY) === "W1 Sep", weekWord("2026-09-10", TODAY));
const wo = weekOptions(TODAY);
/* THE PICKER SAYS WHAT THE ROWS SAY (§53.5, Islam's pick): press Next week
   and the row reads Next week — one week, one spelling, on one screen. */
check("the picker offers this week and five after it, each with its days", wo.length === 6 && wo[0].now && !wo[1].now && wo.map((o) => o.word).join(",") === "This week,Next week,W1 Oct,W2 Oct,W3 Oct,W4 Oct" && wo[0].days === "13 – 17 Sep" && wo[2].days === "27 Sep – 1 Oct" && wo[0].to === "2026-09-17", JSON.stringify(wo));
check("a week's days across a year carry it once", weekDays(weekOf("2027-01-04"), TODAY) === "3 – 7 Jan 2027", weekDays(weekOf("2027-01-04"), TODAY));
const wk = (due, first) => whenText(shape({ ...lateRow, due, first_due: first || due, status: "not_started" }), TODAY);
/* THE BOLD WENT WITH THE WORDS (§356.15): the row carries no mark of its own
   for this week, because the word says it — asserted as an ABSENCE beside the
   words, or a build that kept both would pass on the words alone. */
check("as weeks a row reads the week in words, and nothing marks this one twice", wk("2026-09-17").text === "This week" && wk("2026-09-24").text === "Next week" && wk("2026-10-01").text === "W1 Oct" &&
  wk("2026-09-17").now === undefined && wk("2026-10-01").now === undefined, JSON.stringify(wk("2026-09-17")));
check("...a late row says how late and nothing else", wk("2026-09-03").text === "Late 2 w" && wk("2026-09-03").late && wk("2026-09-14").text === "Late", wk("2026-09-03").text);
check("...and Done is a day either way", whenText(shape({ ...lateRow, status: "done", done_day: "2026-09-15" }), TODAY).text === "Done Tue 15 Sep");
check("the same week is the same week whichever day names it", sameWeek("2026-09-13", "2026-09-17") && !sameWeek("2026-09-17", "2026-09-18"));
check("the grouping is four choices, Owner first, and a near miss is not one", GROUPS.join(",") === "owner,status,due,none" && GROUP_WORD.due === "Due date" && !isGroup("Owner") && isGroup("none"));

/* ══ §2 · the views, and who may do what ══════════════════════════════ */
section("§2 · the four views, the strip, and who may do what");
const mk = (o) => shape({ id: o.id || "x", title: "t", description: "", owner_key: o.owner || "islam",
  due: o.due || null, first_due: o.first || o.due || null, status: o.status || "not_started", done_day: o.doneDay || null, created_by: "islam" });
const ME = { personKey: "noran", seat: "smoteam" }, SUPER = { personKey: "islam", seat: "super" }, OTHER = { personKey: "omar", seat: "smoteam" };
const rows = [
  mk({ id: "a", owner: "islam", due: "2026-09-14" }),                       // late, this week
  mk({ id: "b", owner: "noran", due: "2026-09-03", status: "in_progress" }), // late, carried
  mk({ id: "c", owner: "islam", due: "2026-09-17" }),                       // due Thu
  mk({ id: "d", owner: "noran", due: "2026-09-24" }),                        // next week
  mk({ id: "e", owner: "omar" }),                                            // undated
  mk({ id: "f", owner: "noran", due: "2026-09-15", status: "done", doneDay: "2026-09-15" }), // done this week
  mk({ id: "g", owner: "omar", due: "2026-09-01", status: "done", doneDay: "2026-09-02" }),  // done last week
];
const ids = (v, who = SUPER) => rows.filter((a) => inView(a, v, who, TODAY)).map((a) => a.id).join("");
check("This week holds what is due by Thursday, late included, the undated, and what was finished this week", ids("week") === "abcef", ids("week"));
check("...and NOT next week's, or something finished last week", !/[dg]/.test(ids("week")));
check("Undated holds the open action with no date and nothing else", ids("undated") === "e", ids("undated"));
/* UNDATED IS INSIDE THIS WEEK, not beside it: the line just typed has no date
   and must not vanish on the reload (§10 found it, lib/tracker.ts says why). */
check("Undated is inside This week, so a line just typed does not vanish", ids("undated").split("").every((x) => ids("week").includes(x)));
check("All holds everything", ids("all") === "abcdefg", ids("all"));
check("Mine is what I own — and nothing else, since nobody is 'on' an action any more (§356.11)", ids("mine", ME) === "bdf", ids("mine", ME));
check("...and a different me reads a different list", ids("mine", OTHER) === "eg", ids("mine", OTHER));
const s = summary(rows, TODAY);
check("the strip: 5 open · 2 late · 2 due this week (f is done, so it is not owed) · 1 done this week",
  s.open === 5 && s.late === 2 && s.dueWeek === 2 && s.doneWeek === 1 && !("dueWeekNotStarted" in s), JSON.stringify(s));
check("ONE RULE: the owner may change the action, the Super user may, and nobody else — being on the same team is not being on it",
  mayChange(rows[2], SUPER) && mayChange(rows[2], { personKey: "islam", seat: "smoteam" }) && !mayChange(rows[2], ME) && !mayChange(rows[2], OTHER) && mayChange(rows[2], { personKey: "hana", seat: "super" }));
check("somebody the register has not placed may change nothing but as Super user", !mayChange(rows[2], { personKey: null, seat: "smoteam" }) && mayChange(rows[2], { personKey: null, seat: "super" }));

/* ══ the database ═════════════════════════════════════════════════════ */
const URL_ = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
if (!URL_) {
  console.log("\nNo DATABASE_URL — §3–§10 need one. A check that cannot run is not a check that passed (§54.5).");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: URL_, max: 4, options: "-c search_path=" + SCHEMA });
const appUrl = new URL(URL_);
appUrl.username = "smp_app";
appUrl.password = process.env.SMP_APP_PASSWORD || "smp_app";
const appPool = new pg.Pool({ connectionString: appUrl.toString(), max: 4, options: "-c search_path=" + SCHEMA });
usePools(pool, appPool);
const owner = async (sql, args) => (await pool.query(sql, args)).rows;
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
  } finally { c.release(); }
}

let failed = false;
try {
  await owner("SET search_path TO " + SCHEMA);
  const stamp = "trk" + Date.now().toString(36);
  const [{ id: A }] = await owner("INSERT INTO tenants (key, name) VALUES ($1, $2) RETURNING id", [stamp + "-a", "Raya Trade"]);
  const [{ id: B }] = await owner("INSERT INTO tenants (key, name) VALUES ($1, $2) RETURNING id", [stamp + "-b", "RHI"]);
  /* THE REGISTER: two office rows and one of the client's own people on A;
     one office row on B. The seat lives on tenant_users, the name on people. */
  const person = async (t, key, name, seat, idx) => {
    const [u] = await owner("INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) VALUES ($1,$2,'client',false,false,'x') RETURNING id",
      [stamp + "-" + key + "@example.test", name]);
    /* The register row first: tenant_users.person_key carries an FK to people (§339). */
    await owner("INSERT INTO people (tenant_id, key, idx, name) VALUES ($1,$2,$3,$4)", [t, key, idx, name]);
    await owner("INSERT INTO tenant_users (tenant_id, user_id, person_key, seat) VALUES ($1,$2,$3,$4)", [t, u.id, key, seat]);
  };
  await person(A, "islam", "Islam Saadany", "super", 0);
  await person(A, "noran", "Noran Essam", "smoteam", 1);
  await person(A, "hend", "Hend Adel", "none", 2);
  await person(B, "omar", "Omar Khalil", "super", 0);

  /* ══ §3 · the owner is an office row ════════════════════════════════ */
  section("§3 · an action is owned by an office row, and by nothing else");
  const office = await asTenant(A, (c) => officeRows(c));
  check("the office rows are the two seats, in the register's order", office.map((p) => p.key).join(",") === "islam,noran", JSON.stringify(office));
  check("the client's own person is NOT one", !office.some((p) => p.key === "hend"));
  check("...and is refused as an owner by the rule the server asks", !(await asTenant(A, (c) => isOfficeRow(c, "hend"))));
  check("...while an office row is accepted — both ends", await asTenant(A, (c) => isOfficeRow(c, "noran")));
  check("somebody not on the register at all is refused too", !(await asTenant(A, (c) => isOfficeRow(c, "nobody"))));
  check("B's office row is not A's", !(await asTenant(A, (c) => isOfficeRow(c, "omar"))) && (await asTenant(B, (c) => isOfficeRow(c, "omar"))));

  /* ══ §4 · adding, and the events ════════════════════════════════════ */
  section("§4 · the next empty line, and every change kept");
  const a1 = await asTenant(A, (c) => addAction(c, { title: "  Chase Finance for the   August figures ", ownerKey: "noran", by: "islam" }));
  check("an action is born Not started with no date, its title on one line",
    a1.status === "not_started" && a1.due === null && a1.firstDue === null && a1.title === "Chase Finance for the August figures", JSON.stringify(a1));
  const ev0 = await asTenant(A, (c) => eventsOf(c, a1.id));
  check("the first event says who created it", ev0.length === 1 && ev0[0].kind === "created" && ev0[0].by === "islam", JSON.stringify(ev0));
  await probe("an action with no words is refused", async () => {
    let threw = false;
    try { await asTenant(A, (c) => addAction(c, { title: "   ", ownerKey: "noran", by: "islam" })); } catch { threw = true; }
    check("an action with no words is refused", threw);
  });
  const a2 = await asTenant(A, (c) => setStatus(c, a1.id, "in_progress", "noran"));
  check("a status change is written and kept with who", a2.status === "in_progress" &&
    (await asTenant(A, (c) => eventsOf(c, a1.id))).some((e) => e.kind === "status" && e.from === "not_started" && e.to === "in_progress" && e.by === "noran"));
  await asTenant(A, (c) => setStatus(c, a1.id, "in_progress", "noran"));
  check("setting a status to what it already is writes NO event (§94.5's own trap)", (await asTenant(A, (c) => eventsOf(c, a1.id))).length === 2);
  const a3 = await asTenant(A, (c) => setStatus(c, a1.id, "done", "noran"));
  check("Done stamps the day", a3.status === "done" && !!a3.doneDay, JSON.stringify(a3));
  const a4 = await asTenant(A, (c) => setStatus(c, a1.id, "not_started", "islam"));
  check("reopening clears the stamp", a4.status === "not_started" && a4.doneDay === null, JSON.stringify(a4));
  check("...and the history now holds four entries, oldest last", (await asTenant(A, (c) => eventsOf(c, a1.id))).length === 4);

  /* ══ §5 · the date, and the carried count that cannot be reset ══════ */
  section("§5 · the first date is written once, so a reschedule cannot reset the count");
  const d1 = await asTenant(A, (c) => setFields(c, a1.id, { due: "2026-09-03" }));
  check("the first date given becomes the first due date", d1.due === "2026-09-03" && d1.firstDue === "2026-09-03", JSON.stringify(d1));
  const d2 = await asTenant(A, (c) => setFields(c, a1.id, { due: "2026-09-16" }));
  check("moving the date moves DUE and leaves the first date where it was", d2.due === "2026-09-16" && d2.firstDue === "2026-09-03", JSON.stringify(d2));
  check("...so the carried count is still two weeks at the 15th, not nought", carriedWeeks(d2.firstDue, TODAY) === 2, String(carriedWeeks(d2.firstDue, TODAY)));
  const d3 = await asTenant(A, (c) => setFields(c, a1.id, { due: null }));
  check("clearing the date keeps the first date — a date taken away is not a reschedule to never", d3.due === null && d3.firstDue === "2026-09-03", JSON.stringify(d3));
  const d4 = await asTenant(A, (c) => setStatus(c, a1.id, "done", "noran"));
  check("Done clears the first date (spec 054 §5)", d4.firstDue === null, JSON.stringify(d4));
  await asTenant(A, (c) => setFields(c, a1.id, { due: "2026-09-20" }));
  const d5 = await asTenant(A, (c) => setStatus(c, a1.id, "not_started", "noran"));
  check("reopened, the first date starts again from the date it holds", d5.firstDue === "2026-09-20", JSON.stringify(d5));
  const d6 = await asTenant(A, (c) => setFields(c, a1.id, { title: "Chase Finance", description: "  Nineteen of 26 entered.\n\n " }));
  check("the title and the notes write, and the row carries no collaborators at all (§356.11)", d6.title === "Chase Finance" && d6.description === "Nineteen of 26 entered." && !("collaborators" in d6), JSON.stringify(d6));
  check("a name on the row is read from the register, never stored on the action",
    (await asTenant(A, (c) => namesOf(c))).get("noran") === "Noran Essam");

  /* ══ §6 · one client's list is not another's ═════════════════════════ */
  section("§6 · one client's list is not another's");
  const b1 = await asTenant(B, (c) => addAction(c, { title: "Book the projector", ownerKey: "omar", by: "omar" }));
  const aList = await asTenant(A, (c) => listActions(c));
  const bList = await asTenant(B, (c) => listActions(c));
  check("A sees its own", aList.length === 1 && aList[0].id === a1.id, aList.map((r) => r.title).join("|"));
  check("B sees its own — so 'one row' is not passing because there is only one", bList.length === 1 && bList[0].id === b1.id, bList.map((r) => r.title).join("|"));
  check("A cannot reach B's action by its id", (await asTenant(A, (c) => oneAction(c, b1.id))) === null);
  check("...and can reach its own by id, or the refusal above is not about the client", (await asTenant(A, (c) => oneAction(c, a1.id))) !== null);
  check("A cannot write over B's", (await asTenant(A, (c) => setFields(c, b1.id, { title: "taken" }))) === null &&
    (await asTenant(B, (c) => oneAction(c, b1.id))).title === "Book the projector");
  check("A cannot delete B's", !(await asTenant(A, (c) => deleteAction(c, b1.id))) && (await asTenant(B, (c) => oneAction(c, b1.id))) !== null);
  const noTenant = await (async () => {
    const c = await pool.connect();
    try {
      await c.query("BEGIN"); await c.query("SET LOCAL search_path TO " + SCHEMA); await c.query("SET LOCAL ROLE smp_app");
      const n = (await c.query("SELECT count(*)::int AS n FROM tracker_actions")).rows[0].n +
        (await c.query("SELECT count(*)::int AS n FROM tracker_events")).rows[0].n;
      await c.query("COMMIT"); return n;
    } finally { c.release(); }
  })();
  check("with no tenant set at all, both tables are empty rather than open", noTenant === 0, String(noTenant));

  /* ══ §7 · delete takes the history with it ═══════════════════════════ */
  section("§7 · deleting");
  const gone = await asTenant(B, (c) => deleteAction(c, b1.id));
  check("an action deletes", gone && (await asTenant(B, (c) => oneAction(c, b1.id))) === null);
  check("...and its history goes with it, never orphaned", (await asTenant(B, (c) => eventsOf(c, b1.id))).length === 0);

  /* ══ §8 · the server: the gate, and every act at both ends ══════════ */
  section("§8 · the module's own server — the office in, a client's person out");
  const call = async (tenant, who, rest, body) => {
    const url = "https://smp.example/x/tracker" + rest.map((r) => "/" + r).join("");
    const req = body ? new Request(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) : new Request(url);
    const res = await serve({ req, slug: "x", module: "tracker", tenantId: tenant, tenantName: tenant === A ? "Raya Trade" : "RHI",
      have: ["strategy", "tracker"], rest, personKey: who.personKey, seat: who.seat });
    const text = await res.text();
    let j = null; try { j = JSON.parse(text); } catch {}
    return { status: res.status, text, j, to: res.headers.get("location") || "" };
  };
  const ISLAM = { personKey: "islam", seat: "super" }, NORAN = { personKey: "noran", seat: "smoteam" }, HEND = { personKey: "hend", seat: "none" };
  const page = await call(A, NORAN, [], null);
  check("the office opens the list", page.status === 200 && /<title>Raya Trade &mdash; Internal Tracker<\/title>/.test(page.text), page.status + " " + (page.text.match(/<title>[^<]*/) || [""])[0]);
  check("the page ends in the next empty line — a note under it, this week's number, the person's own first name, a plain pill",
    /id="add" class="new"/.test(page.text) && /id="addnote" class="nt"/.test(page.text) && /<span class="who pick"[^>]*><span class="wn">Noran<\/span>/.test(page.text) &&
    new RegExp('class="addrow" data-due="' + thursdayOf(todayIn()) + '" data-owner="noran"').test(page.text) && /<span class="st">Not started<\/span>/.test(page.text));
  check("the views row carries the two settings behind the dots, Owner and Weeks in force, and the body says which list it is",
    !/class="gby"/.test(page.text) && /data-act="settings"/.test(page.text) && /data-act="set-group" data-value="owner" class="on"/.test(page.text) && /data-act="set-dates" data-value="weeks" class="on"/.test(page.text) &&
    /data-group="owner"/.test(page.text) && /data-dates="weeks"/.test(page.text) && /data-list="[^"]*\/tracker\/list"/.test(page.text));
  check("the way back sits above the title and goes to the client", /<a class="back" href="\/x">[^<]*<svg[^]*?<\/svg>Raya Trade<\/a><h2 class="pt">/.test(page.text));
  check("no font shorthand ends in 'inherit' — a browser drops such a line, which is the pill at two sizes (§356.14)", !/font:[^;}]*\binherit\b/.test(page.text), (page.text.match(/font:[^;}]*\binherit\b/) || [""])[0]);
  check("nothing on it is inline script — the policy would silence it", !/<script>|onclick=/i.test(page.text) && /app\.js"><\/script>/.test(page.text));
  const client = await call(A, HEND, [], null);
  check("the client's own person is turned away with a sentence, not a page", client.status === 403 && /The Internal Tracker is the office/.test(client.text) && !/id="add"/.test(client.text), String(client.status));
  check("...and at the api too, not only on the page (§42)", (await call(A, HEND, ["api"], { act: "add", title: "sneak" })).status === 403);
  check("somebody with no membership at all is turned away", (await call(A, { personKey: null, seat: null }, [], null)).status === 403);
  const js = await call(A, NORAN, ["app.js"], null);
  check("the script is served by the module itself, as script, talking to the two addresses on the body", js.status === 200 && /fetch\(url/.test(js.text) && /data-api/.test(js.text) && /data-list/.test(js.text) && !/location\.reload/.test(js.text));
  const off = await call(A, NORAN, ["nothing-here"], null);
  check("a word the module does not draw comes back to the list", off.status === 302 && off.to.endsWith("/x/tracker"), off.status + " " + off.to);
  check("GET at the api is not a write", (await call(A, NORAN, ["api"], null)).status === 405);
  const lst = await call(A, NORAN, ["list"], null);
  check("the list address answers the list drawn again, for the office", lst.status === 200 && lst.j && lst.j.ok === true && typeof lst.j.body === "string" && /class="list"/.test(lst.j.body) && typeof lst.j.count === "string", lst.status + " " + lst.text.slice(0, 80));
  check("...and not for the client's own person (§42)", (await call(A, HEND, ["list"], null)).status === 403);

  const added = await call(A, NORAN, ["api"], { act: "add", title: "Walk Hend through Reporting" });
  check("Enter on the line adds it under me", added.j && added.j.ok === true && !!added.j.id, added.text);
  check("...and the answer IS the list drawn again, the new row in it, so nothing has to reload (§356.12)",
    typeof added.j.body === "string" && added.j.body.includes('data-id="' + added.j.id + '"') && /Walk Hend through Reporting/.test(added.j.body) && /^\d+ actions? on this week$/.test(added.j.count), added.j.count);
  const mine = await asTenant(A, (c) => oneAction(c, added.j.id));
  check("...owned by me, Not started, due THIS WEEK'S THURSDAY when the line said nothing (§356.14), the first date with it",
    mine.ownerKey === "noran" && mine.status === "not_started" && mine.due === thursdayOf(todayIn()) && mine.firstDue === mine.due, JSON.stringify(mine));
  const noDay = await call(A, NORAN, ["api"], { act: "add", title: "Someday", due: null });
  check("a line that says 'no date' is born with none", noDay.j.ok === true && (await asTenant(A, (c) => oneAction(c, noDay.j.id))).due === null);
  const full = await call(A, NORAN, ["api"], { act: "add", title: "Full line", due: "2026-10-01", description: "  with a note  ", ownerKey: "islam" });
  const fullRow = await asTenant(A, (c) => oneAction(c, full.j.id));
  check("a line arrives with its week, its owner and its note", full.j.ok === true && fullRow.due === "2026-10-01" && fullRow.firstDue === "2026-10-01" && fullRow.ownerKey === "islam" && fullRow.description === "with a note", JSON.stringify(fullRow));
  check("...and a day the list cannot read on the line is refused, nothing written", (await call(A, NORAN, ["api"], { act: "add", title: "x", due: "1/10/2026" })).status === 400);
  const forHend = await call(A, NORAN, ["api"], { act: "add", title: "x", ownerKey: "hend" });
  check("an action cannot be given to the client's own person", forHend.status === 400 && /office/.test(forHend.j.why), forHend.text);
  check("...and can be given to another office row — both ends", (await call(A, NORAN, ["api"], { act: "add", title: "For Islam", ownerKey: "islam" })).j.ok === true);
  const nobody = await call(A, { personKey: null, seat: "smoteam" }, ["api"], { act: "add", title: "orphan" });
  check("an office login not yet on the register is told, and nothing is written", nobody.status === 400 && /register/.test(nobody.j.why));
  check("a status is changed on the row", (await call(A, NORAN, ["api"], { act: "status", id: added.j.id, status: "in_progress" })).j.ok === true &&
    (await asTenant(A, (c) => oneAction(c, added.j.id))).status === "in_progress");
  check("a status the list does not know is refused", (await call(A, NORAN, ["api"], { act: "status", id: added.j.id, status: "blocked" })).status === 400);
  check("a date the list cannot read is refused in words", (await call(A, NORAN, ["api"], { act: "due", id: added.j.id, due: "16/09/2026" })).status === 400);
  check("...and a real one is written", (await call(A, NORAN, ["api"], { act: "due", id: added.j.id, due: "2026-09-16" })).j.ok === true &&
    (await asTenant(A, (c) => oneAction(c, added.j.id))).due === "2026-09-16");
  /* WHO MAY: Islam holds the Super user seat, so he may do anything to Noran's
     action; a second SMO team member who is not on it may not. */
  await person(A, "omarA", "Omar Khalil", "smoteam", 3);
  const OMAR = { personKey: "omarA", seat: "smoteam" };
  check("somebody not on the action may not change it", (await call(A, OMAR, ["api"], { act: "status", id: added.j.id, status: "done" })).status === 403);
  check("...the Super user may — both ends", (await call(A, ISLAM, ["api"], { act: "notes", id: added.j.id, description: "Islam's note" })).j.ok === true);
  /* ONE ACTION, ONE OWNER (§356.11): there is no longer a way to put
     somebody 'on' an action, so a tab on the build before asking for one is
     told it is not something this list does, and writes nothing. */
  const collab = await call(A, NORAN, ["api"], { act: "collab", id: added.j.id, collaborators: ["omarA"] });
  check("'with' is gone: putting somebody on an action is not something this list does", collab.status === 400 && /Not something this list does/.test(collab.j.why), collab.text);
  check("...and they still may not change it, or hand it over, or delete it", (await call(A, OMAR, ["api"], { act: "status", id: added.j.id, status: "done" })).status === 403 &&
    (await call(A, OMAR, ["api"], { act: "owner", id: added.j.id, ownerKey: "omarA" })).status === 403 &&
    (await call(A, OMAR, ["api"], { act: "delete", id: added.j.id })).status === 403);
  check("the owner hands it over", (await call(A, NORAN, ["api"], { act: "owner", id: added.j.id, ownerKey: "omarA" })).j.ok === true &&
    (await asTenant(A, (c) => oneAction(c, added.j.id))).ownerKey === "omarA");
  check("...and now the new owner may change it while the old may not — both ends", (await call(A, OMAR, ["api"], { act: "status", id: added.j.id, status: "done" })).j.ok === true &&
    (await call(A, NORAN, ["api"], { act: "status", id: added.j.id, status: "done" })).status === 403);
  check("an action B's office cannot see cannot be written by B's server either", (await call(B, { personKey: "omar", seat: "super" }, ["api"], { act: "delete", id: added.j.id })).status === 404);
  check("the owner deletes it", (await call(A, OMAR, ["api"], { act: "delete", id: added.j.id })).j.ok === true && (await asTenant(A, (c) => oneAction(c, added.j.id))) === null);
  const opened = await call(A, NORAN, [], null).then(() => trackerDocument({ slug: "x", tenantId: A, tenantName: "Raya Trade", have: ["strategy", "tracker"], ask: { view: "all", q: "", open: a1.id, group: "owner" }, who: NORAN, today: TODAY }));
  check("an opened row shows its notes and its history in place", /class="open"/.test(opened) && /Nineteen of 26 entered\./.test(opened) && /created it, owner/.test(opened));
  check("...with Delete behind a question, never a browser dialog", /Delete this action\?/.test(opened) && !/confirm\(/.test(opened));
  check("...and NO Title box and NO With: the name is renamed on the row and one action has one owner", !/class="open"[\s\S]*input class="ttl"/.test(opened) && !/>With</.test(opened) && !/class="ticks"/.test(opened));
  /* WHO GETS THE PRESS, BOTH ENDS (§61, §94.2): the owner's name is a button
     for the owner and the Super user, and plain text for everybody else. */
  const rowOf = (html) => (html.match(new RegExp('<div class="row[^"]*" data-id="' + a1.id + '"[\\s\\S]*?<button class="more')) || [""])[0];
  const asOmar = await trackerDocument({ slug: "x", tenantId: A, tenantName: "Raya Trade", have: ["strategy", "tracker"], ask: { view: "all", q: "", open: null, group: "owner" }, who: OMAR, today: TODAY });
  check("the owner's name opens the team for the owner", /class="who pick"[^>]*data-act="who"/.test(rowOf(opened)) && /class="team" role="listbox"/.test(rowOf(opened)) && /data-act="pick-owner" data-key="islam"/.test(rowOf(opened)));
  check("...and is plain text for somebody who is not — with the tick and the name not pressable either", /<span class="who">Noran<\/span>/.test(rowOf(asOmar)) && !/who pick/.test(rowOf(asOmar)) && /<button class="tick"[^>]*disabled/.test(rowOf(asOmar)) && !/data-rename/.test(rowOf(asOmar)), rowOf(asOmar).slice(0, 200));
  check("...and the team is first names only, no surnames", (rowOf(opened).match(/data-act="pick-owner"[^>]*>([^<]*)</g) || []).map((x) => x.replace(/^.*>/, "").replace(/<$/, "")).join("|") === "Islam|Noran|Omar", (rowOf(opened).match(/data-act="pick-owner"[^>]*>([^<]*)</g) || []).join());
  /* GROUPED THREE OTHER WAYS: the headings are the words, in their order. */
  const heads = (html) => (html.match(/class="grp" data-key="[^"]*">[^<]*/g) || []).map((x) => x.replace(/^.*">/, "").trim());
  const byStatus = await trackerDocument({ slug: "x", tenantId: A, tenantName: "Raya Trade", have: ["strategy", "tracker"], ask: { view: "all", q: "", open: null, group: "status" }, who: NORAN, today: TODAY });
  const byDue = await trackerDocument({ slug: "x", tenantId: A, tenantName: "Raya Trade", have: ["strategy", "tracker"], ask: { view: "all", q: "", open: null, group: "due", dates: "dates" }, who: NORAN, today: TODAY });
  const byWeek = await trackerDocument({ slug: "x", tenantId: A, tenantName: "Raya Trade", have: ["strategy", "tracker"], ask: { view: "all", q: "", open: null, group: "due", dates: "weeks" }, who: NORAN, today: TODAY });
  const byNone = await trackerDocument({ slug: "x", tenantId: A, tenantName: "Raya Trade", have: ["strategy", "tracker"], ask: { view: "all", q: "", open: null, group: "none", dates: "weeks" }, who: NORAN, today: TODAY });
  check("grouped by Owner the headings are the register's full names, in its order", heads(opened).join("|") === "Islam Saadany|Noran Essam", heads(opened).join("|"));
  check("...by Status it is the three words' own", heads(byStatus).every((h) => Object.values(STATUS_WORD).includes(h)) && heads(byStatus).length >= 1, heads(byStatus).join("|"));
  /* the rows §8 has made by now: two due this week's real Thursday, one on
     Sun 20 Sep 2026, one on 1 Oct 2026, and the undated */
  const realThu = thursdayOf(todayIn());
  check("...by Due date as exact dates it is the day, soonest first, and the undated read 'No date', last",
    heads(byDue).join("|") === [realThu, "2026-09-20", "2026-10-01"].sort().map((d) => readableDay(d, TODAY)).join("|") + "|No date", heads(byDue).join("|"));
  check("...and as weeks it is the WEEK, its word and its days, one heading for every day in it (§356.14, §356.15)",
    heads(byWeek).join("|") === [...new Set([realThu, "2026-09-20", "2026-10-01"].map(thursdayOf))].sort().map((t) => weekWord(t, todayIn()) + " · " + weekDays(weekOf(t), TODAY)).join("|") + "|No date", heads(byWeek).join("|"));
  check("...and by None there is no heading at all while the rows are all still there", heads(byNone).length === 0 && /class="row/.test(byNone) && /data-act="set-group" data-value="none" class="on"/.test(byNone));
  const cookied = await serve({ req: new Request("https://smp.example/x/tracker", { headers: { cookie: "a=b; smp.tracker.group=status" } }), slug: "x", module: "tracker", tenantId: A, tenantName: "Raya Trade", have: ["strategy", "tracker"], rest: [], personKey: "noran", seat: "smoteam" }).then((r) => r.text());
  check("the grouping this browser last chose is read off its cookie, so the page opens grouped that way", /data-value="status" class="on"/.test(cookied) && /data-group="status"/.test(cookied));
  const zzz = await serve({ req: new Request("https://smp.example/x/tracker", { headers: { cookie: "smp.tracker.group=zzz; smp.tracker.dates=days" } }), slug: "x", module: "tracker", tenantId: A, tenantName: "Raya Trade", have: ["strategy", "tracker"], rest: [], personKey: "noran", seat: "smoteam" }).then((r) => r.text());
  check("...and a cookie naming no real grouping or format falls back to Owner and Weeks", /data-value="owner" class="on"/.test(zzz) && /data-value="weeks" class="on"/.test(zzz) && /data-dates="weeks"/.test(zzz));
  const asDays = await serve({ req: new Request("https://smp.example/x/tracker", { headers: { cookie: "smp.tracker.dates=dates" } }), slug: "x", module: "tracker", tenantId: A, tenantName: "Raya Trade", have: ["strategy", "tracker"], rest: [], personKey: "noran", seat: "smoteam" }).then((r) => r.text());
  check("...and the dates cookie is read too — as exact dates the add line reads a day and carries no week picker", /data-dates="dates"/.test(asDays) && !/class="weeks"/.test(asDays) && new RegExp('<button class="when pick" type="button" data-act="due" data-due="' + realThu + '"').test(asDays));
  const searched = await trackerDocument({ slug: "x", tenantId: A, tenantName: "Raya Trade", have: ["strategy", "tracker"], ask: { view: "all", q: "zzz", open: null, group: "owner" }, who: NORAN, today: TODAY });
  check("a search that finds nothing says so and offers the way back", /Nothing matches/.test(searched) && /see all of them/.test(searched));
  const empty = await trackerDocument({ slug: "x", tenantId: B, tenantName: "RHI", have: ["strategy", "tracker"], ask: { view: "week", q: "", open: null, group: "owner" }, who: { personKey: "omar", seat: "super" }, today: TODAY });
  check("an empty client is only the next empty line and one sentence", /Type the first action for RHI/.test(empty) && /Nothing on the list for RHI yet/.test(empty) && !/class="tools"/.test(empty));
  const noDb = await trackerDocument({ slug: "x", tenantId: "not-a-tenant-id", tenantName: "Raya Trade", have: ["strategy", "tracker"], ask: { view: "week", q: "", open: null, group: "owner" }, who: NORAN });
  check("a list that could not be read says so, and is not drawn as empty (§35)", /could not be read/.test(noDb) && !/Nothing on the list/.test(noDb) && !/id="add"/.test(noDb));

  /* ══ §9 · the catalogue ══════════════════════════════════════════════ */
  section("§9 · both tables fenced, and not the platform's");
  const cat = await owner(
    "SELECT c.relname, c.relrowsecurity AS rls, c.relforcerowsecurity AS force, pg_get_expr(p.polqual, p.polrelid) AS q " +
    "FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace LEFT JOIN pg_policy p ON p.polrelid = c.oid AND p.polname = 'tenant_rows' " +
    "WHERE n.nspname = $1 AND c.relname IN ('tracker_actions','tracker_events','library_items')", [SCHEMA]);
  const by = Object.fromEntries(cat.map((r) => [r.relname, r]));
  for (const t of ["tracker_actions", "tracker_events"]) {
    check(t + " has row-level security switched on and FORCED", by[t] && by[t].rls && by[t].force, JSON.stringify(by[t]));
    check(t + "'s policy is IDENTICAL to library_items' (§94.8)", by[t] && by.library_items && by[t].q === by.library_items.q, by[t] && by[t].q);
    check(t + " is not on the platform's own list (§331)", !PLATFORM_TABLES.includes(t));
  }
  const cols = await owner("SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'tracker_actions' ORDER BY ordinal_position", [SCHEMA]);
  check("the action row holds exactly what spec 054 §5 says and no more — the collaborators column is GONE (migration 013)",
    cols.map((c) => c.column_name).join(",") === "tenant_id,id,title,description,owner_key,due,first_due,status,done_at,created_by,created_at,updated_at,extra",
    cols.map((c) => c.column_name).join(","));

  /* ══ §10 · the script, driven ═══════════════════════════════════════
     §8 proved the SERVER; nothing above has ever RUN app.js. A script wired
     to nothing renders a page that answers every markup assertion (§96), so
     the module is served over a real port — the same serve() the route
     calls, bridged from Node's request to a fetch Request — and Chromium
     presses the controls while the DATABASE is read back (§70, §96). */
  section("§10 · the next empty line, pressed in a browser — and every press silent");
  const { createServer } = await import("node:http");
  const srv = createServer(async (rq, rs) => {
    try {
      const chunks = []; for await (const ch of rq) chunks.push(ch);
      const url = "http://smp.test" + rq.url;
      const rest = String(rq.url).split("?")[0].split("/").filter(Boolean).slice(2);
      const req = new Request(url, { method: rq.method, headers: { "Content-Type": rq.headers["content-type"] || "", cookie: rq.headers.cookie || "" },
        body: rq.method === "POST" ? Buffer.concat(chunks) : undefined });
      const res = await serve({ req, slug: "x", module: "tracker", tenantId: A, tenantName: "Raya Trade",
        have: ["strategy", "tracker"], rest, personKey: "noran", seat: "smoteam" });
      rs.writeHead(res.status, Object.fromEntries(res.headers)); rs.end(Buffer.from(await res.arrayBuffer()));
    } catch (e) { rs.writeHead(500); rs.end(String(e)); }
  });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + srv.address().port + "/x/tracker";
  let browser = null;
  try {
    const { chromium } = await import("playwright-core");
    browser = await chromium.launch({ executablePath: process.env.SMP_CHROME || undefined, args: ["--no-sandbox"] });
  } catch (e) { check("a browser to press the controls in (set SMP_CHROME)", false, e.message.split("\n")[0]); }
  if (browser) {
    const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = []; pg.on("pageerror", (e) => errs.push(String(e))); pg.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
    /* A press is silent when the list is swapped in place: the page is
       asked to be idle, and a MARK planted on the window before the first
       press must still be there after the last (§356.12). A reload would
       satisfy every other assertion here — the check's own break puts one
       back after an add and must go red on the mark (§94.5, §113.8). */
    const settle = () => pg.waitForTimeout(350).then(() => pg.waitForLoadState("load"));
    const stayed = () => pg.evaluate("window.__stay === 1");
    await pg.goto(base); await settle();
    if (process.env.SMP_SHOT) await pg.screenshot({ path: process.env.SMP_SHOT, fullPage: true });
    await pg.evaluate("window.__stay = 1");
    check("the mark is really planted, or 'it stayed' proves nothing", await stayed());
    /* THE TWO SETTINGS BEHIND THE DOTS (§356.14): Group by has left the
       row; the menu is hidden until pressed, then names Owner and Weeks as
       what is in force. And the way back sits above the title. */
    /* THE FOUR CARDS ARE ONE HEIGHT AND STAY THERE (§356.16). The fault was
       the third card's own tail taking a second line and pushing all four
       taller, so the page below shifted whenever somebody changed a status —
       which is why the height is measured HERE and again after a status has
       actually been changed, rather than asserted once on a still page. */
    const tileHs = () => pg.evaluate("[...document.querySelectorAll('.strip .tile')].map(e=>Math.round(e.getBoundingClientRect().height)).join(',')");
    /* MEASURED AS SLACK, NEVER AS A HEIGHT (§94.8), and never as "the four
       agree": .strip is a grid, so it stretches every card to the tallest of
       them whatever any of them asked for — an agreement assertion there
       passes on a build with no floor at all (§113.8, found by falsifying).
       What CAN fail is whether the box is HELD OPEN: the distance from the
       last line's bottom to the card's own bottom edge, which is nought on a
       card sized to its content and real on one carrying a floor. */
    const tileSlack = () => pg.evaluate(`[...document.querySelectorAll('.strip .tile')].map(e=>{
      const cs=getComputedStyle(e), last=e.lastElementChild;
      const foot=parseFloat(cs.paddingBottom)+parseFloat(cs.borderBottomWidth);
      return Math.round(e.getBoundingClientRect().bottom-(last.getBoundingClientRect().bottom+foot));
    }).join(',')`);
    check("every card is held open at the taller size rather than hugging its own line",
      (await tileSlack()).split(",").length === 4 && (await tileSlack()).split(",").every((n) => Number(n) > 0), await tileSlack());
    check("...and the due card says the week and no count of its own", (await pg.locator(".strip .tile:nth-child(3) span").innerText()).toLowerCase() === "due this week",
      await pg.locator(".strip .tile:nth-child(3) span").innerText());
    check("the views row carries no Group by select any more, and a three-dots button", (await pg.locator(".gby").count()) === 0 && (await pg.locator("[data-act=settings]").count()) === 1);
    check("the menu is hidden until the dots are pressed", !(await pg.locator(".setmenu").isVisible()));
    await pg.locator("[data-act=settings]").click();
    check("...pressed, it names Owner and Weeks as what is in force, side by side", await pg.locator(".setmenu").isVisible() &&
      (await pg.locator(".setmenu [data-act=set-group].on").getAttribute("data-value")) === "owner" && (await pg.locator(".setmenu [data-act=set-dates].on").getAttribute("data-value")) === "weeks" &&
      (await pg.locator(".setmenu .col").count()) === 2);
    await pg.locator("h2.pt").click();
    check("...and a press elsewhere closes it", !(await pg.locator(".setmenu").isVisible()));
    const backHref = await pg.locator("a.back").getAttribute("href");
    check("the way back sits above the title, naming the client, and goes to the client's platform", backHref === "/x" && (await pg.locator("a.back").innerText()).trim() === "Raya Trade" &&
      (await pg.evaluate("document.querySelector('a.back').getBoundingClientRect().bottom <= document.querySelector('h2.pt').getBoundingClientRect().top")), backHref);
    /* ENTER ADDS, AND THE LINE IS READ BACK OUT OF POSTGRES (§96) — due
       THIS WEEK'S THURSDAY by default (§356.14), the row reading the week in
       WORDS (§356.15) with nothing bold on it. */
    const real = todayIn(), thu = thursdayOf(real);
    /* AT REST THE LINE IS THE PLUS AND THE BOX (§356.16, Islam's B of two
       drawn): the week, the owner, the status and the arrow are invisible and
       THEIR SPACE IS KEPT, so nothing moves under the hand when they arrive.
       Both are asserted — invisible, and the box measured before and after the
       first letter — because visibility alone is satisfied by a build that
       removed them, which is the other option and the one he did not pick. */
    const addBox = (sel) => pg.evaluate("(function(){var e=document.querySelector('" + sel + "');if(!e)return '';var r=e.getBoundingClientRect();return Math.round(r.left)+','+Math.round(r.width)})()");
    const restBox = await addBox(".addrow .tn");
    check("the add line holds its details back until something is typed", !(await pg.locator(".addrow .when").isVisible()) &&
      !(await pg.locator(".addrow .who").isVisible()) && !(await pg.locator(".addrow .st").isVisible()) &&
      !(await pg.locator(".addrow [data-act=add-note]").isVisible()));
    check("...and they are still drawn, so their place is held", (await pg.locator(".addrow .when").count()) === 1 &&
      (await pg.evaluate("document.querySelector('.addrow .when').getBoundingClientRect().width")) > 0);
    await pg.locator("#add").fill("x");
    check("...the first letter brings them back, and nothing moved to make room", (await pg.locator(".addrow .when").isVisible()) &&
      (await pg.locator(".addrow .who").isVisible()) && (await pg.locator(".addrow .st").isVisible()) &&
      (await pg.locator(".addrow [data-act=add-note]").isVisible()) && (await addBox(".addrow .tn")) === restBox,
      restBox + " -> " + (await addBox(".addrow .tn")));
    check("the add line opens on This week in words, owned by me", (await pg.locator(".addrow .when .wk").innerText()) === "This week" &&
      weekWord(real, real) === "This week" &&
      (await pg.locator(".addrow").getAttribute("data-due")) === thu && (await pg.locator(".addrow").getAttribute("data-owner")) === "noran");
    /* THE BOLD WENT WITH THE WORDS (§356.15) — asserted over the WHOLE page,
       because a mark left on one row of one view is exactly what a check
       scoped to one selector would walk past. Its other end is the picker,
       which keeps its mark, asserted below. */
    check("...and no row anywhere on the page marks this week a second time", (await pg.locator(".wk.now").count()) === 0);
    /* THE NOTE IS ASKED FOR (§356.15): the box is not on the line until the
       arrow opens it, and BOTH ENDS are asserted — shut at rest, open on the
       press — or a build that simply deleted the note passes the first half. */
    check("no note box stands on the add line, and the arrow that opens one does", !(await pg.locator("#addnote").isVisible()) &&
      (await pg.locator(".addrow [data-act=add-note]").count()) === 1 &&
      (await pg.locator(".addrow [data-act=add-note]").getAttribute("aria-expanded")) === "false");
    await pg.locator(".addrow [data-act=add-note]").click();
    check("...the arrow opens it, lights, and puts the cursor in it", (await pg.locator("#addnote").isVisible()) &&
      (await pg.evaluate("document.activeElement && document.activeElement.id")) === "addnote" &&
      (await pg.evaluate("document.querySelector('.addrow [data-act=add-note]').classList.contains('on')")) &&
      (await pg.locator(".addrow [data-act=add-note]").getAttribute("aria-expanded")) === "true");
    /* FOLDING EMPTIES IT, and that is the whole rule: a note folded away with
       words still in it would be posted by the next Enter with nothing on the
       screen saying so (§96). */
    await probe("the note box can be typed into once it is open", () => pg.locator("#addnote").fill("something I changed my mind about", { timeout: 4000 }));
    await pg.locator(".addrow [data-act=add-note]").click();
    check("...pressed again it folds AND empties, so nothing unseen can be posted", !(await pg.locator("#addnote").isVisible()) &&
      (await pg.evaluate("document.getElementById('addnote').value")) === "" &&
      !(await pg.evaluate("document.querySelector('.addrow [data-act=add-note]').classList.contains('on')")));
    /* TAB FROM THE ACTION IS THE OTHER DOOR (§61) — and only once the line
       has a name on it, or it would be the one detail the line did not hold
       back (§356.16). */
    await pg.locator("#add").fill("");
    await pg.locator("#add").focus();
    await pg.keyboard.press("Tab");
    check("...Tab on an empty line opens nothing, since the arrow is not there either", !(await pg.locator("#addnote").isVisible()));
    await pg.locator("#add").fill("x");
    await pg.locator("#add").focus();
    await pg.keyboard.press("Tab");
    check("...and Tab from the action opens it too", (await pg.locator("#addnote").isVisible()) &&
      (await pg.evaluate("document.activeElement && document.activeElement.id")) === "addnote");
    await pg.locator("#add").focus();
    check("...while an empty note left behind folds itself, so the line goes back to one row", !(await pg.locator("#addnote").isVisible()));
    /* AND THE ARROW CLOSES AN EMPTY ONE, which is the press that races the
       fold above: focusout fires before the click, so without the guard the
       arrow would find a shut note and open it again — reading as a control
       that does nothing on the one press where it plainly did (§96). */
    await pg.locator(".addrow [data-act=add-note]").click();
    check("...and the arrow opens it once more", await pg.locator("#addnote").isVisible());
    await pg.locator(".addrow [data-act=add-note]").click();
    check("...and closes it again, though it is empty and the focus left it first", !(await pg.locator("#addnote").isVisible()) &&
      !(await pg.evaluate("document.querySelector('.addrow [data-act=add-note]').classList.contains('on')")));
    await pg.locator("#add").fill("Book the room for Thursday");
    await pg.locator("#add").press("Enter"); await settle();
    const born = (await asTenant(A, (c) => listActions(c))).find((r) => r.title === "Book the room for Thursday");
    check("Enter on the line writes the action, owned by me, due this Thursday", !!born && born.ownerKey === "noran" && born.status === "not_started" && born.due === thu && born.firstDue === thu, JSON.stringify(born));
    check("...SILENTLY: the page did not reload", await stayed());
    check("...the line is empty and still under the cursor for the next one",
      (await pg.locator("#add").inputValue()) === "" && (await pg.evaluate("document.activeElement && document.activeElement.id")) === "add");
    const row = '.row[data-id="' + (born && born.id) + '"] ';
    check("...and the new row is on the page, under my own name, reading my first name and This week", (await pg.locator(row).count()) === 1 &&
      /^Noran Essam/.test(await pg.locator('.grp[data-key="noran"]').innerText()) && (await pg.locator(row + ".who .wn").innerText()) === "Noran" &&
      (await pg.locator(row + ".when .wk").innerText()) === "This week" && (await pg.locator(".wk.now").count()) === 0);
    /* textContent, not innerText: the count is uppercased by CSS (§301.6). */
    check("...with the count moved in place", /^\d+ actions on this week$/.test(await pg.locator("#count").textContent()) && +(await pg.locator("#count").textContent()).split(" ")[0] === (await asTenant(A, (c) => listActions(c))).filter((r) => inView(r, "week", NORAN, real)).length, await pg.locator("#count").textContent());
    /* THE ADD LINE TAKES EVERYTHING (§356.14): a note under the action, a
       week picked on the line, an owner picked on the line — nothing posted
       until Enter, then all of it written. The week picked is NEXT week, so
       the row lands under Islam reading "Next week" (§356.15). */
    const nextThu = addDays(thu, 7);
    await pg.locator("#add").fill("Send the outcome to the managers");
    await pg.locator(".addrow [data-act=add-note]").click();
    await probe("the note opens for the line that takes everything", () => pg.locator("#addnote").fill("Ahmed's list first. Copy Noran.", { timeout: 4000 }));
    check("typing lights the line", await pg.evaluate("document.querySelector('.addrow').classList.contains('typing')"));
    await pg.locator(".addrow .when.pick").click();
    const addWeeks = pg.locator(".addrow .weeks");
    check("the week pressed on the line opens the picker — a header, this week marked and bold, No date and a day of my own at the foot", await addWeeks.isVisible() &&
      (await addWeeks.locator(".wh span").allTextContents()).join("|") === "Week|Sun – Thu" &&
      (await addWeeks.locator("button.now.on b").innerText()) === "This week" && (await addWeeks.locator("button:nth-of-type(2) b").innerText()) === "Next week" &&
      (await addWeeks.locator("[data-act=pick-week]").count()) === 7 &&
      (await addWeeks.locator('.wf [data-day=""]').count()) === 1 && (await addWeeks.locator(".wf [data-act=pick-day]").count()) === 1,
      (await addWeeks.locator(".wh span").allTextContents()).join("|"));
    /* AND THE WIDER PICKER STILL FITS (§158: fit, never "and it scrolls").
       The words cost its first column 54 → 86px and the popup 200 → 232, and
       it hangs off the right edge of a cell near the right edge of the page,
       so what is asserted is the BOX against the window at both ends. */
    const pbox = await pg.evaluate("(function(){var e=document.querySelector('.addrow .weeks');if(!e)return null;var r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.right),Math.round(r.width),document.documentElement.clientWidth].join(' ')})()");
    check("...and the wider picker is inside the window, both edges", !!pbox && (() => { const [l, r, w, vw] = pbox.split(" ").map(Number); return l >= 0 && r <= vw && w === 232; })(), pbox);
    /* THE BOLD STAYS IN THE PICKER and only there — the other end of the
       assertion above, which is that no ROW carries one (§94.2). */
    check("...the word is bold on this week's row only, both ends", (await pg.evaluate("getComputedStyle(document.querySelector('.addrow .weeks button.now b')).fontWeight")) === "700" &&
      (await pg.evaluate("getComputedStyle(document.querySelector('.addrow .weeks button:not(.now) b')).fontWeight")) === "400");
    await addWeeks.locator('[data-day="' + nextThu + '"]').click();
    check("picking next week on the line posts nothing yet and the line reads Next week, in the picker's own words", (await pg.locator(".addrow").getAttribute("data-due")) === nextThu &&
      (await pg.locator(".addrow .when .wk").innerText()) === "Next week" && weekWord(nextThu, real) === "Next week" && (await pg.locator(".wk.now").count()) === 0 &&
      !(await asTenant(A, (c) => listActions(c))).some((r) => r.title === "Send the outcome to the managers"));
    await pg.locator(".addrow .who.pick").click();
    await pg.locator(".addrow .team [data-key=islam]").click();
    check("...picking Islam on the line reads Islam, still nothing posted", (await pg.locator(".addrow").getAttribute("data-owner")) === "islam" && (await pg.locator(".addrow .who .wn").innerText()) === "Islam");
    await probe("Enter posts from the note box too", () => pg.locator("#addnote").press("Enter", { timeout: 4000 })); await settle();
    const full = (await asTenant(A, (c) => listActions(c))).find((r) => r.title === "Send the outcome to the managers");
    check("Enter from the note adds it all — next week's Thursday, Islam's, the note kept", !!full && full.due === nextThu && full.firstDue === nextThu && full.ownerKey === "islam" && full.description === "Ahmed's list first. Copy Noran." && await stayed(), JSON.stringify(full));
    const frow = '.row[data-id="' + (full && full.id) + '"] ';
    /* CLEARED means back to the line at rest: empty, the note folded, the
       details held back again, and the week and owner back to their defaults
       — read off the line rather than off the screen, because with nothing
       typed there is deliberately nothing on the screen to read (§356.16). */
    check("...the line is cleared back to This week and me, with the note and the details held back again", (await pg.locator("#add").inputValue()) === "" &&
      (await pg.evaluate("document.getElementById('addnote').value")) === "" && !(await pg.locator("#addnote").isVisible()) &&
      !(await pg.locator(".addrow .when").isVisible()) && !(await pg.locator(".addrow [data-act=add-note]").isVisible()) &&
      (await pg.locator(".addrow").getAttribute("data-due")) === thu && (await pg.locator(".addrow").getAttribute("data-owner")) === "noran" &&
      (await pg.evaluate("document.querySelector('.addrow .when .wk').textContent")) === "This week");
    /* Due NEXT week it is not on This week (inView), so it is read under All. */
    check("...and, due next week, it is not on This week", (await pg.locator(frow).count()) === 0);
    await pg.goto(base + "?view=all"); await settle();
    const frowWk = await probe("Islam's row is on the page under All", () => pg.locator(frow + ".when .wk").innerText({ timeout: 4000 }));
    check("...under All Islam's row reads Next week plain, with no control of mine on it", frowWk === "Next week" &&
      (await pg.locator(".wk.now").count()) === 0 && (await pg.locator(frow + ".when.pick").count()) === 0 && (await pg.locator(frow + ".who.pick").count()) === 0);
    /* THE PILL IS ONE BOX (§356.14): the select on my row and the span on
       Islam's measure the same width, height and font — the fault Islam saw
       was two sizes, so both are measured and compared, never a number. */
    /* NOT THERE reads as "" rather than throwing (§215): a falsification that
       stops a row being made must leave this REPORTING, not dying. */
    const box = (sel) => pg.evaluate("(function(){var e=document.querySelector('" + sel + "');if(!e)return '';var r=e.getBoundingClientRect();var c=getComputedStyle(e);return [e.tagName,Math.round(r.width),Math.round(r.height),c.fontSize,c.fontFamily.split(',')[0]].join(' ')})()");
    const pillSel = await box(row.trim() + " .st"), pillSpan = await box(frow.trim() + " .st"), pillAdd = await box(".addrow .st");
    check("the status pill is one box whether it is a select, a span, or the add line's", pillSel.startsWith("SELECT") && pillSpan.startsWith("SPAN") &&
      pillSel.slice(6) === pillSpan.slice(4) && pillSpan === pillAdd, pillSel + " | " + pillSpan + " | " + pillAdd);
    check("...in the page's own font, never the browser's control font", /system-ui/.test(pillSel) && /11px/.test(pillSel), pillSel);
    await pg.goto(base); await settle();
    await pg.evaluate("window.__stay = 1");
    /* THE TICK is Done; pressed again it is Not started — both ends. And a
       half-typed line in the add box survives the swap (§35, §71.2). */
    await pg.locator("#add").fill("half a line");
    await pg.locator(row + "[data-act=tick]").click(); await settle();
    check("the tick marks it Done in the database", (await asTenant(A, (c) => oneAction(c, born.id))).status === "done");
    check("...the row wears it, and the half-typed line survived the swap", (await pg.locator(row + "[data-act=tick]").getAttribute("aria-checked")) === "true" &&
      (await pg.locator("#add").inputValue()) === "half a line");
    check("...and a Done pill keeps its arrow (the ground is a colour, not the shorthand)", /svg/.test(await pg.evaluate("getComputedStyle(document.querySelector('" + row.trim() + " select.st')).backgroundImage")));
    await pg.locator("#add").fill("");
    await pg.locator(row + "[data-act=tick]").click(); await settle();
    check("the tick again puts it back to Not started", (await asTenant(A, (c) => oneAction(c, born.id))).status === "not_started");
    /* THE STATUS SELECT, on change — and the cards are measured on EITHER SIDE
       OF THIS PRESS, not at two far-apart moments that happen to agree: the
       count on the old card moved with exactly this act, so a measurement taken
       anywhere else proves nothing (§94.5, found by falsifying). */
    const dueWords = () => pg.locator(".strip .tile:nth-child(3) span").innerText();
    const tilesBefore = await tileHs(), wordsBefore = await dueWords();
    await pg.locator(row + "select[data-act=status]").selectOption("in_progress"); await settle();
    check("the status picker writes In progress", (await asTenant(A, (c) => oneAction(c, born.id))).status === "in_progress");
    /* THE WORDS ARE ASSERTED BESIDE THE HEIGHT, because the words are the
       cause: the card grew when its own tail took a second line. A height
       compared alone passes on a build where the tail merely changed from
       "2 not started" to "1 not started" — same two lines, same height, and
       the defect still there (§113.8, found by falsifying). */
    check("...and neither the cards' height nor the due card's words moved with it", (await tileHs()) === tilesBefore && (await dueWords()) === wordsBefore,
      tilesBefore + " / " + wordsBefore + "  ->  " + (await tileHs()) + " / " + (await dueWords()));
    /* THE WEEK ON A ROW: the picker, No date, and a week two ahead — each
       read back out of Postgres as its Thursday. */
    await pg.locator(row + ".when.pick").click();
    check("the week pressed on a row opens its picker with this week marked", await pg.locator(row + ".weeks").isVisible() && (await pg.locator(row + ".weeks button.on b").innerText()) === "This week");
    await pg.locator(row + '.weeks [data-day=""]').click(); await settle();
    check("No date clears the date, and the row says so", (await asTenant(A, (c) => oneAction(c, born.id))).due === null && (await pg.locator(row + ".when").innerText()) === "No date" && await stayed());
    await pg.locator(row + ".when.pick").click();
    await pg.locator(row + '.weeks [data-day="' + addDays(thu, 14) + '"]').click(); await settle();
    const twoAhead = await asTenant(A, (c) => oneAction(c, born.id));
    check("a week two ahead is written as its Thursday, the first date staying where it was — and the row leaves This week", twoAhead.due === addDays(thu, 14) && twoAhead.firstDue === thu &&
      (await pg.locator(row).count()) === 0 && await stayed(), JSON.stringify(twoAhead));
    await pg.goto(base + "?view=all"); await settle();
    await pg.evaluate("window.__stay = 1");
    check("...under All it reads that week's place in its MONTH, which is what the third week on is", (await pg.locator(row + ".when .wk").innerText()) === weekWord(addDays(thu, 14), real) &&
      /^W[1-5] [A-Z][a-z]{2}$/.test(weekWord(addDays(thu, 14), real)) && (await pg.locator(".wk.now").count()) === 0, weekWord(addDays(thu, 14), real));
    /* EXACT DATES, from the dots: the rows read days, the choice is
       remembered, and the DATE BOX STAYS WHEN FOCUS LEAVES IT (§356.14) —
       which is what the calendar popup does, and where the pick was lost. */
    await pg.locator("[data-act=settings]").click();
    await pg.locator('.setmenu [data-act=set-dates][data-value="dates"]').click(); await settle();
    check("Exact dates: the row reads the day, drawn in place", (await pg.locator(row + "[data-act=due]").innerText()) === readableDay(addDays(thu, 14), real) && await stayed() && (await pg.locator(row + ".weeks").count()) === 0);
    await pg.goto(base + "?view=all"); await settle();
    check("...and the next visit still reads days (the cookie)", (await pg.locator(row + "[data-act=due]").innerText()) === readableDay(addDays(thu, 14), real) && (await pg.locator("body").getAttribute("data-dates")) === "dates");
    await pg.evaluate("window.__stay = 1");
    const lastWeek = addDays(weekOf(real).from, -3);   /* last week's Thursday */
    await pg.locator(row + "[data-act=due]").click();
    check("the day becomes a date box in place", (await pg.locator(row + "input.dt").count()) === 1);
    await pg.evaluate("document.querySelector('input.dt').blur()"); await pg.waitForTimeout(400);
    check("...and the box STAYS when focus leaves it — the calendar popup is focus leaving it (§356.14)", (await pg.locator(row + "input.dt").count()) === 1);
    /* On the build that throws the box away (the break), open it again so
       the rest of the run still reports rather than dying here (§215). */
    if (!(await pg.locator(row + "input.dt").count())) await pg.locator(row + "[data-act=due]").click();
    await pg.locator(row + "input.dt").fill(lastWeek); await settle();
    const dated = await asTenant(A, (c) => oneAction(c, born.id));
    check("...and a day chosen is written", dated.due === lastWeek && dated.firstDue === thu, JSON.stringify(dated));
    const when = await pg.locator(row + "[data-act=due]").innerText();
    /* Its FIRST date was this week (given at birth), so it is late by a day
       and carried nought: the word alone, then the day (§5's rule). */
    check("a date last week reads 'Late · <day>' — carried from the FIRST date, which was this week — and never 'carried'", when === "Late · " + readableDay(lastWeek, real) && !/carried/.test(when), when);
    await pg.locator(row + "[data-act=due]").click();
    await pg.locator(row + "input.dt").press("Escape");
    check("Escape puts the word back and writes nothing", (await pg.locator(row + "[data-act=due]").count()) === 1 &&
      (await asTenant(A, (c) => oneAction(c, born.id))).due === lastWeek);
    await pg.locator(row + "[data-act=due]").click();
    await pg.locator("h2.pt").click();
    check("a press elsewhere on the page puts the word back too", (await pg.locator(row + "input.dt").count()) === 0 && (await pg.locator(row + "[data-act=due]").count()) === 1);
    await pg.locator("[data-act=settings]").click();
    await pg.locator('.setmenu [data-act=set-dates][data-value="weeks"]').click(); await settle();
    check("back to weeks, a late row says only how late — the word, no day", (await pg.locator(row + ".when").innerText()) === "Late" && await stayed(), await pg.locator(row + ".when").innerText());
    /* RENAME IN PLACE: a double-click on the name, Enter renames; Escape
       puts the name back and writes nothing; a single click does nothing. */
    await pg.locator(row + ".t").click();
    check("a single click on the name opens no box", (await pg.locator(row + "input.ttl").count()) === 0);
    await pg.locator(row + ".t").dblclick();
    check("a double-click turns the name into a box in place", (await pg.locator(row + "input.ttl").count()) === 1);
    await pg.locator(row + "input.ttl").fill("Book the big room for Thursday");
    await pg.locator(row + "input.ttl").press("Enter"); await settle();
    check("Enter renames it, in the database and on the row", (await asTenant(A, (c) => oneAction(c, born.id))).title === "Book the big room for Thursday" &&
      (await pg.locator(row + ".t").innerText()) === "Book the big room for Thursday");
    await pg.locator(row + ".t").dblclick();
    await pg.locator(row + "input.ttl").fill("zzz");
    await pg.locator(row + "input.ttl").press("Escape");
    check("Escape puts the name back and writes nothing", (await pg.locator(row + ".t").innerText()) === "Book the big room for Thursday" &&
      (await asTenant(A, (c) => oneAction(c, born.id))).title === "Book the big room for Thursday");
    /* THE ARROW opens the row in place for its notes and history, on the
       address, and folds it again; no Title box; the history is small type
       in a box that scrolls — measured as PAINT, not read off a class. */
    await pg.locator(row + "[data-act=more]").click(); await settle();
    check("the arrow opens the row in place, on the address, without a reload", pg.url().includes("open=" + born.id) &&
      (await pg.locator(".open textarea[data-act=notes]").count()) === 1 && (await pg.locator(row + "[data-act=more]").getAttribute("aria-expanded")) === "true" && await stayed(), pg.url());
    check("...with no Title box and no With", (await pg.locator(".open input.ttl").count()) === 0 && !/With/.test(await pg.locator(".open").innerText()));
    const histCss = await pg.evaluate("(function(){var h=document.querySelector('.hist');var c=getComputedStyle(h);return c.fontSize+' '+c.overflowY+' '+c.maxHeight})()");
    check("the history is small type in a box that scrolls", histCss === "11.5px auto 118px", histCss);
    await pg.locator(".open textarea[data-act=notes]").fill("Ask Facilities first.");
    await pg.locator("#add").focus(); await settle();
    check("leaving the notes box writes the notes", (await asTenant(A, (c) => oneAction(c, born.id))).description === "Ask Facilities first.");
    check("...and the row is still open afterwards, the notes still in the box", (await pg.locator(".open textarea[data-act=notes]").inputValue()) === "Ask Facilities first.");
    await pg.locator(row + "[data-act=more]").click(); await settle();
    check("the arrow again folds it, and the address forgets it", (await pg.locator(".open").count()) === 0 && !pg.url().includes("open=") && await stayed(), pg.url());
    /* GROUP BY, from the dots: drawn again in place, remembered by this
       browser (a cookie the page reads on the next visit). */
    await pg.locator("[data-act=settings]").click();
    await pg.locator('.setmenu [data-act=set-group][data-value="status"]').click(); await settle();
    const heads = async () => pg.locator(".grp").allInnerTexts().then((a) => a.map((t) => t.replace(/\s*\d+$/, "").trim()));
    check("grouped by Status the headings are the three words, drawn in place", (await heads()).every((h) => Object.values(STATUS_WORD).includes(h)) && (await heads()).length >= 1 && await stayed(), (await heads()).join("|"));
    await pg.goto(base); await settle();
    await pg.locator("[data-act=settings]").click();
    check("...and the next visit opens grouped the same way (the cookie), the menu saying so", (await pg.locator(".setmenu [data-act=set-group].on").getAttribute("data-value")) === "status" && (await heads()).every((h) => Object.values(STATUS_WORD).includes(h)));
    await pg.locator('.setmenu [data-act=set-group][data-value="owner"]').click(); await settle();
    check("...and back to Owner", /Noran Essam/.test((await heads()).join("|")));
    if (full) await asTenant(A, (c) => deleteAction(c, full.id));   /* §215: a break that never made it must not kill the rest */
    await pg.evaluate("window.__stay = 1");
    /* THE OWNER'S NAME opens the office on this client, first names only;
       picking one hands the action on — and then the old owner has no
       control left on that row (both ends, §61). */
    await pg.locator(row + ".who.pick").click();
    const team = pg.locator(row + ".team");
    /* COMPACT (§356.16): the width was a FLOOR in the stylesheet rather than
       anything the names needed, so what is asserted is that the floor is gone
       and the box is what its widest name needs plus the space the stylesheet
       reserves around it — an agreement worked out from the page's own
       padding, never a pixel count somebody typed (§94.8). */
    const teamFit = () => pg.evaluate("(function(){var t=document.querySelector('.team');if(!t)return null;var c=getComputedStyle(t);"
      + "var w=Math.max(...[...t.querySelectorAll('button')].map(b=>b.scrollWidth));var bc=getComputedStyle(t.querySelector('button'));"
      + "var slack=parseFloat(c.paddingLeft)+parseFloat(c.paddingRight)+parseFloat(c.borderLeftWidth)+parseFloat(c.borderRightWidth);"
      + "return {floor:c.minWidth,box:Math.round(t.getBoundingClientRect().width),need:Math.round(w+slack),"
      + "row:Math.round(t.querySelector('button').getBoundingClientRect().height),pad:bc.paddingTop};})()");
    check("pressing my name opens the team, first names only and no heading", await team.isVisible() &&
      (await team.locator("button").allInnerTexts()).join("|") === "Islam|Noran|Omar" && (await pg.locator(row + ".who.pick").getAttribute("aria-expanded")) === "true",
      (await team.locator("button").allInnerTexts()).join("|"));
    const fit = await teamFit();
    check("...and the list is no wider than its longest name needs — the floor in the stylesheet is gone", !!fit &&
      (fit.floor === "0px" || fit.floor === "auto") && fit.box === fit.need, JSON.stringify(fit));
    check("...with rows short enough to be compact and tall enough to press", !!fit && fit.row <= 30 && fit.row >= 24, fit && fit.row);
    await pg.locator("h2.pt").click();
    check("a click elsewhere closes it and changes nothing", !(await team.isVisible()) && (await asTenant(A, (c) => oneAction(c, born.id))).ownerKey === "noran");
    await pg.locator(row + ".who.pick").click();
    await team.locator('button[data-key="islam"]').click(); await settle();
    const handed = await asTenant(A, (c) => oneAction(c, born.id));
    check("picking Islam hands the action to him, silently", handed.ownerKey === "islam" && await stayed(), JSON.stringify(handed));
    check("...the row moves under Islam and reads his first name", (await pg.locator('.grp[data-key="islam"] ~ ' + row.trim()).count()) === 1 && (await pg.locator(row + ".who").innerText()) === "Islam");
    check("...and I, no longer its owner, have no control left on it — the name is plain, the tick is off, the name will not rename",
      (await pg.locator(row + ".who.pick").count()) === 0 && (await pg.locator(row + "[data-act=tick]").count()) === 0 && (await pg.locator(row + ".t[data-rename]").count()) === 0);
    await asTenant(A, (c) => setFields(c, born.id, { ownerKey: "noran" }));
    await pg.goto(base); await settle();
    await pg.evaluate("window.__stay = 1");
    /* DELETE asks in place — No keeps it, Yes removes it (§95, §273.3). */
    await pg.locator(row + "[data-act=more]").click(); await settle();
    check("the question is not drawn until Delete is pressed", !(await pg.locator(".open .sure").isVisible()));
    await pg.locator(".open [data-act=delete-ask]").click();
    check("Delete asks first, in the row, and is not a browser dialog", await pg.locator(".open .sure").isVisible());
    await pg.locator(".open [data-act=delete-no]").click();
    check("No keeps it", (await asTenant(A, (c) => oneAction(c, born.id))) !== null && !(await pg.locator(".open .sure").isVisible()));
    await pg.locator(".open [data-act=delete-ask]").click();
    await pg.locator(".open [data-act=delete]").click(); await settle();
    check("Yes deletes it and the list is drawn without it, the address forgetting the row", (await asTenant(A, (c) => oneAction(c, born.id))) === null && !pg.url().includes("open=") && (await pg.locator(row).count()) === 0 && await stayed(), pg.url());
    check("no page error from any of it", errs.length === 0, errs.join(" | "));
    await browser.close();
  }
  srv.close();

  await owner("DELETE FROM tenants WHERE id = ANY($1)", [[A, B]]);
  await owner("DELETE FROM users WHERE email LIKE $1", [stamp + "-%"]);
} catch (e) {
  failed = true;
  console.log("\n  DIED: " + (e && e.stack || e));
} finally {
  await pool.end().catch(() => {});
  await appPool.end().catch(() => {});
}

console.log("\n" + ok + " passed, " + bad.length + " failed" + (failed ? " — and the run DIED, which is a failure of its own (§215)" : ""));
process.exit(bad.length || failed ? 1 : 0);
