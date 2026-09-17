/* ── THE INTERNAL TRACKER — the rules, and the rows (spec 054) ────────────
   The office's weekly list for ONE client: what an action is, which week it
   belongs to, when it is late, and how the two tables are read and written.
   Everything a page or the check has to agree about is here once (§53.5).

   THE WEEK IS SUNDAY TO THURSDAY (decision 8): *this week* is the days
   somebody is at their desk, so a Friday or a Saturday belongs to the week
   that FOLLOWS it, never to the one that just ended.

   NOTHING RUNS ON A CLOCK (§97.5). Late and carried are worked out when a
   page is read, from the due date and the date it was FIRST given — so a
   reschedule cannot reset the carried count, and nothing has to wake the
   platform up. Every date here is a CALENDAR DAY spelt YYYY-MM-DD and
   compared as a string, which is exact for that spelling; today is read in
   the team's own zone, named once, so a list read at 23:30 in Cairo is not
   already tomorrow's.

   THE OFFICE ROWS are the register's people who hold a seat on this client
   (`tenant_users`, §338, §339) — the consultants, already on every register.
   An action's owner is one of them BY RULE (decision 5), asked of the server
   and not only of the picker (§42).

   ONE ACTION, ONE OWNER (§356.11). Islam: "no need for the 'with' part for
   collaborators it's a simple task management thing." So an action names
   nobody but its owner, migration 013 drops the column, and the two rules
   spec 054 §6 kept apart — change it, hand it on — collapse into ONE: the
   owner or the client's Super user. Two functions with one answer would be
   §94's drift the day one is widened, so there is one (§53.5). */
import { createRequire } from "node:module";
import type { PoolClient } from "pg";

/* THE REGISTER'S OWN NAME RULE, never a second one (§53.5, §130.7): a first
   name is the first NAME, and a particle is not a name — "Abd El Moniem" is
   one word of somebody's name, not three. */
const R = createRequire(import.meta.url)("./rules.cjs") as { nameWords: (name: string, n: number) => string };

type Q = { query: PoolClient["query"] };
const str = (v: unknown) => (v == null ? "" : String(v));
const brk = () => (typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "");

/* ══ vocabulary ═══════════════════════════════════════════════════════ */
export const STATUSES = ["not_started", "in_progress", "done"] as const;
export type Status = (typeof STATUSES)[number];
/* The product's own three words (§300), so the tracker and the plan never
   say one state two ways. */
export const STATUS_WORD: Record<Status, string> = { not_started: "Not started", in_progress: "In progress", done: "Done" };
export function isStatus(s: unknown): s is Status { return typeof s === "string" && (STATUSES as readonly string[]).includes(s); }

export const OFFICE_SEATS = ["super", "smoteam"] as const;
export function isOffice(seat: unknown): boolean { return typeof seat === "string" && (OFFICE_SEATS as readonly string[]).includes(seat); }

export const VIEWS = ["week", "all", "mine", "undated"] as const;
export type View = (typeof VIEWS)[number];
export const VIEW_WORD: Record<View, string> = { week: "This week", all: "All", mine: "Mine", undated: "Undated" };
export function isView(s: unknown): s is View { return typeof s === "string" && (VIEWS as readonly string[]).includes(s); }

/* HOW THE LIST IS GROUPED IS A CHOICE (§356.11, loosening decision 6 from
   "by owner and nothing else" to "by owner unless you choose otherwise"):
   Owner is how it opens; Status groups into the three words; Due date groups
   by the day, soonest first and the undated last; None is one flat list in
   the order the rows already have. Remembered on the BROWSER (a cookie the
   page reads), never stored on the client, so two of the office read one
   list two ways. */
export const GROUPS = ["owner", "status", "due", "none"] as const;
export type Group = (typeof GROUPS)[number];
export const GROUP_WORD: Record<Group, string> = { owner: "Owner", status: "Status", due: "Due date", none: "None" };
export function isGroup(s: unknown): s is Group { return typeof s === "string" && (GROUPS as readonly string[]).includes(s); }
export const GROUP_COOKIE = "smp.tracker.group";

/* HOW A DATE IS READ AND SET IS A CHOICE TOO (Islam, 2026-09-16: "the due
   dates default should be the weeks not the days"): Weeks is how the page
   opens — a row reads its week's number in the year, W38, this week's in
   bold, and picking a week stores that week's THURSDAY; Exact dates is the
   day, as the page drew it before. A browser's choice like the grouping,
   never the client's data: the stored date is a day either way, so two of
   the office reading one list two ways read one truth. */
