/* ── PORTFOLIO — the rules, before any screen (spec 056) ──────────────────
   The six rules of §3, who gets in (§6), the roll-up (§9.8) and what a row
   owes (§9.13), as functions a check can ask without a browser — which is
   what §8 asks for in those words: *the six rules of §3 are checked as
   rules, not as screens.*

   NOTHING HERE DRAWS ANYTHING AND NOTHING HERE OPENS A DOOR. `portfolio`
   is still `built: false` in `lib/modules.ts`, so the address, the switcher
   and the card are unchanged: a module marked built with nothing to draw is
   the door onto the wrong room that flag exists to stop (§61), and three of
   its screens are drawn and not yet signed off (§9.10, §9.12, §9.13).

   THE RULE LIVES ON THE SERVER AND THE SCREEN ASKS THE SAME FUNCTION
   (§42, §6.5). Every predicate below is the whole answer to its question,
   so a page that draws a control and a handler that accepts the press
   cannot disagree — which is the drift the reference has in its own code
   (§7.2 №3: its screen hook fails OPEN and its server refuses, so the
   buttons 403). Here the screen and the server ask one function and it
   fails CLOSED.

   A FLAT ORDERED ARRAY IS THE TREE. Phases, work packages and activities
   are three tables, and every rule that walks the plan — the numbering, the
   roll-up, the cascade, the tally — wants them in document order with a
   level on each. So the server builds that array once from
   (phase.pos, package.pos, activity.pos) and every function here takes it.
   It is also the shape the drawings already read (`design-mockups/portfolio/
   _derive.js`), so the plan on the screen and the plan on the server cannot
   arrive at two answers for one project (§5.2).

   A CODE IS A POSITION, NEVER A STORED NUMBER (§310, §7.6). The reference
   lets the browser supply phase numbers and never renumbers on a delete, so
   its plans carry gaps and stale codes and a unique index over nullable
   columns constrains nothing. Here `renumber()` derives every code from
   where the row sits, so a gap cannot happen — and ids are never touched,
   because figures are keyed on them (§232).

   PLANNING MODE IS NOT PORTED (§7.3) and there is deliberately no draft
   shape in this file: a field writes when the cursor leaves it, and what
   Planning Mode was for — building a two-hundred-row plan without a request
   per keystroke — is the workbook's (§9.3).
   ──────────────────────────────────────────────────────────────────────── */

/* The check's break, never set on a deployment (constitution XVI, and the
   shape `modules/registry.ts` already uses): each name puts back one rule
   this file exists to state, so a green run is believed only after the red
   one (§94.5, §276). */
const brk = () => (typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "");

/* ══ vocabulary ═══════════════════════════════════════════════════════ */

/* THREE ROLES, ON THE PROJECT (§6.2, §6.3). Not a module column on Roles &
   access — these belong to a project, so they never touch the frozen
   `lib/rules.js` and `MODULE_DEF` needs no roles field (§9.2). */
