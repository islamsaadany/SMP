/* MY WORK (§400) — the office's own open Tracker actions, across every
   client the person may open, for the console's first tab.

   Islam: "for the main console we can have the person tasks across the
   different clients outside on the main platform derived from the internal
   tracker of the different clients work."

   NOTHING IS STORED HERE. Every row is read from that client's own
   `tracker_actions` through withTenant, the one door onto a client's rows,
   and every word is lib/tracker.ts's (weekWord, lateWord, STATUS_WORD) so an
   action reads the same on the console as it does inside the Tracker
   (§53.5). Meeting Notes' actions are deliberately NOT read (his word).

   WHO "YOU" ARE ON A CLIENT is the same question the landing asks —
   registerKeyFor, the membership key if the register holds it, else the one
   active row carrying this address — and it never MINTS (§42): reading a
   list must not place somebody on a register. Somebody nobody placed owns
   nothing there, which is true.

   AND A ROW CAN BE FINISHED HERE (§583). Islam: "add the done tick and
   status change too". The write is the Tracker's own — its rule (mayChange),
   its gate (an office seat), its setStatus and the history line it writes —
   asked of the person LOOKING, who on a colleague's list is not the owner.
   Whether a row may be pressed is answered with the row, by the same rule,
   so a tick is never drawn where the write would refuse it (§61). */
import type { PoolClient } from "pg";
import { withTenant, mapLimit } from "./tenant.ts";
import { registerKeyFor } from "./state-api.ts";
import { modulesFor } from "./modules.ts";
import { writeUpsWhere } from "./case-api.ts";
import {
  shape, todayIn, weekOf, addDays, isLate, carriedWeeks, lateWord, weekWord, weekLabel, readableDay, STATUS_WORD, STATUSES,
  isStatus, isOffice, mayChange, oneAction, setStatus, ONLY_CHANGE, type Action, type Who,
  sameWeek, weekOptions, calendarDay, oneLine, setFields, deleteAction, isOfficeRow, officeRows, shortNames, namesOf,
  progressOf, addProgress, latestProgress, eventsOf, type Progress,
  oneProgress, editProgress, deleteProgress, mayChangeProgress, ONLY_WRITER,
} from "./tracker.ts";

export type Bucket = "late" | "week" | "later";
export type WorkRow = {
  id: string; title: string; client: string; clientName: string;
  due: string | null; when: string; bucket: Bucket; late: boolean; status: string; statusWord: string;
  /* counted in "Due this week" — decided here, beside `late`, so the page
     counts what the server says and never works out a week of its own */
  dueWeek: boolean;
  /* whether the person LOOKING may tick it or change its status (§583) */
  canChange: boolean;
  /* the day it was finished, for My tasks' Show done (2026-10-24) */
  doneDay: string | null;
  /* THE WEEK CELL'S WORD (§709, the Tracker's §708): only the exception —
     how late ("2 w late", "Late" when carried nought), a week that is not
     this one, the day it was finished; a row due this week says nothing,
     its card does */
  cell: string;
  /* the latest progress line, for the row's quiet line (§709) */
  last: { week: string; body: string; now: boolean } | null;
};
export type ClientTally = { open: number; late: number };

/* Which of the three headings an action sits under. An action with no date
   is on THIS week — the tracker's own rule (§356.7): the line just typed has
   no date, and a list that hid it would lose it. Read off the due day alone,
   so a row finished here stays under the heading it was ticked in. */
export function bucketOf(due: string | null, today: string): Bucket {
  if (due && isLate(due, today)) return "late";
  if (!due || due <= weekOf(today).to) return "week";
  return "later";
}
/* The Tracker's own when cell, in weeks (modules/tracker/page.ts whenText):
   a finished action says the day it was finished, a late one only how late
   — counted from its FIRST due day, or its due day where it has none, as the
   Tracker counts it — and anything else its week in words. */
export function whenOf(a: Pick<Action, "due" | "firstDue" | "status" | "doneDay">, today: string): string {
  if (a.status === "done") return a.doneDay ? "Done " + readableDay(a.doneDay, today) : "Done";
  if (!a.due) return "No date";
  if (isLate(a.due, today)) return lateWord(carriedWeeks(a.firstDue || a.due, today));
  return weekWord(a.due, today);
}

type Seat = { tenant_id: string; client_key: string; person_key: string | null };
type Client = { id: string; key: string; name: string; modules?: unknown };
/* Who the person looking is on a client — their seat and register key — or
   null where they may change nothing there. Asked by the caller, which holds
   the rules for opening a client (platform-api.ts). */