export const FORMATS = ["weeks", "dates"] as const;
export type Format = (typeof FORMATS)[number];
export const FORMAT_WORD: Record<Format, string> = { weeks: "Weeks", dates: "Exact dates" };
export function isFormat(s: unknown): s is Format { return typeof s === "string" && (FORMATS as readonly string[]).includes(s); }
export const FORMAT_COOKIE = "smp.tracker.dates";
/* How many weeks ahead the picker offers, this week included. */
export const WEEKS_AHEAD = 6;

export const TITLE_MAX = 200;
export const NOTES_MAX = 5000;
export const oneLine = (v: unknown): string => str(v).replace(/\s+/g, " ").trim();
export const trimmed = (v: unknown): string => str(v).replace(/[ \t]+\n/g, "\n").trim();

/* ══ days and weeks ═══════════════════════════════════════════════════ */
export const TIME_ZONE = "Africa/Cairo";
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function calendarDay(v: unknown): string | null {
  const s = str(v).trim();
  if (!DAY.test(s)) return null;
  const d = toDate(s);
  return dayOf(d) === s ? s : null;   /* 2026-02-31 rolls over and is refused */
}
function toDate(day: string): Date {
  const m = DAY.exec(day)!;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}
function dayOf(d: Date): string {
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
}
export function addDays(day: string, n: number): string {
  const d = toDate(day);
  d.setUTCDate(d.getUTCDate() + n);
  return dayOf(d);
}
/* 0 is Sunday, as the week starts. */
export function weekday(day: string): number { return toDate(day).getUTCDay(); }

export function todayIn(now: Date = new Date(), zone: string = TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/* The Sunday-to-Thursday week a day belongs to. A Friday or a Saturday is
   NEXT week's (decision 8): the week that just ended is over, and work due
   then reads as the coming week's. */
export type Week = { from: string; to: string };
export function weekOf(day: string): Week {
  const wd = weekday(day);
  const from = addDays(day, wd >= 5 ? 7 - wd : -wd);
  return { from, to: addDays(from, 4) };
}

/* A WEEK IS STORED AS ITS THURSDAY (Islam: "setting the week should default
   to thursday of this week") — the last working day of the week it names,
   so late and carried go on being worked out from a day exactly as before. */
export function thursdayOf(day: string): string { return weekOf(day).to; }
const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* THE WEEK'S NUMBER IN THE YEAR is the ISO week holding its Thursday — ISO
   numbers weeks by their Thursday too, so a Sunday-to-Thursday week and the
   calendar's own numbering never disagree about which week this is. */
export function weekNumber(day: string): number {
  const thu = toDate(thursdayOf(day));
  const jan4 = new Date(Date.UTC(thu.getUTCFullYear(), 0, 4));
  const wk1 = new Date(jan4); wk1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7));
  return Math.floor((thu.getTime() - wk1.getTime()) / 86400000 / 7) + 1;
}
/* THE WEEK IN WORDS (§356.15, amended §356.16). Islam, of the built tracker:
   "in the view of the tasks don't write the week number write this week and
   next week ... and maybe when we are out of the next we can write the week
   number" — and then, of that number: "for the weeks after this week and next
   week to have it W1 Oct or W3 Dec". So two weeks have a word and every week
   after them is ITS PLACE IN ITS MONTH rather than its place in the year: the
   year's 40th week means nothing to anybody planning, and "the first week of
   October" is how the work is actually talked about.
   WHICH MONTH A WEEK BELONGS TO IS ALREADY ANSWERED: a week is stored as its
   THURSDAY (thursdayOf), so the month is the Thursday's — the week running
   27 Sep – 1 Oct is W1 Oct. That is one rule rather than a second one about
   straddling months, and the days are printed beside the word in the picker
   and in every grouped heading, so nobody has to work it out.
   THE WEEK BEFORE THIS ONE HAS NO WORD, AND HIS OWN EARLIER DECISION IS WHY:
   an OPEN action due in a past week is LATE, so it reads Late / Late 1 w /
   Late 2 w (lateWord) and never reaches this function at all — "Previous
   week" could only ever appear in place of those, and it would take the alarm
   with it. Where a past week does reach this — a list GROUPED by its due week
   — it falls through to the number, which is the honest answer there.
   TODAY IS REQUIRED, NEVER OPTIONAL: a caller that forgot it would silently
   be handed numbers back, which is this fault wearing a green tick (§93). */