export const ROLES = ["lead", "contributor", "viewer"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_WORD: Record<Role, string> = { lead: "Lead", contributor: "Contributor", viewer: "Viewer" };
export function isRole(s: unknown): s is Role { return typeof s === "string" && (ROLES as readonly string[]).includes(s); }
/* WHERE EVERYBODY LANDS (§6.4, Islam). Nothing is granted until somebody
   decides, which is the safe direction. */
export const ROLE_DEFAULT: Role = "viewer";

/* AN ACTIVITY'S FOUR STATES, AND THE FOURTH IS THE GOVERNANCE RULE (§3 №1).
   Whoever does the work marks it `done`; only a Lead marks it `completed`.
   Everything sitting at `done` queues on the sign-off screen (§9.10). */
export const ACT_STATUSES = ["not_started", "in_progress", "done", "completed"] as const;
export type ActStatus = (typeof ACT_STATUSES)[number];
export const ACT_WORD: Record<ActStatus, string> = {
  not_started: "Not started", in_progress: "In progress", done: "Done", completed: "Completed",
};
export function isActStatus(s: unknown): s is ActStatus { return typeof s === "string" && (ACT_STATUSES as readonly string[]).includes(s); }

/* A SUB-ACTIVITY HAS THREE, and the middle one is what trips rule 2 — see
   `progressFromSubs`. They are NOT the activity's four: a sub-activity is
   never signed off, because the sign-off is the activity's. */
export const SUB_STATUSES = ["todo", "in_progress", "done"] as const;
export type SubStatus = (typeof SUB_STATUSES)[number];
export function isSubStatus(s: unknown): s is SubStatus { return typeof s === "string" && (SUB_STATUSES as readonly string[]).includes(s); }

/* ITS OWN RHYTHM (spec 046 §4.2 row 4, §9.10): a checkpoint is a DATE and
   nothing else — it stores nothing, records nothing and gates nothing, and
   Strategy's reporting cycle does not reach it. */
export const CADENCES = ["weekly", "monthly"] as const;
export type Cadence = (typeof CADENCES)[number];
export function isCadence(s: unknown): s is Cadence { return typeof s === "string" && (CADENCES as readonly string[]).includes(s); }

/* THE TWO SEATS, read off the client's register exactly as every other
   module reads them (§6.1, §338). A client's own Super user and a
   Forefront consultant holding the same seat are ONE value on ONE column by
   the time anything inside the client asks — which is §6.1's whole
   correction, and is why there is no Forefront-versus-client branch here. */
export const OFFICE_SEATS = ["super", "smoteam"] as const;
export type Seat = "super" | "smoteam" | "none";
export function inOffice(seat: unknown): boolean {
  return typeof seat === "string" && (OFFICE_SEATS as readonly string[]).includes(seat);
}

/* ══ who gets in (§6) ══════════════════════════════════════════════════ */

/* WHAT A RULE IS ASKED ABOUT: the seat this person holds on the client, and
   their row on THIS project. A seat reaches every project, so `role` is
   null for the office and that is not a gap (§6.1). */
export type Who = { seat: Seat | null; role: Role | null };

/* Seeing it at all. A seat, or a row on this project — and nothing else,
   because there is no Portfolio column to hold a third answer (§6). */
export function maySee(w: Who): boolean {
  return inOffice(w.seat) || isRole(w.role);
}

/* SEE THE PLAN, WRITE YOUR OWN ROWS (§7.4A) — the platform's own rule in
   §215's words. A Contributor sees all of it, because on a plan with
   dependencies seeing what you are waiting on is the normal case rather
   than a privilege; what is given up is the narrower kind, somebody who may
   see only their own rows, and it comes back as a tick on the membership
   and never as a fourth role (§6.3). */
export function mayReadPlan(w: Who): boolean { return maySee(w); }

/* Building and restructuring it: a Lead, or a seat (§6.2). */
export function mayBuildPlan(w: Who): boolean {
  if (brk() === "any-build") return maySee(w);
  return inOffice(w.seat) || w.role === "lead";
}

/* STARTING A PROJECT IS BY SEAT (§9.2, decision 5 as widened): a client's
   Super user can do anything, and consultants scoping the work is a fact
   about engagements rather than a rule in the code. */
export function mayStartProject(w: Who): boolean { return inOffice(w.seat); }

/* AND DELETING ONE IS THE SUPER USER'S ALONE (§6.1) — not a new rule:
   §89 already names destruction as the thing the SMO team seat does not
   get, and it is the one of that section's three that lands in Portfolio. */
export function mayDeleteProject(w: Who): boolean {
  if (brk() === "team-deletes") return inOffice(w.seat);
  return w.seat === "super";
}

/* NAMING PEOPLE ONTO A PROJECT is the seat's (§6.4, §9.2). Recorded rather
   than assumed: §5.1a has the charter's Project Manager row READ whoever is
   at Lead and says setting it there sets the role, while §5.1 gives the
   charter's pen to the office AND the Lead — so a Lead editing that one row
   would be naming somebody. Answered the narrow way until Islam says
   otherwise (§42 fails closed), and named in the spec rather than left for
   somebody to find. */
export function mayNameTeam(w: Who): boolean { return inOffice(w.seat); }

/* THE CHARTER'S PEN IS THE OFFICE'S AND THE LEAD'S — Islam, 2026-09-17,
   widening what the drawing assumed (§5.1). The consequence is named there
   rather than discovered: a Lead can also change the budget and the agreed
   window, and every field records who changed it and when. */
export function mayEditCharter(w: Who): boolean {
  return inOffice(w.seat) || w.role === "lead";
}

/* WHETHER A CONTRIBUTOR REPORTS OR ONLY COMMENTS IS READ OFF THE ACTIVITY,
   never from the membership (§6.2): assigned is one thing, tagged is
   another, and both are stored on the row. */
export type ActWho = { assignee?: string | null; collaborators?: readonly string[] };
const named = (list: readonly string[] | undefined, key: string | null) =>
  !!key && !!list && list.indexOf(key) >= 0;

/* Reporting an activity: the person it is assigned to, a Lead, or a seat. */
export function mayReport(w: Who, personKey: string | null, a: ActWho): boolean {
  if (mayBuildPlan(w)) return true;
  if (w.role !== "contributor") return false;
  return !!personKey && a.assignee === personKey;
}

/* Commenting on one: the same, plus anybody the activity TAGS — and never a
   Viewer (§7.4B, 2026-09-17: *"viewer no commenting just viewing"*). It
   matters because of where that word sits: everybody lands at Viewer, so
   read-only is what the default quietly grants, and read-only is the only
   default that fails closed. */
export function mayComment(w: Who, personKey: string | null, a: ActWho): boolean {
  if (brk() === "viewer-comments" && maySee(w)) return true;
  if (mayBuildPlan(w)) return true;
  if (w.role !== "contributor") return false;
  return (!!personKey && a.assignee === personKey) || named(a.collaborators, personKey);
}

/* ══ two people finish an activity, not one (§3 №1, §6.5) ══════════════ */

/* Whoever is doing the work marks it Done. */
export function mayMarkDone(w: Who, personKey: string | null, a: ActWho): boolean {
  return mayReport(w, personKey, a);
}

/* ONLY A LEAD COMPLETES (§6.5). This is a governance rule, not a status
   list — which is why it is its own predicate rather than a wider one. */
export function mayComplete(w: Who): boolean {
  if (brk() === "anyone-completes") return maySee(w);
  return mayBuildPlan(w);
}

/* AND THE REOPEN IS GATED LIKE THE COMPLETION (§7.6). Theirs needs only the
   work-on gate and clears the sign-off date, so a Contributor undoes a
   Lead's sign-off — which empties the governance rule this section is
   keeping. One answer, asked twice, so the two cannot part. */
export function mayReopen(w: Who): boolean { return mayComplete(w); }

/* A COMPLETION'S END DATE IS CHECKED, not merely stored (§3 №1: *inside a
   range the platform checks*). It may not fall before the work started and
   it may not be in the future — a date nobody could have finished on is a
   figure the plan would then be read against (§344). Returns the reason, or
   null when it is fine, because a refusal that does not say why sends
   somebody to look at everything (§123). */
export function endDateRefused(end: string | null, opts: { start?: string | null; today: string }): string | null {
  if (!end) return "A completion needs the date the work actually ended.";
  if (end > opts.today) return "That date has not happened yet.";
  const from = opts.start || null;
  if (from && end < from) return "That is before the work started.";
  return null;
}

/* ══ real dates are worked out, never typed (§3 №2) ════════════════════ */

/* ONE CHOKEPOINT, AND THE PORT'S OWN REASON FOR IT: `calculateEndDate`
   exists four times over in the reference and the live copies disagree
   about whether a date snaps to Sunday (§7, their trap 4). So every path
   that changes an activity's progress or status comes through here and
   nothing else writes these two columns (§53.5).

   The real start is stamped the FIRST time progress leaves nought and is
   never re-stamped — reopening an activity does not move the day the work
   began. The real end is stamped on Completed and CLEARED on a reopen,
   which is what makes §9.11's *on-time* reading honest: an activity with no
   real end date is not counted at all there rather than counted as a
   success (§7.6). */
export type Dates = { actualStart: string | null; actualEnd: string | null };
export type Before = { status: ActStatus; progress: number } & Dates;
export type After = { status: ActStatus; progress: number };

export function stampDates(before: Before, after: After, today: string): Dates {
  const started = before.actualStart || (after.progress > 0 ? today : null);
  if (brk() === "restamp-start") {
    return { actualStart: after.progress > 0 ? today : before.actualStart, actualEnd: before.actualEnd };
  }
  if (after.status === "completed") return { actualStart: started || today, actualEnd: before.actualEnd || today };
  /* Anything that is not Completed has no real end — which is the clearing
     half, and it is the half theirs does at a gate a Contributor can reach. */
  return { actualStart: started, actualEnd: null };
}

/* ══ progress is computed, and typing over it is refused (§3 №3) ═══════ */

export type Sub = { status: SubStatus; weight?: number | null };

/* BY WEIGHT ONLY IF THE SET SUMS TO 100, OTHERWISE BY A PLAIN COUNT — the
   reference's rule as the audit measured it (§7), never by duration and
   never by effort. Their own schema comment says the weights must sum to
   100 and nothing enforces it, so a set summing to 90 falls silently to
   equal weighting; that is kept, because the fallback is the honest answer
   to a half-filled set and refusing would strand a plan mid-edit.

   THE FLOOR IS THEIRS AND IS PORTED ON PURPOSE (§3 №3): one sub-activity
   started with none finished reads 10%, *which is what trips rule 2* — it
   is how the real start date comes to be stamped at all. */
export function progressFromSubs(subs: readonly Sub[]): number {
  if (!subs.length) return 0;
  const done = subs.filter((s) => s.status === "done");
  const going = subs.some((s) => s.status === "in_progress");
  if (!done.length) return going ? 10 : 0;
  const total = subs.reduce((a, s) => a + (Number(s.weight) || 0), 0);
  if (total === 100) return Math.round(done.reduce((a, s) => a + (Number(s.weight) || 0), 0));
  return Math.round((done.length * 100) / subs.length);
}

/* AND A MANUAL FIGURE IS TURNED AWAY WITH THE REASON where it would lie
   (§3 №3). With sub-activities present the percentage IS the breakdown, so
   a typed figure is a second answer to one question (§53.5) — and saying
   which is what stops somebody re-typing it (§123). */
export function manualProgressRefused(subs: readonly Sub[]): string | null {
  if (brk() === "manual-wins") return null;
  if (!subs.length) return null;
  return "This activity's progress comes from its breakdown. Change a sub-activity instead.";
}

/* ══ the roll-up (§9.8) ═══════════════════════════════════════════════ */

/* A row of the plan, in document order. `lvl` is 0 phase · 1 work package ·
   2 activity, which is the tree's own three levels and the only thing the
   walkers need to know about it. */
export type Lvl = 0 | 1 | 2;
export type Row = {
  id: string;
  lvl: Lvl;
  name?: string;
  /* An activity's own figure. A parent's is derived and written back by
     `rollUp`, never stored: their two stored columns are dropped rather
     than ported, because nothing in their code ever writes either and the
     endpoint that selects one never reads it (§7.6, §9.8). */
  pct?: number;
  weight?: number | null;
  start?: string | null;
  end?: string | null;
  status?: ActStatus;
  assignee?: string | null;
  /* Written by `rollUp` onto a parent. */
  total?: number;
  done?: number;
};

/* THE ROWS ONE LEVEL UNDER `i` — or, where that level is empty, everything
   beneath it, so a phase with activities hung straight off it still rolls
   up. The same shape the numbering has (1.1 sits directly under a phase
   when there is no work package). */
export function kidsOf(rows: readonly Row[], i: number): number[] {
  const lvl = rows[i].lvl;
  const out: number[] = [];
  let j: number;
  for (j = i + 1; j < rows.length && rows[j].lvl > lvl; j++) if (rows[j].lvl === lvl + 1) out.push(j);
  if (!out.length) for (j = i + 1; j < rows.length && rows[j].lvl > lvl; j++) out.push(j);
  return out;
}

/* §243'S BLANK RULE, IN ISLAM'S OWN WORDS — *missing it should be
   considered equally weighted objectives not 0* — reused rather than
   re-decided (§9.8). A blank counts as the average of the weights that WERE
   set; none set means equal; every set weight being nought falls back to
   equal rather than to a dash.

   IT IS A SECOND COPY OF `koWeights` AND THAT IS DELIBERATE, not an
   oversight of §53.5: that one is the frozen product's, read by six frozen
   sources and run in a vm by `lib/frozen.cjs`, and Portfolio may not reach
   into Strategy's vocabulary (§9.1's whole argument for why the three words
   could not ride `labels`). What must not drift is the RULE, so the check
   asserts this answers what §243 answers rather than asserting a number. */
export function weightsOf(rows: readonly Row[]): number[] | null {
  const raw = rows.map((r) => (r.weight == null || Number.isNaN(Number(r.weight)) ? null : Number(r.weight)));
  const set = raw.filter((w): w is number => w != null);
  if (!set.length) return null;
  const mean = set.reduce((a, b) => a + b, 0) / set.length;
  return raw.map((w) => (w == null ? mean : w));
}

/* One level's figure. Null where there is nothing to average — absent is
   not nought (§35, §93), which is what lets a project with a charter and no
   plan read *No plan yet* rather than 0% (§9.13). */
export function meanPct(rows: readonly Row[]): number | null {
  if (!rows.length) return null;
  const flat = () => Math.round(rows.reduce((a, r) => a + (r.pct || 0), 0) / rows.length);
  const ws = brk() === "equal-only" ? null : weightsOf(rows);
  if (!ws) return flat();
  let acc = 0, tot = 0;
  rows.forEach((r, i) => { acc += (r.pct || 0) * ws[i]; tot += ws[i]; });
  return tot ? Math.round(acc / tot) : flat();
}

/* ONE LEVEL AT A TIME, bottom up. Writes the figure, the widest span, the
   status and the ACTIVITY TALLY onto every parent — the tally because a
   phase's *2 of 3 done* and its percentage are two readings of one set and
   must be taken from it together, or a card and the table under it
   disagree (§264).

   AN ACTIVITY WAITING FOR A LEAD'S SIGN-OFF COUNTS AS 100% (§9.8): progress
   is how much work is done, and the sign-off is whether a Lead accepts it —
   holding it at 99 would make the figure say something about governance. */
export function rollUp(rows: Row[]): Row[] {
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    if (r.lvl === 2) continue;
    const ks = kidsOf(rows, i).map((j) => rows[j]);
    const p = meanPct(ks);
    r.pct = p == null ? 0 : p;
    r.start = ks.reduce<string | null>((a, x) => (!a || (x.start && x.start < a) ? x.start || a : a), null);
    r.end = ks.reduce<string | null>((a, x) => (!a || (x.end && x.end > a) ? x.end || a : a), null);
    const acts: Row[] = [];
    for (let j = i + 1; j < rows.length && rows[j].lvl > r.lvl; j++) if (rows[j].lvl === 2) acts.push(rows[j]);
    r.total = acts.length;
    r.done = acts.filter((x) => (x.pct || 0) === 100).length;
  }
  return rows;
}