export type ViewerOn = (t: Client) => Who | null;

/* WHEN AN ENTRY WAS WRITTEN, in the Tracker's words (modules/tracker/page.ts
   entryWeek): This week, Last week, then the week's own word. */
export function entryWeekWord(at: string, today: string): string {
  const day = at ? todayIn(new Date(at)) : today;
  return sameWeek(day, today) ? "This week" : sameWeek(day, addDays(weekOf(today).from, -7)) ? "Last week" : weekWord(day, today);
}
function cellOf(a: Action, today: string): string {
  if (a.status === "done") return whenOf(a, today);
  if (!a.due) return "No date";
  if (isLate(a.due, today)) { const n = carriedWeeks(a.firstDue || a.due, today); return n ? n + " w late" : "Late"; }
  return a.due <= weekOf(today).to ? "" : weekWord(a.due, today);
}
function rowOf(t: Client, a: Action, today: string, who: Who | null, last: Progress | null = null): WorkRow {
  const done = a.status === "done";
  const late = !done && isLate(a.due, today);
  return {
    id: a.id, title: a.title, client: t.key, clientName: t.name, due: a.due,
    when: whenOf(a, today), bucket: bucketOf(a.due, today), late,
    dueWeek: !done && !late && !!a.due && a.due <= weekOf(today).to,
    status: a.status, statusWord: STATUS_WORD[a.status],
    canChange: !!who && isOffice(who.seat) && mayChange(a, who),
    doneDay: a.doneDay,
    cell: cellOf(a, today),
    /* §728: now — written this week, so the row's quiet line leaves the week out */
    last: last ? { week: entryWeekWord(last.at, today), body: oneLine(last.body), now: sameWeek(last.at ? todayIn(new Date(last.at)) : today, today) } : null,
  };
}

/* One client's open actions for one person, and those it finished in the
   last 30 days (My tasks' Show done, Islam 2026-10-24: "done last week and
   done in the last 30 days but last week is the important one"); the
   callers that count or list what is open filter them out (tally, Home). A client that will not answer
   yields NOTHING and says so in the log — one client down must not take the
   whole list with it (§231.3's rule, one module over). */
export async function openOn(t: Client, email: string, personKey: string | null, today: string, viewer: Who | null = null): Promise<WorkRow[] | null> {
  if (!modulesFor(t.modules).includes("tracker" as never)) return [];
  try {
    return await withTenant(t.id, async (c: PoolClient) => {
      const key = await registerKeyFor(c, email, personKey);
      if (!key) return [];
      /* SMP_BREAK=mywork-everyone drops the owner filter — the one fault
         that would put somebody else's actions on your list; checks/shell.mjs
         §4b must go red under it. */
      const everyone = process.env.SMP_BREAK === "mywork-everyone";
      const r = await c.query(
        "SELECT id, title, owner_key, due::text AS due, first_due::text AS first_due, status, " +
        "to_char(done_at AT TIME ZONE 'Africa/Cairo', 'YYYY-MM-DD') AS done_day FROM tracker_actions " +
        "WHERE " + (everyone ? "$1::text IS NOT NULL" : "owner_key = $1") +
        " AND (status <> 'done' OR done_at >= now() - interval '30 days') ORDER BY due ASC NULLS FIRST, created_at ASC", [key]);
      const latest = await latestProgress(c);
      return r.rows.map((row) => { const a = shape(row); return rowOf(t, a, today, viewer, latest.get(a.id) || null); });
    });
  } catch (e) {
    console.error("my work on " + t.key + ":", (e as Error).message);
    return null;
  }
}

/* The whole list, and a tally per client for the cards. `clients` is what
   the rules already let this person see (FF.visibleClients) — this reads
   nothing the console would not draw. `viewerOn` is asked only by the tab;
   the cards draw no tick, so they pass none and every row reads unchangeable. */