export function weekWord(day: string, today: string): string {
  if (brk() === "week-numbers") return "W" + weekNumber(day);   /* §356.15 put back */
  if (sameWeek(day, today)) return "This week";
  if (sameWeek(day, addDays(weekOf(today).from, 7))) return "Next week";
  if (brk() === "week-of-year") return "W" + weekNumber(day);   /* §356.16 put back */
  const thu = toDate(thursdayOf(day));
  return "W" + Math.ceil(thu.getUTCDate() / 7) + " " + MONTH[thu.getUTCMonth()];
}
export function sameWeek(a: string, b: string): boolean { return weekOf(a).from === weekOf(b).from; }
/* The picker's rows: this week and the weeks after it, each with its days —
   and its word is weekWord's, so pressing "Next week" gives a row that reads
   "Next week" and one week is never spelt two ways on one screen (§53.5).
   Its cost was stated before it was chosen and is paid in the stylesheet: the
   first column grows from 54px to 86px to hold two words, and the popup with
   it. */
export type WeekOption = { from: string; to: string; word: string; days: string; now: boolean };
export function weekOptions(today: string, n: number = WEEKS_AHEAD): WeekOption[] {
  const out: WeekOption[] = [];
  let w = weekOf(today);
  for (let i = 0; i < n; i++) {
    out.push({ from: w.from, to: w.to, word: weekWord(w.from, today), days: weekDays(w, today), now: i === 0 });
    w = weekOf(addDays(w.from, 7));
  }
  return out;
}
/* "13 – 17 Sep", or "27 Sep – 1 Oct" across a month; the year only when it
   is not this one, on the far end. */
export function weekDays(w: Week, today?: string): string {
  const a = readableDay(w.from, today).replace(/^\w+ /, ""), b = readableDay(w.to, today).replace(/^\w+ /, "");
  const am = a.split(" ")[1], bm = b.split(" ")[1];
  return (am === bm ? a.split(" ")[0] : a) + " – " + b;
}

export function isLate(due: string | null, today: string): boolean {
  return !!due && due < today;
}
/* How many week boundaries the FIRST due date has been carried across —
   nought while it is still the week it was due. */
export function carriedWeeks(firstDue: string | null, today: string): number {
  if (!firstDue) return 0;
  const a = toDate(weekOf(firstDue).from).getTime(), b = toDate(weekOf(today).from).getTime();
  return Math.max(0, Math.round((b - a) / 86400000 / 7));
}

/* LATE IS ONE SHORT WORD (Islam: "carried 1 week is long"): the weeks ride on
   the word — Late, Late 1 w, Late 2 w — and the date comes after it. */
export function lateWord(carried: number): string {
  return carried > 0 ? "Late " + carried + " w" : "Late";
}

/* "Thu 17 Sep", and the year only when it is not this year — the product's
   own three-letter months (SMPRules.MONTH_NAMES spells them the same). */
export function readableDay(day: string | null, today?: string): string {
  if (!day || !DAY.test(day)) return "";
  const d = toDate(day);
  const y = today && today.slice(0, 4) === day.slice(0, 4) ? "" : " " + d.getUTCFullYear();
  return WEEKDAY[d.getUTCDay()] + " " + d.getUTCDate() + " " + MONTH[d.getUTCMonth()] + y;
}
export function weekLabel(w: Week, today?: string): string {
  return readableDay(w.from, today).replace(/^\w+ /, "") + " – " + readableDay(w.to, today).replace(/^\w+ /, "");
}

/* ══ the action ═══════════════════════════════════════════════════════ */
export type Action = {
  id: string; title: string; description: string;
  ownerKey: string;
  due: string | null; firstDue: string | null;
  status: Status; doneDay: string | null;
  createdBy: string; createdAt: string; updatedAt: string;
};
export type Who = { personKey: string | null; seat: string | null };

export function shape(r: Record<string, any>): Action {
  return {
    id: str(r.id), title: str(r.title), description: str(r.description),
    ownerKey: str(r.owner_key),
    due: r.due ? str(r.due) : null, firstDue: r.first_due ? str(r.first_due) : null,
    status: isStatus(r.status) ? r.status : "not_started",
    doneDay: r.done_day ? str(r.done_day) : null,
    createdBy: str(r.created_by), createdAt: str(r.created_at), updatedAt: str(r.updated_at),
  };
}

export function isMine(a: Action, who: Who): boolean {
  return !!who.personKey && a.ownerKey === who.personKey;
}
/* This week: still open and due by Thursday (late included), or finished
   this week. Undated: open with no date — never late, never on This week, so
   it needs a view of its own or it is lost (spec 054 §3). */