/* The project's own figure — its phases, by the same rule one level up and
   not a second one. Null where there is no plan at all. */
export function overall(rows: readonly Row[]): number | null {
  return meanPct(rows.filter((r) => r.lvl === 0));
}

/* ══ the numbers renumber themselves (§3 №5) ══════════════════════════ */

/* DERIVED FROM POSITION, so a gap cannot happen — and the 1.2.3 → 1.2
   collapse comes free rather than being a rule of its own: an activity
   sitting straight under a phase is that phase's second level, so it takes
   a two-part code because there is no work package above it to count.
   Ids are never touched (§232). */
export function renumber(rows: readonly Row[]): string[] {
  const at = [0, 0, 0];
  return rows.map((r) => {
    at[r.lvl] += 1;
    for (let k = r.lvl + 1; k < 3; k++) at[k] = 0;
    /* How many parts the code has is how deep the row SITS, which for an
       activity under a phase is two rather than three. The break puts back
       the row with no collapse — every activity three parts deep, so one
       hung straight off a phase reads 1.0.1 and the plan grows a level it
       does not have. */
    const depth = r.lvl === 2
      ? (brk() === "no-collapse" || hasPackageAbove(rows, r) ? 3 : 2)
      : r.lvl + 1;
    const parts: number[] = [];
    if (depth >= 1) parts.push(at[0]);
    if (depth >= 2) parts.push(r.lvl === 2 && depth === 2 ? at[2] : at[1]);
    if (depth >= 3) parts.push(at[2]);
    return parts.join(".");
  });
}