export async function myWork(clients: Client[], seats: Seat[], email: string, opts: { viewerOn?: ViewerOn; now?: Date } = {}) {
  const today = todayIn(opts.now || new Date());
  const keyOn = new Map(seats.map((s) => [s.client_key, s.person_key || null]));
  const rows: WorkRow[] = [];
  const tally: Record<string, ClientTally> = {};
  const unanswered: string[] = [];
  /* a few clients at once rather than one after another (§669); the rows
     keep the clients' order, as the loop they replace kept it */
  const gots = await mapLimit(clients, 4, (t) => openOn(t, email, keyOn.get(t.key) ?? null, today, opts.viewerOn ? opts.viewerOn(t) : null));
  for (let i = 0; i < clients.length; i++) {
    const t = clients[i], got = gots[i];
    if (got === null) { unanswered.push(t.name); continue; }
    rows.push(...got);
    if (modulesFor(t.modules).includes("tracker" as never))
      tally[t.key] = { open: got.filter((r) => r.status !== "done").length, late: got.filter((r) => r.late).length };
  }
  const order: Record<Bucket, number> = { late: 0, week: 1, later: 2 };
  rows.sort((a, b) => order[a.bucket] - order[b.bucket]
    || (a.due || "").localeCompare(b.due || "") || a.clientName.localeCompare(b.clientName));
  const week = weekOf(today);
  return {
    today, rows, tally, unanswered,
    /* the panel's week line, the Tracker's own (page.ts): "This week · 18 Oct – 22 Oct" */
    weekLine: weekWord(week.to, today) + " · " + weekLabel(week, today),
    /* the status choices, in the Tracker's order and words (§53.5) */
    statuses: STATUSES.map((s) => ({ key: s, word: STATUS_WORD[s] })),
    nextWeekFrom: addDays(week.from, 7),
  };
}

/* ── A WRITE-UP TO DO (spec 069, which reworks spec 067 decision 7) ───
   My tasks' SECOND source, said so (spec 067 §8): a write-up is not a
   Tracker action and cannot be one — most are about ended and past clients,
   whose Trackers are behind a closed door. So it is read from the Track
   Record, shaped like a row with the Tracker's own week words and buckets
   (whenOf, bucketOf), and drawn among the actions by when it is wanted: the
   first day after the assignment's end month. Nobody asks for it; its lead
   is waited on once that month comes, and whoever starts it after that.
   It carries NO status to change: a write-up is finished by publishing it,
   never from a list (§61). */
export type WriteUp = { kind: "case"; id: string; name: string; client: string; clientName: string;
  type: string; due: string | null; when: string; bucket: Bucket; late: boolean; dueWeek: boolean };
export async function writeUps(c: { query: PoolClient["query"] }, userId: string, today: string): Promise<WriteUp[]> {
  const r = await c.query(
    "SELECT cs.id, cs.name, cs.kind, t.key, t.name AS client_name, " +
    "CASE WHEN cs.ended ~ '^\\d{4}-\\d{2}$' THEN (to_date(cs.ended, 'YYYY-MM') + interval '1 month')::date::text END AS due " +
    "FROM case_studies cs JOIN tenants t ON t.id = cs.about_tenant_id WHERE " + writeUpsWhere("$1", "$2") +
    " ORDER BY cs.ended, cs.name", [userId, today.slice(0, 7)]);
  return r.rows.map((x: any) => {
    const late = !!x.due && isLate(x.due, today);
    return { kind: "case" as const, id: x.id, name: x.name, client: x.key, clientName: x.client_name, type: x.kind, due: x.due,
      when: whenOf({ due: x.due, firstDue: null, status: "open", doneDay: null } as any, today),
      bucket: bucketOf(x.due, today), late, dueWeek: !late && !!x.due && x.due <= weekOf(today).to };
  });
}

/* ── FINISHING A ROW FROM MY WORK (§583) ─────────────────────────────
   The Tracker's status write, judged against the STORED row (§42): this
   client has a Tracker, the person holds an office seat on it (the Tracker's
   own gate), and the rule is mayChange — the owner, or the client's Super
   user. `who` is the door's answer for this client (door.ts seatAt), never
   anything the page sent. setStatus writes the history line the Tracker
   writes, so the action's history says the same whichever page finished it.
   The answer is the row drawn again by the reader the list uses, so the page
   swaps in a row it did not have to work out (§53.5). */
