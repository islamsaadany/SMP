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
   and not only of the picker (§42). */
import type { PoolClient } from "pg";

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

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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
  ownerKey: string; collaborators: string[];
  due: string | null; firstDue: string | null;
  status: Status; doneDay: string | null;
  createdBy: string; createdAt: string; updatedAt: string;
};
export type Who = { personKey: string | null; seat: string | null };

export function shape(r: Record<string, any>): Action {
  return {
    id: str(r.id), title: str(r.title), description: str(r.description),
    ownerKey: str(r.owner_key),
    collaborators: Array.isArray(r.collaborators) ? r.collaborators.map(str).filter(Boolean) : [],
    due: r.due ? str(r.due) : null, firstDue: r.first_due ? str(r.first_due) : null,
    status: isStatus(r.status) ? r.status : "not_started",
    doneDay: r.done_day ? str(r.done_day) : null,
    createdBy: str(r.created_by), createdAt: str(r.created_at), updatedAt: str(r.updated_at),
  };
}

export function isMine(a: Action, who: Who): boolean {
  return !!who.personKey && (a.ownerKey === who.personKey || a.collaborators.includes(who.personKey));
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
export type Summary = { open: number; late: number; dueWeek: number; dueWeekNotStarted: number; doneWeek: number };
export function summary(all: Action[], today: string): Summary {
  const w = weekOf(today);
  const open = all.filter((a) => a.status !== "done");
  const dueWeek = open.filter((a) => !!a.due && a.due >= w.from && a.due <= w.to);
  return {
    open: open.length,
    late: open.filter((a) => isLate(a.due, today)).length,
    dueWeek: dueWeek.length,
    dueWeekNotStarted: dueWeek.filter((a) => a.status === "not_started").length,
    doneWeek: all.filter((a) => a.status === "done" && !!a.doneDay && a.doneDay >= w.from && a.doneDay <= w.to).length,
  };
}

/* ══ who may do what (spec 054 §6) ════════════════════════════════════
   Change the title, the notes, the date, the status: the owner, a
   collaborator, or the client's Super user. Hand it to somebody else, change
   who else is on it, delete it: the owner or the Super user. Being the
   creator confers nothing. */
export function mayChange(a: Action, who: Who): boolean {
  return who.seat === "super" || isMine(a, who);
}
export function mayOwn(a: Action, who: Who): boolean {
  return who.seat === "super" || (!!who.personKey && a.ownerKey === who.personKey);
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
  "id, title, description, owner_key, collaborators, due::text AS due, first_due::text AS first_due, status, " +
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

export async function addAction(c: Q, a: { title: string; ownerKey: string; by: string }): Promise<Action> {
  const title = oneLine(a.title).slice(0, TITLE_MAX);
  if (!title) throw new Error("an action needs a title");
  const r = await c.query(
    "INSERT INTO tracker_actions (title, owner_key, created_by) VALUES ($1, $2, $3) RETURNING " + COLS,
    [title, a.ownerKey, a.by]);
  const row = shape(r.rows[0]);
  await c.query("INSERT INTO tracker_events (action_id, kind, to_status, by_key) VALUES ($1, 'created', $2, $3)",
    [row.id, row.status, a.by]);
  return row;
}

export type Patch = { title?: string; description?: string; due?: string | null; ownerKey?: string; collaborators?: string[] };
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
  if (p.collaborators !== undefined) put("collaborators", JSON.stringify(Array.from(new Set(p.collaborators.map(str).filter(Boolean))).sort()));
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