function hasPackageAbove(rows: readonly Row[], r: Row): boolean {
  const i = rows.indexOf(r);
  for (let j = i - 1; j >= 0; j--) {
    if (rows[j].lvl === 1) return true;
    if (rows[j].lvl === 0) return false;
  }
  return false;
}

/* ══ moving a date moves what depends on it (§3 №4) ═══════════════════ */

/* ONE DEPENDENCY PER ACTIVITY (§5), so the graph is a forest of chains and
   the preview is a walk. A PREVIEW, never a commit: *a preview says what
   will shift before anything commits*, which is the whole of the rule —
   moving a date silently is how a plan stops matching what anybody agreed.

   A CYCLE IS REFUSED RATHER THAN WALKED FOR EVER. Their schema has no
   referential integrity to inherit and no CHECK anywhere (§7.6), so a row
   depending on itself through a chain is assumed rather than ruled out; it
   stops here and says so instead of hanging the request. */
export type Dep = { id: string; dependsOn?: string | null; start?: string | null; end?: string | null };
export type Shift = { id: string; from: string | null; to: string | null };

export function addDays(day: string, n: number): string {
  const t = Date.parse(day + "T00:00:00Z");
  return new Date(t + n * 86400000).toISOString().slice(0, 10);
}
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}

export function cascade(rows: readonly Dep[], id: string, newEnd: string): Shift[] {
  const by = new Map(rows.map((r) => [r.id, r]));
  const moved = by.get(id);
  if (!moved || !moved.end) return [];
  const by_days = daysBetween(moved.end, newEnd);
  if (!by_days) return [];
  const out: Shift[] = [];
  const seen = new Set<string>([id]);
  let front = rows.filter((r) => r.dependsOn === id);
  while (front.length) {
    const next: Dep[] = [];
    for (const r of front) {
      if (seen.has(r.id)) continue;      /* a chain that loops back */
      seen.add(r.id);
      out.push({ id: r.id, from: r.start || null, to: r.start ? addDays(r.start, by_days) : null });
      if (brk() === "no-cascade") continue;
      rows.filter((x) => x.dependsOn === r.id).forEach((x) => next.push(x));
    }
    front = next;
  }
  return out;
}