export function inView(a: Action, view: View, who: Who, today: string): boolean {
  const w = weekOf(today);
  if (view === "all") return true;
  if (view === "mine") return isMine(a, who);
  if (view === "undated") return a.status !== "done" && !a.due;
  if (a.status === "done") return !!a.doneDay && a.doneDay >= w.from && a.doneDay <= w.to;
  /* AN OPEN ACTION WITH NO DATE IS ON THIS WEEK. The spec first wrote the
     opposite ("never on This week, so it needs a view of its own or it is
     lost") and checks/tracker.mjs §10 found the loss that rule makes: the
     line somebody has just typed on the landing has no date, so on the
     reload it moved to Undated and vanished from under their hand — the
     sheet this replaces never did that. A line with no date is this week's
     until somebody says otherwise; Undated stays as the narrower list of
     what still needs a date, inside This week rather than beside it. */
  return !a.due || a.due <= w.to;
}
export type Summary = { open: number; late: number; dueWeek: number; doneWeek: number };
export function summary(all: Action[], today: string): Summary {
  const w = weekOf(today);
  const open = all.filter((a) => a.status !== "done");
  const dueWeek = open.filter((a) => !!a.due && a.due >= w.from && a.due <= w.to);
  return {
    open: open.length,
    late: open.filter((a) => isLate(a.due, today)).length,
    dueWeek: dueWeek.length,
    doneWeek: all.filter((a) => a.status === "done" && !!a.doneDay && a.doneDay >= w.from && a.doneDay <= w.to).length,
  };
}

/* ══ who may do what (spec 054 §6, one rule since §356.11) ════════════
   Change the title, the notes, the date, the status; hand it to somebody
   else; delete it: the owner or the client's Super user. Being the creator
   confers nothing, and with collaborators gone nobody else was ever on it. */
export function mayChange(a: Action, who: Who): boolean {
  return who.seat === "super" || isMine(a, who);
}

/* THE SHORT NAME ON A ROW is the register's own first name (§130.7's rule,
   asked of rules.cjs and never re-spelt), and a clashing pair on one client
   is lengthened to two words for exactly that pair (§81.1) — two Ahmeds
   reading as one name would tell them apart from nobody. Still equal at two
   words, the whole name. Asked once over everybody named on the list, so a
   former seat's owner is shortened by the same rule as a present one. */
export function shortNames(people: Person[]): Map<string, string> {
  const out = new Map<string, string>();
  const at = (n: number) => people.map((p) => R.nameWords(p.name, n) || p.name);
  const one = at(1), two = at(2);
  const dup = (arr: string[], i: number) => arr.some((x, j) => j !== i && x.toLowerCase() === arr[i].toLowerCase());
  people.forEach((p, i) => {
    out.set(p.key, !dup(one, i) ? one[i] : !dup(two, i) ? two[i] : p.name);
  });
  return out;
}

/* ══ the rows ═════════════════════════════════════════════════════════ */
export type Person = { key: string; name: string };
/* The people on this register who hold a seat on this client — the office.
   `tenant_users` is the platform's own table and carries no tenant policy,
   so the join is written against THIS tenant's rows explicitly rather than
   trusted to the setting. */
export async function officeRows(c: Q): Promise<Person[]> {
  const r = await c.query(
    "SELECT p.key, COALESCE(NULLIF(p.name, ''), p.key) AS name FROM people p " +
    "JOIN tenant_users tu ON tu.tenant_id = p.tenant_id AND tu.person_key = p.key " +
    "WHERE tu.seat IN ('super', 'smoteam') AND COALESCE(p.extra->>'active', 'true') <> 'false' " +
    "ORDER BY p.idx, p.key");
  return r.rows.map((x: any) => ({ key: str(x.key), name: str(x.name) }));
}
export async function namesOf(c: Q): Promise<Map<string, string>> {
  const r = await c.query("SELECT key, COALESCE(NULLIF(name, ''), key) AS name FROM people");
  return new Map(r.rows.map((x: any) => [str(x.key), str(x.name)]));
}
export async function isOfficeRow(c: Q, key: string): Promise<boolean> {
  if (brk() === "owner-anyone") return (await c.query("SELECT 1 FROM people WHERE key = $1", [key])).rows.length > 0;
  return (await officeRows(c)).some((p) => p.key === key);
}

const COLS =
  "id, title, description, owner_key, due::text AS due, first_due::text AS first_due, status, " +
  "to_char(done_at AT TIME ZONE 'Africa/Cairo', 'YYYY-MM-DD') AS done_day, created_by, created_at, updated_at";

/* Open first, soonest first, no date last; done at the end, latest first. */
export async function listActions(c: Q): Promise<Action[]> {
  const r = await c.query(
    "SELECT " + COLS + " FROM tracker_actions " +
    "ORDER BY (status = 'done'), due ASC NULLS LAST, done_at DESC NULLS LAST, created_at ASC");
  return r.rows.map(shape);
}
export async function oneAction(c: Q, id: string): Promise<Action | null> {
  const r = await c.query("SELECT " + COLS + " FROM tracker_actions WHERE id = $1", [id]);
  return r.rows[0] ? shape(r.rows[0]) : null;
}

