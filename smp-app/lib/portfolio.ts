/* ── PORTFOLIO — the rules, before any screen (spec 060) ──────────────────
   The six rules of §3, who gets in (§6), the roll-up (§9.8) and what a row
   owes (§9.13), as functions a check can ask without a browser — which is
   what §8 asks for in those words: *the six rules of §3 are checked as
   rules, not as screens.*

   NOTHING HERE DRAWS ANYTHING. It said *and nothing here opens a door* until
   §376, when `portfolio` became `built: true` and the module began serving
   itself — corrected rather than left standing, because a comment describing
   a state the code has left is the fault §104.8 records. What is still true
   is the division: the rules are here, the drawing is in `modules/portfolio/`,
   and a screen may not answer a question this file answers (§53.5).

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
/* `actualEnd` IS THE DATE A LEAD CHOSE AT SIGN-OFF (§9.10) and it comes
   through here rather than being written beside this function, or the
   chokepoint above stops being one the day the queue is built. Absent, a
   completion stamps today, which is what every other path wants. */
export type After = { status: ActStatus; progress: number; actualEnd?: string | null };

export function stampDates(before: Before, after: After, today: string): Dates {
  const started = before.actualStart || (after.progress > 0 ? today : null);
  if (brk() === "restamp-start") {
    return { actualStart: after.progress > 0 ? today : before.actualStart, actualEnd: before.actualEnd };
  }
  if (after.status === "completed")
    return { actualStart: started || today, actualEnd: after.actualEnd || before.actualEnd || today };
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
  /* An activity marked as a commitment — their `is_milestone` (§5). It
     changes no arithmetic here: what it decides is which rows the landing's
     "what is owed next" reads (§9.13b), and whether Analytics counts the row
     as a commitment met (§9.12). */
  milestone?: boolean;
  /* WHEN THE WORK ACTUALLY RAN, stamped by `stampDates` and never typed
     (§3 №3) — the plan's two views read it as the overrun past the planned
     bar, and `stampDates` is what writes it. */
  actualStart?: string | null;
  actualEnd?: string | null;
  /* THE ONE ACTIVITY THAT MUST FINISH FIRST (§5): one per activity, so the
     graph is a forest of chains and `cascade`'s preview is a walk. It is a
     rules field rather than a screen one — `cascade` takes exactly this
     beside the two dates — which is why it belongs here and `billable`,
     `description` and the breakdown do not (they are the panel's, read by
     `oneActivity`). */
  dependsOn?: string | null;
  /* THE DAY SOMEBODY ACCEPTED IT — the second half of §3 №1, written by
     `signOff` and cleared on a reopen exactly as `actualEnd` is. It is a
     rules field because §9.12's whole headline turns on it: a commitment is
     met when it was accepted ON OR BEFORE its date, and the reference's own
     reading — an activity with no recorded end date assumed to have met it
     — is what flatters the sign-off backlog it sits beside. */
  signedOffAt?: string | null;
  /* WHO accepted it — read by Progress's signed-off list for a reader who
     cannot reopen, so the section says who did it rather than drawing an
     empty cell where a control would be (§35, and the drawing's own). */
  signedOffBy?: string;
  /* A name the register no longer holds keeps what was stored beside it
     (§288.1, §96.2). What is DRAWN is the register's answer where there is
     one; this is the fallback and never the first reading (§48, §130.9). */
  assigneeName?: string;
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

/* ══ WRITING A PLAN (§15, spec 060) ═══════════════════════════════════ */

/* THE THREE KINDS OF ROW, named once. The tree's own three levels wear two
   names already — `lvl` 0/1/2 for the walkers, and a table each — so the
   word a request carries is pinned here and the api, the queries and the
   page all read it from one place rather than each spelling it (§53.5). */
export const KINDS = ["phase", "package", "activity"] as const;
export type Kind = (typeof KINDS)[number];
export function isKind(s: unknown): s is Kind {
  return typeof s === "string" && (KINDS as readonly string[]).includes(s);
}
export const KIND_WORD: Record<Kind, string> = {
  phase: "phase", package: "work package", activity: "activity",
};
/* The level a kind sits at, which is what `kidsOf` and `renumber` read. */
export const KIND_LVL: Record<Kind, Lvl> = { phase: 0, package: 1, activity: 2 };

/* WHAT A ROW HOLDS IS WHY A REMOVAL IS REFUSED (§15.6, §62): a phase that
   still holds work cannot go, and the refusal NAMES what is in the way
   rather than leaving somebody to guess which of its children is the
   problem (§123, §62's own shape). An activity holds a breakdown, which is
   its own figure rather than another row of the plan, so it is removed with
   it — a sub-activity has no life outside the activity it weighs.

   ASKED OF THE ROWS BOTH SIDES ALREADY HOLD, so the page can say it before
   the press and the server says it again after (§42: a screen that only
   narrows a control has narrowed nothing). */
export function removeRefused(rows: readonly Row[], id: string): string | null {
  if (brk() === "remove-anything") return null;
  const i = rows.findIndex((r) => r.id === id);
  if (i < 0) return "That row is not on this plan.";
  const r = rows[i];
  if (r.lvl === 2) return null;
  const kids = kidsOf(rows, i).map((j) => rows[j]);
  if (!kids.length) return null;
  /* The deepest thing under it is what the sentence names, because that is
     what somebody has to move: a phase holding two work packages is
     refused by naming the packages, not the twelve activities inside them. */
  const word = kids.length === 1 ? KIND_WORD[kids[0].lvl === 1 ? "package" : "activity"]
    : kids[0].lvl === 1 ? "work packages" : "activities";
  return "This " + KIND_WORD[r.lvl === 0 ? "phase" : "package"] +
    " cannot be removed while it holds work. " +
    plainCount(kids.length, word) + " " + (kids.length === 1 ? "is" : "are") + " in it: " +
    kids.map((k) => k.name || "").filter(Boolean).join(", ") + ".";
}

/* A count and its noun, where the noun is already inflected by the caller.
   `plural()` is the shell's and takes a singular; this takes the word as
   given, because `removeRefused` has already chosen between a singular and
   an irregular plural one line above (§107.8: a label is never inflected
   by adding an "s" — *activities* is not *activitys*). */
function plainCount(n: number, word: string): string { return n + " " + word; }

/* WHICH WAY A ROW CAN MOVE, asked once for the page and the server. An
   arrow that can do nothing is not DRAWN (§94.15, §15.2) and a move with
   nothing to swap is REFUSED, and those have to be one answer or the page
   draws a control the server turns away (§61, §42).

   IT IS WITHIN THE CONTAINER AND NEVER ACROSS ONE: the first activity of a
   work package does not move up into the package above it, because that is
   a different act — re-parenting — and nothing on this screen offers it. */
export function mayMove(rows: readonly Row[], id: string, dir: -1 | 1): boolean {
  const i = rows.findIndex((r) => r.id === id);
  if (i < 0) return false;
  const lvl = rows[i].lvl;
  /* ONE WALK FOR BOTH DIRECTIONS: step until a row at this level turns up,
     and stop at anything SHALLOWER, which is the edge of the container. A
     deeper row is somebody else's child and is stepped over — the first
     attempt at this counted `kidsOf`, which answers one level down and not
     the whole subtree, so a phase holding a work package reported the
     package's first activity as its next sibling. */
  for (let k = i + dir; k >= 0 && k < rows.length; k += dir) {
    if (rows[k].lvl < lvl && brk() !== "move-across") return false;
    if (rows[k].lvl === lvl) return true;
  }
  return false;
}

/* THE FIELDS A ROW'S OWNER MAY WRITE, by kind — and the list is what the
   api validates against, so a field name nobody drew is refused by name
   rather than written (§42's fall-through, closed).

   STATUS AND THE PER-CENT ARE DELIBERATELY NOT HERE (§15.4): both are
   worked out — a status from the breakdown and the sign-off, a parent's
   figure from its children by weight — so there is no box for either and no
   field to carry one. `manualProgressRefused` is what turns a typed figure
   away where a breakdown exists, and it is reachable from the api and the
   workbook and from no control on this screen, which is the point. */
export const ROW_FIELDS: Record<Kind, readonly string[]> = {
  phase: ["name", "weight"],
  package: ["name", "weight"],
  activity: ["name", "weight", "description", "deliverables", "assignee",
             "dependsOn", "milestone", "billable", "start", "end"],
};
export function isRowField(kind: Kind, field: unknown): boolean {
  return typeof field === "string" && ROW_FIELDS[kind].includes(field);
}

/* A WEIGHT IS A NUMBER OR AN ABSENCE, and an absence is a real answer:
   §243's rule, reused rather than re-decided — a blank counts as the
   average of the weights that WERE set. So an emptied box DELETES the value
   rather than storing nought, which would quietly re-weight its siblings
   (§50.6). Returns the reason, or null. */
export function weightRefused(v: string): string | null {
  if (!v.trim()) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return "A weight is a number, or empty for an equal share.";
  if (n < 0) return "A weight cannot be negative.";
  if (n > 100) return "A weight is a share, so it cannot be over 100.";
  return null;
}

/* A PLANNED DATE IS A DAY OR AN ABSENCE, and the pair must stay in order —
   the schema says so too (`portfolio_activity_window`), and a refusal in
   the database's words would name a constraint rather than a reason
   (§316.2). Checked here so the sentence is the person's (§123). */
export function dateRefused(v: string): string | null {
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "That is not a day.";
  if (Number.isNaN(Date.parse(v + "T00:00:00Z"))) return "That is not a day.";
  return null;
}
export function windowRefused(start: string | null, end: string | null): string | null {
  if (start && end && end < start) return "The end of a window cannot fall before its start.";
  return null;
}

/* A NAME IS ONE LINE AND IS NEVER EMPTY (§260, §316): the schema refuses a
   blank outright, so the sentence is written here rather than let through
   to be answered by a constraint name. Line breaks are closed up for
   `SMPRules.oneLine`'s own reason, one product over — a title is one line
   of prose however long, and a box that keeps thirty blank lines renders as
   a fault nobody can see until the pen is open. */
export function oneLine(v: string): string {
  return v.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim();
}
export function nameRefused(v: string): string | null {
  return oneLine(v) ? null : "It needs a name.";
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

/* ══ the reading (§9.10, §9.12) ═══════════════════════════════════════ */

/* SIGNED OFF — the fourth of Progress's four sections, and the only one that
   is not a thing owed. It is there so the page is not only a list of
   problems and so undoing one has somewhere to be done from (§9.10). */
export function signedOff(rows: readonly Row[]): Row[] {
  return acts(rows).filter((r) => r.status === "completed");
}

/* HOW MUCH WARNING A COMMITMENT GETS — the one number in this module that
   somebody CHOSE rather than derived, so it is named once and every screen
   that prints a commitment date reads it (§9.13a is the record of it being
   written twice, thirty days on a landing beside the fourteen Analytics
   already had). It is NOT a guessed constant (§122.5's fix there is to
   measure, and how much warning somebody wants cannot be measured) — it is
   a decision, reversible in one place, and it decides a COLOUR and never a
   word.

   AND IT WAS DECLARED LOCALLY ON THE LANDING FOR ONE SLICE, under a comment
   saying it was read from here (§104.8). Corrected at §378. */
export const SOON = 14;

/* HOW FAR ALONG, IN WORDS — the drawings' own five and their own thresholds
   (`design-mockups/portfolio/_derive.js`), read by the landing AND by
   Analytics, because a percentage described two ways on two screens of one
   client is §53.5's drift wearing an adjective.

   *ON TRACK* IS NOT A WORD A PERCENTAGE MAY USE (§344, §9.12): the
   reference labels a phase at 90% *On Track*, which is a claim about a
   schedule the figure cannot see. So this answers *how far along* and
   `behind()` answers *is it late*, and a row can be 67% and behind, and
   both are true.

   THE LANDING SHIPPED ITS OWN FIVE WORDS AND ITS OWN THREE THRESHOLDS for
   one slice — *Finished* and *Nearly there* at 34 and 67 — which is neither
   the drawing's vocabulary nor Analytics'. Corrected at §378, and the check
   asserts the pair AGREE rather than asserting either (§94.8).

   AND THE BREAK FOR THAT MAY NOT LIVE HERE, WHICH TOOK A GREEN
   FALSIFICATION RUN TO SEE (§54.5, §337.1): `far-words` first changed THIS
   function, and the check compares the page's words against THIS function
   — so both sides moved together and it read 0 failures, which is
   indistinguishable from a guard that works. The fault it is for is a
   SECOND answer to *how far along*, so the break lives in `analytics.ts`
   as a local word table (§53.5). */
export type Far = { word: string; cls: string };
export function howFar(pct: number): Far {
  if (pct === 100) return { word: "Done", cls: "done" };
  if (pct >= 90) return { word: "Nearly done", cls: "on" };
  if (pct >= 25) return { word: "Under way", cls: "on" };
  if (pct > 0) return { word: "Early", cls: "on" };
  return { word: "Not started", cls: "" };
}

/* ══ a commitment, and whether it was met (§9.12) ══════════════════════ */

/* IN DATE ORDER, REVERSING THE REFERENCE (§9.12): theirs sorts by severity
   — overdue, then upcoming, then met — which is right for triage and wrong
   for reading a project out. A review walks the timeline, and the
   outstanding ones stand out by colour without being dragged to the top.
   A commitment with no date sorts last rather than first (§35). */
export function commitments(rows: readonly Row[]): Row[] {
  return acts(rows).filter((r) => r.milestone)
    .sort((a, b) => String(a.end || "9999-99-99").localeCompare(String(b.end || "9999-99-99")));
}

/* SIX STATES, AND TWO OF THEM ARE CORRECTIONS OF THE REFERENCE (§9.12):

     hit   signed off ON OR BEFORE the day it was due
     late  signed off after it — and NOT counted as hit, where theirs
           counts a commitment delivered three weeks late as delivered
     wait  the work is finished and no Lead has accepted it. Counted in
           NEITHER column; theirs counts it as delivered on time, because an
           activity with no recorded end date is assumed to have met its
           date — which flatters exactly the sign-off backlog it sits beside
     over  not signed off, and the day has passed
     soon  not signed off, due within `SOON`
     plan  further out than that

   A COMMITMENT IS MET WHEN SOMEBODY ACCEPTED IT, never when its work was
   finished — which is why a phase can read *2 of 3 done* while its own
   commitment reads *Awaiting sign-off*, and the page says so rather than
   leaving it as an apparent contradiction (§9.12, §124).

   ONE ANSWER FOR BOTH SCREENS: Analytics draws all six and the landing
   draws the three that are owed, and a state named twice is how the two
   come to disagree about one row (§5.2, §53.5). */
export const MS_STATES = ["hit", "late", "wait", "over", "soon", "plan"] as const;
export type MsState = (typeof MS_STATES)[number];
export function msState(r: Row, today: string): MsState {
  /* ACCEPTED. The day somebody accepted it is what it is judged against,
     with the stamped real end as the fallback — both are dates the platform
     wrote itself (`signOff`, `stampDates`) and never typed.

     AND A COMPLETED ROW WITH NEITHER DATE, OR WITH NO PLANNED END, READS
     *ON TIME* — which is a path this product cannot produce, because
     `signOff` writes both and a commitment is drawn on a scale, so there is
     no branch for it (§24). Said here rather than left to be discovered:
     this is the one place the file trusts its own writer instead of
     re-checking it. */
  if (r.status === "completed") {
    const on = r.signedOffAt || r.actualEnd || null;
    return on && r.end && on > r.end ? "late" : "hit";
  }
  /* MARKED DONE IS NOT HIT. The break counts it as met on time, which is
     the reference's own reading and must turn the check red (§94.5). */
  if (r.status === "done") return brk() === "done-is-hit" ? "hit" : "wait";
  if (!r.end) return "plan";
  if (r.end < today) return "over";
  return daysBetween(today, r.end) <= SOON ? "soon" : "plan";
}
/* MET, AND MET ON TIME, ARE TWO QUESTIONS (§9.12): the landing asks the
   first to decide what is still owed, Analytics asks the second for its
   headline — and the headline counts `hit` ALONE, so a commitment delivered
   late and one still waiting for a Lead are each in neither column. */
export function met(r: Row): boolean { return r.status === "completed"; }
export function hitOnTime(r: Row, today: string): boolean { return msState(r, today) === "hit"; }

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