/* ══ what is waiting on somebody (§9.13, §279) ════════════════════════ */

/* THREE PREDICATES, NAMED ONCE, because Progress draws them as three
   sections and the landing counts them as one number, and a section and a
   count that disagree is the fault §5.2 is about.

   A ROW IS ONE THING TO FIX (§279): an activity nobody is on that is ALSO
   past its date is owed once, so the union is by row and never a sum of the
   three lengths (§108.1). The landing's fixture demonstrates it rather than
   claiming it — three reasons, the number reading 2. */
const acts = (rows: readonly Row[]) => rows.filter((r) => r.lvl === 2);

/* Done and waiting for a Lead to accept it. */
export function waitingSignOff(rows: readonly Row[]): Row[] {
  return acts(rows).filter((r) => r.status === "done");
}
/* LATE IS A FACT ABOUT A DATE AND NEVER ABOUT A PERCENTAGE (§344). *On
   track* is a claim about a schedule that a percentage cannot make, so a
   project can be 59% and behind, and the two are drawn apart. */
export function behind(r: Row, today: string): boolean {
  return (r.pct || 0) < 100 && !!r.end && r.end < today;
}
export function overdue(rows: readonly Row[], today: string): Row[] {
  return acts(rows).filter((r) => behind(r, today));
}
export function nobodyOn(rows: readonly Row[]): Row[] {
  return acts(rows).filter((r) => !r.assignee && (r.pct || 0) < 100);
}
export function owed(rows: readonly Row[], today: string): Row[] {
  const out: Row[] = [];
  const add = (list: Row[]) => list.forEach((r) => { if (out.indexOf(r) < 0) out.push(r); });
  add(waitingSignOff(rows));
  add(overdue(rows, today));
  add(nobodyOn(rows));
  if (brk() === "owed-sums") {
    return [...waitingSignOff(rows), ...overdue(rows, today), ...nobodyOn(rows)];
  }
  return out;
}

/* ══ the checkpoint (spec 046 §4.2 row 4, §9.10) ══════════════════════ */

/* DERIVED, NEVER STORED — there is no checkpoint table and no row per
   checkpoint, because it stores nothing, records nothing and gates nothing.
   Two fields on the project answer *when is the next one*, which is the
   only question anything asks. `day` is 0–6 for a weekly cadence (Sunday
   first, the week this platform already uses, spec 054 decision 8) and 1–28
   for a monthly one, capped so a cadence set on the 30th does not skip
   February (§35: an absent answer is better than a wrong one, and a day
   nobody chose is a wrong one). */
export function nextCheckpoint(cadence: Cadence | null, day: number | null, today: string): string | null {
  if (!cadence || day == null) return null;
  if (cadence === "weekly") {
    if (day < 0 || day > 6) return null;
    const dow = new Date(Date.parse(today + "T00:00:00Z")).getUTCDay();
    const ahead = (day - dow + 7) % 7 || 7;
    return addDays(today, ahead);
  }
  if (day < 1 || day > 28) return null;
  const t = new Date(Date.parse(today + "T00:00:00Z"));
  const here = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), day)).toISOString().slice(0, 10);
  if (here > today) return here;
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, day)).toISOString().slice(0, 10);
}