export type WorkWrite = { ok: true; row: WorkRow } | { ok: false; status: number; why: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function setWorkStatus(t: Client, who: Who, id: string, status: unknown, now: Date = new Date()): Promise<WorkWrite> {
  if (!modulesFor(t.modules).includes("tracker" as never)) return { ok: false, status: 404, why: "This client has no Internal Tracker." };
  if (!isOffice(who.seat)) return { ok: false, status: 403, why: "The Internal Tracker is the office's." };
  if (!isStatus(status)) return { ok: false, status: 400, why: "Not a status this list knows." };
  const gone: WorkWrite = { ok: false, status: 404, why: "That action is not on this client's list any more." };
  if (!UUID.test(id)) return gone;
  const today = todayIn(now);
  return withTenant(t.id, async (c: PoolClient): Promise<WorkWrite> => {
    const cur = await oneAction(c, id);
    if (!cur) return gone;
    /* SMP_BREAK=mywork-press-anyone drops the rule — the one fault that lets
       a team seat finish somebody else's action from the console;
       checks/shell.mjs §4b must go red under it. */
    if (!mayChange(cur, who) && process.env.SMP_BREAK !== "mywork-press-anyone") return { ok: false, status: 403, why: ONLY_CHANGE };
    await setStatus(c, id, status, who.personKey || "");
    const a = await oneAction(c, id);
    return a ? { ok: true, row: rowOf(t, a, today, who, (await latestProgress(c)).get(id) || null) } : gone;
  });
}

/* ── A TASK OPENED IN PLACE ON MY TASKS (§709) ────────────────────────
   Islam: "go ahead, build it" — the working mockup
   design-mockups/home/2026-11-03_my-tasks-working.html. A press on a task's
   name opens it on My tasks as the Tracker opens it (§706's option D):
   Progress, Description, History. This is that task read through the same
   door and the same rules as the Tracker's page — the action, its entries
   (each marked whether the person looking wrote it), its history in the
   Tracker's words, the office on that client to hand it to, and the weeks
   it may move to — never a second copy of any of it (§53.5). */
export type WorkDetail = { ok: true; detail: {
  id: string; description: string; canChange: boolean; canWrite: boolean;
  progress: { id: string; week: string; now: boolean; body: string; by: string; mine: boolean; edited: boolean }[];
  history: { day: string; text: string }[];
  team: { key: string; name: string; me: boolean; owner: boolean }[];
  weeks: { day: string; word: string; days: string; on: boolean }[];
} } | { ok: false; status: number; why: string };
function gate(t: Client, who: Who): { ok: false; status: number; why: string } | null {
  if (!modulesFor(t.modules).includes("tracker" as never)) return { ok: false, status: 404, why: "This client has no Internal Tracker." };
  if (!isOffice(who.seat)) return { ok: false, status: 403, why: "The Internal Tracker is the office's." };
  return null;
}
const GONE = { ok: false as const, status: 404, why: "That action is not on this client's list any more." };
export async function workDetail(t: Client, who: Who, id: string, now: Date = new Date()): Promise<WorkDetail> {
  const g = gate(t, who); if (g) return g;
  if (!UUID.test(id)) return GONE;
  const today = todayIn(now);
  return withTenant(t.id, async (c: PoolClient): Promise<WorkDetail> => {
    const a = await oneAction(c, id);
    if (!a) return GONE;
    const names = await namesOf(c);
    const office = await officeRows(c);
    const short = shortNames(office.map((p) => ({ key: p.key, name: p.name })));
    const nm = (k: string) => names.get(k) || k;
    const sn = (k: string) => short.get(k) || nm(k);
    const wk = (d: string | null | undefined) => d ? weekWord(d, today) : "no date";
    const hist = (await eventsOf(c, id)).map((e) => {
      const d = e.detail || {};
      const what = e.kind === "created" ? "made it, for " + nm(d.owner || a.ownerKey) + (d.due !== undefined ? ", due " + wk(d.due) : "")
        : e.kind === "due" ? "carried it to " + wk(d.to) + " (was " + wk(d.from) + ")"
        : e.kind === "owner" ? "handed it to " + nm(d.to || "") + " (was " + nm(d.from || "") + ")"
        : e.kind === "title" ? "renamed it to \u201c" + (d.to || "") + "\u201d"
        : e.kind === "topic" ? "moved it to another topic"
        : STATUS_WORD[e.from || "not_started"] + " \u2192 " + STATUS_WORD[e.to || "not_started"];
      return { day: e.at ? readableDay(todayIn(new Date(e.at)), today) : "", text: nm(e.by) + " " + what };
    });
    const live = mayChange(a, who);
    return { ok: true, detail: {
      id: a.id, description: a.description, canChange: live, canWrite: !!who.personKey,
      progress: (await progressOf(c, id)).map((p) => ({ id: p.id, week: entryWeekWord(p.at, today), now: sameWeek(todayIn(new Date(p.at)), today),
        body: p.body, by: sn(p.by), mine: !!who.personKey && p.by === who.personKey, edited: !!p.editedAt })),
      history: hist,
      team: live ? office.map((p) => ({ key: p.key, name: sn(p.key), me: p.key === who.personKey, owner: p.key === a.ownerKey })) : [],
      weeks: live ? weekOptions(today).map((w) => ({ day: w.to, word: w.word, days: w.days, on: !!a.due && sameWeek(a.due, w.to) })) : [],
    } };
  });
}

/* ── WRITING TO A TASK FROM MY TASKS (§709) ───────────────────────────
   Each op is the Tracker's own act, judged as the Tracker's api judges it
   (modules/tracker/index.ts), against the STORED row (§42): progress by
   anybody past the gate with a name on the register; everything else by
   mayChange — the owner, a lead of one of the client's assignments, or the
   client's Super user. A hand-over takes the row off this person's list and
   a delete takes it off everyone's; the answer says so (gone), and otherwise
   carries the row drawn again by the list's own reader. */
export type WorkOp = "progress" | "progress-edit" | "progress-delete" | "notes" | "due" | "owner" | "rename" | "delete";
export type WorkWrite2 = { ok: true; row: WorkRow | null; gone: boolean } | { ok: false; status: number; why: string };
export async function workWrite(t: Client, who: Who, id: string, op: unknown, body: Record<string, unknown>, now: Date = new Date()): Promise<WorkWrite2> {
  const g = gate(t, who); if (g) return g;
  if (!["progress", "progress-edit", "progress-delete", "notes", "due", "owner", "rename", "delete"].includes(String(op))) return { ok: false, status: 400, why: "Not something this list does." };
  if (!UUID.test(id)) return GONE;
  const today = todayIn(now);
  const by = who.personKey || "";
  return withTenant(t.id, async (c: PoolClient): Promise<WorkWrite2> => {
    const cur = await oneAction(c, id);
    if (!cur) return GONE;
    if (op === "progress") {
      if (!by) return { ok: false, status: 400, why: "You are not on this client's register yet, so nothing can be written under your name here." };
      if (!oneLine(body.body)) return { ok: false, status: 400, why: "A progress entry needs a few words." };
      await addProgress(c, id, String(body.body), by);
    } else if (op === "progress-edit" || op === "progress-delete") {
      /* AN ENTRY IS ITS WRITER'S (§657), on My tasks and Home as in the
         Tracker (§712): edited or deleted by them alone, judged against the
         stored entry, which must be this action's */
      const p = await oneProgress(c, String(body.progressId || ""));
      if (!p || p.actionId !== id) return { ok: false, status: 404, why: "That entry is not on this action any more." };
      if (!mayChangeProgress(p, who)) return { ok: false, status: 403, why: ONLY_WRITER };
      if (op === "progress-edit") {
        if (!oneLine(body.body)) return { ok: false, status: 400, why: "A progress entry needs a few words." };
        await editProgress(c, p.id, String(body.body));
      } else await deleteProgress(c, p.id);
    } else {
      if (!mayChange(cur, who)) return { ok: false, status: 403, why: ONLY_CHANGE };
      if (op === "notes") await setFields(c, id, { description: String(body.description || "") });
      else if (op === "rename") {
        if (!oneLine(body.title)) return { ok: false, status: 400, why: "An action needs a few words." };
        await setFields(c, id, { title: String(body.title) }, by);
      } else if (op === "due") {
        const due = body.due == null || body.due === "" ? null : calendarDay(body.due);
        if (body.due && !due) return { ok: false, status: 400, why: "That is not a date this list can read." };
        await setFields(c, id, { due }, by);
      } else if (op === "owner") {
        const k = String(body.ownerKey || "");
        if (!k || !(await isOfficeRow(c, k))) return { ok: false, status: 400, why: "An action is owned by somebody on the office's seats." };
        await setFields(c, id, { ownerKey: k }, by);
        /* handed on, it leaves the list it was on — whoever's that list is */
        if (k !== cur.ownerKey) return { ok: true, row: null, gone: true };
      } else if (op === "delete") {
        await deleteAction(c, id);
        return { ok: true, row: null, gone: true };
      }
    }
    const a = await oneAction(c, id);
    return a ? { ok: true, row: rowOf(t, a, today, who, (await latestProgress(c)).get(id) || null), gone: false } : GONE;
  });
}

/* The card's line — "3 open · 1 late", nothing when nothing is open (§368:
   a mark is what is outstanding). */
export function tallyMark(t: ClientTally | undefined): { mark: string; alarm: boolean; tip: string } | null {
  if (!t || !t.open) return null;
  return { mark: t.open + " open" + (t.late ? " · " + t.late + " late" : ""), alarm: t.late > 0,
    tip: "Your open actions on this client" + (t.late ? " — " + t.late + " past their week" : "") };
}
