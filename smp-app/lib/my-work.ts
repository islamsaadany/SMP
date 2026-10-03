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
   nothing there, which is true. */
import type { PoolClient } from "pg";
import { withTenant } from "./tenant.ts";
import { registerKeyFor } from "./state-api.ts";
import { modulesFor } from "./modules.ts";
import { shape, todayIn, weekOf, addDays, isLate, carriedWeeks, lateWord, weekWord, STATUS_WORD } from "./tracker.ts";

export type Bucket = "late" | "week" | "later";
export type WorkRow = {
  id: string; title: string; client: string; clientName: string;
  due: string | null; when: string; bucket: Bucket; late: boolean; status: string; statusWord: string;
};
export type ClientTally = { open: number; late: number };

/* Which of the three headings an open action sits under. An action with no
   date is on THIS week — the tracker's own rule (§356.7): the line just typed
   has no date, and a list that hid it would lose it. */
export function bucketOf(due: string | null, today: string): Bucket {
  if (due && isLate(due, today)) return "late";
  if (!due || due <= weekOf(today).to) return "week";
  return "later";
}
export function whenOf(due: string | null, firstDue: string | null, today: string): string {
  if (!due) return "No date";
  if (isLate(due, today)) return lateWord(carriedWeeks(firstDue, today));
  return weekWord(due, today);
}

type Seat = { tenant_id: string; client_key: string; person_key: string | null };
type Client = { id: string; key: string; name: string; modules?: unknown };

/* One client's open actions for one person. A client that will not answer
   yields NOTHING and says so in the log — one client down must not take the
   whole list with it (§231.3's rule, one module over). */
export async function openOn(t: Client, email: string, personKey: string | null, today: string): Promise<WorkRow[] | null> {
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
      return r.rows.map((row) => {
        const a = shape(row);
        return { id: a.id, title: a.title, client: t.key, clientName: t.name, due: a.due,
          when: whenOf(a.due, a.firstDue, today), bucket: bucketOf(a.due, today), late: isLate(a.due, today),
          status: a.status, statusWord: STATUS_WORD[a.status] };
      });
    });
  } catch (e) {
    console.error("my work on " + t.key + ":", (e as Error).message);
    return null;
  }
}

/* The whole list, and a tally per client for the cards. `clients` is what
   the rules already let this person see (FF.visibleClients) — this reads
   nothing the console would not draw. */
export async function myWork(clients: Client[], seats: Seat[], email: string, now: Date = new Date()) {
  const today = todayIn(now);
  const keyOn = new Map(seats.map((s) => [s.client_key, s.person_key || null]));
  const rows: WorkRow[] = [];
  const tally: Record<string, ClientTally> = {};
  const unanswered: string[] = [];
  for (const t of clients) {
    const got = await openOn(t, email, keyOn.get(t.key) ?? null, today);
    if (got === null) { unanswered.push(t.name); continue; }
    rows.push(...got);
    if (modulesFor(t.modules).includes("tracker" as never))
      tally[t.key] = { open: got.length, late: got.filter((r) => r.late).length };
  }
  const order: Record<Bucket, number> = { late: 0, week: 1, later: 2 };
  rows.sort((a, b) => order[a.bucket] - order[b.bucket]
    || (a.due || "").localeCompare(b.due || "") || a.clientName.localeCompare(b.clientName));
  const thisWeekEnds = weekOf(today).to;
  return {
    today, rows, tally, unanswered,
    stats: {
      open: rows.length,
      late: rows.filter((r) => r.late).length,
      dueWeek: rows.filter((r) => !r.late && r.due && r.due <= thisWeekEnds).length,
      clients: new Set(rows.map((r) => r.client)).size,
    },
    nextWeekFrom: addDays(weekOf(today).from, 7),
  };
}

/* The card's line — "3 open · 1 late", nothing when nothing is open (§368:
   a mark is what is outstanding). */
export function tallyMark(t: ClientTally | undefined): { mark: string; alarm: boolean; tip: string } | null {
  if (!t || !t.open) return null;
  return { mark: t.open + " open" + (t.late ? " · " + t.late + " late" : ""), alarm: t.late > 0,
    tip: "Your open actions on this client" + (t.late ? " — " + t.late + " past their week" : "") };
}