export type Event = { kind: string; from: Status | null; to: Status | null; by: string; at: string };
export async function eventsOf(c: Q, id: string): Promise<Event[]> {
  const r = await c.query(
    "SELECT kind, from_status, to_status, by_key, at FROM tracker_events WHERE action_id = $1 ORDER BY at DESC, id DESC", [id]);
  return r.rows.map((x: any) => ({ kind: str(x.kind), from: x.from_status || null, to: x.to_status || null, by: str(x.by_key), at: str(x.at) }));
}

/* THE ADD LINE TAKES EVERYTHING (Islam, 2026-09-16): the date, the owner
   and a note arrive with the title. A date given at birth is the first due
   date too (spec 054 §5). */
export async function addAction(c: Q, a: { title: string; ownerKey: string; by: string; due?: string | null; description?: string }): Promise<Action> {
  const title = oneLine(a.title).slice(0, TITLE_MAX);
  if (!title) throw new Error("an action needs a title");
  const due = a.due || null;
  const r = await c.query(
    "INSERT INTO tracker_actions (title, owner_key, created_by, due, first_due, description) VALUES ($1, $2, $3, $4, $4, $5) RETURNING " + COLS,
    [title, a.ownerKey, a.by, due, trimmed(a.description || "").slice(0, NOTES_MAX)]);
  const row = shape(r.rows[0]);
  await c.query("INSERT INTO tracker_events (action_id, kind, to_status, by_key) VALUES ($1, 'created', $2, $3)",
    [row.id, row.status, a.by]);
  return row;
}

export type Patch = { title?: string; description?: string; due?: string | null; ownerKey?: string };
/* THE FIRST DUE DATE IS WRITTEN ONCE (spec 054 §5): set the day the action
   first gets a date and never moved by a reschedule, so the carried count
   cannot be reset by giving an action a new date every Sunday. */
export async function setFields(c: Q, id: string, p: Patch): Promise<Action | null> {
  const sets: string[] = [], args: unknown[] = [];
  const put = (col: string, v: unknown) => { args.push(v); sets.push(col + " = $" + args.length); };
  if (p.title !== undefined) { const t = oneLine(p.title).slice(0, TITLE_MAX); if (!t) throw new Error("an action needs a title"); put("title", t); }
  if (p.description !== undefined) put("description", trimmed(p.description).slice(0, NOTES_MAX));
  if (p.due !== undefined) {
    put("due", p.due);
    if (brk() === "reset-carried") put("first_due", p.due);
    else if (p.due) { args.push(p.due); sets.push("first_due = COALESCE(first_due, $" + args.length + ")"); }
  }
  if (p.ownerKey !== undefined) put("owner_key", p.ownerKey);
  if (!sets.length) return oneAction(c, id);
  sets.push("updated_at = now()");
  args.push(id);
  const r = await c.query("UPDATE tracker_actions SET " + sets.join(", ") + " WHERE id = $" + args.length + " RETURNING " + COLS, args);
  return r.rows[0] ? shape(r.rows[0]) : null;
}

/* Done stamps when and clears the first due date (spec 054 §5); reopening
   clears the stamp and starts the first due date again from the date the
   action holds, so a finished action brought back does not carry the weeks
   it was owed before it was done. One event per real change; setting a
   status to what it already is writes nothing (§94.5's own trap, avoided in
   the writer). */
export async function setStatus(c: Q, id: string, status: Status, by: string): Promise<Action | null> {
  const was = await oneAction(c, id);
  if (!was) return null;
  if (was.status === status) return was;
  const r = await c.query(
    "UPDATE tracker_actions SET status = $2, done_at = CASE WHEN $2 = 'done' THEN now() ELSE NULL END, " +
    "first_due = CASE WHEN $2 = 'done' THEN NULL WHEN first_due IS NULL THEN due ELSE first_due END, " +
    "updated_at = now() WHERE id = $1 RETURNING " + COLS, [id, status]);
  await c.query("INSERT INTO tracker_events (action_id, kind, from_status, to_status, by_key) VALUES ($1, 'status', $2, $3, $4)",
    [id, was.status, status, by]);
  return r.rows[0] ? shape(r.rows[0]) : null;
}

export async function deleteAction(c: Q, id: string): Promise<boolean> {
  const r = await c.query("DELETE FROM tracker_actions WHERE id = $1", [id]);
  return (r.rowCount || 0) > 0;
}
