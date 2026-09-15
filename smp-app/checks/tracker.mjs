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
     SMP_BREAK=owner-anyone   node checks/tracker.mjs   # must go red      */
import pg from "pg";
import { usePools } from "../lib/db.ts";
import { SCHEMA } from "../db/schema-name.mjs";
import { PLATFORM_TABLES } from "../lib/schema-check.ts";
import { serve } from "../modules/tracker/index.ts";
import { initials, trackerDocument } from "../modules/tracker/page.ts";
import {
  STATUSES, STATUS_WORD, VIEWS, isStatus, isView, isOffice, calendarDay, addDays, weekday, weekOf, isLate, carriedWeeks,
  readableDay, weekLabel, inView, summary, mayChange, mayOwn, shape, oneLine,
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
check("initials are the first two words, and a lone word gives one letter", initials("Islam Saadany") === "IS" && initials("Noran Essam") === "NE" && initials("Madonna") === "M");
check("a title pasted over lines comes back as one line", oneLine("Chase\n  Finance") === "Chase Finance");

/* ══ §2 · the views, and who may do what ══════════════════════════════ */
section("§2 · the four views, the strip, and who may do what");
const mk = (o) => shape({ id: o.id || "x", title: "t", description: "", owner_key: o.owner || "islam", collaborators: o.with || [],
  due: o.due || null, first_due: o.first || o.due || null, status: o.status || "not_started", done_day: o.doneDay || null, created_by: "islam" });
const ME = { personKey: "noran", seat: "smoteam" }, SUPER = { personKey: "islam", seat: "super" }, OTHER = { personKey: "omar", seat: "smoteam" };
const rows = [
  mk({ id: "a", owner: "islam", due: "2026-09-14" }),                       // late, this week
  mk({ id: "b", owner: "noran", due: "2026-09-03", status: "in_progress" }), // late, carried
  mk({ id: "c", owner: "islam", due: "2026-09-17", with: ["noran"] }),       // due Thu
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
check("Mine is what I own OR am on", ids("mine", ME) === "bcdf", ids("mine", ME));
check("...and a different me reads a different list", ids("mine", OTHER) === "eg", ids("mine", OTHER));
const s = summary(rows, TODAY);
check("the strip: 5 open · 2 late · 2 due this week (2 not started — f is done, so it is not owed) · 1 done this week",
  s.open === 5 && s.late === 2 && s.dueWeek === 2 && s.dueWeekNotStarted === 2 && s.doneWeek === 1, JSON.stringify(s));
check("the owner may change the action; a collaborator may; a stranger may not; the Super user may",
  mayChange(rows[2], SUPER) && mayChange(rows[2], ME) && !mayChange(rows[2], OTHER) && mayChange(rows[2], { personKey: "hana", seat: "super" }));
check("only the owner or the Super user may hand it over — a collaborator may NOT",
  mayOwn(rows[2], { personKey: "islam", seat: "smoteam" }) && !mayOwn(rows[2], ME) && mayOwn(rows[2], { personKey: "hana", seat: "super" }));
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
  const d6 = await asTenant(A, (c) => setFields(c, a1.id, { title: "Chase Finance", description: "  Nineteen of 26 entered.\n\n ", collaborators: ["islam", "islam", ""] }));
  check("the title, the notes and who else all write; who else is de-duplicated", d6.title === "Chase Finance" && d6.description === "Nineteen of 26 entered." && d6.collaborators.join() === "islam", JSON.stringify(d6));
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
  check("the page ends in the next empty line, and the line is the person's own", /id="add"/.test(page.text) && /title="Noran Essam">NE</.test(page.text));
  check("the late word is on the row that is late", /Late · /.test(page.text) || !/class="row/.test(page.text));
  check("nothing on it is inline script — the policy would silence it", !/<script>|onclick=/i.test(page.text) && /app\.js"><\/script>/.test(page.text));
  const client = await call(A, HEND, [], null);
  check("the client's own person is turned away with a sentence, not a page", client.status === 403 && /The Internal Tracker is the office/.test(client.text) && !/id="add"/.test(client.text), String(client.status));
  check("...and at the api too, not only on the page (§42)", (await call(A, HEND, ["api"], { act: "add", title: "sneak" })).status === 403);
  check("somebody with no membership at all is turned away", (await call(A, { personKey: null, seat: null }, [], null)).status === 403);
  const js = await call(A, NORAN, ["app.js"], null);
  check("the script is served by the module itself, as script", js.status === 200 && /fetch\(API/.test(js.text));
  const off = await call(A, NORAN, ["nothing-here"], null);
  check("a word the module does not draw comes back to the list", off.status === 302 && off.to.endsWith("/x/tracker"), off.status + " " + off.to);
  check("GET at the api is not a write", (await call(A, NORAN, ["api"], null)).status === 405);

  const added = await call(A, NORAN, ["api"], { act: "add", title: "Walk Hend through Reporting" });
  check("Enter on the line adds it under me", added.j && added.j.ok === true && !!added.j.id, added.text);
  const mine = await asTenant(A, (c) => oneAction(c, added.j.id));
  check("...owned by me, Not started, no date", mine.ownerKey === "noran" && mine.status === "not_started" && mine.due === null);
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
  check("the owner puts somebody on it", (await call(A, NORAN, ["api"], { act: "collab", id: added.j.id, collaborators: ["omarA"] })).j.ok === true &&
    (await asTenant(A, (c) => oneAction(c, added.j.id))).collaborators.join() === "omarA");
  check("...and now they may change it", (await call(A, OMAR, ["api"], { act: "status", id: added.j.id, status: "done" })).j.ok === true);
  check("...but may NOT hand it over or delete it", (await call(A, OMAR, ["api"], { act: "owner", id: added.j.id, ownerKey: "omarA" })).status === 403 &&
    (await call(A, OMAR, ["api"], { act: "delete", id: added.j.id })).status === 403);
  check("the owner hands it over, and leaves the new owner's name off 'with'", (await call(A, NORAN, ["api"], { act: "owner", id: added.j.id, ownerKey: "omarA" })).j.ok === true &&
    (await asTenant(A, (c) => oneAction(c, added.j.id))).collaborators.length === 0);
  check("an action B's office cannot see cannot be written by B's server either", (await call(B, { personKey: "omar", seat: "super" }, ["api"], { act: "delete", id: added.j.id })).status === 404);
  check("the owner deletes it", (await call(A, OMAR, ["api"], { act: "delete", id: added.j.id })).j.ok === true && (await asTenant(A, (c) => oneAction(c, added.j.id))) === null);
  const opened = await call(A, NORAN, [], null).then(() => trackerDocument({ slug: "x", tenantId: A, tenantName: "Raya Trade", have: ["strategy", "tracker"], ask: { view: "all", q: "", open: a1.id }, who: NORAN, today: TODAY }));
  check("an opened row shows its notes and its history in place", /class="open"/.test(opened) && /Nineteen of 26 entered\./.test(opened) && /created it, owner/.test(opened));
  check("...with Delete behind a question, never a browser dialog", /Delete this action\?/.test(opened) && !/confirm\(/.test(opened));
  const searched = await trackerDocument({ slug: "x", tenantId: A, tenantName: "Raya Trade", have: ["strategy", "tracker"], ask: { view: "all", q: "zzz", open: null }, who: NORAN, today: TODAY });
  check("a search that finds nothing says so and offers the way back", /Nothing matches/.test(searched) && /see all of them/.test(searched));
  const empty = await trackerDocument({ slug: "x", tenantId: B, tenantName: "RHI", have: ["strategy", "tracker"], ask: { view: "week", q: "", open: null }, who: { personKey: "omar", seat: "super" }, today: TODAY });
  check("an empty client is only the next empty line and one sentence", /Type the first action for RHI/.test(empty) && /Nothing on the list for RHI yet/.test(empty) && !/class="tools"/.test(empty));
  const noDb = await trackerDocument({ slug: "x", tenantId: "not-a-tenant-id", tenantName: "Raya Trade", have: ["strategy", "tracker"], ask: { view: "week", q: "", open: null }, who: NORAN });
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
  check("the action row holds exactly what spec 054 §5 says and no more",
    cols.map((c) => c.column_name).join(",") === "tenant_id,id,title,description,owner_key,collaborators,due,first_due,status,done_at,created_by,created_at,updated_at,extra",
    cols.map((c) => c.column_name).join(","));

  /* ══ §10 · the script, driven ═══════════════════════════════════════
     §8 proved the SERVER; nothing above has ever RUN app.js. A script wired
     to nothing renders a page that answers every markup assertion (§96), so
     the module is served over a real port — the same serve() the route
     calls, bridged from Node's request to a fetch Request — and Chromium
     presses the controls while the DATABASE is read back (§70, §96). */
  section("§10 · the next empty line, pressed in a browser");
  const { createServer } = await import("node:http");
  const srv = createServer(async (rq, rs) => {
    try {
      const chunks = []; for await (const ch of rq) chunks.push(ch);
      const url = "http://smp.test" + rq.url;
      const rest = String(rq.url).split("?")[0].split("/").filter(Boolean).slice(2);
      const req = new Request(url, { method: rq.method, headers: { "Content-Type": rq.headers["content-type"] || "" },
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
    const settle = () => pg.waitForLoadState("load").then(() => pg.waitForTimeout(150));
    await pg.goto(base); await settle();
    /* ENTER ADDS, AND THE LINE IS READ BACK OUT OF POSTGRES (§96). */
    await pg.locator("#add").fill("Book the room for Thursday");
    await pg.locator("#add").press("Enter"); await settle();
    const born = (await asTenant(A, (c) => listActions(c))).find((r) => r.title === "Book the room for Thursday");
    check("Enter on the line writes the action, owned by me", !!born && born.ownerKey === "noran" && born.status === "not_started", JSON.stringify(born));
    check("...the page is read again and the line is empty and focused for the next one",
      (await pg.locator("#add").inputValue()) === "" && (await pg.evaluate("document.activeElement && document.activeElement.id")) === "add");
    check("...and the new row is on the page", (await pg.locator('.row[data-id="' + born.id + '"]').count()) === 1);
    const row = '.row[data-id="' + born.id + '"] ';
    /* THE TICK is Done; pressed again it is Not started — both ends. */
    await pg.locator(row + "[data-act=tick]").click(); await settle();
    check("the tick marks it Done in the database", (await asTenant(A, (c) => oneAction(c, born.id))).status === "done");
    check("...and the row wears it", (await pg.locator(row + "[data-act=tick]").getAttribute("aria-checked")) === "true");
    await pg.locator(row + "[data-act=tick]").click(); await settle();
    check("the tick again puts it back to Not started", (await asTenant(A, (c) => oneAction(c, born.id))).status === "not_started");
    /* THE STATUS SELECT, on change. */
    await pg.locator(row + "select[data-act=status]").selectOption("in_progress"); await settle();
    check("the status picker writes In progress", (await asTenant(A, (c) => oneAction(c, born.id))).status === "in_progress");
    /* THE DATE, in place: the word becomes a date box, a change posts. */
    await pg.locator(row + "[data-act=due]").click();
    check("the date becomes a date box in place", (await pg.locator(row + "input.dt").count()) === 1);
    /* fill() fires the box's own change, which posts and reloads — a second
       dispatched change here waited 30s on a box that was already gone. */
    await pg.locator(row + "input.dt").fill("2026-09-17"); await settle();
    const dated = await asTenant(A, (c) => oneAction(c, born.id));
    check("...and the date is written, first date with it", dated.due === "2026-09-17" && dated.firstDue === "2026-09-17", JSON.stringify(dated));
    await pg.locator(row + "[data-act=due]").click();
    await pg.locator(row + "input.dt").press("Escape");
    check("Escape puts the word back and writes nothing", (await pg.locator(row + "[data-act=due]").count()) === 1 &&
      (await asTenant(A, (c) => oneAction(c, born.id))).due === "2026-09-17");
    /* THE OPENED ROW: notes save on leaving the box, and only when changed. */
    await pg.locator(row + ".t a").click(); await settle();
    check("the title opens the row in place, on the address", pg.url().includes("open=" + born.id) && (await pg.locator(".open textarea[data-act=notes]").count()) === 1, pg.url());
    await pg.locator(".open textarea[data-act=notes]").fill("Ask Facilities first.");
    await pg.locator(".open input[data-act=rename]").focus(); await pg.waitForTimeout(300);
    check("leaving the notes box writes the notes", (await asTenant(A, (c) => oneAction(c, born.id))).description === "Ask Facilities first.");
    await pg.locator(".open input[data-act=rename]").fill("Book the big room for Thursday");
    await pg.locator(".open input[data-act=rename]").press("Enter"); await settle();
    check("Enter on the title renames it", (await asTenant(A, (c) => oneAction(c, born.id))).title === "Book the big room for Thursday");
    /* DELETE asks in place — No keeps it, Yes removes it (§95, §273.3). */
    /* BOTH ENDS: the question is NOT on the page until Delete is pressed —
       a `.sure` drawn open all along passes "it asks first" perfectly. Its
       first run found exactly that: the span's own display:flex outranked
       the browser's [hidden]. */
    check("the question is not drawn until Delete is pressed", !(await pg.locator(".open .sure").isVisible()));
    await pg.locator(".open [data-act=delete-ask]").click();
    check("Delete asks first, in the row, and is not a browser dialog", await pg.locator(".open .sure").isVisible());
    await pg.locator(".open [data-act=delete-no]").click();
    check("No keeps it", (await asTenant(A, (c) => oneAction(c, born.id))) !== null && !(await pg.locator(".open .sure").isVisible()));
    await pg.locator(".open [data-act=delete-ask]").click();
    await pg.locator(".open [data-act=delete]").click(); await settle();
    check("Yes deletes it and lands back on the list", (await asTenant(A, (c) => oneAction(c, born.id))) === null && !pg.url().includes("open="), pg.url());
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
