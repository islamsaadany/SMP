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
import { withTenant } from "./tenant.ts";
import { registerKeyFor } from "./state-api.ts";
import { modulesFor } from "./modules.ts";
import {
  shape, todayIn, weekOf, addDays, isLate, carriedWeeks, lateWord, weekWord, weekLabel, readableDay, STATUS_WORD, STATUSES,
  isStatus, isOffice, mayChange, oneAction, setStatus, ONLY_CHANGE, type Action, type Who,
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

function rowOf(t: Client, a: Action, today: string, who: Who | null): WorkRow {
  const done = a.status === "done";
  const late = !done && isLate(a.due, today);
  return {
    id: a.id, title: a.title, client: t.key, clientName: t.name, due: a.due,
    when: whenOf(a, today), bucket: bucketOf(a.due, today), late,
    dueWeek: !done && !late && !!a.due && a.due <= weekOf(today).to,
    status: a.status, statusWord: STATUS_WORD[a.status],
    canChange: !!who && isOffice(who.seat) && mayChange(a, who),
  };
}

/* One client's open actions for one person. A client that will not answer
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
        "SELECT id, title, owner_key, due::text AS due, first_due::text AS first_due, status FROM tracker_actions " +
        "WHERE " + (everyone ? "$1::text IS NOT NULL" : "owner_key = $1") + " AND status <> 'done' ORDER BY due ASC NULLS FIRST, created_at ASC", [key]);
      return r.rows.map((row) => rowOf(t, shape(row), today, viewer));
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
  for (const t of clients) {
    const got = await openOn(t, email, keyOn.get(t.key) ?? null, today, opts.viewerOn ? opts.viewerOn(t) : null);
    if (got === null) { unanswered.push(t.name); continue; }
    rows.push(...got);
    if (modulesFor(t.modules).includes("tracker" as never))
      tally[t.key] = { open: got.length, late: got.filter((r) => r.late).length };
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
    return a ? { ok: true, row: rowOf(t, a, today, who) } : gone;
  });
}

/* The card's line — "3 open · 1 late", nothing when nothing is open (§368:
   a mark is what is outstanding). */
export function tallyMark(t: ClientTally | undefined): { mark: string; alarm: boolean; tip: string } | null {
  if (!t || !t.open) return null;
  return { mark: t.open + " open" + (t.late ? " · " + t.late + " late" : ""), alarm: t.late > 0,
    tip: "Your open actions on this client" + (t.late ? " — " + t.late + " past their week" : "") };
}
